import type { Difficulty, Level } from '../../engine/level';
import index from '../../levels/practice/index.json';

export interface ChallengeEntry {
  id: number;
  file: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  blurb: string;
}

export const CHALLENGES = index.challenges as ChallengeEntry[];
export const TOPICS = [...new Set(CHALLENGES.map((c) => c.topic))];

const files = import.meta.glob<{ default: Level }>('../../levels/practice/[0-9]*.json');

export async function loadChallenge(id: number): Promise<Level | null> {
  const entry = CHALLENGES.find((c) => c.id === id);
  const loader = entry && files[`../../levels/practice/${entry.file}`];
  return loader ? (await loader()).default : null;
}
