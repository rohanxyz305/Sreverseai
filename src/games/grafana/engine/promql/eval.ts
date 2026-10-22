import type { MetricStore } from '../store';
import { labelsKey, type Labels, type QueryResult, type Series } from '../types';
import { COMPARISON_OPS, typeOf, type BinOp, type Expr, type MatrixSelector, type VectorSelector } from './ast';
import { matchesValue, parse, PromQLError } from './parser';

/** Prometheus' default lookback: an instant selector returns the newest sample at most 5 min old. */
export const LOOKBACK = 300;

interface Sample {
  labels: Labels;
  value: number;
}
type Instant = { kind: 'scalar'; value: number } | { kind: 'vector'; samples: Sample[] };
interface RangePoints {
  labels: Labels;
  ts: number[];
  vs: number[];
}

function dropName(labels: Labels): Labels {
  if (!('__name__' in labels)) return labels;
  const { __name__: _, ...rest } = labels;
  return rest;
}

/**
 * Prometheus' extrapolatedRate (promql/functions.go): extrapolates the first/last samples
 * towards the range boundaries so rate() is not biased by where the scrapes happen to land.
 */
export function extrapolatedRate(
  ts: number[],
  vs: number[],
  rangeStart: number,
  rangeEnd: number,
  isCounter: boolean,
  isRate: boolean,
): number | undefined {
  if (vs.length < 2) return undefined;
  let result = vs[vs.length - 1] - vs[0];
  if (isCounter) {
    for (let k = 1; k < vs.length; k++) if (vs[k] < vs[k - 1]) result += vs[k - 1];
  }
  const sampled = ts[ts.length - 1] - ts[0];
  const avgStep = sampled / (vs.length - 1);
  let toStart = ts[0] - rangeStart;
  const toEnd = rangeEnd - ts[ts.length - 1];
  if (isCounter && result > 0 && vs[0] >= 0) {
    const toZero = sampled * (vs[0] / result);
    if (toZero < toStart) toStart = toZero;
  }
  const threshold = avgStep * 1.1;
  let interval = sampled;
  interval += toStart < threshold ? toStart : avgStep / 2;
  interval += toEnd < threshold ? toEnd : avgStep / 2;
  result *= interval / sampled;
  if (isRate) result /= rangeEnd - rangeStart;
  return result;
}

class Evaluator {
  private selected = new Map<VectorSelector, Series[]>();

  constructor(private store: MetricStore) {}

  private select(vs: VectorSelector): Series[] {
    let hit = this.selected.get(vs);
    if (!hit) {
      hit = this.store.get(vs.name).filter((s) => vs.matchers.every((m) => matchesValue(m, s.labels[m.name] ?? '')));
      this.selected.set(vs, hit);
    }
    return hit;
  }

  /** Index of the last scrape at or before t, or -1. */
  private indexAt(t: number): number {
    return Math.min(this.store.length - 1, Math.floor((t - this.store.start) / this.store.step));
  }

  private instantSelect(vs: VectorSelector, t: number): Sample[] {
    const at = t - vs.offset;
    const i = this.indexAt(at);
    if (i < 0 || this.store.timestampAt(i) <= at - LOOKBACK) return [];
    const out: Sample[] = [];
    for (const s of this.select(vs)) {
      const v = s.values[i];
      if (!Number.isNaN(v)) out.push({ labels: s.labels, value: v });
    }
    return out;
  }

  /** Samples in the left-open window (t - range, t], as in Prometheus 3. */
  private rangeSelect(ms: MatrixSelector, t: number): RangePoints[] {
    const at = t - ms.vector.offset;
    const { start, step } = this.store;
    const i1 = this.indexAt(at);
    const i0 = Math.max(0, Math.floor((at - ms.range - start) / step) + 1);
    const out: RangePoints[] = [];
    for (const s of this.select(ms.vector)) {
      const ts: number[] = [];
      const vs: number[] = [];
      for (let i = i0; i <= i1; i++) {
        if (Number.isNaN(s.values[i])) continue;
        ts.push(this.store.timestampAt(i));
        vs.push(s.values[i]);
      }
      if (vs.length) out.push({ labels: s.labels, ts, vs });
    }
    return out;
  }

