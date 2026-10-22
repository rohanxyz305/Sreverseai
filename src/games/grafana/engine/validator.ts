import { queryRange } from './promql/eval';
import { PromQLError } from './promql/parser';
import { SIM_END } from './simulator';
import type { MetricStore } from './store';
import { formatLabels, labelsKey, type QueryResult } from './types';

/** Answers are checked over a fixed window, independent of the player's dashboard time range. */
export const CHECK_WINDOW = 30 * 60;
export const CHECK_STEP = 60;

export interface CheckResult {
  ok: boolean;
  message: string;
}

const expectedCache = new WeakMap<MetricStore, Map<string, QueryResult>>();

export function checkWindowQuery(store: MetricStore, query: string): QueryResult {
  return queryRange(store, query, SIM_END - CHECK_WINDOW, SIM_END, CHECK_STEP);
}

function expectedResult(store: MetricStore, query: string): QueryResult {
  let cache = expectedCache.get(store);
  if (!cache) expectedCache.set(store, (cache = new Map()));
  let r = cache.get(query);
  if (!r) cache.set(query, (r = checkWindowQuery(store, query)));
  return r;
}

export function valuesClose(a: number | null, b: number | null, tolerance: number): boolean {
  if (a === null || b === null) return a === b;
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.isNaN(a) && Number.isNaN(b);
  if (a === b) return true;
  const diff = Math.abs(a - b);
  // Relative tolerance, with an absolute floor so values near 0 do not fail on noise.
  return diff <= tolerance * Math.max(Math.abs(a), Math.abs(b)) || diff <= 1e-9;
}

function fmt(v: number | null): string {
  if (v === null) return 'no data';
  if (!Number.isFinite(v)) return String(v);
  return Math.abs(v) >= 1000 ? v.toExponential(3) : Number(v.toPrecision(4)).toString();
}

/**
 * Compares the *result* of the player's query to the result of the reference query:
 * same series (label sets) and values within `tolerance`. The query text never matters.
 */
export function compareQuery(store: MetricStore, actualQuery: string, expectedQuery: string, tolerance = 0.01): CheckResult {
  if (!actualQuery.trim()) return { ok: false, message: 'Write a query first.' };
  const expected = expectedResult(store, expectedQuery);
  let actual: QueryResult;
  try {
    actual = checkWindowQuery(store, actualQuery);
  } catch (err) {
    if (err instanceof PromQLError) return { ok: false, message: err.message };
    throw err;
  }

  if (actual.series.length === 0) {
    return { ok: false, message: 'Your query returns no data. Check the metric name and label matchers.' };
  }
  const exp = expected.series;
  const act = actual.series;
  if (act.length !== exp.length) {
    let tip = '';
    if (act.length > exp.length) tip = exp.length === 1 ? ' Try aggregating, for example with sum().' : ' Try filtering or aggregating.';
    else tip = ' Your filter may be too narrow.';
    return { ok: false, message: `Your query returns ${act.length} series; the answer has ${exp.length}.${tip}` };
  }

  const actualByKey = new Map(act.map((s) => [labelsKey(s.labels), s]));
  for (const e of exp) {
    const a = actualByKey.get(labelsKey(e.labels));
    if (!a) {
      return {
        ok: false,
        message: `The series labels don't match. Expected a series like ${formatLabels(e.labels)}, but got ${formatLabels(act[0].labels)}.`,
      };
    }
  }
  for (const e of exp) {
    const a = actualByKey.get(labelsKey(e.labels))!;
    for (let i = 0; i < e.values.length; i++) {
      if (!valuesClose(a.values[i], e.values[i], tolerance)) {
        return {
          ok: false,
          message: `The labels match, but the values are off (expected about ${fmt(e.values[i])}, got ${fmt(a.values[i])}). Check the function and range.`,
        };
      }
    }
  }
  return { ok: true, message: 'Correct!' };
}
