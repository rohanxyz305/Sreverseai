import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Level, PanelConfig, PlayerState } from '../engine/level';
import { checkAll } from '../engine/objectives';
import { queryRange } from '../engine/promql/eval';
import { simulate, SIM_END } from '../engine/simulator';

const dir = join(__dirname, '..', 'levels', 'practice');
const index: { challenges: { id: number; file: string; difficulty: string }[] } = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const challenges: Level[] = index.challenges.map((c) => JSON.parse(readFileSync(join(dir, c.file), 'utf8')));

const empty: PlayerState = { panels: [], exploreQuery: '', timeRange: '6h', choices: {} };
const explore = (q: string): PlayerState => ({ ...empty, exploreQuery: q });
const panel = (type: PanelConfig['type'], query: string, unit: PanelConfig['unit'] = 'none'): PlayerState => ({
  ...empty,
  panels: [{ id: 'x', title: 'x', type, unit, query }],
});

/** A different-but-equivalent right answer where possible (proves results are compared, not text), and a wrong one. */
const solutions: Record<number, { right: PlayerState; wrong: PlayerState }> = {
  1: { right: explore('sum(rate(http_requests_total[5m]))'), wrong: explore('sum(http_requests_total)') },
  2: { right: explore('sum(rate(http_requests_total[5m])) by (service)'), wrong: explore('sum by (pod) (rate(http_requests_total[5m]))') },
  3: { right: explore('count without (pod, node) (memory_bytes)'), wrong: explore('count(memory_bytes)') },
  4: { right: panel('timeseries', 'memory_bytes{service="api"}', 'bytes'), wrong: panel('timeseries', 'memory_bytes{service="api"}') },
  5: { right: panel('gauge', 'db_connections_active'), wrong: panel('stat', 'db_connections_active') },
  6: { right: explore('node_cpu_usage > 80'), wrong: explore('node_cpu_usage') },
  7: {
    right: explore('sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)'),
    wrong: explore('100 * sum by (service) (rate(http_requests_total{status=~"5.."}[5m])) / sum by (service) (rate(http_requests_total[5m]))'),
  },
  8: { right: explore('sum by (method) (rate(http_requests_total[1m])) * 60'), wrong: explore('sum by (method) (rate(http_requests_total[1m]))') },
  9: { right: panel('table', 'topk(3, pod_cpu_usage)'), wrong: panel('table', 'topk(5, pod_cpu_usage)') },
  10: { right: explore('max_over_time(node_cpu_usage[60m])'), wrong: explore('avg_over_time(node_cpu_usage[1h])') },
  11: {
    right: explore('sum(rate(http_request_duration_seconds_sum[5m])) by (service) / sum(rate(http_request_duration_seconds_count[5m])) by (service)'),
    wrong: explore('sum by (service) (http_request_duration_seconds_sum) / sum by (service) (http_request_duration_seconds_count)'),
  },
  12: {
    right: { ...panel('stat', 'avg(node_cpu_usage)', 'percent'), timeRange: '1h' },
    wrong: { ...panel('stat', 'avg(node_cpu_usage)', 'percent'), timeRange: '6h' },
  },
  13: { right: { ...empty, choices: { svc: 2 } }, wrong: { ...empty, choices: { svc: 1 } } },
  14: { right: { ...empty, choices: { svc: 0, when: 2 } }, wrong: { ...empty, choices: { svc: 0, when: 3 } } },
  15: { right: { ...empty, choices: { pod: 0 } }, wrong: { ...empty, choices: { pod: 2 } } },
};

const at = (c: Level, q: string, start = SIM_END, step = 15) => queryRange(simulate(c.seed, c.scenario), q, start, SIM_END, step);

describe('practice challenges', () => {
  it('index matches the files and every challenge has a solution', () => {
    expect(new Set(challenges.map((c) => c.id)).size).toBe(challenges.length);
    challenges.forEach((c, i) => {
      expect(c.id).toBe(index.challenges[i].id);
      expect(['easy', 'medium', 'hard']).toContain(c.difficulty);
      expect(solutions[c.id], `solution for ${c.id}`).toBeDefined();
    });
  });

  for (const c of challenges) {
    describe(`#${c.id} ${c.title}`, () => {
      const store = simulate(c.seed, c.scenario);
      it('accepts the right answer', () => {
        for (const [id, r] of Object.entries(checkAll(c.objectives, solutions[c.id].right, store))) expect(r, id).toMatchObject({ ok: true });
      });
      it('rejects a wrong answer', () => {
        expect(Object.values(checkAll(c.objectives, solutions[c.id].wrong, store)).some((r) => !r.ok)).toBe(true);
      });
    });
  }

  const byId = (id: number) => challenges.find((c) => c.id === id)!;

  it('#13: payments really has the highest 5xx rate', () => {
    const r = at(byId(13), 'topk(1, sum by (service) (rate(http_requests_total{status=~"5.."}[5m])))');
    expect(r.series[0].labels.service).toBe('payments');
  });

  it('#14: frontend latency really jumps at 11:48', () => {
    const c = byId(14);
    const r = at(c, 'sum by (service) (rate(http_request_duration_seconds_sum[1m])) / sum by (service) (rate(http_request_duration_seconds_count[1m]))', SIM_END - 1800);
    const top = r.series.reduce((a, b) => ((a.values.at(-1) ?? 0) > (b.values.at(-1) ?? 0) ? a : b));
    expect(top.labels.service).toBe('frontend');
    const base = top.values[0]!;
    const first = r.timestamps[top.values.findIndex((v) => v! > base * 2)];
    expect(new Date(first * 1000).toISOString().slice(11, 16)).toBe('11:48');
  });

  it('#15: frontend-1 grows the most but is not the biggest pod', () => {
    const c = byId(15);
    expect(at(c, 'topk(1, delta(memory_bytes[1h]))').series[0].labels.pod).toBe('frontend-1');
    expect(at(c, 'topk(1, memory_bytes)').series[0].labels.pod).not.toBe('frontend-1');
  });

  it('#6 and #10: the incident is visible', () => {
    expect(at(byId(6), 'node_cpu_usage > 80').series.map((s) => s.labels.node)).toEqual(['node-a']);
    const peak = at(byId(10), 'max_over_time(node_cpu_usage{node="node-b"}[1h])').series[0].values[0]!;
    const now = at(byId(10), 'node_cpu_usage{node="node-b"}').series[0].values[0]!;
    expect(peak - now).toBeGreaterThan(30);
  });
});
