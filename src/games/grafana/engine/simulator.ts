import { Rng } from './rng';
import { MetricStore } from './store';

export const SCRAPE_INTERVAL = 15;
export const RETENTION = 6 * 3600;
/** Fixed virtual "now" so every level is reproducible. Displayed in UTC. */
export const SIM_END = Date.UTC(2026, 9, 22, 12, 0, 0) / 1000;
export const SIM_START = SIM_END - RETENTION;

export type IncidentType = 'cpu_spike' | 'memory_leak' | 'error_burst' | 'latency_jump' | 'traffic_spike';

export interface Incident {
  type: IncidentType;
  /** A service, pod or node name. */
  target: string;
  /** Minutes before SIM_END that the incident starts. */
  startMin: number;
  /** Omit for an incident that is still ongoing. */
  durationMin?: number;
  /**
   * cpu_spike: extra CPU percent (default 45). memory_leak: MiB per minute (default 2).
   * error_burst: 5xx ratio (default 0.25). latency_jump / traffic_spike: multiplier (default 4 / 3).
   */
  magnitude?: number;
}

export interface Scenario {
  incidents: Incident[];
}

interface ServiceSpec {
  name: string;
  /** Requests per second per pod at the daily average. */
  baseRps: number;
  medianLatency: number;
  memMiB: number;
  cpuPerRps: number;
}

export const SERVICES: ServiceSpec[] = [
  { name: 'frontend', baseRps: 40, medianLatency: 0.08, memMiB: 180, cpuPerRps: 0.6 },
  { name: 'api', baseRps: 25, medianLatency: 0.12, memMiB: 320, cpuPerRps: 1.2 },
  { name: 'payments', baseRps: 6, medianLatency: 0.25, memMiB: 260, cpuPerRps: 4 },
];
export const NODES = ['node-a', 'node-b'];
export const PODS = SERVICES.flatMap((svc) =>
  NODES.map((node, i) => ({ service: svc.name, pod: `${svc.name}-${i + 1}`, node, spec: svc })),
);

const METHODS: [string, number][] = [
  ['GET', 0.75],
  ['POST', 0.25],
];
const STATUSES = ['200', '404', '500'];
const BASE_5XX = 0.004;
const BASE_404 = 0.015;
const LATENCY_SIGMA = 0.5;
export const LATENCY_BUCKETS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, Infinity];
const MiB = 1024 * 1024;

const DEFAULT_MAGNITUDE: Record<IncidentType, number> = {
  cpu_spike: 45,
  memory_leak: 2,
  error_burst: 0.25,
  latency_jump: 4,
  traffic_spike: 3,
};

