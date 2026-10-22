import type { PanelType, Unit } from '../engine/level';
import { formatLabels, type Labels, type QueryResult } from '../engine/types';
import { formatValue, lastValue } from './format';
import { TimeSeriesChart } from './TimeSeriesChart';
import type { QueryState } from './useRangeQuery';

/** Grafana's default thresholds: green base, red from 80. */
function thresholdColor(v: number | null): { color: string; status: string } {
  if (v !== null && v >= 80) return { color: 'var(--color-bad)', status: 'critical' };
  return { color: 'var(--color-ok)', status: 'ok' };
}

function shortLabel(labels: Labels): string {
  const keys = Object.keys(labels).filter((k) => k !== '__name__');
  if (!keys.length) return labels.__name__ ?? 'value';
  return keys.map((k) => labels[k]).join(' · ');
}

function Stat({ result, unit }: { result: QueryResult; unit: Unit }) {
  return (
    <div className="flex h-full flex-wrap items-stretch gap-2">
      {result.series.slice(0, 8).map((s) => {
        const v = lastValue(s.values);
        const { color, status } = thresholdColor(v);
        return (
          <div key={formatLabels(s.labels)} className="flex min-w-32 flex-1 flex-col justify-center rounded px-3 py-2" style={{ background: `color-mix(in srgb, ${color} 22%, transparent)` }}>
            <div className="truncate text-xs text-muted">{shortLabel(s.labels)}</div>
            <div className="text-3xl font-semibold" style={{ color }}>
              {formatValue(v, unit)}
            </div>
            <div className="sr-only">status {status}</div>
          </div>
        );
      })}
    </div>
  );
}

function Gauge({ result, unit }: { result: QueryResult; unit: Unit }) {
  const values = result.series.map((s) => lastValue(s.values));
  const max = unit === 'percent' ? 100 : Math.max(1, ...values.map((v) => v ?? 0)) * 1.2;
  return (
    <div className="flex h-full flex-wrap items-center justify-around gap-2">
      {result.series.slice(0, 6).map((s, i) => {
        const v = values[i];
        const frac = Math.min(1, Math.max(0, (v ?? 0) / max));
        const { color, status } = thresholdColor(unit === 'percent' ? v : (v ?? 0) / max * 100);
        const r = 40;
        const arc = (f: number) => {
          const a = Math.PI * (1 - f);
          return `${50 + r * Math.cos(a)} ${55 - r * Math.sin(a)}`;
        };
        return (
          <figure key={formatLabels(s.labels)} className="flex w-36 flex-col items-center">
            <svg viewBox="0 0 100 62" className="w-full" role="img" aria-label={`${shortLabel(s.labels)}: ${formatValue(v, unit)}, ${status}`}>
              <path d={`M ${arc(0)} A ${r} ${r} 0 0 1 ${arc(1)}`} stroke="#2c3235" strokeWidth="9" fill="none" />
              {frac > 0 && <path d={`M ${arc(0)} A ${r} ${r} 0 0 1 ${arc(frac)}`} stroke={color} strokeWidth="9" fill="none" />}
              <text x="50" y="54" textAnchor="middle" fill={color} fontSize="13" fontWeight="600">
                {formatValue(v, unit)}
              </text>
            </svg>
            <figcaption className="truncate text-xs text-muted">{shortLabel(s.labels)}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function Table({ result, unit }: { result: QueryResult; unit: Unit }) {
  // Like Grafana's instant table: only series that have a sample at the latest timestamp.
  const end = result.timestamps.length - 1;
  const rows = result.series
    .filter((s) => s.values[end] !== null)
    .map((s) => ({ s, v: s.values[end] }))
    .sort((a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity));
  const keys = [...new Set(rows.flatMap(({ s }) => Object.keys(s.labels)))].sort();
  if (!rows.length) return <div className="grid h-full place-items-center text-muted">No data at the latest timestamp</div>;
  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-panel-2 text-muted">
          <tr>
            {keys.map((k) => (
              <th key={k} className="px-2 py-1 font-medium">
                {k}
              </th>
            ))}
            <th className="px-2 py-1 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ s, v }) => (
            <tr key={formatLabels(s.labels)} className="border-t border-line">
              {keys.map((k) => (
                <td key={k} className="px-2 py-1 font-mono">
                  {s.labels[k] ?? ''}
                </td>
              ))}
              <td className="px-2 py-1 text-right font-mono">{formatValue(v, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Visualization({ state, type, unit, height }: { state: QueryState; type: PanelType; unit: Unit; height: number }) {
  if (state.error) {
    return (
      <div role="alert" className="rounded border border-bad/40 bg-bad/10 p-3 font-mono text-xs text-bad">
        {state.error}
      </div>
    );
  }
  if (!state.result) return <div className="grid h-full place-items-center text-muted">No query yet</div>;
  if (!state.result.series.length) return <div className="grid h-full place-items-center text-muted">No data</div>;
  switch (type) {
    case 'timeseries':
      return <TimeSeriesChart result={state.result} unit={unit} height={height} />;
    case 'stat':
      return <Stat result={state.result} unit={unit} />;
    case 'gauge':
      return <Gauge result={state.result} unit={unit} />;
    case 'table':
      return <Table result={state.result} unit={unit} />;
  }
}

export { Table as ResultTable };
