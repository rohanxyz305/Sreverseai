import { describe, expect, it } from 'vitest';
import { queryRange } from '../engine/promql/eval';
import { simulate, SIM_END } from '../engine/simulator';

describe('simulator', () => {
  it('is deterministic for a seed', () => {
    const a = simulate(42);
    const b = simulate(42);
    const c = simulate(43);
    expect(a.series.length).toBe(b.series.length);
    a.series.forEach((s, i) => expect(s.values).toEqual(b.series[i].values));
    expect(a.series[0].values).not.toEqual(c.series[0].values);
  });

  it('keeps 6 h of 15 s scrapes ending at the virtual now', () => {
    const s = simulate(1);
    expect(s.length).toBe(1441);
    expect(s.end).toBe(SIM_END);
    expect(s.series.length).toBeLessThanOrEqual(200);
  });

  it('counters never decrease', () => {
    const s = simulate(7, { incidents: [{ type: 'error_burst', target: 'api', startMin: 30 }] });
    for (const series of s.get('http_requests_total')) {
      for (let i = 1; i < series.values.length; i++) expect(series.values[i]).toBeGreaterThanOrEqual(series.values[i - 1]);
    }
  });

  it('histogram buckets are cumulative and +Inf equals _count', () => {
    const s = simulate(9);
    for (const svc of ['frontend', 'api', 'payments']) {
      const buckets = s.get('http_request_duration_seconds_bucket').filter((x) => x.labels.service === svc);
      const count = s.get('http_request_duration_seconds_count').find((x) => x.labels.service === svc)!;
      const last = s.length - 1;
      for (let b = 1; b < buckets.length; b++) expect(buckets[b].values[last]).toBeGreaterThanOrEqual(buckets[b - 1].values[last]);
      expect(buckets.at(-1)!.labels.le).toBe('+Inf');
      expect(buckets.at(-1)!.values[last]).toBe(count.values[last]);
    }
  });

  it('request histogram _count matches http_requests_total', () => {
    const s = simulate(11);
    const q = (query: string) => queryRange(s, query, SIM_END, SIM_END, 15).series[0].values[0]!;
    const fromCounter = q('sum(increase(http_requests_total{service="api"}[10m]))');
    const fromHist = q('sum(increase(http_request_duration_seconds_count{service="api"}[10m]))');
    expect(fromHist).toBeCloseTo(fromCounter, 6);
  });

  it('injects incidents', () => {
    const base = simulate(5);
    const hot = simulate(5, { incidents: [{ type: 'cpu_spike', target: 'node-b', startMin: 10 }] });
    const cpu = (store: typeof base) => queryRange(store, 'node_cpu_usage{node="node-b"}', SIM_END, SIM_END, 15).series[0].values[0]!;
    expect(cpu(hot) - cpu(base)).toBeGreaterThan(40);

    const errs = simulate(5, { incidents: [{ type: 'error_burst', target: 'api', startMin: 10, magnitude: 0.3 }] });
    const ratio = queryRange(
      errs,
      'sum(rate(http_requests_total{service="api",status="500"}[5m])) / sum(rate(http_requests_total{service="api"}[5m]))',
      SIM_END,
      SIM_END,
      15,
    ).series[0].values[0]!;
    expect(ratio).toBeGreaterThan(0.25);
    expect(ratio).toBeLessThan(0.35);
  });

  it('evaluates a 6 h dashboard query quickly', () => {
    const s = simulate(3);
    const t0 = performance.now();
    queryRange(s, 'sum by (service) (rate(http_requests_total[5m]))', SIM_END - 6 * 3600, SIM_END, 60);
    expect(performance.now() - t0).toBeLessThan(500);
  });
});
