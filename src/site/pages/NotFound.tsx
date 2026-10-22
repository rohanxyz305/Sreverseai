import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
      <div className="font-mono text-6xl font-bold text-bad">404</div>
      <h1 className="mt-4 text-2xl font-semibold">This page returned no data</h1>
      <p className="mt-2 text-muted">Check the URL, or head back to somewhere with healthy metrics.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-canvas">
          Home
        </Link>
        <Link to="/games" className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:bg-panel-2">
          🎮 Games
        </Link>
      </div>
    </div>
  );
}
