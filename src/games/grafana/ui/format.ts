import type { Unit } from '../engine/level';

/** Okabe-Ito based palette: distinguishable with the common forms of colour blindness. */
export const PALETTE = ['#56B4E9', '#E69F00', '#009E73', '#F0E442', '#CC79A7', '#D55E00', '#7aa5ff', '#bbbbbb'];

function sig(v: number, digits = 3): string {
  return Number(v.toPrecision(digits)).toString();
}

export function formatValue(v: number | null | undefined, unit: Unit): string {
  if (v === null || v === undefined) return '-';
  if (Number.isNaN(v)) return 'NaN';
  if (!Number.isFinite(v)) return v > 0 ? '+Inf' : '-Inf';
  switch (unit) {
    case 'percent':
      return `${v.toFixed(1)}%`;
    case 'bytes': {
      const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
      let i = 0;
      let x = Math.abs(v);
      while (x >= 1024 && i < units.length - 1) {
        x /= 1024;
        i++;
      }
      return `${v < 0 ? '-' : ''}${x.toFixed(i ? 1 : 0)} ${units[i]}`;
    }
    case 'reqps':
      return `${sig(v)} req/s`;
    case 's':
      return Math.abs(v) < 1 ? `${sig(v * 1000)} ms` : `${sig(v)} s`;
    case 'none': {
      const a = Math.abs(v);
      if (a >= 1e9) return `${sig(v / 1e9)} Bil`;
      if (a >= 1e6) return `${sig(v / 1e6)} Mil`;
      if (a >= 1e3) return `${sig(v / 1e3)} K`;
      return sig(v);
    }
  }
}

export function formatClockUTC(t: number): string {
  return new Date(t * 1000).toISOString().slice(11, 19);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Last non-null value of a series. */
export function lastValue(values: (number | null)[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) if (values[i] !== null) return values[i];
  return null;
}
