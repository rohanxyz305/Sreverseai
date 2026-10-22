/** Every URL inside Grafana Learning Games. The game is mounted at BASE inside the Sreverseai site. */
export const BASE = '/games/grafana';

export const paths = {
  home: BASE,
  campaign: `${BASE}/campaign`,
  practice: `${BASE}/practice`,
  play: (id: number) => `${BASE}/play/${id}`,
  challenge: (id: number) => `${BASE}/practice/${id}`,
};

/** Game screens take the whole window (no site header). */
export const FULLSCREEN = /^\/games\/grafana\/(play|practice)\/\d+/;