  private matrixArg(e: Expr): MatrixSelector {
    while (e.type === 'paren') e = e.expr;
    if (e.type !== 'matrix') throw new PromQLError('expected a range vector selector such as metric[5m]', e.pos, 'execution');
    return e;
  }

  evalAt(e: Expr, t: number): Instant {
    switch (e.type) {
      case 'number':
        return { kind: 'scalar', value: e.value };
      case 'string':
        throw new PromQLError('string literals are not supported here', e.pos, 'execution');
      case 'paren':
        return this.evalAt(e.expr, t);
      case 'unary': {
        const v = this.evalAt(e.expr, t);
        if (v.kind === 'scalar') return { kind: 'scalar', value: -v.value };
        return { kind: 'vector', samples: v.samples.map((s) => ({ labels: dropName(s.labels), value: -s.value })) };
      }
      case 'vector':
        return { kind: 'vector', samples: this.instantSelect(e, t) };
      case 'matrix':
        throw new PromQLError('invalid expression type "range vector" for range query, must be Scalar or instant Vector', e.pos, 'execution');
      case 'call':
        return this.evalCall(e.func, e.args, t);
      case 'agg':
        return this.evalAgg(e, t);
      case 'binary':
        return this.evalBinary(e, t);
    }
  }

  private evalCall(func: string, args: Expr[], t: number): Instant {
    const overRange = (fn: (p: RangePoints, ms: MatrixSelector) => number | undefined): Instant => {
      const ms = this.matrixArg(args[0]);
      const samples: Sample[] = [];
      for (const p of this.rangeSelect(ms, t)) {
        const v = fn(p, ms);
        if (v !== undefined) samples.push({ labels: dropName(p.labels), value: v });
      }
      return { kind: 'vector', samples };
    };
    const at = (ms: MatrixSelector) => t - ms.vector.offset;
    const mapVector = (fn: (v: number) => number): Instant => {
      const v = this.evalAt(args[0], t) as Extract<Instant, { kind: 'vector' }>;
      return { kind: 'vector', samples: v.samples.map((s) => ({ labels: dropName(s.labels), value: fn(s.value) })) };
    };
    const scalarArg = (k: number) => (this.evalAt(args[k], t) as Extract<Instant, { kind: 'scalar' }>).value;

    switch (func) {
      case 'rate':
        return overRange((p, ms) => extrapolatedRate(p.ts, p.vs, at(ms) - ms.range, at(ms), true, true));
      case 'increase':
        return overRange((p, ms) => extrapolatedRate(p.ts, p.vs, at(ms) - ms.range, at(ms), true, false));
      case 'delta':
        return overRange((p, ms) => extrapolatedRate(p.ts, p.vs, at(ms) - ms.range, at(ms), false, false));
      case 'irate':
        return overRange((p) => {
          const n = p.vs.length;
          if (n < 2) return undefined;
          const last = p.vs[n - 1];
          const prev = p.vs[n - 2];
          const diff = last < prev ? last : last - prev;
          return diff / (p.ts[n - 1] - p.ts[n - 2]);
        });
      case 'avg_over_time':
        return overRange((p) => p.vs.reduce((a, b) => a + b, 0) / p.vs.length);
      case 'sum_over_time':
        return overRange((p) => p.vs.reduce((a, b) => a + b, 0));
      case 'min_over_time':
        return overRange((p) => Math.min(...p.vs));
      case 'max_over_time':
        return overRange((p) => Math.max(...p.vs));
      case 'count_over_time':
        return overRange((p) => p.vs.length);
      case 'last_over_time': {
        // Unlike the other *_over_time functions, this keeps the metric name.
        const ms = this.matrixArg(args[0]);
        return { kind: 'vector', samples: this.rangeSelect(ms, t).map((p) => ({ labels: p.labels, value: p.vs[p.vs.length - 1] })) };
      }
      case 'abs':
        return mapVector(Math.abs);
      case 'ceil':
        return mapVector(Math.ceil);
      case 'floor':
        return mapVector(Math.floor);
      case 'round':
        return mapVector((v) => Math.floor(v + 0.5));
      case 'sqrt':
        return mapVector(Math.sqrt);
      case 'clamp_min': {
        const min = scalarArg(1);
        return mapVector((v) => Math.max(v, min));
      }
      case 'clamp_max': {
        const max = scalarArg(1);
        return mapVector((v) => Math.min(v, max));
      }
      case 'scalar': {
        const v = this.evalAt(args[0], t) as Extract<Instant, { kind: 'vector' }>;
        return { kind: 'scalar', value: v.samples.length === 1 ? v.samples[0].value : NaN };
      }
      case 'vector':
        return { kind: 'vector', samples: [{ labels: {}, value: scalarArg(0) }] };
      case 'time':
        return { kind: 'scalar', value: t };
    }
    throw new PromQLError(`function "${func}" is not implemented`, null, 'execution');
  }

