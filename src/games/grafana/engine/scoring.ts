/**
 * 3 stars: under the target time with no hints.
 * 2 stars: within 2x the target time and at most 1 hint.
 * 1 star: solved.
 */
export function computeStars(elapsedSeconds: number, hintsUsed: number, targetSeconds: number, usedShowMe = false): 1 | 2 | 3 {
  if (usedShowMe) return 1;
  if (elapsedSeconds <= targetSeconds && hintsUsed === 0) return 3;
  if (elapsedSeconds <= targetSeconds * 2 && hintsUsed <= 1) return 2;
  return 1;
}

export function xpFor(stars: number): number {
  return 50 + stars * 50;
}
