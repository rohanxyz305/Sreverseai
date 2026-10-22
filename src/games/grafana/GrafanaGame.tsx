import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { GameNav } from './ui/NavBar';

const GameHome = lazy(() => import('./modes/Home'));
const LevelMap = lazy(() => import('./modes/campaign/LevelMap'));
const PracticeArena = lazy(() => import('./modes/practice/PracticeArena'));
const GameScreen = lazy(() => import('./modes/GameScreen'));

const loading = <div className="grid h-64 place-items-center text-muted">Loading…</div>;

function GameLayout() {
  return (
    <>
      <GameNav />
      <Suspense fallback={loading}>
        <Outlet />
      </Suspense>
      <p className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted sm:px-6">
        Grafana Learning Games is not affiliated with or endorsed by Grafana Labs. Grafana is a trademark of Grafana Labs. All metrics are simulated.
      </p>
    </>
  );
}

/** Mounted by the Sreverseai site at /games/grafana/*. */
export default function GrafanaGame() {
  return (
    <Routes>
      <Route element={<GameLayout />}>
        <Route index element={<GameHome />} />
        <Route path="campaign" element={<LevelMap />} />
        <Route path="practice" element={<PracticeArena />} />
      </Route>
      <Route
        path="play/:levelId"
        element={
          <Suspense fallback={loading}>
            <GameScreen key="campaign" mode="campaign" />
          </Suspense>
        }
      />
      <Route
        path="practice/:levelId"
        element={
          <Suspense fallback={loading}>
            <GameScreen key="practice" mode="practice" />
          </Suspense>
        }
      />
    </Routes>
  );
}
