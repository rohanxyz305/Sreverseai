import { Link } from 'react-router-dom';
import { ACHIEVEMENTS, isUnlocked, playerLevel, useProgress } from '../store/progress';
import { ALL_LEVELS } from './campaign/levels';
import { CHALLENGES } from './practice/challenges';
import { paths } from '../paths';

/** Decorative Grafana-style panel: a request-rate line with an incident spike and a firing alert. */
function HeroPanel() {
  const pts = Array.from({ length: 41 }, (_, i) => {
    const spike = i >= 27 && i <= 31 ? 70 : 0;
    const y = 120 - (Math.sin(i / 4) * 10 + 30 + ((i * 37) % 11) + spike);
    return `${i * 10},${y.toFixed(1)}`;
  }).join(' ');
  const base = Array.from({ length: 41 }, (_, i) => `${i * 10},${(132 - Math.cos(i / 5) * 6 - ((i * 13) % 7)).toFixed(1)}`).join(' ');
  return (
    <div className="animate-rise relative rounded-xl border border-line bg-panel/90 p-4 shadow-2xl shadow-black/40" style={{ animationDelay: '120ms' }} aria-hidden>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">payments · request rate</div>
          <div className="text-sm font-medium">5xx errors per second</div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-bad/50 bg-bad/15 px-2 py-0.5 text-xs font-medium text-bad">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" /> HighErrorRate · firing
        </span>
      </div>
      <svg viewBox="0 0 400 150" className="w-full">
        {[30, 60, 90, 120].map((y) => (
          <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#2c3235" strokeWidth="1" />
        ))}
        <line x1="0" x2="400" y1="62" y2="62" stroke="#f2495c" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
        <text x="396" y="57" textAnchor="end" fill="#f2495c" fontSize="9">threshold</text>
        <rect x="268" y="10" width="44" height="130" fill="#f2495c" opacity="0.07" />
        <polyline points={base} fill="none" stroke="#56B4E9" strokeWidth="2" className="animate-dash" />
        <polyline points={pts} fill="none" stroke="#E69F00" strokeWidth="2.5" strokeLinejoin="round" className="animate-dash" />
      </svg>
      <div className="mt-3 rounded-lg border border-line bg-canvas px-3 py-2 font-mono text-xs">
        <span className="text-[#e69f00]">sum by</span> (<span className="text-[#56b4e9]">service</span>) (<span className="text-[#7aa5ff]">rate</span>(http_requests_total{'{'}
        <span className="text-[#56b4e9]">status</span>=~<span className="text-[#7ee787]">"5.."</span>
        {'}'}[<span className="text-[#f0e442]">5m</span>]))
      </div>
    </div>
  );
}

