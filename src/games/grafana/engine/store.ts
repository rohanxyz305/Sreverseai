import type { Labels, Series } from './types';

/** In-memory TSDB: every series shares one regular scrape grid. */
export class MetricStore {
  readonly series: Series[] = [];
  private byName = new Map<string, Series[]>();

  constructor(
    readonly start: number,
    readonly step: number,
    readonly length: number,
  ) {}

  get end(): number {
    return this.start + (this.length - 1) * this.step;
  }

  timestampAt(i: number): number {
    return this.start + i * this.step;
  }

  add(labels: Labels, values: Float64Array): void {
    const s: Series = { labels, values };
    this.series.push(s);
    const name = labels.__name__;
    const list = this.byName.get(name);
    if (list) list.push(s);
    else this.byName.set(name, [s]);
  }

  /** Series with the given metric name, or all series when no name is given. */
  get(name?: string): Series[] {
    if (name === undefined) return this.series;
    return this.byName.get(name) ?? [];
  }

  metricNames(): string[] {
    return [...this.byName.keys()].sort();
  }

  labelValues(label: string, name?: string): string[] {
    const set = new Set<string>();
    for (const s of this.get(name)) if (s.labels[label] !== undefined) set.add(s.labels[label]);
    return [...set].sort();
  }
}
