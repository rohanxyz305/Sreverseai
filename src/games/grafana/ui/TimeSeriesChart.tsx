import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import type { Unit } from '../engine/level';
import { formatLabels, type QueryResult } from '../engine/types';
import { formatValue, PALETTE } from './format';

interface Props {
  result: QueryResult;
  unit: Unit;
  height: number;
}

function seriesLabel(labels: Record<string, string>): string {
  return Object.keys(labels).length ? formatLabels(labels) : 'value';
}

export function TimeSeriesChart({ result, unit, height }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const data: uPlot.AlignedData = [
      result.timestamps,
      ...result.series.map((s) => s.values.map((v) => (v === null || !Number.isFinite(v) ? null : v))),
    ];
    const axis: uPlot.Axis = {
      stroke: '#9fa1ad',
      grid: { stroke: '#2c3235', width: 1 },
      ticks: { stroke: '#2c3235', width: 1 },
    };
    const opts: uPlot.Options = {
      width: Math.max(200, el.clientWidth),
      height,
      tzDate: (ts) => uPlot.tzDate(new Date(ts * 1000), 'Etc/UTC'),
      cursor: { drag: { x: false, y: false } },
      legend: { live: true },
      scales: { x: { time: true } },
      axes: [
        { ...axis, values: (_u, splits) => splits.map((t) => new Date(t * 1000).toISOString().slice(11, 16)) },
        { ...axis, size: 70, values: (_u, splits) => splits.map((v) => formatValue(v, unit)) },
      ],
      series: [
        { label: 'Time (UTC)' },
        ...result.series.map((s, i) => ({
          label: seriesLabel(s.labels),
          stroke: PALETTE[i % PALETTE.length],
          width: 1.5,
          value: (_u: uPlot, v: number | null) => formatValue(v, unit),
          points: { show: false },
        })),
      ],
    };
    const plot = new uPlot(opts, data, el);
    const ro = new ResizeObserver(() => plot.setSize({ width: Math.max(200, el.clientWidth), height }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      plot.destroy();
    };
  }, [result, unit, height]);

  return <div ref={host} className="w-full" role="img" aria-label={`Time series chart with ${result.series.length} series`} />;
}
