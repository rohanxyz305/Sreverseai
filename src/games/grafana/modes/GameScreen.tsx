import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { Level, Objective } from '../engine/level';
import { checkAll } from '../engine/objectives';
import { computeStars } from '../engine/scoring';
import type { CheckResult } from '../engine/validator';
import { useProgress } from '../store/progress';
import { useGame, type View } from '../store/game';
import { Dashboard } from '../ui/Dashboard';
import { Explore, EXPLORE_EDITOR_ID } from '../ui/Explore';
import { DifficultyBadge } from '../ui/Badges';
import { formatDuration } from '../ui/format';
import { Debrief, type DebriefData } from './Debrief';
import { MODES, type ModeConfig, type ModeId } from './registry';

function ObjectiveItem({ obj, result }: { obj: Objective; result: CheckResult }) {
  const choose = useGame((s) => s.choose);
  const picked = useGame((s) => s.choices[obj.id]);
  return (
    <li className={`rounded-lg border p-2 transition-colors ${result.ok ? 'border-ok/40 bg-ok/10' : 'border-line bg-panel-2'}`}>
      <div className="flex gap-2">
        <span aria-hidden className={result.ok ? 'text-ok' : 'text-muted'}>
          {result.ok ? '✓' : '○'}
        </span>
        <div className="flex-1">
          <div className={result.ok ? 'text-ok' : ''}>
            {obj.text}
            <span className="sr-only">{result.ok ? ' (done)' : ' (not done yet)'}</span>
          </div>
          {obj.type === 'choice' && (
            <fieldset className="mt-2">
              <legend className="mb-1 text-xs text-muted">{obj.question}</legend>
              <div className="flex flex-wrap gap-1">
                {obj.options.map((opt, i) => (
                  <label
                    key={opt}
                    className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-xs ${picked === i ? 'border-accent bg-accent/20' : 'border-line hover:bg-panel'}`}
                  >
                    <input type="radio" name={obj.id} className="sr-only" checked={picked === i} onChange={() => choose(obj.id, i)} />
                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {!result.ok && <p className="mt-1 text-xs text-muted">{result.message}</p>}
        </div>
      </div>
    </li>
  );
}

function Sidebar({ level, results, mode }: { level: Level; results: Record<string, CheckResult>; mode: ModeConfig }) {
  const hintsShown = useGame((s) => s.hintsShown);
  const showMe = useGame((s) => s.showMe);
  const revealHint = useGame((s) => s.revealHint);
  const revealSolution = useGame((s) => s.revealSolution);
  const done = level.objectives.filter((o) => results[o.id]?.ok).length;
  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-line bg-panel p-4" aria-label="Mission">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-wide text-muted">
            {mode.id === 'campaign' ? `Level ${level.id}` : `Challenge #${level.id}`} · {level.chapter}
          </div>
          {level.difficulty && <DifficultyBadge value={level.difficulty} />}
        </div>
        <h1 className="mt-1 text-lg font-semibold">{level.title}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">{level.intro}</p>
      </div>
      {level.tutorial && (
        <section aria-label="Tutorial">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">How to</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {level.tutorial.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      )}
      <section aria-label="Objectives">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Objectives</h2>
          <span className="text-xs text-muted">
            {done} / {level.objectives.length} done
          </span>
        </div>
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-panel-2" role="progressbar" aria-valuemin={0} aria-valuemax={level.objectives.length} aria-valuenow={done} aria-label="Objectives done">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-ok transition-all duration-500" style={{ width: `${(done / level.objectives.length) * 100}%` }} />
        </div>
        <ul className="space-y-2 text-sm">
          {level.objectives.map((o) => (
            <ObjectiveItem key={o.id} obj={o} result={results[o.id]} />
          ))}
        </ul>
      </section>
      <section aria-label="Hints" className="mt-auto">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Hints</h2>
        <ul className="mb-2 space-y-1 text-sm">
          {level.hints.slice(0, hintsShown).map((h, i) => (
            <li key={h} className="rounded bg-panel-2 p-2">
              <span className="text-brand">Hint {i + 1}:</span> {h}
            </li>
          ))}
        </ul>
        {showMe && (
          <p className="mb-2 rounded border border-brand/50 bg-brand/10 p-2 font-mono text-xs">{level.solution}</p>
        )}
        <div className="flex gap-2">
          <button
            className="rounded border border-line px-3 py-1 text-sm hover:bg-panel-2 disabled:opacity-50"
            onClick={revealHint}
            disabled={hintsShown >= level.hints.length}
          >
            {hintsShown >= level.hints.length ? 'No more hints' : `Get a hint (${level.hints.length - hintsShown} left)`}
          </button>
          {hintsShown >= 2 && !showMe && (
            <button className="rounded border border-brand/60 px-3 py-1 text-sm text-brand hover:bg-brand/10" onClick={revealSolution}>
              Show me
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">Hints cost stars. "Show me" caps the level at 1 star.</p>
      </section>
    </aside>
  );
}

const SHORTCUTS: [string, string][] = [
  ['/', 'Focus the Explore query editor'],
  ['Ctrl + Enter', 'Run the query'],
  ['Space', 'Pause / resume'],
  ['Esc', 'Close the panel editor, or open the menu'],
  ['?', 'Show this help'],
];

function Overlay({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="w-full max-w-md rounded-lg border border-line bg-panel p-6 shadow-xl">{children}</div>
    </div>
  );
}

export default function GameScreen({ mode: modeId }: { mode: ModeId }) {
  const mode = MODES[modeId];
  const id = Number(useParams().levelId);
  const navigate = useNavigate();
  const progress = useProgress((s) => (modeId === 'campaign' ? s.levels : s.practice));
  const recordResult = useProgress((s) => s.recordResult);
  const game = useGame();
  const [missing, setMissing] = useState(false);
  const [help, setHelp] = useState(false);
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Level | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const recorded = useRef<string | null>(null);
  const prevDone = useRef<Set<string>>(new Set());
  const unlocked = !mode.isLocked(id, progress);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setDebrief(null);
    setMissing(false);
    setToast(null);
    prevDone.current = new Set();
    mode.load(id).then((l) => {
      if (cancelled) return;
      if (l) {
        useGame.getState().start(l);
        setLoaded(l);
      } else setMissing(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, unlocked, attempt, mode]);

  useEffect(() => {
    const t = setInterval(() => useGame.getState().tick(), 1000);
    return () => clearInterval(t);
  }, []);

  const { level, store, panels, exploreQuery, timeRange, choices } = game;
  // Compare by identity: campaign and practice both have a level 1.
  const ready = level !== null && level === loaded && store !== null;

  const results = useMemo(
    () => (ready ? checkAll(level.objectives, { panels, exploreQuery, timeRange, choices }, store) : {}),
    [ready, level, store, panels, exploreQuery, timeRange, choices],
  );
  const allDone = ready && level.objectives.every((o) => results[o.id]?.ok);

  // Toast when an objective flips to done (but not when the level is finished; the debrief covers that).
  useEffect(() => {
    if (!ready) return;
    const now = new Set(level.objectives.filter((o) => results[o.id]?.ok).map((o) => o.id));
    const fresh = level.objectives.find((o) => now.has(o.id) && !prevDone.current.has(o.id));
    prevDone.current = now;
    if (fresh && !allDone) setToast(`Objective complete: ${fresh.text}`);
  }, [ready, level, results, allDone]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!allDone || game.finished || !level) return;
    const key = `${level.id}:${attempt}`;
    if (recorded.current === key) return;
    recorded.current = key;
    game.finish();
    const stars = computeStars(game.elapsed, game.hintsShown, level.stars.targetSeconds, game.showMe);
    const { xp, unlocked: achievements } = recordResult(modeId, level.id, {
      stars,
      seconds: game.elapsed,
      hintsUsed: game.hintsShown,
      difficulty: level.difficulty,
    });
    setDebrief({ level, stars, seconds: game.elapsed, hints: game.hintsShown, xp, achievements });
  }, [allDone, game, level, attempt, recordResult, modeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest('input, select, textarea, .cm-editor');
      const g = useGame.getState();
      if (e.key === 'Escape') {
        if (help) setHelp(false);
        else if (g.editing) g.discardDraft();
        else g.togglePause();
        return;
      }
      if (typing || g.finished) return;
      if (e.key === ' ') {
        e.preventDefault();
        g.togglePause();
      } else if (e.key === '/') {
        e.preventDefault();
        g.setView('explore');
        setTimeout(() => (document.getElementById(EXPLORE_EDITOR_ID) as HTMLElement | null)?.focus(), 0);
      } else if (e.key === '?') {
        setHelp(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [help]);

  if (!unlocked) return <Navigate to={mode.mapPath} replace />;
  if (missing) {
    return (
      <div className="grid h-full place-items-center text-muted">
        <div className="text-center">
          <p>This level isn't built yet.</p>
          <Link to={mode.mapPath} className="text-accent underline">
            Back to {mode.mapLabel.toLowerCase()}
          </Link>
        </div>
      </div>
    );
  }
  if (!ready) return <div className="grid h-full place-items-center text-muted">Generating 6 hours of metrics…</div>;

  const tabs: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'explore', label: 'Explore' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="bg-warn/15 px-4 py-1 text-center text-xs text-warn lg:hidden">Grafana Learning Games is built for desktop screens (1280 px+). It may be cramped here.</div>
      <header className="flex items-center gap-4 border-b border-line bg-panel px-4 py-2">
        <Link to={mode.mapPath} className="text-sm text-muted hover:text-ink">
          ← {mode.mapLabel}
        </Link>
        <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{mode.label}</span>
        <nav className="flex gap-1" aria-label="Views">
          {tabs.map((t) => (
            <button
              key={t.id}
              aria-current={game.view === t.id ? 'page' : undefined}
              className={`rounded px-3 py-1 text-sm ${game.view === t.id ? 'bg-panel-2 text-ink' : 'text-muted hover:text-ink'}`}
              onClick={() => game.setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-sm" aria-label="Elapsed time">
            ⏱ {formatDuration(game.elapsed)} <span className="text-muted">/ {formatDuration(level.stars.targetSeconds)}</span>
          </span>
          <button className="rounded border border-line px-3 py-1 text-sm hover:bg-panel-2" onClick={game.togglePause}>
            {game.paused ? 'Resume' : 'Pause'}
          </button>
          <button className="rounded border border-line px-2 py-1 text-sm hover:bg-panel-2" onClick={() => setHelp(true)} aria-label="Keyboard shortcuts and help">
            ?
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar level={level} results={results} mode={mode} />
        <main className="min-w-0 flex-1 overflow-y-auto p-4">{game.view === 'dashboard' ? <Dashboard /> : <Explore />}</main>
      </div>

      {game.paused && !game.finished && (
        <Overlay label="Paused">
          <h2 className="mb-4 text-lg font-semibold">Paused</h2>
          <div className="flex flex-col gap-2">
            <button className="rounded bg-accent px-3 py-2 font-medium text-canvas" onClick={game.togglePause} autoFocus>
              Resume
            </button>
            <button className="rounded border border-line px-3 py-2" onClick={() => setAttempt((a) => a + 1)}>
              Restart level
            </button>
            <button className="rounded border border-line px-3 py-2" onClick={() => navigate(mode.mapPath)}>
              {mode.mapLabel}
            </button>
          </div>
        </Overlay>
      )}
      {help && (
        <Overlay label="Help">
          <h2 className="mb-3 text-lg font-semibold">Keyboard shortcuts</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {SHORTCUTS.map(([k, d]) => (
              <div key={k} className="contents">
                <dt>
                  <kbd className="rounded border border-line bg-panel-2 px-1.5 font-mono text-xs">{k}</kbd>
                </dt>
                <dd className="text-muted">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">The data is simulated. All times are UTC, and "now" is fixed at 12:00.</p>
          <button className="mt-4 rounded bg-accent px-3 py-1.5 font-medium text-canvas" onClick={() => setHelp(false)} autoFocus>
            Got it
          </button>
        </Overlay>
      )}
      {debrief && <Debrief data={debrief} mode={mode} onReplay={() => setAttempt((a) => a + 1)} />}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
        {toast && (
          <div className="animate-pop rounded-full border border-ok/50 bg-panel px-4 py-2 text-sm text-ok shadow-xl">✓ {toast}</div>
        )}
      </div>
    </div>
  );
}
