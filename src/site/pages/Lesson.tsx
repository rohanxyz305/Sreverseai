import { Link, useParams } from 'react-router-dom';
import { BlockView } from '../components/Prose';
import { LESSONS, TRACKS } from '../content/lessons';
import { useLearn } from '../store';
import NotFound from './NotFound';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Lesson() {
  const { slug } = useParams();
  const completed = useLearn((s) => s.completed);
  const toggle = useLearn((s) => s.toggle);
  const lesson = LESSONS.find((l) => l.slug === slug);
  if (!lesson) return <NotFound />;

  const inTrack = LESSONS.filter((l) => l.track === lesson.track);
  const idx = inTrack.indexOf(lesson);
  const prev = inTrack[idx - 1];
  const next = inTrack[idx + 1];
  const done = completed.includes(lesson.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to="/learn" className="hover:text-ink">
          Learn
        </Link>{' '}
        /{' '}
        <Link to={`/learn?track=${lesson.track}`} className="hover:text-ink">
          {TRACKS[lesson.track].title}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_240px]">
        <article className="min-w-0">
          <header>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${lesson.track === 'beginner' ? 'bg-accent/15 text-accent' : 'bg-ok/15 text-ok'}`}>
                {lesson.track === 'beginner' ? '🌱 Beginner' : '🚀 Experienced'}
              </span>
              <span>
                Lesson {idx + 1} of {inTrack.length}
              </span>
              <span>·</span>
              <span>{lesson.minutes} min read</span>
            </div>
            <h1 className="mt-3 flex items-start gap-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              <span aria-hidden>{lesson.icon}</span>
              {lesson.title}
            </h1>
            <p className="mt-3 text-lg text-muted">{lesson.summary}</p>
          </header>

          {lesson.sections.map((s) => (
            <section key={s.heading} id={slugify(s.heading)} className="mt-10 scroll-mt-24">
              <h2 className="mb-4 text-2xl font-semibold">{s.heading}</h2>
              <div className="space-y-4">
                {s.blocks.map((b, i) => (
                  <BlockView key={i} block={b} />
                ))}
              </div>
            </section>
          ))}

          <section className="mt-10 rounded-2xl border border-ok/40 bg-ok/10 p-6" aria-labelledby="takeaways">
            <h2 id="takeaways" className="text-lg font-semibold text-ok">
              Key takeaways
            </h2>
            <ul className="mt-3 space-y-2">
              {lesson.takeaways.map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden className="text-ok">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {lesson.practice && (
            <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand/40 bg-gradient-to-r from-brand/15 to-transparent p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-brand">Practise it</div>
                <div className="mt-1 font-semibold">{lesson.practice.label}</div>
                <div className="text-sm text-muted">In Grafana Learning Games, on simulated live data.</div>
              </div>
              <Link to={lesson.practice.to} className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-canvas hover:brightness-110">
                🎮 Play →
              </Link>
            </section>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <button
              onClick={() => toggle(lesson.slug)}
              aria-pressed={done}
              className={`rounded-lg px-5 py-2.5 font-semibold transition ${done ? 'border border-ok/50 bg-ok/15 text-ok' : 'bg-accent text-canvas hover:brightness-110'}`}
            >
              {done ? '✓ Completed (undo)' : 'Mark as complete'}
            </button>
            <div className="flex gap-2">
              {prev && (
                <Link to={`/learn/${prev.slug}`} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-panel-2">
                  ← {prev.title}
                </Link>
              )}
              {next && (
                <Link to={`/learn/${next.slug}`} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-panel-2">
                  {next.title} →
                </Link>
              )}
            </div>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <nav aria-label="On this page">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">On this page</h2>
              <ul className="mt-3 space-y-2 border-l border-line text-sm">
                {lesson.sections.map((s) => (
                  <li key={s.heading}>
                    <a href={`#${slugify(s.heading)}`} className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-accent hover:text-ink">
                      {s.heading}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#takeaways" className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-accent hover:text-ink">
                    Key takeaways
                  </a>
                </li>
              </ul>
            </nav>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{TRACKS[lesson.track].title}</h2>
              <ol className="mt-3 space-y-1.5 text-sm">
                {inTrack.map((l) => (
                  <li key={l.slug}>
                    <Link
                      to={`/learn/${l.slug}`}
                      aria-current={l.slug === lesson.slug ? 'page' : undefined}
                      className={`flex gap-2 rounded px-2 py-1 ${l.slug === lesson.slug ? 'bg-panel-2 text-ink' : 'text-muted hover:text-ink'}`}
                    >
                      <span aria-hidden>{completed.includes(l.slug) ? '✅' : '○'}</span>
                      <span className="leading-snug">{l.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
