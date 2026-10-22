export interface Term {
  term: string;
  definition: string;
  /** Slug of a lesson that explains it. */
  lesson?: string;
}

export const GLOSSARY: Term[] = [
  { term: 'Alert fatigue', definition: 'When so many alerts fire that on-call engineers start ignoring them, including the important ones.', lesson: 'alerting-best-practices' },
  { term: 'Availability', definition: 'The share of time or requests a service works correctly, usually expressed as a percentage like 99.9%.', lesson: 'sli-slo-sla' },
  { term: 'Blameless postmortem', definition: 'A written review of an incident that focuses on how the system allowed the failure, not on who made a mistake.', lesson: 'blameless-postmortems' },
  { term: 'Blast radius', definition: 'How much of the system or user base a failure, change or experiment can affect.', lesson: 'chaos-engineering' },
  { term: 'Burn rate', definition: 'How fast the error budget is being consumed relative to the pace that would use exactly all of it over the SLO window.', lesson: 'burn-rate-alerting' },
  { term: 'Canary release', definition: 'Rolling a change out to a small share of traffic first and comparing its metrics with the old version before going wide.' },
  { term: 'Cardinality', definition: 'The number of unique time series a metric produces. High-cardinality labels (user IDs, URLs) can overload a metrics system.', lesson: 'prometheus-basics' },
  { term: 'Chaos engineering', definition: 'Running controlled experiments that inject failures to discover weaknesses before they cause outages.', lesson: 'chaos-engineering' },
  { term: 'Counter', definition: 'A metric that only increases (except when it resets on restart), such as total requests. Query it with rate() or increase().', lesson: 'prometheus-basics' },
  { term: 'CrashLoopBackOff', definition: 'A Kubernetes state where a container keeps crashing and the kubelet waits longer between each restart.', lesson: 'kubernetes-for-sre' },
  { term: 'Error budget', definition: 'The amount of unreliability an SLO allows (1 − SLO). Teams spend it on releases and experiments.', lesson: 'error-budgets' },
  { term: 'Gauge', definition: 'A metric that can go up or down, such as memory in use or queue length.', lesson: 'prometheus-basics' },
  { term: 'Golden signals', definition: 'Latency, traffic, errors and saturation: the four metrics Google recommends for any user-facing system.', lesson: 'golden-signals' },
  { term: 'Histogram', definition: 'A metric type that counts observations into buckets, allowing percentiles to be computed with histogram_quantile().', lesson: 'promql-advanced' },
  { term: 'Incident Commander', definition: 'The person who coordinates an incident response: sets priorities, delegates and owns communication. They do not debug.', lesson: 'incident-response' },
  { term: 'Liveness probe', definition: 'A Kubernetes health check that restarts a container when it fails.', lesson: 'kubernetes-for-sre' },
  { term: 'Load average', definition: 'The average number of processes running or waiting to run over 1, 5 and 15 minutes. Compare it with the CPU count.', lesson: 'linux-for-sre' },
  { term: 'MTTR', definition: 'Mean time to recovery (or restore): the average time from an incident starting to service being restored.' },
  { term: 'Observability', definition: 'The ability to understand a system’s internal state from the data it emits (metrics, logs, traces), including for questions you did not plan for.', lesson: 'monitoring-vs-observability' },
  { term: 'OOMKilled', definition: 'A container killed for exceeding its memory limit. In Kubernetes it shows exit code 137.', lesson: 'kubernetes-for-sre' },
  { term: 'OpenTelemetry', definition: 'A vendor-neutral, open standard and set of SDKs for producing metrics, logs and traces.', lesson: 'monitoring-vs-observability' },
  { term: 'PromQL', definition: 'The query language of Prometheus, used for dashboards, alerts and recording rules.', lesson: 'prometheus-basics' },
  { term: 'RED method', definition: 'Rate, Errors, Duration: three metrics to chart for every request-driven service.', lesson: 'golden-signals' },
  { term: 'Readiness probe', definition: 'A Kubernetes health check that removes a pod from load balancing while it fails, without restarting it.', lesson: 'kubernetes-for-sre' },
  { term: 'Recording rule', definition: 'A Prometheus rule that precomputes an expensive query and stores it as a new series.', lesson: 'promql-advanced' },
  { term: 'Runbook', definition: 'Step-by-step instructions for diagnosing and mitigating a specific alert or failure.', lesson: 'alerting-best-practices' },
  { term: 'Saturation', definition: 'How full a resource is, such as CPU run queue, memory pressure or connection pool usage.', lesson: 'golden-signals' },
  { term: 'SLA', definition: 'Service Level Agreement: a contract with customers that has consequences if reliability targets are missed.', lesson: 'sli-slo-sla' },
  { term: 'SLI', definition: 'Service Level Indicator: a measurement of user experience, usually good events divided by total events.', lesson: 'sli-slo-sla' },
  { term: 'SLO', definition: 'Service Level Objective: a target for an SLI over a time window, such as 99.9% of requests succeeding over 30 days.', lesson: 'sli-slo-sla' },
  { term: 'Toil', definition: 'Manual, repetitive, automatable operational work with no lasting value that grows as the service grows.', lesson: 'toil-and-capacity' },
  { term: 'USE method', definition: 'Utilization, Saturation, Errors: a checklist for every hardware or software resource.', lesson: 'golden-signals' },
];