function normalCdf(x: number): number {
  // Abramowitz-Stegun 7.1.26
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

/** Generates 6 h of scrape data for the simulated stack, with incidents injected. */
export function simulate(seed: number, scenario: Scenario = { incidents: [] }): MetricStore {
  const rng = new Rng(seed);
  const n = RETENTION / SCRAPE_INTERVAL + 1;
  const store = new MetricStore(SIM_START, SCRAPE_INTERVAL, n);

  const incidents = scenario.incidents.map((inc) => {
    const start = SIM_END - inc.startMin * 60;
    const end = inc.durationMin === undefined ? Infinity : start + inc.durationMin * 60;
    return { ...inc, start, end, mag: inc.magnitude ?? DEFAULT_MAGNITUDE[inc.type] };
  });
  /** Active incidents of a type that hit any of the given names at time t. */
  const active = (type: IncidentType, names: string[], t: number) =>
    incidents.filter((inc) => inc.type === type && names.includes(inc.target) && t >= inc.start && t < inc.end);

  const daily = (t: number) => 1 + 0.3 * Math.sin((2 * Math.PI * t) / 86400 - 1.2);

  // [pod][method][status] counter buffers.
  const req = PODS.map(() => METHODS.map(() => STATUSES.map(() => new Float64Array(n))));
  const podCpu = PODS.map(() => new Float64Array(n));
  const podMem = PODS.map(() => new Float64Array(n));
  const nodeCpu = NODES.map(() => new Float64Array(n));
  const svcReqPerStep = SERVICES.map(() => new Float64Array(n));
  const dbConn = new Float64Array(n);

  // Counters start mid-life rather than at zero.
  const counters = PODS.map((p) =>
    METHODS.map(([, share]) =>
      [1, BASE_404, BASE_5XX].map((ratio) => Math.round(p.spec.baseRps * share * 86400 * ratio * (0.5 + rng.next()))),
    ),
  );
  const memJitter = PODS.map(() => 0.9 + rng.next() * 0.2);

  for (let i = 0; i < n; i++) {
    const t = store.timestampAt(i);
    const nodeLoad = NODES.map(() => 0);

    PODS.forEach((p, pi) => {
      const names = [p.service, p.pod, p.node];
      let traffic = 1;
      for (const inc of active('traffic_spike', names, t)) traffic *= inc.mag;
      const rps = Math.max(0, p.spec.baseRps * daily(t) * traffic * (1 + 0.06 * rng.gauss()));

      let ratio5xx = BASE_5XX;
      for (const inc of active('error_burst', names, t)) ratio5xx = Math.max(ratio5xx, inc.mag);

      METHODS.forEach(([, share], mi) => {
        const total = rps * share * SCRAPE_INTERVAL;
        const c5xx = rng.roundStochastic(total * ratio5xx);
        const c404 = rng.roundStochastic(total * BASE_404);
        const c200 = Math.max(0, rng.roundStochastic(total) - c5xx - c404);
        const st = counters[pi][mi];
        st[0] += c200;
        st[1] += c404;
        st[2] += c5xx;
        STATUSES.forEach((_, si) => (req[pi][mi][si][i] = st[si]));
        svcReqPerStep[SERVICES.indexOf(p.spec)][i] += c200 + c404 + c5xx;
      });

      let cpu = 8 + rps * p.spec.cpuPerRps * (1 + 0.05 * rng.gauss());
      for (const inc of active('cpu_spike', [p.service, p.pod], t)) cpu += inc.mag;
      podCpu[pi][i] = Math.min(100, Math.max(0, cpu));
      nodeLoad[NODES.indexOf(p.node)] += podCpu[pi][i];

      let mem = p.spec.memMiB * memJitter[pi] * (1 + 0.01 * rng.gauss()) * MiB;
      for (const inc of active('memory_leak', [p.service, p.pod], t)) mem += ((t - inc.start) / 60) * inc.mag * MiB;
      podMem[pi][i] = Math.round(mem);
    });

    NODES.forEach((node, ni) => {
      let cpu = 10 + 0.35 * nodeLoad[ni] + 1.5 * rng.gauss();
      for (const inc of active('cpu_spike', [node], t)) cpu += inc.mag;
      nodeCpu[ni][i] = Math.min(100, Math.max(0, cpu));
    });

    const apiRps = svcReqPerStep[1][i] / SCRAPE_INTERVAL;
    dbConn[i] = Math.max(1, Math.round(12 + apiRps * 0.4 + 2 * rng.gauss()));
  }

  PODS.forEach((p, pi) => {
    METHODS.forEach(([method], mi) => {
      STATUSES.forEach((status, si) => {
        store.add(
          { __name__: 'http_requests_total', service: p.service, pod: p.pod, node: p.node, method, status },
          req[pi][mi][si],
        );
      });
    });
  });
  PODS.forEach((p, pi) => store.add({ __name__: 'pod_cpu_usage', service: p.service, pod: p.pod, node: p.node }, podCpu[pi]));
  PODS.forEach((p, pi) => store.add({ __name__: 'memory_bytes', service: p.service, pod: p.pod, node: p.node }, podMem[pi]));
  NODES.forEach((node, ni) => store.add({ __name__: 'node_cpu_usage', node }, nodeCpu[ni]));
  store.add({ __name__: 'db_connections_active', instance: 'db-0' }, dbConn);

  // Latency histogram per service, consistent with the request counters above.
  // Buckets are cumulative (le="+Inf" equals _count), as in real Prometheus.
  SERVICES.forEach((svc, si) => {
    const buckets = LATENCY_BUCKETS.map(() => new Float64Array(n));
    const count = new Float64Array(n);
    const sum = new Float64Array(n);
    const cum = LATENCY_BUCKETS.map(() => 0);
    let cCount = 0;
    let cSum = 0;
    for (let i = 0; i < n; i++) {
      const t = store.timestampAt(i);
      let median = svc.medianLatency;
      for (const inc of active('latency_jump', [svc.name], t)) median *= inc.mag;
      if (active('error_burst', [svc.name], t).length) median *= 1.5;
      const reqs = svcReqPerStep[si][i];
      LATENCY_BUCKETS.forEach((le, bi) => {
        const frac = le === Infinity ? 1 : normalCdf((Math.log(le) - Math.log(median)) / LATENCY_SIGMA);
        cum[bi] += Math.round(reqs * frac);
        buckets[bi][i] = cum[bi];
      });
      cCount += reqs;
      cSum += reqs * median * Math.exp((LATENCY_SIGMA * LATENCY_SIGMA) / 2);
      count[i] = cCount;
      sum[i] = cSum;
    }
    LATENCY_BUCKETS.forEach((le, bi) =>
      store.add(
        { __name__: 'http_request_duration_seconds_bucket', service: svc.name, le: le === Infinity ? '+Inf' : String(le) },
        buckets[bi],
      ),
    );
    store.add({ __name__: 'http_request_duration_seconds_count', service: svc.name }, count);
    store.add({ __name__: 'http_request_duration_seconds_sum', service: svc.name }, sum);
  });

  return store;
}