  private evalAgg(e: Extract<Expr, { type: 'agg' }>, t: number): Instant {
    const input = this.evalAt(e.expr, t) as Extract<Instant, { kind: 'vector' }>;
    const groupLabels = (l: Labels): Labels => {
      const out: Labels = {};
      if (e.without) {
        for (const k in l) if (k !== '__name__' && !e.grouping.includes(k)) out[k] = l[k];
      } else {
        for (const k of e.grouping) if (l[k] !== undefined && l[k] !== '') out[k] = l[k];
      }
      return out;
    };
    const groups = new Map<string, { labels: Labels; samples: Sample[] }>();
    for (const s of input.samples) {
      const gl = groupLabels(s.labels);
      const key = labelsKey(gl);
      let g = groups.get(key);
      if (!g) groups.set(key, (g = { labels: gl, samples: [] }));
      g.samples.push(s);
    }

    if (e.op === 'topk' || e.op === 'bottomk') {
      const k = Math.floor((this.evalAt(e.param!, t) as Extract<Instant, { kind: 'scalar' }>).value);
      const dir = e.op === 'topk' ? -1 : 1;
      const out: Sample[] = [];
      for (const g of groups.values()) {
        const sorted = g.samples.filter((s) => !Number.isNaN(s.value)).sort((a, b) => dir * (a.value - b.value));
        out.push(...sorted.slice(0, Math.max(0, k)));
      }
      return { kind: 'vector', samples: out };
    }

    const samples: Sample[] = [];
    for (const g of groups.values()) {
      const vals = g.samples.map((s) => s.value);
      let value: number;
      switch (e.op) {
        case 'sum':
          value = vals.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          value = vals.reduce((a, b) => a + b, 0) / vals.length;
          break;
        case 'min':
          value = Math.min(...vals);
          break;
        case 'max':
          value = Math.max(...vals);
          break;
        case 'count':
          value = vals.length;
          break;
      }
      samples.push({ labels: g.labels, value });
    }
    return { kind: 'vector', samples };
  }

