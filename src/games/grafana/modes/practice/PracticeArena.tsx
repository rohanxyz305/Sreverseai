import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Difficulty } from '../../engine/level';
import { useProgress } from '../../store/progress';
import { DifficultyBadge, Stars, TOPIC_ICONS } from '../../ui/Badges';
import { formatDuration } from '../../ui/format';
import { CHALLENGES, TOPICS } from './challenges';
import { paths } from '../../paths';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active ? 'border-accent bg-accent/15 text-ink' : 'border-line text-muted hover:border-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default function PracticeArena() {
  const practice = useProgress((s) => s.practice);
  const navigate = useNavigate();
  const [topic, setTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [query, setQuery] = useState('');
  const [hideDone, setHideDone] = useState(false);

  const done = CHALLENGES.filter((c) => practice[c.id]).length;
  const stars = CHALLENGES.reduce((a, c) => a + (practice[c.id]?.stars ?? 0), 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHALLENGES.filter(
      (c) =>
        (!topic || c.topic === topic) &&
        (!difficulty || c.difficulty === difficulty) &&
        (!hideDone || !practice[c.id]) &&
        (!q || `${c.title} ${c.blurb} ${c.topic}`.toLowerCase().includes(q)),
    );
  }, [topic, difficulty, query, hideDone, practice]);

  const surprise = () => {
    // Prefer unsolved challenges that match the current filters.
    const unsolved = visible.filter((c) => !practice[c.id]);
    const pool = unsolved.length ? unsolved : visible.length ? visible : CHALLENGES;
    navigate(paths.challenge(pool[Math.floor(Math.random() * pool.length)].id));
  };

  return (
    <div>
      <section className="bg-grid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="animate-rise">
            <span className="rounded-full border border-ok/40 bg-ok/10 px-2.5 py-0.5 text-xs font-medium text-ok">All {CHALLENGES.length} challenges unlocked</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Practice Arena</h1>
            <p className="mt-2 max-w-2xl text-muted">
              Bite-sized Grafana and PromQL challenges on live simulated data. Play any one, in any order, as often as you like. Each takes 1–4 minutes.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={surprise} className="rounded-lg bg-brand px-4 py-2 font-semibold text-canvas shadow-lg shadow-brand/20 transition hover:brightness-110">
              🎲 Surprise me
            </button>
            <div className="flex gap-2 text-sm">
              <span className="rounded-lg border border-line bg-panel px-3 py-2">
                <b>{done}</b> <span className="text-muted">/ {CHALLENGES.length} solved</span>
              </span>
              <span className="rounded-lg border border-line bg-panel px-3 py-2">
                <b className="text-brand">★ {stars}</b> <span className="text-muted">/ {CHALLENGES.length * 3}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
            <Chip active={!topic} onClick={() => setTopic(null)}>
              All topics
            </Chip>
            {TOPICS.map((t) => (
              <Chip key={t} active={topic === t} onClick={() => setTopic(topic === t ? null : t)}>
                <span aria-hidden>{TOPIC_ICONS[t]}</span> {t}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-2" role="group" aria-label="Filter by difficulty">
              {DIFFICULTIES.map((d) => (
                <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(difficulty === d ? null : d)}>
                  {d[0].toUpperCase() + d.slice(1)}
                </Chip>
              ))}
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search challenges…"
              aria-label="Search challenges"
              className="w-48 rounded-full border border-line bg-panel px-3 py-1 text-sm placeholder:text-muted"
            />
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-muted">
              <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="accent-[var(--color-accent)]" />
              Hide solved
            </label>
          </div>
        </div>

        {visible.length ? (
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c, i) => {
              const p = practice[c.id];
              return (
                <li key={c.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <Link
                    to={paths.challenge(c.id)}
                    className="group flex h-full flex-col rounded-xl border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs text-muted">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-panel-2 text-base text-accent" aria-hidden>
                          {TOPIC_ICONS[c.topic]}
                        </span>
                        #{c.id} · {c.topic}
                      </span>
                      <DifficultyBadge value={c.difficulty} />
                    </div>
                    <h2 className="mt-3 font-semibold group-hover:text-accent">{c.title}</h2>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{c.blurb}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                      {p ? (
                        <>
                          <Stars count={p.stars} size="text-base" />
                          <span className="font-mono text-xs text-muted">best {formatDuration(p.bestTime)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted">Not played yet</span>
                          <span className="text-xs font-medium text-accent">Play →</span>
                        </>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="grid h-48 place-items-center rounded-xl border border-dashed border-line text-muted">
            <div className="text-center">
              <p>No challenges match these filters.</p>
              <button
                className="mt-2 text-accent underline"
                onClick={() => {
                  setTopic(null);
                  setDifficulty(null);
                  setQuery('');
                  setHideDone(false);
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
