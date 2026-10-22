import { Link } from 'react-router-dom';
import { isUnlocked, useProgress } from '../../store/progress';
import { Stars, TOPIC_ICONS } from '../../ui/Badges';
import { CHAPTERS } from './levels';
import { paths } from '../../paths';

export default function LevelMap() {
  const levels = useProgress((s) => s.levels);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign</h1>
          <p className="mt-1 text-muted">Five chapters, each level unlocks the next. Want to skip ahead? Try the Practice Arena.</p>
        </div>
        <Link to={paths.practice} className="rounded-lg border border-line bg-panel px-4 py-2 text-sm hover:border-brand/60">
          🎯 Practice Arena: everything unlocked →
        </Link>
      </div>
      <div className="space-y-8">
        {CHAPTERS.map((ch, ci) => {
          const done = ch.levels.filter((l) => levels[l.id]).length;
          return (
            <section key={ch.title} aria-label={`Chapter ${ci + 1}: ${ch.title}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-panel-2 text-accent" aria-hidden>
                  {TOPIC_ICONS[ch.title] ?? ci + 1}
                </span>
                <h2 className="font-semibold">
                  Chapter {ci + 1} · {ch.title}
                </h2>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-panel-2" aria-hidden>
                  <div className="h-full bg-accent" style={{ width: `${(done / ch.levels.length) * 100}%` }} />
                </div>
                <span className="text-xs text-muted">
                  {done}/{ch.levels.length}
                </span>
              </div>
              <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {ch.levels.map((l) => {
                  const built = Boolean(l.file);
                  const open = built && isUnlocked(l.id, levels);
                  const p = levels[l.id];
                  const body = (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>Level {l.id}</span>
                        {p && <span className="text-ok">✓ done</span>}
                      </div>
                      <div className="mt-1 font-medium">{l.title}</div>
                      <div className="mt-3 text-sm">
                        {p ? (
                          <Stars count={p.stars} size="text-base" />
                        ) : (
                          <span className="text-xs text-muted">{!built ? 'Coming soon' : open ? 'Ready to play →' : '🔒 Finish the previous level'}</span>
                        )}
                      </div>
                    </>
                  );
                  return (
                    <li key={l.id}>
                      {open ? (
                        <Link
                          to={paths.play(l.id)}
                          className={`block h-full rounded-xl border p-3 transition hover:-translate-y-0.5 hover:border-accent ${!p ? 'border-accent/50 bg-accent/5' : 'border-line bg-panel'}`}
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="h-full rounded-xl border border-line bg-panel/40 p-3 opacity-60" aria-disabled>
                          {body}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
