import { Link } from 'react-router-dom';
import type { Level } from '../engine/level';
import { ACHIEVEMENTS } from '../store/progress';
import { formatDuration } from '../ui/format';
import type { ModeConfig } from './registry';

export interface DebriefData {
  level: Level;
  stars: number;
  seconds: number;
  hints: number;
  xp: number;
  achievements: string[];
}

export function Debrief({ data, mode, onReplay }: { data: DebriefData; mode: ModeConfig; onReplay: () => void }) {
  const next = mode.next(data.level.id);
  const headline = data.stars === 3 ? 'Flawless!' : data.stars === 2 ? 'Nice work!' : 'Solved!';
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Level complete">
      <div className="animate-pop relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
        <div className="bg-gradient-to-br from-brand/25 via-accent/10 to-transparent px-6 pb-4 pt-6 text-center">
          <div className="text-xs uppercase tracking-widest text-muted">
            {mode.label} · {data.level.title}
          </div>
          <h2 className="mt-1 text-2xl font-bold">{headline}</h2>
          <div className="mt-2 flex justify-center gap-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                aria-hidden
                className={`animate-star text-5xl ${i <= data.stars ? 'text-brand drop-shadow-[0_0_12px_rgba(245,166,35,0.6)]' : 'text-line'}`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                ★
              </span>
            ))}
          </div>
          <span className="sr-only">{data.stars} of 3 stars</span>
        </div>
        <div className="px-6 pb-6">
          <dl className="my-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-panel-2 p-2">
              <dt className="text-xs text-muted">Time</dt>
              <dd className="font-mono">
                {formatDuration(data.seconds)} <span className="text-muted">/ {formatDuration(data.level.stars.targetSeconds)}</span>
              </dd>
            </div>
            <div className="rounded-lg bg-panel-2 p-2">
              <dt className="text-xs text-muted">Hints</dt>
              <dd className="font-mono">{data.hints}</dd>
            </div>
            <div className="rounded-lg bg-panel-2 p-2">
              <dt className="text-xs text-muted">XP</dt>
              <dd className="font-mono text-brand">+{data.xp}</dd>
            </div>
          </dl>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">What you learned</h3>
          <p className="mb-3 mt-1 text-sm leading-relaxed">{data.level.debrief}</p>
          <p className="mb-4 rounded-lg border border-line bg-canvas p-2 font-mono text-xs text-muted">
            <span className="text-ok">Answer:</span> {data.level.solution}
          </p>
          {data.achievements.length > 0 && (
            <div className="mb-4 rounded-lg border border-brand/50 bg-brand/10 p-2 text-sm">
              Achievement unlocked:{' '}
              {data.achievements
                .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
                .map((a) => `${a?.icon} ${a?.title}`)
                .join(', ')}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Link to={mode.mapPath} className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-panel-2">
              {mode.mapLabel}
            </Link>
            <button className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-panel-2" onClick={onReplay}>
              Replay
            </button>
            {next && (
              <Link to={mode.playPath(next.id)} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-canvas hover:brightness-110" autoFocus>
                Next: {next.title} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
