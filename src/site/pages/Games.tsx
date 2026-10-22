import { Link } from 'react-router-dom';
import { GAMES } from '../../games/registry';

export default function Games() {
  const live = GAMES.filter((g) => g.status === 'live');
  const soon = GAMES.filter((g) => g.status === 'soon');
  return (
    <>
      <section className="bg-grid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <span className="text-5xl" aria-hidden>
            🎮
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Sreverseai Games</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Learn SRE skills by playing. Every game runs in your browser on simulated systems, so you can break things safely, as often as you like.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Play now</h2>
        <div className="mt-4 grid gap-6">
          {live.map((g) => (
            <article key={g.slug} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-8 ${g.accent}`}>
              <div className="pointer-events-none absolute -right-6 -top-8 text-[9rem] leading-none opacity-10" aria-hidden>
                {g.icon}
              </div>
              <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-ok/15 px-2.5 py-0.5 text-xs font-semibold text-ok">● Live</span>
                    <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs text-muted">{g.level}</span>
                  </div>
                  <h3 className="mt-3 text-3xl font-bold tracking-tight">
                    <span aria-hidden>{g.icon}</span> {g.title}
                  </h3>
                  <p className="mt-2 text-lg">{g.tagline}</p>
                  <p className="mt-2 text-muted">{g.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {g.highlights.map((h) => (
                      <li key={h} className="flex gap-2 text-sm">
                        <span className="text-ok" aria-hidden>
                          ✓
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to={`/games/${g.slug}`} className="rounded-lg bg-brand px-6 py-3 font-semibold text-canvas shadow-lg shadow-brand/25 hover:brightness-110">
                      Play {g.title} →
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4">
                  {g.stats && (
                    <dl className="grid grid-cols-3 gap-3">
                      {g.stats.map((s) => (
                        <div key={s.label} className="rounded-xl border border-line bg-canvas/60 p-3 text-center">
                          <dd className="text-2xl font-bold">{s.value}</dd>
                          <dt className="text-xs text-muted">{s.label}</dt>
                        </div>
                      ))}
                    </dl>
                  )}
                  <ul className="flex flex-wrap gap-2">
                    {g.tags.map((t) => (
                      <li key={t} className="rounded-full border border-line bg-canvas/60 px-3 py-1 text-xs">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-14 text-sm font-semibold uppercase tracking-widest text-muted">Coming soon</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {soon.map((g) => (
            <li key={g.slug} className={`rounded-2xl border border-dashed bg-gradient-to-br p-6 ${g.accent}`}>
              <div className="flex items-center justify-between">
                <span className="text-3xl" aria-hidden>
                  {g.icon}
                </span>
                <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs text-muted">Coming soon</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{g.title}</h3>
              <p className="mt-1 text-sm text-muted">{g.tagline}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {g.tags.map((t) => (
                  <li key={t} className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-muted">
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
