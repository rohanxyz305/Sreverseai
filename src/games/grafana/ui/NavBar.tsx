import { Link, NavLink } from 'react-router-dom';
import { paths } from '../paths';
import { playerLevel, useProgress } from '../store/progress';

export function GameLogo() {
  return (
    <Link to={paths.home} className="flex items-center gap-2 font-bold tracking-tight" aria-label="Grafana Learning Games overview">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#22252b" />
        <polyline points="5,22 11,16 16,19 22,8 27,12" fill="none" stroke="#f5a623" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span>
        Grafana <span className="text-brand">Learning Games</span>
      </span>
    </Link>
  );
}

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1 text-sm transition-colors ${isActive ? 'bg-panel-2 text-ink' : 'text-muted hover:text-ink'}`;

/** Second-level navigation inside the game, shown under the Sreverseai header. */
export function GameNav() {
  const xp = useProgress((s) => s.xp);
  const { level, into, span } = playerLevel(xp);
  return (
    <div className="border-b border-line bg-panel/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <Link to="/games" className="hover:text-ink">
            Games
          </Link>{' '}
          /
        </nav>
        <GameLogo />
        <nav className="flex gap-1" aria-label="Game sections">
          <NavLink to={paths.home} end className={link}>
            Overview
          </NavLink>
          <NavLink to={paths.campaign} className={link}>
            Campaign
          </NavLink>
          <NavLink to={paths.practice} className={link}>
            Practice Arena
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2" title={`${into} / ${span} XP to the next level`}>
          <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">Lv {level}</span>
          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-panel-2 sm:block" role="progressbar" aria-label="XP to next level" aria-valuemin={0} aria-valuemax={span} aria-valuenow={into}>
            <div className="h-full bg-brand" style={{ width: `${(into / span) * 100}%` }} />
          </div>
          <span className="font-mono text-xs text-muted">{xp} XP</span>
        </div>
      </div>
    </div>
  );
}
