import type { Scenario } from './simulator';

export type PanelType = 'timeseries' | 'stat' | 'gauge' | 'table';
export type Unit = 'none' | 'percent' | 'bytes' | 'reqps' | 's';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type TimeRange = '5m' | '15m' | '30m' | '1h' | '3h' | '6h';

export const TIME_RANGES: TimeRange[] = ['5m', '15m', '30m', '1h', '3h', '6h'];
export const TIME_RANGE_SECONDS: Record<TimeRange, number> = {
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '3h': 10800,
  '6h': 21600,
};

export interface PanelConfig {
  id: string;
  title: string;
  type: PanelType;
  unit: Unit;
  query: string;
}

interface ObjectiveBase {
  id: string;
  /** What the player sees in the objectives list. */
  text: string;
}

export type Objective =
  | (ObjectiveBase & { type: 'query_result'; expected: string; tolerance?: number })
  | (ObjectiveBase & { type: 'panel'; panelType?: PanelType; unit?: Unit; expected?: string; tolerance?: number })
  | (ObjectiveBase & { type: 'time_range'; range: TimeRange })
  | (ObjectiveBase & { type: 'choice'; question: string; options: string[]; answer: number });

export interface Level {
  id: number;
  /** Chapter (campaign) or topic (practice). */
  chapter: string;
  difficulty?: Difficulty;
  title: string;
  intro: string;
  /** Optional guided steps (Level 1 tutorial). */
  tutorial?: string[];
  seed: number;
  scenario: Scenario;
  startView?: 'dashboard' | 'explore';
  startPanels?: Omit<PanelConfig, 'id'>[];
  objectives: Objective[];
  hints: string[];
  /** Shown by "Show me" after 2 hints. */
  solution: string;
  stars: { targetSeconds: number };
  debrief: string;
}

/** What the player has built so far; objectives are checked against this. */
export interface PlayerState {
  panels: PanelConfig[];
  exploreQuery: string;
  timeRange: TimeRange;
  choices: Record<string, number>;
}
