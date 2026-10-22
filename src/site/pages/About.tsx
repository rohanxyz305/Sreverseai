import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">About Sreverseai</h1>
      <p className="mt-4 text-lg text-muted">
        Sreverseai is a free place to learn Site Reliability Engineering. Whether you are new to IT or have years of experience, you learn faster by doing than by reading.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: '📖', title: 'Learn', body: 'Short lessons with clear takeaways, from what SRE is to burn-rate alerting.' },
          { icon: '🎮', title: 'Play', body: 'Games on simulated systems where you write real queries and debug real-looking failures.' },
          { icon: '🏆', title: 'Progress', body: 'Stars, XP and achievements. Your progress is saved in your browser, with no account needed.' },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-line bg-panel p-5">
            <div className="text-2xl" aria-hidden>
              {c.icon}
            </div>
            <h2 className="mt-2 font-semibold">{c.title}</h2>
            <p className="mt-1 text-sm text-muted">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 space-y-3 leading-7">
        <h2 className="text-2xl font-semibold">Who it's for</h2>
        <ul className="list-disc space-y-1 pl-6 marker:text-accent">
          <li>Students and career switchers who want a first job in SRE, DevOps or platform engineering.</li>
          <li>Developers who are now on call and want to understand dashboards and alerts.</li>
          <li>Experienced IT and ops engineers moving to SLO-based reliability practices.</li>
          <li>Anyone preparing for SRE interviews.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3 leading-7">
        <h2 className="text-2xl font-semibold">Privacy</h2>
        <p className="text-muted">
          There are no accounts. Lesson progress and game scores are stored in your own browser (local storage) and never leave your device. Clearing your browser data resets them.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-7">
        <h2 className="text-2xl font-semibold">Trademarks</h2>
        <p className="text-muted">
          Sreverseai is independent. It is not affiliated with or endorsed by Grafana Labs, the Prometheus project, the Cloud Native Computing Foundation or any other vendor. Grafana is a trademark of Grafana Labs. Product names are used only to describe what is taught.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/learn" className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-canvas hover:brightness-110">
          Start learning →
        </Link>
        <Link to="/games" className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:bg-panel-2">
          🎮 Play games
        </Link>
      </div>
    </div>
  );
}
