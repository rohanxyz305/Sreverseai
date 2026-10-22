import { describe, expect, it } from 'vitest';
import { extrapolatedRate, queryRange } from '../engine/promql/eval';
import { END, makeStore } from './helpers';

/** Value of the single series at the last step. */
function last(store: ReturnType<typeof makeStore>, q: string) {
  const r = queryRange(store, q, END, END, 15);
  return r.series.map((s) => ({ labels: s.labels, value: s.values[0] }));
}

const store = makeStore([
  { labels: { __name__: 'reqs', service: 'api', status: '200' }, fn: (i) => 1000 + 10 * i },
  { labels: { __name__: 'reqs', service: 'api', status: '500' }, fn: (i) => 100 + 1 * i },
  { labels: { __name__: 'reqs', service: 'web', status: '200' }, fn: (i) => 5000 + 30 * i },
  { labels: { __name__: 'reqs', service: 'web', status: '500' }, fn: () => 50 },
  { labels: { __name__: 'cpu', node: 'a' }, fn: () => 40 },
  { labels: { __name__: 'cpu', node: 'b' }, fn: (i) => (i < 40 ? 50 : 95) },
  { labels: { __name__: 'resets', job: 'x' }, fn: (i) => (i < 50 ? 100 + i : i - 50) },
  { labels: { __name__: 'mem', node: 'a' }, fn: () => 1 },
]);

describe('rate / increase', () => {
  it('matches Prometheus extrapolation for a steady counter', () => {
    // 20 samples in (t-5m, t], +10 per scrape: rate = 10 / 15 s.
    const [s] = last(store, 'rate(reqs{service="api",status="200"}[5m])');
    expect(s.value).toBeCloseTo(10 / 15, 10);
    expect(s.labels).toEqual({ service: 'api', status: '200' });
  });

  it('increase() = rate() * range', () => {
    const [s] = last(store, 'increase(reqs{service="web",status="200"}[5m])');
    expect(s.value).toBeCloseTo(30 * 20, 8);
  });

  it('handles counter resets', () => {
    // Window holds 141..149, reset to 0, then 0..10: increase 8 + 10 = 18, extrapolated by 300/285.
    const [s] = last(store, 'increase(resets[5m])');
    expect(s.value).toBeCloseTo((18 * 300) / 285, 10);
  });

  it('irate uses the last two samples', () => {
    const [s] = last(store, 'irate(reqs{service="web",status="200"}[1m])');
    expect(s.value).toBeCloseTo(2, 10);
  });

  it('extrapolates to zero at most for counters starting low', () => {
    const v = extrapolatedRate([15, 30, 45], [0, 10, 20], 0, 60, true, false);
    // Would extrapolate 15 s before the first sample, but the counter started at 0.
    expect(v).toBeCloseTo(20 * (30 + 0 + 15) / 30, 10);
  });

  it('returns nothing with fewer than 2 samples', () => {
    expect(extrapolatedRate([0], [1], 0, 60, true, true)).toBeUndefined();
  });
});

describe('selectors', () => {
  it('anchors regex matchers', () => {
    expect(last(store, 'reqs{status=~"5"}')).toHaveLength(0);
    expect(last(store, 'reqs{status=~"5.."}')).toHaveLength(2);
    expect(last(store, 'reqs{status!~"5..",service!="web"}')).toHaveLength(1);
  });

  it('keeps __name__ on raw selectors and supports offset', () => {
    const [s] = last(store, 'cpu{node="b"} offset 6m');
    expect(s.labels.__name__).toBe('cpu');
    expect(s.value).toBe(50);
  });
});

describe('aggregation', () => {
  it('sum by', () => {
    const r = last(store, 'sum by (service) (rate(reqs[5m]))');
    expect(r.map((s) => s.labels)).toEqual([{ service: 'api' }, { service: 'web' }]);
    expect(r[0].value).toBeCloseTo(11 / 15, 10);
    expect(r[1].value).toBeCloseTo(2, 10);
  });

  it('avg / min / max / count, and without()', () => {
    expect(last(store, 'avg(cpu)')[0].value).toBe(67.5);
    expect(last(store, 'max(cpu)')[0].value).toBe(95);
    expect(last(store, 'min(cpu)')[0].value).toBe(40);
    expect(last(store, 'count(reqs)')[0].value).toBe(4);
    expect(last(store, 'sum without (status) (reqs)').map((s) => s.labels)).toEqual([{ service: 'api' }, { service: 'web' }]);
  });

  it('topk / bottomk keep the original labels', () => {
    const [top] = last(store, 'topk(1, cpu)');
    expect(top.labels).toEqual({ __name__: 'cpu', node: 'b' });
    const [bottom] = last(store, 'bottomk(1, cpu)');
    expect(bottom.labels.node).toBe('a');
  });
});

describe('binary operators', () => {
  it('error ratio with ignoring()', () => {
    const r = last(store, 'rate(reqs{status="500"}[5m]) / ignoring(status) rate(reqs{status="200"}[5m])');
    expect(r).toHaveLength(2);
    expect(r[0].labels).toEqual({ service: 'api' });
    expect(r[0].value).toBeCloseTo(0.1, 10);
    expect(r[1].value).toBe(0);
  });

  it('one-to-one matching without modifiers needs identical labels', () => {
    expect(last(store, 'rate(reqs{status="500"}[5m]) / rate(reqs{status="200"}[5m])')).toHaveLength(0);
  });

  it('comparisons filter, bool returns 0/1', () => {
    expect(last(store, 'cpu > 70').map((s) => s.labels.node)).toEqual(['b']);
    expect(last(store, 'cpu > bool 70').map((s) => s.value)).toEqual([0, 1]);
  });

  it('scalar arithmetic drops the metric name', () => {
    const r = last(store, 'cpu / 100');
    expect(r[0]).toEqual({ labels: { node: 'a' }, value: 0.4 });
    expect(last(store, '2 * 3 + 1')[0].value).toBe(7);
  });

  it('set operators', () => {
    expect(last(store, 'cpu and cpu > 70').map((s) => s.labels.node)).toEqual(['b']);
    expect(last(store, 'cpu unless cpu > 70').map((s) => s.labels.node)).toEqual(['a']);
    expect(last(store, 'cpu{node="a"} or cpu')).toHaveLength(2);
  });

  it('rejects many-to-many matching', () => {
    expect(() => last(store, 'reqs / on(service) reqs')).toThrow(/many-to-many|duplicate series/);
  });
});

describe('queryRange', () => {
  it('returns aligned timestamps and null for missing samples', () => {
    const r = queryRange(store, 'cpu > 70', 0, END, 60);
    expect(r.timestamps).toHaveLength(16);
    const b = r.series[0];
    expect(b.values[0]).toBeNull();
    expect(b.values[15]).toBe(95);
  });

  it('rejects range vectors at the top level', () => {
    expect(() => queryRange(store, 'reqs[5m]', 0, END, 60)).toThrow(/invalid expression type "range vector"/);
  });

  it('rejects duplicate label sets after dropping the name', () => {
    expect(() => queryRange(store, 'abs({__name__=~"cpu|mem", node="a"})', END, END, 15)).toThrow(/same labelset/);
  });
});
