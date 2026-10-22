import type { Level } from '../engine/level';
import { ALL_LEVELS, loadLevel, nextPlayableLevel } from './campaign/levels';
import { CHALLENGES, loadChallenge } from './practice/challenges';
import { isUnlocked, type LevelProgress } from '../store/progress';
import { paths } from '../paths';

export type ModeId = 'campaign' | 'practice';

/** What the shared game screen needs to know about a mode. */
export interface ModeConfig {
  id: ModeId;
  label: string;
  mapPath: string;
  mapLabel: string;
  playPath: (id: number) => string;
  load: (id: number) => Promise<Level | null>;
  next: (id: number) => { id: number; title: string } | undefined;
  isLocked: (id: number, progress: Record<number, LevelProgress>) => boolean;
}

export const MODES: Record<ModeId, ModeConfig> = {
  campaign: {
    id: 'campaign',
    label: 'Campaign',
    mapPath: paths.campaign,
    mapLabel: 'Level map',
    playPath: paths.play,
    load: loadLevel,
    next: nextPlayableLevel,
    isLocked: (id, progress) => !isUnlocked(id, progress),
  },
  practice: {
    id: 'practice',
    label: 'Practice Arena',
    mapPath: paths.practice,
    mapLabel: 'All challenges',
    playPath: paths.challenge,
    load: loadChallenge,
    next: (id) => CHALLENGES[CHALLENGES.findIndex((c) => c.id === id) + 1],
    // Practice is free play: nothing is ever locked.
    isLocked: () => false,
  },
};

export const CAMPAIGN_LEVEL_COUNT = ALL_LEVELS.length;
