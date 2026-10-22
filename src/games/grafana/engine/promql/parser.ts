import {
  AGG_NOT_YET,
  COMPARISON_OPS,
  FUNCTIONS,
  NOT_YET,
  SET_OPS,
  TYPE_NAMES,
  typeOf,
  type AggOp,
  type BinOp,
  type Expr,
  type Matcher,
  type MatchOp,
  type VectorSelector,
} from './ast';

export class PromQLError extends Error {
  constructor(
    readonly detail: string,
    readonly pos: number | null,
    readonly kind: 'parse' | 'execution' = 'parse',
  ) {
    super(
      kind === 'parse'
        ? `${pos === null ? '' : `1:${pos + 1}: `}parse error: ${detail}`
        : `execution error: ${detail}`,
    );
  }
}

type TokKind = 'ident' | 'number' | 'duration' | 'string' | 'op' | 'eof';
interface Token {
  kind: TokKind;
  value: string;
  pos: number;
}

const DURATION_RE = /^(\d+(ms|[smhdwy]))+/;
const NUMBER_RE = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/;
const TWO_CHAR_OPS = ['==', '!=', '=~', '!~', '<=', '>='];
const ONE_CHAR_OPS = '=<>+-*/%^(){}[],';

function lex(src: string): Token[] {
  const toks: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '#') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    const rest = src.slice(i);
    if (/[0-9.]/.test(c)) {
      const dm = DURATION_RE.exec(rest);
      if (dm && !/[A-Za-z0-9_.]/.test(src[i + dm[0].length] ?? '')) {
        toks.push({ kind: 'duration', value: dm[0], pos: i });
        i += dm[0].length;
        continue;
      }
      const nm = NUMBER_RE.exec(rest);
      if (nm) {
        toks.push({ kind: 'number', value: nm[0], pos: i });
        i += nm[0].length;
        continue;
      }
    }
    if (/[A-Za-z_:]/.test(c)) {
      const m = /^[A-Za-z_:][A-Za-z0-9_:]*/.exec(rest)!;
      toks.push({ kind: 'ident', value: m[0], pos: i });
      i += m[0].length;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      let value = '';
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\' && c !== '`' && j + 1 < src.length) {
          const e = src[j + 1];
          value += e === 'n' ? '\n' : e === 't' ? '\t' : e;
          j += 2;
        } else {
          value += src[j++];
        }
      }
      if (j >= src.length) throw new PromQLError('unterminated quoted string', i);
      toks.push({ kind: 'string', value, pos: i });
      i = j + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      toks.push({ kind: 'op', value: two, pos: i });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.includes(c)) {
      toks.push({ kind: 'op', value: c, pos: i });
      i++;
      continue;
    }
    throw new PromQLError(`unexpected character: '${c}'`, i);
  }
  toks.push({ kind: 'eof', value: '', pos: src.length });
  return toks;
}

const UNITS: Record<string, number> = { ms: 0.001, s: 1, m: 60, h: 3600, d: 86400, w: 604800, y: 31536000 };

export function parseDuration(text: string): number {
  let total = 0;
  for (const m of text.matchAll(/(\d+)(ms|[smhdwy])/g)) total += Number(m[1]) * UNITS[m[2]];
  return total;
}

const PREC: Record<BinOp, number> = {
  or: 1,
  and: 2,
  unless: 2,
  '==': 3,
  '!=': 3,
  '>': 3,
  '<': 3,
  '>=': 3,
  '<=': 3,
  '+': 4,
  '-': 4,
  '*': 5,
  '/': 5,
  '%': 5,
  '^': 6,
};
const AGGS = new Set<AggOp>(['sum', 'avg', 'min', 'max', 'count', 'topk', 'bottomk']);
const KEYWORDS = new Set(['by', 'without', 'on', 'ignoring', 'bool', 'offset', 'group_left', 'group_right', 'and', 'or', 'unless']);

function describe(t: Token): string {
  switch (t.kind) {
    case 'eof':
      return 'end of input';
    case 'ident':
      return `identifier "${t.value}"`;
    case 'number':
      return `number "${t.value}"`;
    case 'duration':
      return `duration "${t.value}"`;
    case 'string':
      return `string ${JSON.stringify(t.value)}`;
    case 'op':
      return `"${t.value}"`;
  }
}

class Parser {
  private i = 0;
  constructor(private toks: Token[]) {}

  private peek(offset = 0): Token {
    return this.toks[Math.min(this.i + offset, this.toks.length - 1)];
  }
  private next(): Token {
    return this.toks[this.i++];
  }
  private isOp(v: string, t = this.peek()): boolean {
    return t.kind === 'op' && t.value === v;
  }
  private isIdent(v: string, t = this.peek()): boolean {
    return t.kind === 'ident' && t.value === v;
  }
  private expectOp(v: string, context: string): Token {
    const t = this.peek();
    if (!this.isOp(v)) throw new PromQLError(`unexpected ${describe(t)} ${context}, expected "${v}"`, t.pos);
    return this.next();
  }
  private fail(t: Token, context = ''): never {
    throw new PromQLError(`unexpected ${describe(t)}${context ? ' ' + context : ''}`, t.pos);
  }

  parseTop(): Expr {
    if (this.peek().kind === 'eof') throw new PromQLError('no expression found in input', null);
    const e = this.parseExpr(1);
    if (this.peek().kind !== 'eof') this.fail(this.peek());
    return e;
  }

  private binaryOp(t: Token): BinOp | null {
    if (t.kind === 'op' && t.value in PREC && t.value !== '=') return t.value as BinOp;
    if (t.kind === 'ident' && (t.value === 'and' || t.value === 'or' || t.value === 'unless')) return t.value;
    return null;
  }

  private parseExpr(minPrec: number): Expr {
    let lhs = this.parseUnary();
    for (;;) {
      const t = this.peek();
      const op = this.binaryOp(t);
      if (!op || PREC[op] < minPrec) break;
      this.next();
      let bool = false;
      let matching: { on: boolean; labels: string[] } | undefined;
      if (this.isIdent('bool')) {
        if (!COMPARISON_OPS.has(op)) throw new PromQLError('bool modifier can only be used on comparison operators', this.peek().pos);
        this.next();
        bool = true;
      }
      if (this.isIdent('on') || this.isIdent('ignoring')) {
        const on = this.next().value === 'on';
        matching = { on, labels: this.parseLabelList() };
      }
      if (this.isIdent('group_left') || this.isIdent('group_right')) {
        throw new PromQLError(`${this.peek().value} is not available yet in Grafana Learning Games`, this.peek().pos);
      }
      const rhs = this.parseExpr(op === '^' ? PREC[op] : PREC[op] + 1);
      lhs = this.makeBinary(op, lhs, rhs, bool, matching, t.pos);
    }
    return lhs;
  }

  private makeBinary(op: BinOp, lhs: Expr, rhs: Expr, bool: boolean, matching: { on: boolean; labels: string[] } | undefined, pos: number): Expr {
    const lt = typeOf(lhs);
    const rt = typeOf(rhs);
    for (const t of [lt, rt]) {
      if (t !== 'scalar' && t !== 'vector') throw new PromQLError('binary expression must contain only scalar and instant vector types', pos);
    }
    if (SET_OPS.has(op) && (lt === 'scalar' || rt === 'scalar')) {
      throw new PromQLError(`set operator "${op}" not allowed in binary scalar expression`, pos);
    }
    if (COMPARISON_OPS.has(op) && lt === 'scalar' && rt === 'scalar' && !bool) {
      throw new PromQLError('comparisons between scalars must use BOOL modifier', pos);
    }
    if (matching && (lt === 'scalar' || rt === 'scalar')) {
      throw new PromQLError('vector matching only allowed between instant vectors', pos);
    }
    return { type: 'binary', op, lhs, rhs, bool, matching, pos };
  }

  private parseUnary(): Expr {
    const t = this.peek();
    if (this.isOp('-') || this.isOp('+')) {
      this.next();
      const operand = this.parseExpr(PREC['^']);
      const ot = typeOf(operand);
      if (ot !== 'scalar' && ot !== 'vector') throw new PromQLError(`unary expression only allowed on expressions of type scalar or instant vector, got "${TYPE_NAMES[ot]}"`, t.pos);
      if (t.value === '+') return operand;
      if (operand.type === 'number') return { ...operand, value: -operand.value, pos: t.pos };
      return { type: 'unary', op: '-', expr: operand, pos: t.pos };
    }
    return this.parsePostfix(this.parsePrimary());
  }

  private parsePostfix(e: Expr): Expr {
    for (;;) {
      const t = this.peek();
      if (this.isOp('[')) {
        if (e.type !== 'vector') throw new PromQLError('ranges only allowed for vector selectors', t.pos);
        this.next();
        const d = this.peek();
        if (d.kind !== 'duration') this.fail(d, 'in range selector, expected a duration like 5m');
        this.next();
        const range = parseDuration(d.value);
        if (range <= 0) throw new PromQLError('zero range in duration', d.pos);
        if (this.peek().kind === 'ident' && this.peek().value.startsWith(':')) throw new PromQLError('subqueries are not available yet in Grafana Learning Games', this.peek().pos);
        this.expectOp(']', 'in range selector');
        e = { type: 'matrix', vector: e, range, pos: e.pos };
      } else if (this.isIdent('offset')) {
        const target = e.type === 'vector' ? e : e.type === 'matrix' ? e.vector : null;
        if (!target) throw new PromQLError('offset modifier must be preceded by an instant vector selector or range vector selector', t.pos);
        this.next();
        const d = this.peek();
        if (d.kind !== 'duration') this.fail(d, 'after offset, expected a duration like 5m');
        this.next();
        target.offset = parseDuration(d.value);
      } else {
        return e;
      }
    }
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    switch (t.kind) {
      case 'eof':
        throw new PromQLError('unexpected end of input', t.pos);
      case 'number':
        this.next();
        return { type: 'number', value: Number(t.value), pos: t.pos };
      case 'duration':
        throw new PromQLError(`unexpected ${describe(t)}; durations are only allowed inside [ ] or after offset`, t.pos);
      case 'string':
        throw new PromQLError('string literals are not supported here; did you mean a label matcher like {service="api"}?', t.pos);
      case 'op':
        if (t.value === '(') {
          this.next();
          const inner = this.parseExpr(1);
          this.expectOp(')', 'in parenthesized expression');
          return { type: 'paren', expr: inner, pos: t.pos };
        }
        if (t.value === '{') return this.parseSelector(undefined, t.pos);
        return this.fail(t);
      case 'ident':
        return this.parseIdent(t);
    }
  }

  private parseIdent(t: Token): Expr {
    const name = t.value;
    if (AGGS.has(name as AggOp)) return this.parseAggregation(name as AggOp, t.pos);
    if (AGG_NOT_YET.has(name) && (this.isOp('(', this.peek(1)) || this.isIdent('by', this.peek(1)) || this.isIdent('without', this.peek(1)))) {
      throw new PromQLError(`aggregation "${name}" is not available yet in Grafana Learning Games`, t.pos);
    }
    if (/^inf$/i.test(name) || /^nan$/i.test(name)) {
      this.next();
      return { type: 'number', value: /^inf$/i.test(name) ? Infinity : NaN, pos: t.pos };
    }
    if (KEYWORDS.has(name)) this.fail(t);
    if (this.isOp('(', this.peek(1))) {
      if (name in FUNCTIONS) return this.parseCall(name, t.pos);
      if (NOT_YET.has(name)) throw new PromQLError(`function "${name}" is not available yet in Grafana Learning Games`, t.pos);
      throw new PromQLError(`unknown function with name "${name}"`, t.pos);
    }
    this.next();
    return this.parseSelector(name, t.pos);
  }

  private parseLabelList(): string[] {
    this.expectOp('(', 'in grouping');
    const labels: string[] = [];
    while (!this.isOp(')')) {
      const t = this.next();
      if (t.kind !== 'ident') this.fail(t, 'in grouping, expected a label name');
      labels.push(t.value);
      if (this.isOp(',')) this.next();
      else if (!this.isOp(')')) this.fail(this.peek(), 'in grouping, expected "," or ")"');
    }
    this.next();
    return labels;
  }

  private parseAggregation(op: AggOp, pos: number): Expr {
    this.next();
    let grouping: string[] | undefined;
    let without = false;
    const parseGrouping = () => {
      without = this.next().value === 'without';
      grouping = this.parseLabelList();
    };
    if (this.isIdent('by') || this.isIdent('without')) parseGrouping();
    this.expectOp('(', `after "${op}"`);
    let param: Expr | undefined;
    if (op === 'topk' || op === 'bottomk') {
      param = this.parseExpr(1);
      if (typeOf(param) !== 'scalar') {
        throw new PromQLError(`expected type scalar in aggregation parameter, got ${TYPE_NAMES[typeOf(param)]}`, param.pos);
      }
      this.expectOp(',', `in "${op}"`);
    }
    const expr = this.parseExpr(1);
    this.expectOp(')', `in aggregation "${op}"`);
    if (grouping === undefined && (this.isIdent('by') || this.isIdent('without'))) parseGrouping();
    const et = typeOf(expr);
    if (et !== 'vector') throw new PromQLError(`expected type instant vector in aggregation expression, got ${TYPE_NAMES[et]}`, expr.pos);
    return { type: 'agg', op, param, expr, grouping: grouping ?? [], without, pos };
  }

  private parseCall(func: string, pos: number): Expr {
    this.next();
    this.next(); // (
    const args: Expr[] = [];
    while (!this.isOp(')')) {
      args.push(this.parseExpr(1));
      if (this.isOp(',')) this.next();
      else if (!this.isOp(')')) this.fail(this.peek(), `in call to function "${func}", expected "," or ")"`);
    }
    this.next();
    const spec = FUNCTIONS[func];
    if (args.length !== spec.args.length) {
      throw new PromQLError(`expected ${spec.args.length} argument(s) in call to "${func}", got ${args.length}`, pos);
    }
    args.forEach((a, k) => {
      const at = typeOf(a);
      if (at !== spec.args[k]) {
        throw new PromQLError(`expected type ${TYPE_NAMES[spec.args[k]]} in call to function "${func}", got ${TYPE_NAMES[at]}`, a.pos);
      }
    });
    return { type: 'call', func, args, pos };
  }

  private parseSelector(name: string | undefined, pos: number): VectorSelector {
    const matchers: Matcher[] = [];
    if (this.isOp('{')) {
      this.next();
      while (!this.isOp('}')) {
        const lt = this.next();
        if (lt.kind !== 'ident' && lt.kind !== 'string') this.fail(lt, 'in label matching, expected label name');
        const ot = this.next();
        if (ot.kind !== 'op' || !['=', '!=', '=~', '!~'].includes(ot.value)) {
          this.fail(ot, 'in label matching, expected label matching operator');
        }
        const vt = this.next();
        if (vt.kind !== 'string') this.fail(vt, 'in label matching, expected string');
        const m: Matcher = { name: lt.value, op: ot.value as MatchOp, value: vt.value };
        if (m.op === '=~' || m.op === '!~') {
          try {
            m.re = new RegExp(`^(?:${m.value})$`);
          } catch (err) {
            throw new PromQLError(`invalid regular expression in label matcher: ${(err as Error).message}`, vt.pos);
          }
        }
        matchers.push(m);
        if (this.isOp(',')) this.next();
        else if (!this.isOp('}')) this.fail(this.peek(), 'in label matching, expected "," or "}"');
      }
      this.next();
    }
    if (name === undefined) {
      if (!matchers.some((m) => !matchesValue(m, ''))) {
        throw new PromQLError('vector selector must contain at least one non-empty matcher', pos);
      }
      const nameMatcher = matchers.find((m) => m.name === '__name__' && m.op === '=');
      if (nameMatcher) name = nameMatcher.value;
    } else if (matchers.some((m) => m.name === '__name__')) {
      throw new PromQLError(`metric name must not be set twice: "${name}"`, pos);
    }
    return { type: 'vector', name, matchers, offset: 0, pos };
  }
}

export function matchesValue(m: Matcher, value: string): boolean {
  switch (m.op) {
    case '=':
      return value === m.value;
    case '!=':
      return value !== m.value;
    case '=~':
      return m.re!.test(value);
    case '!~':
      return !m.re!.test(value);
  }
}

export function parse(query: string): Expr {
  return new Parser(lex(query)).parseTop();
}
