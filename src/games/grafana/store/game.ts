import { create } from 'zustand';
import type { Level, PanelConfig, PlayerState, TimeRange } from '../engine/level';
import { simulate } from '../engine/simulator';
import type { MetricStore } from '../engine/store';

export type View = 'dashboard' | 'explore';

interface GameState extends PlayerState {
  level: Level | null;
  store: MetricStore | null;
  view: View;
  /** Panel being edited (a draft; it only reaches `panels` on Apply). */
  editing: PanelConfig | null;
  hintsShown: number;
  showMe: boolean;
  elapsed: number;
  paused: boolean;
  finished: boolean;

  start: (level: Level) => void;
  setView: (view: View) => void;
  setTimeRange: (range: TimeRange) => void;
  runExplore: (query: string) => void;
  newPanel: () => void;
  editPanel: (id: string) => void;
  updateDraft: (patch: Partial<PanelConfig>) => void;
  applyDraft: () => void;
  discardDraft: () => void;
  removePanel: (id: string) => void;
  choose: (objectiveId: string, option: number) => void;
  revealHint: () => void;
  revealSolution: () => void;
  tick: () => void;
  togglePause: () => void;
  finish: () => void;
}

let nextId = 1;
const newId = () => `p${nextId++}`;

export const useGame = create<GameState>()((set, get) => ({
  level: null,
  store: null,
  panels: [],
  exploreQuery: '',
  timeRange: '6h',
  choices: {},
  view: 'dashboard',
  editing: null,
  hintsShown: 0,
  showMe: false,
  elapsed: 0,
  paused: false,
  finished: false,

  start: (level) =>
    set({
      level,
      store: simulate(level.seed, level.scenario),
      panels: (level.startPanels ?? []).map((p) => ({ ...p, id: newId() })),
      exploreQuery: '',
      timeRange: '6h',
      choices: {},
      view: level.startView ?? 'dashboard',
      editing: null,
      hintsShown: 0,
      showMe: false,
      elapsed: 0,
      paused: false,
      finished: false,
    }),
  setView: (view) => set({ view }),
  setTimeRange: (timeRange) => set({ timeRange }),
  runExplore: (exploreQuery) => set({ exploreQuery }),
  newPanel: () =>
    set({ view: 'dashboard', editing: { id: newId(), title: 'New panel', type: 'timeseries', unit: 'none', query: '' } }),
  editPanel: (id) => {
    const p = get().panels.find((x) => x.id === id);
    if (p) set({ view: 'dashboard', editing: { ...p } });
  },
  updateDraft: (patch) => {
    const e = get().editing;
    if (e) set({ editing: { ...e, ...patch } });
  },
  applyDraft: () => {
    const e = get().editing;
    if (!e) return;
    const exists = get().panels.some((p) => p.id === e.id);
    set({ panels: exists ? get().panels.map((p) => (p.id === e.id ? e : p)) : [...get().panels, e], editing: null });
  },
  discardDraft: () => set({ editing: null }),
  removePanel: (id) => set({ panels: get().panels.filter((p) => p.id !== id) }),
  choose: (objectiveId, option) => set({ choices: { ...get().choices, [objectiveId]: option } }),
  revealHint: () => {
    const { level, hintsShown } = get();
    if (level && hintsShown < level.hints.length) set({ hintsShown: hintsShown + 1 });
  },
  revealSolution: () => set({ showMe: true }),
  tick: () => {
    const { paused, finished, elapsed } = get();
    if (!paused && !finished) set({ elapsed: elapsed + 1 });
  },
  togglePause: () => set({ paused: !get().paused }),
  finish: () => set({ finished: true }),
}));
