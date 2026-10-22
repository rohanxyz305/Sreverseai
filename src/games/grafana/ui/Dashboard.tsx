import { TIME_RANGES, type PanelConfig, type PanelType, type TimeRange, type Unit } from '../engine/level';
import { UNIT_LABELS } from '../engine/objectives';
import { useGame } from '../store/game';
import { QueryEditor } from './QueryEditor';
import { useRangeQuery } from './useRangeQuery';
import { Visualization } from './Visualization';

const PANEL_TYPES: { value: PanelType; label: string }[] = [
  { value: 'timeseries', label: 'Time series' },
  { value: 'stat', label: 'Stat' },
  { value: 'gauge', label: 'Gauge' },
  { value: 'table', label: 'Table' },
];

export function TimeRangePicker() {
  const timeRange = useGame((s) => s.timeRange);
  const setTimeRange = useGame((s) => s.setTimeRange);
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span>Time range</span>
      <select
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
        className="rounded border border-line bg-panel-2 px-2 py-1 text-sm text-ink"
      >
        {TIME_RANGES.map((r) => (
          <option key={r} value={r}>
            Last {r.replace('m', ' minutes').replace('h', ' hours').replace(/^1 hours/, '1 hour')}
          </option>
        ))}
      </select>
      <span className="text-muted">UTC</span>
    </label>
  );
}

function Panel({ panel }: { panel: PanelConfig }) {
  const store = useGame((s) => s.store);
  const timeRange = useGame((s) => s.timeRange);
  const editPanel = useGame((s) => s.editPanel);
  const removePanel = useGame((s) => s.removePanel);
  const state = useRangeQuery(store, panel.query, timeRange);
  return (
    <section className="flex flex-col rounded border border-line bg-panel" aria-label={`Panel ${panel.title}`}>
      <header className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <h3 className="truncate text-sm font-medium">{panel.title}</h3>
        <div className="flex gap-1">
          <button className="rounded px-2 py-0.5 text-xs text-muted hover:bg-panel-2 hover:text-ink" onClick={() => editPanel(panel.id)}>
            Edit
          </button>
          <button className="rounded px-2 py-0.5 text-xs text-muted hover:bg-panel-2 hover:text-bad" onClick={() => removePanel(panel.id)} aria-label={`Remove panel ${panel.title}`}>
            Remove
          </button>
        </div>
      </header>
      <div className="min-h-[220px] flex-1 p-2">
        <Visualization state={state} type={panel.type} unit={panel.unit} height={200} />
      </div>
    </section>
  );
}

export function PanelEditor() {
  const draft = useGame((s) => s.editing)!;
  const store = useGame((s) => s.store);
  const timeRange = useGame((s) => s.timeRange);
  const update = useGame((s) => s.updateDraft);
  const apply = useGame((s) => s.applyDraft);
  const discard = useGame((s) => s.discardDraft);
  const state = useRangeQuery(store, draft.query, timeRange);

  return (
    <div className="flex h-full flex-col gap-3" aria-label="Panel editor">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Edit panel</h2>
        <div className="flex items-center gap-2">
          <TimeRangePicker />
          <button className="rounded border border-line px-3 py-1 text-sm hover:bg-panel-2" onClick={discard}>
            Discard
          </button>
          <button className="rounded bg-accent px-3 py-1 text-sm font-medium text-canvas hover:brightness-110" onClick={apply}>
            Apply
          </button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_280px] gap-3">
        <div className="flex min-h-0 flex-col gap-3">
          <div className="min-h-[280px] rounded border border-line bg-panel p-2">
            <Visualization state={state} type={draft.type} unit={draft.unit} height={260} />
          </div>
          <div className="rounded border border-line bg-panel p-3">
            <div className="mb-1 text-xs font-medium text-muted">Query A · Metrics browser</div>
            <QueryEditor value={draft.query} onChange={(query) => update({ query })} onRun={(query) => update({ query })} label="Panel query" autoFocus />
          </div>
        </div>
        <aside className="flex flex-col gap-4 rounded border border-line bg-panel p-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Visualization</span>
            <select value={draft.type} onChange={(e) => update({ type: e.target.value as PanelType })} className="rounded border border-line bg-panel-2 px-2 py-1">
              {PANEL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Panel options · Title</span>
            <input value={draft.title} onChange={(e) => update({ title: e.target.value })} className="rounded border border-line bg-panel-2 px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Standard options · Unit</span>
            <select value={draft.unit} onChange={(e) => update({ unit: e.target.value as Unit })} className="rounded border border-line bg-panel-2 px-2 py-1">
              {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </label>
        </aside>
      </div>
    </div>
  );
}

export function Dashboard() {
  const panels = useGame((s) => s.panels);
  const editing = useGame((s) => s.editing);
  const newPanel = useGame((s) => s.newPanel);
  if (editing) return <PanelEditor />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">On-call overview</h2>
        <div className="flex items-center gap-3">
          <TimeRangePicker />
          <button className="rounded bg-accent px-3 py-1 text-sm font-medium text-canvas hover:brightness-110" onClick={newPanel}>
            Add panel
          </button>
        </div>
      </div>
      {panels.length ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {panels.map((p) => (
            <Panel key={p.id} panel={p} />
          ))}
        </div>
      ) : (
        <div className="grid h-64 place-items-center rounded border border-dashed border-line text-muted">
          This dashboard is empty. Click "Add panel" to start.
        </div>
      )}
    </div>
  );
}
