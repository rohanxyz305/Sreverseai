export type Labels = Record<string, string>;

/** One stored time series. Values are aligned to the store's scrape grid. */
export interface Series {
  labels: Labels;
  values: Float64Array;
}

/** Result of a range query: one row per series, values aligned to `timestamps` (seconds); null = no sample. */
export interface QueryResult {
  timestamps: number[];
  series: { labels: Labels; values: (number | null)[] }[];
}

export function labelsKey(labels: Labels): string {
  const keys = Object.keys(labels).sort();
  let out = '';
  for (const k of keys) out += k + '\u0000' + labels[k] + '\u0001';
  return out;
}

export function formatLabels(labels: Labels): string {
  const name = labels.__name__ ?? '';
  const rest = Object.keys(labels)
    .filter((k) => k !== '__name__')
    .sort()
    .map((k) => `${k}="${labels[k]}"`)
    .join(', ');
  return rest ? `${name}{${rest}}` : name || '{}';
}
