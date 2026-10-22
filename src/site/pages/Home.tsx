import { Link } from 'react-router-dom';
import { GAMES, LIVE_GAMES } from '../../games/registry';
import { LESSONS, TRACKS, lessonsFor, type Track } from '../content/lessons';
import { useLearn } from '../store';

const TOPICS = [
  { icon: '🎯', title: 'SLOs & error budgets', slug: 'sli-slo-sla' },
  { icon: '🔭', title: 'Observability', slug: 'monitoring-vs-observability' },
  { icon: '🔥', title: 'Prometheus & PromQL', slug: 'prometheus-basics' },
  { icon: '🚨', title: 'Incident response', slug: 'incident-response' },
  { icon: '🐧', title: 'Linux troubleshooting', slug: 'linux-for-sre' },
  { icon: '☸️', title: 'Kubernetes', slug: 'kubernetes-for-sre' },
  { icon: '🔔', title: 'Alerting', slug: 'alerting-best-practices' },
  { icon: '🧪', title: 'Chaos engineering', slug: 'chaos-engineering' },
];

function PathCard({ track, accent }: { track: Track; accent: string }) {
  const lessons = lessonsFor(track);
  const completed = useLearn((s) => s.completed);
  const done = lessons.filter((l) => completed.includes(l.slug)).length;
  const next = lessons.find((l) => !completed.includes(l.slug)) ?? lessons[0];
  const t = TRACKS[track];
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-2xl border bg-panel p-6 ${accent}`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted">{t.audience}</span>
      <h3 className="mt-2 text-2xl font-bold">{t.title}</h3>
      <p className="mt-2 text-muted">{t.blurb}</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {lessons.slice(0, 4).map((l) => (
          <li key={l.slug} className="flex items-center gap-2">
            <span aria-hidden>{completed.includes(l.slug) ? '✅' : l.icon}</span>
            <span className={completed.includes(l.slug) ? 'text-muted line-through' : ''}>{l.title}</span>
          </li>
        ))}
        {lessons.length > 4 && <li className="text-muted">+ {lessons.length - 4} more</li>}
      </ul>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2" role="progressbar" aria-label={`${t.title} progress`} aria-valuemin={0} aria-valuemax={lessons.length} aria-valuenow={done}>
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-ok" style={{ width: `${(done / lessons.length) * 100}%` }} />
        </div>
        <span className="text-xs text-muted">
          {done}/{lessons.length}
        </span>
      </div>
      <Link to={`/learn/${next.slug}`} className="mt-5 inline-flex w-fit items-center rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-white">
        {done ? 'Continue' : 'Start'}: {next.title} →
      </Link>
    </div>
  );
}

export default function Home() {
  const live = LIVE_GAMES[0];
  return (
    <>
      <section className="bg-grid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -left-40 -top-20 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-ok/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" /> Free SRE learning for beginners and pros
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
              Become the engineer who keeps{' '}
              <span className="bg-gradient-to-r from-accent via-[#8ab4ff] to-ok bg-clip-text text-transparent">production up</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Sreverseai teaches Site Reliability Engineering from first principles to production practice. Read short lessons, then prove what you learned in hands-on games on simulated systems.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/learn" className="rounded-lg bg-accent px-6 py-3 font-semibold text-canvas shadow-lg shadow-accent/25 transition hover:brightness-110">
                Start learning →
              </Link>
              <Link to="/games" className="rounded-lg border border-line bg-panel px-6 py-3 font-semibold transition hover:border-brand/60">
                🎮 Play the games
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                [String(LESSONS.length), 'lessons'],
                ['2', 'learning tracks'],
                [String(GAMES.length), 'games (1 live)'],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="sr-only">{k}</dt>
                  <dd className="text-2xl font-bold">{v}</dd>
                  <dd className="text-xs text-muted">{k}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise space-y-3" style={{ animationDelay: '120ms' }} aria-hidden>
            {[
              { step: '1', title: 'Learn the concept', body: 'SLOs, error budgets, golden signals in 6–10 minutes', icon: '📖', cls: 'border-accent/40' },
              { step: '2', title: 'Practise it in a game', body: 'Write real PromQL against a live simulated stack', icon: '🎮', cls: 'border-brand/40 lg:ml-8' },
              { step: '3', title: 'Use it at work', body: 'Dashboards, alerts and incident habits that transfer', icon: '🚀', cls: 'border-ok/40 lg:ml-16' },
            ].map((s) => (
              <div key={s.step} className={`flex items-center gap-4 rounded-xl border bg-panel/90 p-4 shadow-xl shadow-black/30 ${s.cls}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-panel-2 text-xl">{s.icon}</span>
                <div>
                  <div className="text-xs text-muted">Step {s.step}</div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-muted">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="paths">
        <h2 id="paths" className="text-3xl font-bold tracking-tight">
          Pick your path
        </h2>
        <p className="mt-2 text-muted">Two tracks, same goal. Jump between them at any time.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <PathCard track="beginner" accent="border-accent/40" />
          <PathCard track="experienced" accent="border-ok/40" />
        </div>
      </section>

      {live && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="featured-game">
          <div className="relative overflow-hidden rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/20 via-panel to-panel p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 text-[10rem] leading-none opacity-10" aria-hidden>
              {live.icon}
            </div>
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-canvas">FEATURED GAME</span>
            <h2 id="featured-game" className="mt-3 text-3xl font-bold tracking-tight">
              {live.title}
            </h2>
            <p className="mt-2 max-w-2xl text-muted">{live.description}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {live.highlights.map((h) => (
                <li key={h} className="rounded-full border border-line bg-canvas/60 px-3 py-1 text-sm">
                  ✓ {h}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/games/${live.slug}`} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-canvas shadow-lg shadow-brand/25 hover:brightness-110">
                Play now →
              </Link>
              <Link to="/games" className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:bg-panel-2">
                See all games
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="topics">
        <h2 id="topics" className="text-3xl font-bold tracking-tight">
          What you'll learn
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {TOPICS.map((t) => (
            <li key={t.slug}>
              <Link to={`/learn/${t.slug}`} className="group flex h-full items-center gap-3 rounded-xl border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-accent/60">
                <span className="text-2xl" aria-hidden>
                  {t.icon}
                </span>
                <span className="font-medium group-hover:text-accent">{t.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
