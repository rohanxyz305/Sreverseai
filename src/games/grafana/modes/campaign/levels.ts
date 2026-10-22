import type { Level } from '../../engine/level';
import index from '../../levels/index.json';

export interface LevelEntry {
  id: number;
  title: string;
  file?: string;
}

export interface Chapter {
  title: string;
  levels: LevelEntry[];
}

export const CHAPTERS: Chapter[] = index.chapters;
export const ALL_LEVELS: LevelEntry[] = CHAPTERS.flatMap((c) => c.levels);

const files = import.meta.glob<{ default: Level }>('../../levels/[0-9]*.json');

/** Lazy-loads one level's JSON so the initial bundle stays small. */
export async function loadLevel(id: number): Promise<Level | null> {
  const entry = ALL_LEVELS.find((l) => l.id === id);
  if (!entry?.file) return null;
  const loader = files[`../../levels/${entry.file}`];
  return loader ? (await loader()).default : null;
}

export function nextPlayableLevel(id: number): LevelEntry | undefined {
  return ALL_LEVELS.find((l) => l.id === id + 1 && l.file);
}
