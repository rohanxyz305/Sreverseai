import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Every game on Sreverseai. To add a game:
 *   1. Build it under src/games/<slug>/ with a default-exported component holding its own <Routes>.
 *   2. Add an entry here with status 'live', its `component` and (optionally) a `fullscreen` pattern.
 * The Games hub, the site router and the home page all read from this list.
 */
export interface GameEntry {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  status: 'live' | 'soon';
  level: string;
  tags: string[];
  highlights: string[];
  stats?: { label: string; value: string }[];
  /** Tailwind classes for the card accent. */
  accent: string;
  component?: LazyExoticComponent<ComponentType>;
  /** Paths under this pattern hide the site header (immersive game screens). */
  fullscreen?: RegExp;
}

export const GAMES: GameEntry[] = [
  {
    slug: 'grafana',
    title: 'Grafana Learning Games',
    tagline: 'Learn Grafana, PromQL and alerting by fixing simulated incidents.',
    description:
      'Build dashboards, write PromQL and hunt root causes on a simulated production stack: 3 services, 6 pods, 2 nodes and a database, with real-looking metrics.',
    icon: '📈',
    status: 'live',
    level: 'Beginner → Advanced',
    tags: ['Observability', 'PromQL', 'Dashboards', 'Troubleshooting'],
    highlights: ['Story campaign with stars and XP', 'Practice Arena: 15 challenges, all unlocked', 'Real PromQL engine with Prometheus-style errors'],
    stats: [
      { label: 'Campaign levels', value: '20' },
      { label: 'Practice challenges', value: '15' },
      { label: 'Achievements', value: '7' },
    ],
    accent: 'from-brand/30 to-accent/10 border-brand/40',
    component: lazy(() => import('./grafana/GrafanaGame')),
    fullscreen: /^\/games\/grafana\/(play|practice)\/\d+/,
  },
  {
    slug: 'kubernetes',
    title: 'Kubernetes Games',
    tagline: 'Debug CrashLoopBackOffs, OOMKills and broken rollouts in a simulated cluster.',
    description: 'kubectl-style commands against a cluster that breaks in realistic ways.',
    icon: '☸️',
    status: 'soon',
    level: 'Beginner → Intermediate',
    tags: ['Kubernetes', 'kubectl', 'Troubleshooting'],
    highlights: [],
    accent: 'from-accent/25 to-transparent border-line',
  },
  {
    slug: 'linux',
    title: 'Linux Terminal Quest',
    tagline: 'Find the full disk, the runaway process and the port conflict from a shell.',
    description: 'A browser terminal with a simulated server and timed missions.',
    icon: '🐧',
    status: 'soon',
    level: 'Beginner',
    tags: ['Linux', 'Shell', 'Networking'],
    highlights: [],
    accent: 'from-ok/20 to-transparent border-line',
  },
  {
    slug: 'incident-commander',
    title: 'Incident Commander',
    tagline: 'Run a live outage: triage, delegate, communicate and write the postmortem.',
    description: 'A decision game about incident roles, severity and stakeholder updates.',
    icon: '🚨',
    status: 'soon',
    level: 'Intermediate → Advanced',
    tags: ['Incident response', 'On-call', 'Postmortems'],
    highlights: [],
    accent: 'from-bad/20 to-transparent border-line',
  },
];

export const LIVE_GAMES = GAMES.filter((g) => g.status === 'live');

export function isFullscreenGamePath(pathname: string): boolean {
  return LIVE_GAMES.some((g) => g.fullscreen?.test(pathname));
}
