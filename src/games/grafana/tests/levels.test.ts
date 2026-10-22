import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Level, PlayerState } from '../engine/level';
import { checkAll } from '../engine/objectives';
import { queryRange } from '../engine/promql/eval';
import { simulate, SIM_END } from '../engine/simulator';

const dir = join(__dirname, '..', 'levels');
const levels: Level[] = readdirSync(dir)
  .filter((f) => /^\d+-.*\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

const empty: PlayerState = { panels: [], exploreQuery: '', timeRange: '6h', choices: {} };
const panel = (type: PlayerState['panels'][number]['type'], query: string, unit: PlayerState['panels'][number]['unit'] = 'none') => ({
  id: Math.random().toString(36),
  title: 'p',
  type,
  unit,
  query,
});

/** A reference solution and a plausible wrong answer for every level. */
const solutions: Record<number, { right: PlayerState; wrong: PlayerState }> = {
  1: {
    right: { ...empty, panels: [panel('timeseries', 'http_requests_total')] },
    wrong: { ...empty, panels: [panel('stat', 'http_requests_total')] },
  },
  2: {
    right: { ...empty, timeRange: '15m', choices: { when: 2 } },
    wrong: { ...empty, timeRange: '15m', choices: { when: 1 } },
  },
  3: {
    right: { ...empty, panels: [panel('stat', 'node_cpu_usage', 'percent'), panel('gauge', 'node_cpu_usage', 'percent')] },
    wrong: { ...empty, panels: [panel('stat', 'node_cpu_usage'), panel('gauge', 'node_cpu_usage', 'percent')] },
  },
  4: {
    right: { ...empty, exploreQuery: 'topk(1, memory_bytes)', choices: { pod: 3 } },
    wrong: { ...empty, choices: { pod: 2 } },
  },
  5: {
    right: { ...empty, exploreQuery: 'http_requests_total{status=~"5..", service="api"}' },
    wrong: { ...empty, exploreQuery: 'http_requests_total{service="api", status="5.."}' },
  },
};

describe('levels', () => {
  it('ids are unique and every level has a reference solution', () => {
    const ids = levels.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(solutions[id], `solution for level ${id}`).toBeDefined();
  });

  for (const level of levels) {
    describe(`level ${level.id}: ${level.title}`, () => {
      const store = simulate(level.seed, level.scenario);

      it('has valid content', () => {
        expect(level.hints.length).toBeGreaterThanOrEqual(2);
        expect(level.objectives.length).toBeGreaterThan(0);
        for (const o of level.objectives) if (o.type === 'choice') expect(o.options[o.answer]).toBeDefined();
        for (const p of level.startPanels ?? []) expect(() => queryRange(store, p.query, SIM_END - 3600, SIM_END, 60)).not.toThrow();
      });

      it('is solved by the reference answer', () => {
        const results = checkAll(level.objectives, solutions[level.id].right, store);
        for (const [id, r] of Object.entries(results)) expect(r, `objective ${id}`).toMatchObject({ ok: true });
      });

      it('rejects a wrong answer', () => {
        const results = checkAll(level.objectives, solutions[level.id].wrong, store);
        expect(Object.values(results).some((r) => !r.ok)).toBe(true);
      });
    });
  }

  it('level 2: the frontend spike really starts at 11:51 UTC', () => {
    const l = levels.find((x) => x.id === 2)!;
    const store = simulate(l.seed, l.scenario);
    const r = queryRange(store, 'sum(rate(http_requests_total{service="frontend"}[1m]))', SIM_END - 900, SIM_END, 15);
    const baseline = r.series[0].values[0]!;
    const firstHigh = r.timestamps[r.series[0].values.findIndex((v) => v! > baseline * 1.5)];
    const hhmm = new Date(firstHigh * 1000).toISOString().slice(11, 16);
    expect(hhmm).toBe('11:51');
  });

  it('level 4: the answer is the pod with the highest memory', () => {
    const l = levels.find((x) => x.id === 4)!;
    const store = simulate(l.seed, l.scenario);
    const r = queryRange(store, 'topk(1, memory_bytes)', SIM_END, SIM_END, 15);
    const o = l.objectives[0];
    expect(o.type === 'choice' && o.options[o.answer]).toBe(r.series[0].labels.pod);
  });

  it('level 3: node-b is in the red', () => {
    const l = levels.find((x) => x.id === 3)!;
    const store = simulate(l.seed, l.scenario);
    const r = queryRange(store, 'node_cpu_usage{node="node-b"}', SIM_END, SIM_END, 15);
    expect(r.series[0].values[0]!).toBeGreaterThan(85);
  });
});
