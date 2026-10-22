import { Fragment } from 'react';
import type { Block } from '../content/lessons';

/** Renders `backtick` spans as inline code. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') ? (
          <code key={i} className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[0.85em] text-[#8ab4ff]">
            {p.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function BlockView({ block }: { block: Block }) {
  if ('p' in block)
    return (
      <p className="leading-7 text-ink/90">
        <Inline text={block.p} />
      </p>
    );
  if ('ul' in block)
    return (
      <ul className="list-disc space-y-1.5 pl-6 leading-7 marker:text-accent">
        {block.ul.map((li) => (
          <li key={li}>
            <Inline text={li} />
          </li>
        ))}
      </ul>
    );
  if ('ol' in block)
    return (
      <ol className="list-decimal space-y-1.5 pl-6 leading-7 marker:font-semibold marker:text-accent">
        {block.ol.map((li) => (
          <li key={li}>
            <Inline text={li} />
          </li>
        ))}
      </ol>
    );
  if ('code' in block)
    return (
      <div className="overflow-hidden rounded-xl border border-line bg-[#0b0c10]">
        {block.lang && <div className="border-b border-line px-4 py-1.5 font-mono text-xs uppercase tracking-wide text-muted">{block.lang}</div>}
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-[#d8d9e3]">
          <code>{block.code}</code>
        </pre>
      </div>
    );
  if ('table' in block)
    return (
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-panel-2 text-muted">
            <tr>
              {block.table.head.map((h, i) => (
                <th key={i} className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((row, ri) => (
              <tr key={ri} className="border-t border-line">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-3 py-2 ${ci === 0 ? 'font-medium' : ''}`}>
                    <Inline text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <aside className="flex gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm leading-6">
      <span aria-hidden>💡</span>
      <p>
        <span className="font-semibold text-brand">Tip: </span>
        <Inline text={block.tip} />
      </p>
    </aside>
  );
}
