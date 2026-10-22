import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { isFullscreenGamePath } from '../games/registry';

export function SiteLogo({ small = false }: { small?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Sreverseai home">
      <svg viewBox="0 0 32 32" className={small ? 'h-6 w-6' : 'h-8 w-8'} aria-hidden>
        <defs>
          <linearGradient id="srv-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6e9fff" />
            <stop offset="1" stopColor="#3fb950" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#srv-g)" />
        <path d="M9 20.5c1.6 1.4 3.7 2 5.8 2 3 0 5-1.4 5-3.6 0-4.6-10.2-2.7-10.2-7.4C9.6 9.3 11.6 8 14.4 8c1.9 0 3.6.5 5 1.5" fill="none" stroke="#0b0c10" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="23.5" cy="21.5" r="2.2" fill="#0b0c10" />
      </svg>
      <span className={`font-bold tracking-tight ${small ? 'text-base' : 'text-xl'}`}>
        Sreverse<span className="bg-gradient-to-r from-accent to-ok bg-clip-text text-transparent">ai</span>
      </span>
    </Link>
  );
}

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/learn', label: 'Learn' },
  { to: '/glossary', label: 'Glossary' },
  { to: '/about', label: 'About' },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-ink bg-panel-2' : 'text-muted hover:text-ink'}`;

function GamesButton({ onClick }: { onClick?: () => void }) {
  const { pathname } = useLocation();
  const active = pathname.startsWith('/games');
  return (
    <Link
      to="/games"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg transition hover:brightness-110 ${
        active ? 'bg-brand text-canvas shadow-brand/25 ring-2 ring-brand/40' : 'bg-gradient-to-r from-brand to-[#ff7a45] text-canvas shadow-brand/20'
      }`}
    >
      <span aria-hidden>🎮</span> Games
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
        <SiteLogo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <GamesButton />
          <button
            className="rounded-md border border-line p-2 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t border-line px-4 py-2 md:hidden" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `block ${navClass({ isActive })}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <SiteLogo small />
          <p className="mt-3 max-w-xs text-sm text-muted">Learn Site Reliability Engineering by reading, practising and playing. Free and runs in your browser.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Learn</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link className="hover:text-ink" to="/learn?track=beginner">SRE Foundations</Link></li>
            <li><Link className="hover:text-ink" to="/learn?track=experienced">Production SRE</Link></li>
            <li><Link className="hover:text-ink" to="/glossary">Glossary</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Games</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link className="hover:text-ink" to="/games">All games</Link></li>
            <li><Link className="hover:text-ink" to="/games/grafana">Grafana Learning Games</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Sreverseai</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li><Link className="hover:text-ink" to="/about">About</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Sreverseai. Product names such as Grafana, Prometheus and Kubernetes are trademarks of their owners and are used here only to describe what is taught.
      </p>
    </footer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const loading = <div className="grid h-64 place-items-center text-muted">Loading…</div>;

export function SiteLayout() {
  const { pathname } = useLocation();
  if (isFullscreenGamePath(pathname)) {
    return (
      <div className="h-screen">
        <Suspense fallback={loading}>
          <Outlet />
        </Suspense>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-panel focus:p-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={loading}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