function Progress({ value, max, color = 'bg-accent' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-panel-2" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

const SKILLS = ['Dashboards', 'PromQL', 'rate() & counters', 'Aggregations', 'Explore', 'Units & thresholds', 'Troubleshooting', 'LogQL (soon)', 'Alerting (soon)', 'SLOs (soon)'];

const COMING = [
  { title: 'Incident Mode', body: 'An alert fires. Find the root cause before the timer ends.', icon: '🚨' },
  { title: 'Sandbox', body: 'Build any dashboard and get a best-practice score.', icon: '🧪' },
  { title: 'Timed Challenges', body: '"p99 latency per service in 60 seconds."', icon: '⏱️' },
  { title: 'Dashboard Builder', body: 'Export JSON that imports into real Grafana.', icon: '📦' },
];

export default function Home() {
  const { levels, practice, xp, achievements, reset } = useProgress();
  const playable = ALL_LEVELS.filter((l) => l.file);
  const next = playable.find((l) => !levels[l.id] && isUnlocked(l.id, levels));
  const campaignDone = Object.keys(levels).length;
  const practiceDone = Object.keys(practice).length;
  const totalStars = [...Object.values(levels), ...Object.values(practice)].reduce((a, p) => a + p.stars, 0);
  const pl = playerLevel(xp);

  return (
    <div>
      <section className="bg-grid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-accent/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-rise">
            <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted">Free · no sign-up · runs in your browser</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Learn Grafana by <span className="bg-gradient-to-r from-brand to-[#ff7a45] bg-clip-text text-transparent">fixing incidents</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Build dashboards, write PromQL and hunt root causes on a simulated production stack. Real Grafana concepts with nothing to install.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={next ? paths.play(next.id) : paths.campaign}
                className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-canvas shadow-lg shadow-accent/20 transition hover:brightness-110"
              >
                {!next ? 'Campaign so far: done! Replay a level' : campaignDone ? `Continue campaign · Level ${next.id}` : 'Start the campaign'} →
              </Link>
              <Link to={paths.practice} className="rounded-lg border border-line bg-panel px-5 py-2.5 font-semibold transition hover:border-brand/60">
                Practice Arena <span className="ml-1 rounded bg-ok/15 px-1.5 py-0.5 text-xs text-ok">all unlocked</span>
              </Link>
            </div>
          </div>
          <HeroPanel />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section aria-label="Your progress" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-line bg-panel p-4">
            <div className="text-xs text-muted">Player level</div>
            <div className="mt-1 text-2xl font-bold text-brand">Lv {pl.level}</div>
            <div className="mt-2">
              <Progress value={pl.into} max={pl.span} color="bg-brand" />
            </div>
            <div className="mt-1 text-xs text-muted">
              {pl.into} / {pl.span} XP
            </div>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <div className="text-xs text-muted">Stars earned</div>
            <div className="mt-1 text-2xl font-bold">★ {totalStars}</div>
            <div className="mt-2 text-xs text-muted">3 per level, minus hints and time</div>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <div className="text-xs text-muted">Campaign</div>
            <div className="mt-1 text-2xl font-bold">
              {campaignDone}
              <span className="text-base font-normal text-muted"> / {ALL_LEVELS.length}</span>
            </div>
            <div className="mt-2">
              <Progress value={campaignDone} max={ALL_LEVELS.length} />
            </div>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <div className="text-xs text-muted">Practice Arena</div>
            <div className="mt-1 text-2xl font-bold">
              {practiceDone}
              <span className="text-base font-normal text-muted"> / {CHALLENGES.length}</span>
            </div>
            <div className="mt-2">
              <Progress value={practiceDone} max={CHALLENGES.length} color="bg-ok" />
            </div>
          </div>
        </section>

        <section aria-label="Game modes" className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Choose how to play</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to={paths.campaign} className="group relative overflow-hidden rounded-xl border border-line bg-panel p-6 transition hover:-translate-y-0.5 hover:border-accent/60">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl transition group-hover:bg-accent/20" aria-hidden />
              <div className="text-3xl" aria-hidden>
                🗺️
              </div>
              <h3 className="mt-3 text-lg font-semibold">Campaign</h3>
              <p className="mt-1 text-sm text-muted">
                A guided story in 5 chapters, from your first panel to a full outage postmortem. Each level unlocks the next.
              </p>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <Progress value={campaignDone} max={ALL_LEVELS.length} />
                </div>
                <span className="text-xs text-muted">
                  {campaignDone}/{ALL_LEVELS.length}
                </span>
              </div>
              <span className="mt-4 inline-block text-sm font-medium text-accent">Open level map →</span>
            </Link>
            <Link to={paths.practice} className="group relative overflow-hidden rounded-xl border border-brand/40 bg-panel p-6 transition hover:-translate-y-0.5 hover:border-brand">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/25" aria-hidden />
              <div className="flex items-start justify-between">
                <div className="text-3xl" aria-hidden>
                  🎯
                </div>
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-canvas">NEW</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">Practice Arena</h3>
              <p className="mt-1 text-sm text-muted">
                {CHALLENGES.length} short challenges across PromQL, panels, dashboards and troubleshooting. <b className="text-ink">Nothing is locked</b>, so jump in anywhere, at any difficulty.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['Easy', 'Medium', 'Hard'].map((d, i) => (
                  <span key={d} className={`rounded-full border px-2 py-0.5 text-xs ${['border-ok/40 text-ok', 'border-warn/40 text-warn', 'border-bad/40 text-bad'][i]}`}>
                    {d}
                  </span>
                ))}
              </div>
              <span className="mt-4 inline-block text-sm font-medium text-brand">Browse challenges →</span>
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COMING.map((m) => (
              <li key={m.title} className="rounded-xl border border-dashed border-line p-4 opacity-75">
                <div className="flex items-center justify-between">
                  <span aria-hidden>{m.icon}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted">Coming soon</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{m.title}</h3>
                <p className="mt-0.5 text-xs text-muted">{m.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Skills" className="mt-10">
          <h2 className="mb-3 text-xl font-semibold">What you'll learn</h2>
          <ul className="flex flex-wrap gap-2">
            {SKILLS.map((s) => (
              <li key={s} className={`rounded-full border px-3 py-1 text-sm ${s.includes('soon') ? 'border-line text-muted' : 'border-accent/40 bg-accent/10'}`}>
                {s}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Achievements" className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Achievements</h2>
            <span className="text-sm text-muted">
              {achievements.length} / {ACHIEVEMENTS.length}
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {ACHIEVEMENTS.map((a) => {
              const got = achievements.includes(a.id);
              return (
                <li key={a.id} className={`rounded-xl border p-3 text-center ${got ? 'border-brand/60 bg-brand/10' : 'border-line bg-panel'}`}>
                  <div className={`text-2xl ${got ? '' : 'opacity-30 grayscale'}`} aria-hidden>
                    {a.icon}
                  </div>
                  <div className="mt-1 text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted">{a.description}</div>
                  <div className="sr-only">{got ? 'Unlocked' : 'Locked'}</div>
                </li>
              );
            })}
          </ul>
          {(campaignDone > 0 || practiceDone > 0) && (
            <button className="mt-5 text-xs text-muted underline hover:text-bad" onClick={() => window.confirm('Reset all progress?') && reset()}>
              Reset progress
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
