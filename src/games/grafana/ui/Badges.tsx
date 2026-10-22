import type { Difficulty } from '../engine/level';

const DIFFICULTY: Record<Difficulty, { label: string; cls: string; bars: number }> = {
  easy: { label: 'Easy', cls: 'text-ok border-ok/40 bg-ok/10', bars: 1 },
  medium: { label: 'Medium', cls: 'text-warn border-warn/40 bg-warn/10', bars: 2 },
  hard: { label: 'Hard', cls: 'text-bad border-bad/40 bg-bad/10', bars: 3 },
};

/** Difficulty shown as text plus bars, never colour alone. */
export function DifficultyBadge({ value }: { value: Difficulty }) {
  const d = DIFFICULTY[value];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${d.cls}`}>
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`w-[3px] rounded-sm ${i <= d.bars ? 'bg-current' : 'bg-current opacity-25'}`} style={{ height: 3 + i * 3 }} />
        ))}
      </span>
      {d.label}
    </span>
  );
}

export const TOPIC_ICONS: Record<string, string> = {
  PromQL: '⌁',
  Panels: '▦',
  Dashboards: '▤',
  Troubleshooting: '⚠',
  Basics: '◎',
  Logs: '≡',
  Production: '⚑',
};

export function Stars({ count, size = 'text-xl' }: { count: number; size?: string }) {
  return (
    <span className={size} role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? 'text-brand' : 'text-line'} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}
