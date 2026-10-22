export type MatchOp = '=' | '!=' | '=~' | '!~';

export interface Matcher {
  name: string;
  op: MatchOp;
  value: string;
  re?: RegExp;
}

export type ValueType = 'scalar' | 'vector' | 'matrix' | 'string';

export const TYPE_NAMES: Record<ValueType, string> = {
  scalar: 'scalar',
  vector: 'instant vector',
  matrix: 'range vector',
  string: 'string',
};

export interface VectorSelector {
  type: 'vector';
  name?: string;
  matchers: Matcher[];
  offset: number;
  pos: number;
}

export interface MatrixSelector {
  type: 'matrix';
  vector: VectorSelector;
  range: number;
  pos: number;
}

export type AggOp = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'topk' | 'bottomk';
export type BinOp =
  | '+' | '-' | '*' | '/' | '%' | '^'
  | '==' | '!=' | '>' | '<' | '>=' | '<='
  | 'and' | 'or' | 'unless';

export type Expr =
  | { type: 'number'; value: number; pos: number }
  | { type: 'string'; value: string; pos: number }
  | VectorSelector
  | MatrixSelector
  | { type: 'call'; func: string; args: Expr[]; pos: number }
  | { type: 'agg'; op: AggOp; param?: Expr; expr: Expr; grouping: string[]; without: boolean; pos: number }
  | {
      type: 'binary';
      op: BinOp;
      lhs: Expr;
      rhs: Expr;
      bool: boolean;
      matching?: { on: boolean; labels: string[] };
      pos: number;
    }
  | { type: 'unary'; op: '-'; expr: Expr; pos: number }
  | { type: 'paren'; expr: Expr; pos: number };

export const COMPARISON_OPS = new Set<BinOp>(['==', '!=', '>', '<', '>=', '<=']);
export const SET_OPS = new Set<BinOp>(['and', 'or', 'unless']);

export function typeOf(e: Expr): ValueType {
  switch (e.type) {
    case 'number':
      return 'scalar';
    case 'string':
      return 'string';
    case 'vector':
    case 'agg':
      return 'vector';
    case 'matrix':
      return 'matrix';
    case 'call':
      return FUNCTIONS[e.func].ret;
    case 'binary':
      return typeOf(e.lhs) === 'scalar' && typeOf(e.rhs) === 'scalar' ? 'scalar' : 'vector';
    case 'unary':
    case 'paren':
      return typeOf(e.expr);
  }
}

export interface FunctionSpec {
  args: ValueType[];
  ret: ValueType;
}

export const FUNCTIONS: Record<string, FunctionSpec> = {
  rate: { args: ['matrix'], ret: 'vector' },
  irate: { args: ['matrix'], ret: 'vector' },
  increase: { args: ['matrix'], ret: 'vector' },
  delta: { args: ['matrix'], ret: 'vector' },
  avg_over_time: { args: ['matrix'], ret: 'vector' },
  min_over_time: { args: ['matrix'], ret: 'vector' },
  max_over_time: { args: ['matrix'], ret: 'vector' },
  sum_over_time: { args: ['matrix'], ret: 'vector' },
  count_over_time: { args: ['matrix'], ret: 'vector' },
  last_over_time: { args: ['matrix'], ret: 'vector' },
  abs: { args: ['vector'], ret: 'vector' },
  ceil: { args: ['vector'], ret: 'vector' },
  floor: { args: ['vector'], ret: 'vector' },
  round: { args: ['vector'], ret: 'vector' },
  sqrt: { args: ['vector'], ret: 'vector' },
  clamp_min: { args: ['vector', 'scalar'], ret: 'vector' },
  clamp_max: { args: ['vector', 'scalar'], ret: 'vector' },
  scalar: { args: ['vector'], ret: 'scalar' },
  vector: { args: ['scalar'], ret: 'vector' },
  time: { args: [], ret: 'scalar' },
};

/** Real PromQL functions that the simulator does not implement yet (friendlier than "unknown function"). */
export const NOT_YET = new Set([
  'histogram_quantile', 'predict_linear', 'deriv', 'idelta', 'label_replace', 'label_join', 'absent',
  'absent_over_time', 'present_over_time', 'sort', 'sort_desc', 'sort_by_label', 'changes', 'resets',
  'quantile_over_time', 'stddev_over_time', 'stdvar_over_time', 'timestamp', 'clamp', 'sgn', 'exp', 'ln',
  'log2', 'log10', 'hour', 'minute', 'day_of_week', 'day_of_month', 'days_in_month', 'month', 'year',
  'holt_winters', 'double_exponential_smoothing',
]);
export const AGG_NOT_YET = new Set(['stddev', 'stdvar', 'quantile', 'count_values', 'group', 'limitk', 'limit_ratio']);
