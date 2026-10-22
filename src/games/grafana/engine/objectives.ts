import type { Objective, PlayerState, Unit } from './level';
import type { MetricStore } from './store';
import { compareQuery, type CheckResult } from './validator';

export const UNIT_LABELS: Record<Unit, string> = {
  none: 'None',
  percent: 'Percent (0-100)',
  bytes: 'Bytes (IEC)',
  reqps: 'Requests/sec',
  s: 'Seconds',
};

export function checkObjective(obj: Objective, state: PlayerState, store: MetricStore): CheckResult {
  switch (obj.type) {
    case 'query_result': {
      const candidates = [
        { where: 'Explore', query: state.exploreQuery },
        ...state.panels.map((p) => ({ where: `Panel "${p.title}"`, query: p.query })),
      ].filter((c) => c.query.trim());
      if (!candidates.length) return { ok: false, message: 'Write a query in Explore or in a panel.' };
      let first: CheckResult | null = null;
      for (const c of candidates) {
        const r = compareQuery(store, c.query, obj.expected, obj.tolerance);
        if (r.ok) return r;
        first ??= { ok: false, message: `${c.where}: ${r.message}` };
      }
      return first!;
    }
    case 'panel': {
      let panels = state.panels;
      if (obj.panelType) {
        panels = panels.filter((p) => p.type === obj.panelType);
        if (!panels.length) return { ok: false, message: `Add a ${obj.panelType} panel.` };
      }
      if (obj.unit) {
        panels = panels.filter((p) => p.unit === obj.unit);
        if (!panels.length) return { ok: false, message: `Set the panel's unit to "${UNIT_LABELS[obj.unit]}".` };
      }
      if (!obj.expected) return { ok: true, message: 'Done!' };
      let first: CheckResult | null = null;
      for (const p of panels) {
        const r = compareQuery(store, p.query, obj.expected, obj.tolerance);
        if (r.ok) return r;
        first ??= { ok: false, message: `Panel "${p.title}": ${r.message}` };
      }
      return first!;
    }
    case 'time_range':
      return state.timeRange === obj.range
        ? { ok: true, message: 'Done!' }
        : { ok: false, message: `Set the time range to "Last ${obj.range}".` };
    case 'choice': {
      const picked = state.choices[obj.id];
      if (picked === undefined) return { ok: false, message: 'Pick an answer.' };
      return picked === obj.answer ? { ok: true, message: 'Correct!' } : { ok: false, message: 'Not quite. Look at the data again.' };
    }
  }
}

export function checkAll(objectives: Objective[], state: PlayerState, store: MetricStore): Record<string, CheckResult> {
  return Object.fromEntries(objectives.map((o) => [o.id, checkObjective(o, state, store)]));
}
