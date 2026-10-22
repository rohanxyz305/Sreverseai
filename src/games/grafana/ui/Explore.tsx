import { useState } from 'react';
import { useGame } from '../store/game';
import { TimeRangePicker } from './Dashboard';
import { QueryEditor } from './QueryEditor';
import { useRangeQuery } from './useRangeQuery';
import { ResultTable, Visualization } from './Visualization';

export const EXPLORE_EDITOR_ID = 'explore-query';

export function Explore() {
  const store = useGame((s) => s.store);
  const timeRange = useGame((s) => s.timeRange);
  const exploreQuery = useGame((s) => s.exploreQuery);
  const runExplore = useGame((s) => s.runExplore);
  const [draft, setDraft] = useState(exploreQuery);
  const state = useRangeQuery(store, exploreQuery, timeRange);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Explore · Prometheus (simulated)</h2>
        <TimeRangePicker />
      </div>
      <div className="flex items-start gap-2 rounded border border-line bg-panel p-3">
        <div className="flex-1">
          <QueryEditor id={EXPLORE_EDITOR_ID} value={draft} onChange={setDraft} onRun={runExplore} label="Explore query" />
        </div>
        <button className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-canvas hover:brightness-110" onClick={() => runExplore(draft)}>
          Run query
        </button>
      </div>
      <section className="rounded border border-line bg-panel p-2" aria-label="Graph">
        <div className="mb-1 px-1 text-xs font-medium text-muted">Graph</div>
        <div className="min-h-[260px]">
          <Visualization state={state} type="timeseries" unit="none" height={260} />
        </div>
      </section>
      {state.result && state.result.series.length > 0 && (
        <section className="max-h-72 rounded border border-line bg-panel p-2" aria-label="Table">
          <div className="mb-1 px-1 text-xs font-medium text-muted">Table · latest value, highest first</div>
          <ResultTable result={state.result} unit="none" />
        </section>
      )}
    </div>
  );
}
