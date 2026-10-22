import { describe, expect, it } from 'vitest';
import { computeStars } from '../engine/scoring';
import { simulate } from '../engine/simulator';
import { compareQuery, valuesClose } from '../engine/validator';

const store = simulate(42, { incidents: [{ type: 'error_burst', target: 'api', startMin: 20 }] });

describe('compareQuery', () => {
  it('accepts any query with the same result, not the same text', () => {
    const expected = 'sum by (service) (rate(http_requests_total[5m]))';
    expect(compareQuery(store, expected, expected).ok).toBe(true);
    expect(compareQuery(store, 'sum(rate(http_requests_total[5m])) by (service)', expected).ok).toBe(true);
    expect(compareQuery(store, 'sum without (pod, node, method, status) (rate(http_requests_total[5m]))', expected).ok).toBe(true);
  });

  it('explains wrong series counts', () => {
    const r = compareQuery(store, 'rate(http_requests_total[5m])', 'sum(rate(http_requests_total[5m]))');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/returns 36 series; the answer has 1\. Try aggregating/);
  });

  it('explains wrong labels and wrong values', () => {
    expect(compareQuery(store, 'sum by (pod) (rate(http_requests_total{service="api"}[5m]))', 'sum by (method) (rate(http_requests_total{service="api"}[5m]))').message).toMatch(/labels don't match/);
    expect(compareQuery(store, 'sum(rate(http_requests_total[1m]))', 'sum(rate(http_requests_total[5m]))').message).toMatch(/values are off/);
  });

  it('passes through PromQL errors and empty results', () => {
    expect(compareQuery(store, 'rate(http_requests_total)', 'http_requests_total').message).toMatch(/parse error/);
    expect(compareQuery(store, 'http_request_total', 'http_requests_total').message).toMatch(/no data/);
    expect(compareQuery(store, '  ', 'http_requests_total').ok).toBe(false);
  });
});

describe('valuesClose', () => {
  it('uses a relative tolerance with an absolute floor', () => {
    expect(valuesClose(100, 100.9, 0.01)).toBe(true);
    expect(valuesClose(100, 102, 0.01)).toBe(false);
    expect(valuesClose(0, 0, 0.01)).toBe(true);
    expect(valuesClose(0, 1e-12, 0.01)).toBe(true);
    expect(valuesClose(NaN, NaN, 0.01)).toBe(true);
    expect(valuesClose(null, 0, 0.01)).toBe(false);
  });
});

describe('computeStars', () => {
  it('follows the plan', () => {
    expect(computeStars(50, 0, 60)).toBe(3);
    expect(computeStars(70, 0, 60)).toBe(2);
    expect(computeStars(50, 1, 60)).toBe(2);
    expect(computeStars(130, 0, 60)).toBe(1);
    expect(computeStars(50, 2, 60)).toBe(1);
    expect(computeStars(10, 0, 60, true)).toBe(1);
  });
});
