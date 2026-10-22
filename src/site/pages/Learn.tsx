import { Link, useSearchParams } from 'react-router-dom';
import { LESSONS, TRACKS, type Track } from '../content/lessons';
import { useLearn } from '../store';

const FILTERS: { id: 'all' | Track; label: string }[] = [
  { id: 'all', label: 'All lessons' },
  { id: 'beginner', label: '🌱 Beginner' },
  { id: 'experienced', label: '🚀 Experienced' },
];

export default function Learn() {
  const [params, setParams] = useSearchParams();
  const filter = (params.get('track') as Track | null) ?? 'all';
  const completed = useLearn((s) => s.completed);
  const done = LESSONS.filter((l) => completed.includes(l.slug)).length;
  const tracks = (Object.keys(TRACKS) as Track[]).filter((t) => filter === 'all' || filter === t);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Learn SRE</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Short, practical lessons. Each one ends with key takeaways and, where it fits, a game challenge to practise the skill.
          </p>
        </div>
        <div className="w-full max-w-xs rounded-xl border border-line bg-panel p-4 sm:w-64">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Your progress</span>
            <span className="font-semibold">
              {done}/{LESSONS.length}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-2" role="progressbar" aria-label="Lessons completed" aria-valuemin={0} aria-valuemax={LESSONS.length} aria-valuenow={done}>
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-ok transition-all" style={{ width: `${(done / LESSONS.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by track">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            aria-pressed={filter === f.id}
            onClick={() => setParams(f.id === 'all' ? {} : { track: f.id })}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              filter === f.id ? 'border-accent bg-accent/15 text-ink' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tracks.map((t) => {
        const lessons = LESSONS.filter((l) => l.track === t);
        return (
          <section key={t} className="mt-10" aria-labelledby={`track-${t}`}>
            <div className="mb-4">
              <h2 id={`track-${t}`} className="text-2xl font-semibold">
                {TRACKS[t].title}
              </h2>
              <p className="text-sm text-muted">
                {TRACKS[t].audience} · {lessons.length} lessons · about {lessons.reduce((a, l) => a + l.minutes, 0)} min
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((l, i) => {
                const isDone = completed.includes(l.slug);
                return (
                  <li key={l.slug}>
                    <Link
                      to={`/learn/${l.slug}`}
                      className={`group flex h-full flex-col rounded-xl border bg-panel p-5 transition hover:-translate-y-0.5 hover:border-accent/60 ${isDone ? 'border-ok/40' : 'border-line'}`}
                    >
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>
                          Lesson {i + 1} · {l.minutes} min
                        </span>
                        {isDone && <span className="text-ok">✓ Completed</span>}
                      </div>
                      <div className="mt-3 flex items-start gap-3">
                        <span className="text-2xl" aria-hidden>
                          {l.icon}
                        </span>
                        <h3 className="font-semibold leading-snug group-hover:text-accent">{l.title}</h3>
                      </div>
                      <p className="mt-2 flex-1 text-sm text-muted">{l.summary}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {l.topics.map((tp) => (
                          <span key={tp} className="rounded-full bg-panel-2 px-2 py-0.5 text-xs text-muted">
                            {tp}
                          </span>
                        ))}
                        {l.practice && <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">🎮 has practice</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
