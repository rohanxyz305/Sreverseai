import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Difficulty } from '../engine/level';
import { xpFor } from '../engine/scoring';

export interface LevelProgress {
  stars: number;
  bestTime: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-panel', title: 'First Panel', description: 'Finish Level 1', icon: '📊' },
  { id: 'three-stars', title: 'Flawless', description: 'Earn 3 stars on anything', icon: '⭐' },
  { id: 'explorer', title: 'Explorer', description: 'Finish the Explore mode level', icon: '🧭' },
  { id: 'chapter-basics', title: 'Basics Done', description: 'Finish every level in Basics', icon: '🎓' },
  { id: 'no-hints-basics', title: 'No Hints Chapter', description: 'Finish Basics without hints', icon: '🧠' },
  { id: 'practice-5', title: 'Practice Makes Perfect', description: 'Finish 5 practice challenges', icon: '🏋️' },
  { id: 'practice-hard', title: 'Hard Mode', description: 'Finish a Hard challenge', icon: '🔥' },
];

/** Player level from XP: every 500 XP is one level. */
export function playerLevel(xp: number): { level: number; into: number; span: number } {
  return { level: Math.floor(xp / 500) + 1, into: xp % 500, span: 500 };
}

type Mode = 'campaign' | 'practice';

interface ProgressState {
  levels: Record<number, LevelProgress>;
  practice: Record<number, LevelProgress>;
  /** Campaign levels finished without hints. */
  noHint: number[];
  xp: number;
  achievements: string[];
  /** Returns the XP earned and any newly unlocked achievement ids. */
  recordResult: (
    mode: Mode,
    id: number,
    result: { stars: number; seconds: number; hintsUsed: number; difficulty?: Difficulty },
  ) => { xp: number; unlocked: string[] };
  reset: () => void;
}

const BASICS = [1, 2, 3, 4];

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      levels: {},
      practice: {},
      noHint: [],
      xp: 0,
      achievements: [],
      recordResult: (mode, id, { stars, seconds, hintsUsed, difficulty }) => {
        const s = get();
        const table = mode === 'campaign' ? s.levels : s.practice;
        const prev = table[id];
        // XP is only granted for improvements, so replaying cannot farm it.
        const xp = Math.max(0, xpFor(stars) - (prev ? xpFor(prev.stars) : 0));
        const updated = {
          ...table,
          [id]: { stars: Math.max(stars, prev?.stars ?? 0), bestTime: Math.min(seconds, prev?.bestTime ?? Infinity) },
        };
        const levels = mode === 'campaign' ? updated : s.levels;
        const practice = mode === 'practice' ? updated : s.practice;
        const noHint = mode === 'campaign' && hintsUsed === 0 && !s.noHint.includes(id) ? [...s.noHint, id] : s.noHint;

        const has = new Set(s.achievements);
        const earned: string[] = [];
        const award = (aid: string, cond: boolean) => {
          if (cond && !has.has(aid)) earned.push(aid);
        };
        award('first-panel', mode === 'campaign' && id === 1);
        award('three-stars', stars === 3);
        award('explorer', mode === 'campaign' && id === 4);
        award('chapter-basics', BASICS.every((l) => levels[l]));
        award('no-hints-basics', BASICS.every((l) => noHint.includes(l)));
        award('practice-5', Object.keys(practice).length >= 5);
        award('practice-hard', mode === 'practice' && difficulty === 'hard');

        set({ levels, practice, noHint, xp: s.xp + xp, achievements: [...has, ...earned] });
        return { xp, unlocked: earned };
      },
      reset: () => set({ levels: {}, practice: {}, noHint: [], xp: 0, achievements: [] }),
    }),
    { name: 'obsquest-progress', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export function isUnlocked(levelId: number, levels: Record<number, LevelProgress>): boolean {
  return levelId === 1 || Boolean(levels[levelId - 1]);
}
