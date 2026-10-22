import { useMemo } from 'react';
import { TIME_RANGE_SECONDS, type TimeRange } from '../engine/level';
import { queryRange } from '../engine/promql/eval';
import { PromQLError } from '../engine/promql/parser';
import { SCRAPE_INTERVAL, SIM_END } from '../engine/simulator';
import type { MetricStore } from '../engine/store';
import type { QueryResult } from '../engine/types';

export type QueryState = { result: QueryResult; error?: undefined } | { result?: undefined; error: string } | { result?: undefined; error?: undefined };

/** ~240 points per chart, aligned to the scrape interval (like Grafana's auto step). */
export function stepFor(range: TimeRange): number {
  return Math.max(SCRAPE_INTERVAL, Math.ceil(TIME_RANGE_SECONDS[range] / 240 / SCRAPE_INTERVAL) * SCRAPE_INTERVAL);
}

export function useRangeQuery(store: MetricStore | null, query: string, range: TimeRange): QueryState {
  return useMemo(() => {
    if (!store || !query.trim()) return {};
    try {
      return { result: queryRange(store, query, SIM_END - TIME_RANGE_SECONDS[range], SIM_END, stepFor(range)) };
    } catch (err) {
      if (err instanceof PromQLError) return { error: err.message };
      throw err;
    }
  }, [store, query, range]);
}