  private evalBinary(e: Extract<Expr, { type: 'binary' }>, t: number): Instant {
    const l = this.evalAt(e.lhs, t);
    const r = this.evalAt(e.rhs, t);
    const isCmp = COMPARISON_OPS.has(e.op);

    if (l.kind === 'scalar' && r.kind === 'scalar') {
      return { kind: 'scalar', value: applyOp(e.op, l.value, r.value) };
    }

    if (l.kind === 'scalar' || r.kind === 'scalar') {
      const vec = (l.kind === 'vector' ? l : r) as Extract<Instant, { kind: 'vector' }>;
      const sc = (l.kind === 'scalar' ? l : r) as Extract<Instant, { kind: 'scalar' }>;
      const samples: Sample[] = [];
      for (const s of vec.samples) {
        const [a, b] = l.kind === 'vector' ? [s.value, sc.value] : [sc.value, s.value];
        const v = applyOp(e.op, a, b);
        if (isCmp && !e.bool) {
          if (v) samples.push(s);
        } else {
          samples.push({ labels: dropName(s.labels), value: v });
        }
      }
      return { kind: 'vector', samples };
    }

    // vector <op> vector
    const sig = (labels: Labels): string => {
      const m = e.matching;
      const out: Labels = {};
      if (m?.on) {
        for (const k of m.labels) if (labels[k] !== undefined) out[k] = labels[k];
      } else {
        for (const k in labels) if (k !== '__name__' && !(m?.labels ?? []).includes(k)) out[k] = labels[k];
      }
      return labelsKey(out);
    };

    if (e.op === 'and' || e.op === 'unless') {
      const rightSigs = new Set(r.samples.map((s) => sig(s.labels)));
      const keep = e.op === 'and';
      return { kind: 'vector', samples: l.samples.filter((s) => rightSigs.has(sig(s.labels)) === keep) };
    }
    if (e.op === 'or') {
      const leftSigs = new Set(l.samples.map((s) => sig(s.labels)));
      return { kind: 'vector', samples: [...l.samples, ...r.samples.filter((s) => !leftSigs.has(sig(s.labels)))] };
    }

    const right = new Map<string, Sample>();
    for (const s of r.samples) {
      const k = sig(s.labels);
      if (right.has(k)) {
        throw new PromQLError(
          'found duplicate series for the match group on the right hand-side of the operation; many-to-many matching not allowed: matching labels must be unique on one side',
          e.pos,
          'execution',
        );
      }
      right.set(k, s);
    }
    const seenLeft = new Set<string>();
    const samples: Sample[] = [];
    for (const s of l.samples) {
      const k = sig(s.labels);
      const rs = right.get(k);
      if (!rs) continue;
      if (seenLeft.has(k)) {
        throw new PromQLError('many-to-many matching not allowed: matching labels must be unique on one side', e.pos, 'execution');
      }
      seenLeft.add(k);
      const v = applyOp(e.op, s.value, rs.value);
      if (isCmp && !e.bool) {
        if (v) samples.push(s);
        continue;
      }
      let labels = dropName(s.labels);
      if (e.matching?.on) {
        const kept: Labels = {};
        for (const key of e.matching.labels) if (labels[key] !== undefined) kept[key] = labels[key];
        labels = kept;
      } else if (e.matching) {
        labels = Object.fromEntries(Object.entries(labels).filter(([key]) => !e.matching!.labels.includes(key)));
      }
      samples.push({ labels, value: v });
    }
    return { kind: 'vector', samples };
  }
}

function applyOp(op: BinOp, a: number, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return a / b;
    case '%':
      return a % b;
    case '^':
      return a ** b;
    case '==':
      return a === b ? 1 : 0;
    case '!=':
      return a !== b ? 1 : 0;
    case '>':
      return a > b ? 1 : 0;
    case '<':
      return a < b ? 1 : 0;
    case '>=':
      return a >= b ? 1 : 0;
    case '<=':
      return a <= b ? 1 : 0;
    default:
      throw new PromQLError(`operator "${op}" not allowed here`, null, 'execution');
  }
}

/**
 * Evaluates a PromQL query over [start, end] like Prometheus' /api/v1/query_range.
 * Throws PromQLError with a Prometheus-style message on bad input.
 */
export function queryRange(store: MetricStore, query: string, start: number, end: number, step: number): QueryResult {
  const expr = parse(query);
  const type = typeOf(expr);
  if (type !== 'scalar' && type !== 'vector') {
    throw new PromQLError(
      `invalid expression type "${type === 'matrix' ? 'range vector' : type}" for range query, must be Scalar or instant Vector`,
      null,
      'execution',
    );
  }
  const ev = new Evaluator(store);
  const timestamps: number[] = [];
  for (let t = start; t <= end; t += step) timestamps.push(t);
  const rows = new Map<string, { labels: Labels; values: (number | null)[] }>();

  timestamps.forEach((t, ti) => {
    const v = ev.evalAt(expr, t);
    const samples = v.kind === 'scalar' ? [{ labels: {}, value: v.value }] : v.samples;
    const seen = new Set<string>();
    for (const s of samples) {
      const key = labelsKey(s.labels);
      if (seen.has(key)) throw new PromQLError('vector cannot contain metrics with the same labelset', null, 'execution');
      seen.add(key);
      let row = rows.get(key);
      if (!row) rows.set(key, (row = { labels: s.labels, values: new Array(timestamps.length).fill(null) }));
      row.values[ti] = s.value;
    }
  });

  const series = [...rows.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, row]) => row);
  return { timestamps, series };
}
