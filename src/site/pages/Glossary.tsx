import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY } from '../content/glossary';
import { LESSONS } from '../content/lessons';

export default function Glossary() {
  const [q, setQ] = useState('');
  const terms = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...GLOSSARY]
      .sort((a, b) => a.term.localeCompare(b.term))
      .filter((t) => !s || t.term.toLowerCase().includes(s) || t.definition.toLowerCase().includes(s));
  }, [q]);
  const letters = [...new Set(terms.map((t) => t.term[0].toUpperCase()))];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">SRE glossary</h1>
      <p className="mt-2 text-muted">{GLOSSARY.length} terms you will hear in standups, incident channels and interviews, in plain English.</p>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search terms… (e.g. SLO, toil, burn rate)"
        aria-label="Search glossary"
        className="mt-6 w-full rounded-xl border border-line bg-panel px-4 py-3 placeholder:text-muted"
      />
      {letters.length > 1 && (
        <nav className="mt-4 flex flex-wrap gap-1" aria-label="Jump to letter">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="grid h-8 w-8 place-items-center rounded-md border border-line text-sm text-muted hover:border-accent hover:text-ink">
              {l}
            </a>
          ))}
        </nav>
      )}
      {terms.length === 0 ? (
        <p className="mt-10 text-center text-muted">No terms match “{q}”.</p>
      ) : (
        letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} className="mt-8 scroll-mt-24">
            <h2 className="mb-3 text-sm font-bold text-accent">{letter}</h2>
            <dl className="space-y-3">
              {terms
                .filter((t) => t.term[0].toUpperCase() === letter)
                .map((t) => {
                  const lesson = LESSONS.find((l) => l.slug === t.lesson);
                  return (
                    <div key={t.term} className="rounded-xl border border-line bg-panel p-4">
                      <dt className="font-semibold">{t.term}</dt>
                      <dd className="mt-1 text-sm leading-6 text-muted">{t.definition}</dd>
                      {lesson && (
                        <dd className="mt-2 text-sm">
                          <Link to={`/learn/${lesson.slug}`} className="text-accent hover:underline">
                            Learn more: {lesson.title} →
                          </Link>
                        </dd>
                      )}
                    </div>
                  );
                })}
            </dl>
          </section>
        ))
      )}
    </div>
  );
}
