import { describe, expect, it } from 'vitest';
import { parse, parseDuration, PromQLError } from '../engine/promql/parser';

function err(q: string): string {
  try {
    parse(q);
  } catch (e) {
    expect(e).toBeInstanceOf(PromQLError);
    return (e as Error).message;
  }
  throw new Error(`expected "${q}" to fail`);
}

describe('parser', () => {
  it('parses selectors, functions, aggregations and binary expressions', () => {
    for (const q of [
      'http_requests_total',
      'http_requests_total{service="api", status=~"5.."}',
      '{__name__="node_cpu_usage"}',
      'rate(http_requests_total[5m])',
      'sum by (service) (rate(http_requests_total[5m]))',
      'sum(rate(http_requests_total[5m])) by (service)',
      'sum without (pod, node) (rate(http_requests_total{status="500"}[1m]))',
      'topk(3, memory_bytes)',
      'a / ignoring(status) b',
      'a / on(service) b',
      'node_cpu_usage > bool 70',
      '-node_cpu_usage',
      '2 ^ 3 ^ 2',
      'rate(http_requests_total[1h30m] offset 5m)',
      'a and b or c unless d',
      "metric{label='single quoted'}",
      'sum(rate(x[5m])) # trailing comment',
    ]) {
      expect(() => parse(q), q).not.toThrow();
    }
  });

  it('respects precedence and right-associative ^', () => {
    const e = parse('1 + 2 * 3');
    expect(e.type === 'binary' && e.op).toBe('+');
    const p = parse('2 ^ 3 ^ 2');
    expect(p.type === 'binary' && p.rhs.type).toBe('binary');
    const u = parse('-2 ^ 2');
    expect(u.type).toBe('unary');
  });

  it('parses durations', () => {
    expect(parseDuration('5m')).toBe(300);
    expect(parseDuration('1h30m')).toBe(5400);
    expect(parseDuration('500ms')).toBe(0.5);
  });

  it('produces Prometheus-style errors', () => {
    expect(err('rate(http_requests_total)')).toBe(
      '1:6: parse error: expected type range vector in call to function "rate", got instant vector',
    );
    expect(err('sum(rate(x[5m])')).toMatch(/unexpected end of input/);
    expect(err('foo(bar)')).toMatch(/unknown function with name "foo"/);
    expect(err('histogram_quantile(0.9, x)')).toMatch(/not available yet/);
    expect(err('{}')).toMatch(/at least one non-empty matcher/);
    expect(err('1 > 2')).toMatch(/must use BOOL modifier/);
    expect(err('x{a="b"')).toMatch(/expected "," or "}"/);
    expect(err('x{a=b}')).toMatch(/expected string/);
    expect(err('sum(x[5m])')).toMatch(/expected type instant vector in aggregation expression, got range vector/);
    expect(err('rate(x[5m], 1)')).toMatch(/expected 1 argument\(s\) in call to "rate", got 2/);
    expect(err('(x)[5m]')).toMatch(/ranges only allowed for vector selectors/);
    expect(err('x[5m:1m]')).toMatch(/subqueries are not available yet/);
    expect(err('')).toMatch(/no expression found/);
    expect(err('x $ y')).toMatch(/unexpected character/);
    expect(err('x{a=~"("}')).toMatch(/invalid regular expression/);
    expect(err('x and 1')).toMatch(/set operator "and" not allowed/);
  });
});
