import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { LIVE_GAMES } from './games/registry';
import { SiteLayout } from './site/Layout';
import Home from './site/pages/Home';
import NotFound from './site/pages/NotFound';

const Learn = lazy(() => import('./site/pages/Learn'));
const Lesson = lazy(() => import('./site/pages/Lesson'));
const Glossary = lazy(() => import('./site/pages/Glossary'));
const Games = lazy(() => import('./site/pages/Games'));
const About = lazy(() => import('./site/pages/About'));

/** Old URLs from before the game moved under /games/grafana. */
function LegacyRedirect({ to }: { to: (id?: string) => string }) {
  const { id } = useParams();
  return <Navigate to={to(id)} replace />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="learn" element={<Learn />} />
          <Route path="learn/:slug" element={<Lesson />} />
          <Route path="glossary" element={<Glossary />} />
          <Route path="about" element={<About />} />
          <Route path="games" element={<Games />} />
          {LIVE_GAMES.map((g) => {
            const Game = g.component!;
            return <Route key={g.slug} path={`games/${g.slug}/*`} element={<Game />} />;
          })}
          <Route path="campaign" element={<LegacyRedirect to={() => '/games/grafana/campaign'} />} />
          <Route path="practice" element={<LegacyRedirect to={() => '/games/grafana/practice'} />} />
          <Route path="play/:id" element={<LegacyRedirect to={(id) => `/games/grafana/play/${id}`} />} />
          <Route path="practice/:id" element={<LegacyRedirect to={(id) => `/games/grafana/practice/${id}`} />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
