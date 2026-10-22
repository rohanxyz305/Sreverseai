import { MetricStore } from '../engine/store';
import type { Labels } from '../engine/types';

/** Small hand-built store: 61 scrapes, 15 s apart, starting at t=0. */
export function makeStore(series: { labels: Labels; fn: (i: number) => number }[], length = 61): MetricStore {
  const store = new MetricStore(0, 15, length);
  for (const s of series) {
    const values = new Float64Array(length);
    for (let i = 0; i < length; i++) values[i] = s.fn(i);
    store.add(s.labels, values);
  }
  return store;
}

export const END = 60 * 15;
