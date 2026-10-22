import { paths } from '../../games/grafana/paths';

export type Track = 'beginner' | 'experienced';

/** Inline `code` in strings is rendered as code. */
export type Block =
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { code: string; lang?: string }
  | { table: { head: string[]; rows: string[][] } }
  | { tip: string };

export interface Lesson {
  slug: string;
  title: string;
  track: Track;
  minutes: number;
  icon: string;
  summary: string;
  topics: string[];
  sections: { heading: string; blocks: Block[] }[];
  takeaways: string[];
  practice?: { label: string; to: string };
}

export const TRACKS: Record<Track, { title: string; audience: string; blurb: string }> = {
  beginner: {
    title: 'SRE Foundations',
    audience: 'New to SRE or IT',
    blurb: 'Start from zero: what SRE is, how reliability is measured, and the tools you will use every day.',
  },
  experienced: {
    title: 'Production SRE',
    audience: 'Already working in IT, DevOps or development',
    blurb: 'Go deeper: burn-rate alerting, advanced PromQL, Kubernetes failure modes, toil and chaos engineering.',
  },
};

export const LESSONS: Lesson[] = [
  {
    slug: 'what-is-sre',
    title: 'What is Site Reliability Engineering?',
    track: 'beginner',
    minutes: 6,
    icon: '🧭',
    summary: 'Where SRE came from, what SREs actually do all day, and how it relates to DevOps.',
    topics: ['Basics', 'Culture'],
    sections: [
      {
        heading: 'The short version',
        blocks: [
          { p: 'Site Reliability Engineering (SRE) applies software engineering to operations problems. Instead of keeping systems alive by hand, SREs write code, automation and policies that keep them reliable at scale.' },
          { p: 'Google started the discipline in 2003, when Ben Treynor Sloss was asked to run a production team. He staffed it with software engineers and gave them the job of making operations work like engineering.' },
        ],
      },
      {
        heading: 'What SREs do',
        blocks: [
          {
            ul: [
              'Define how reliable a service should be (SLOs) and measure it (SLIs).',
              'Build monitoring and alerting that tells humans about real user pain, not noise.',
              'Respond to incidents, then run blameless postmortems so the same failure does not repeat.',
              'Remove toil: the manual, repetitive work that grows with the size of the system.',
              'Plan capacity, review launches and make releases safer (canaries, rollbacks, feature flags).',
            ],
          },
          { tip: 'A common SRE rule: keep operational work under about 50% of the team’s time. The rest goes to engineering that makes operations smaller.' },
        ],
      },
      {
        heading: 'SRE vs DevOps',
        blocks: [
          { p: 'DevOps is a set of cultural ideas: break down silos, share ownership, automate, and measure. SRE is one concrete way to put those ideas into practice, with specific tools like SLOs, error budgets and toil budgets.' },
          {
            table: {
              head: ['', 'DevOps', 'SRE'],
              rows: [
                ['What it is', 'A culture and set of practices', 'A job role and an engineering discipline'],
                ['Reliability target', 'Often implicit', 'Explicit SLOs and error budgets'],
                ['Typical output', 'CI/CD pipelines, shared ownership', 'SLOs, alerting, automation, postmortems'],
              ],
            },
          },
        ],
      },
    ],
    takeaways: [
      'SRE = software engineering applied to operations.',
      'Reliability is a feature with a target, not "as high as possible".',
      'SREs spend a large share of their time building automation, not firefighting.',
    ],
    practice: { label: 'Try your first dashboard', to: paths.play(1) },
  },
  {
    slug: 'sli-slo-sla',
    title: 'SLIs, SLOs and SLAs',
    track: 'beginner',
    minutes: 8,
    icon: '🎯',
    summary: 'The three acronyms every SRE uses, how they differ, and what "three nines" really allows.',
    topics: ['SLOs', 'Reliability'],
    sections: [
      {
        heading: 'Definitions',
        blocks: [
          {
            ul: [
              'SLI (Service Level Indicator): a measurement of user experience, usually a ratio of good events to total events. Example: the share of HTTP requests that return non-5xx in under 300 ms.',
              'SLO (Service Level Objective): the target for an SLI over a window. Example: 99.9% of requests are good over 30 days.',
              'SLA (Service Level Agreement): a contract with customers, with consequences (refunds, credits) if it is missed. SLAs are set looser than SLOs so you get warned first.',
            ],
          },
        ],
      },
      {
        heading: 'Good SLIs measure what users feel',
        blocks: [
          { p: 'CPU usage is not an SLI: users do not feel CPU. They feel failed requests, slow pages and stale data. Common SLI types:' },
          {
            ul: [
              'Availability: good requests / all requests.',
              'Latency: requests faster than a threshold / all requests.',
              'Freshness: data updated within N minutes / all reads.',
              'Correctness: jobs with correct output / all jobs.',
            ],
          },
          { code: 'sum(rate(http_requests_total{status!~"5.."}[5m]))\n/\nsum(rate(http_requests_total[5m]))', lang: 'promql' },
        ],
      },
      {
        heading: 'What the nines allow (30-day window)',
        blocks: [
          {
            table: {
              head: ['SLO', 'Allowed bad time per 30 days'],
              rows: [
                ['99%', '7 h 12 min'],
                ['99.5%', '3 h 36 min'],
                ['99.9%', '43 min 12 s'],
                ['99.95%', '21 min 36 s'],
                ['99.99%', '4 min 19 s'],
              ],
            },
          },
          { tip: 'Each extra nine costs roughly 10x more engineering effort. Pick the lowest target your users are actually happy with.' },
        ],
      },
    ],
    takeaways: ['SLI = measurement, SLO = target, SLA = contract.', 'Measure what users experience, as a good/total ratio.', '99.9% over 30 days leaves about 43 minutes of failure.'],
    practice: { label: 'Practice: compute an error ratio', to: paths.challenge(7) },
  },
  {
    slug: 'error-budgets',
    title: 'Error budgets',
    track: 'beginner',
    minutes: 6,
    icon: '💰',
    summary: 'How a reliability target turns into a budget that balances shipping features against stability.',
    topics: ['SLOs', 'Culture'],
    sections: [
      {
        heading: 'The idea',
        blocks: [
          { p: 'If your SLO is 99.9%, then 0.1% of requests are allowed to fail. That 0.1% is your error budget. As long as budget remains, the team can ship fast and take risks. When it runs out, reliability work comes first.' },
          { p: 'This replaces arguments ("is it stable enough to release?") with data that product and engineering both agreed on in advance.' },
        ],
      },
      {
        heading: 'An error budget policy',
        blocks: [
          {
            ol: [
              'Budget healthy: normal releases, experiments allowed.',
              'Budget below 25%: extra review for risky changes, more canary time.',
              'Budget exhausted: freeze feature releases except fixes, and focus on reliability until the budget recovers.',
              'A single incident consumed more than 20% of the budget: a postmortem with action items is required.',
            ],
          },
        ],
      },
      {
        heading: 'Burn rate',
        blocks: [
          { p: 'Burn rate is how fast you spend the budget compared with the steady pace that would use exactly 100% in the window. A burn rate of 1 uses the whole 30-day budget in 30 days. A burn rate of 14.4 uses 2% of it in one hour, which is fast enough to wake someone up.' },
          { code: 'burn_rate = observed_error_ratio / (1 - SLO)\n# 99.9% SLO, 1.44% errors right now -> 0.0144 / 0.001 = 14.4', lang: 'text' },
        ],
      },
    ],
    takeaways: ['Error budget = 1 − SLO.', 'Spend it on releases and experiments; protect it when it runs low.', 'Burn rate tells you how urgent a problem is.'],
    practice: { label: 'Practice: find who is burning the budget', to: paths.challenge(13) },
  },
  {
    slug: 'monitoring-vs-observability',
    title: 'Monitoring vs observability',
    track: 'beginner',
    minutes: 7,
    icon: '🔭',
    summary: 'Metrics, logs and traces, what each is good at, and the tools you will meet.',
    topics: ['Observability'],
    sections: [
      {
        heading: 'Two related ideas',
        blocks: [
          { p: 'Monitoring answers known questions: is CPU high, are errors above 1%? Observability is the ability to answer new questions about a system from the data it emits, without shipping new code.' },
          { p: 'You need both: monitoring tells you something is wrong; observability helps you find out why.' },
        ],
      },
      {
        heading: 'The three signals',
        blocks: [
          {
            table: {
              head: ['Signal', 'What it is', 'Best for', 'Common tools'],
              rows: [
                ['Metrics', 'Numbers over time with labels', 'Dashboards, alerts, trends', 'Prometheus, Mimir, Grafana'],
                ['Logs', 'Timestamped text or JSON events', 'Details and error messages', 'Loki, Elasticsearch'],
                ['Traces', 'The path of one request across services', 'Finding slow hops in microservices', 'Tempo, Jaeger'],
              ],
            },
          },
          { tip: 'OpenTelemetry is the vendor-neutral standard for producing all three. Instrument once and send anywhere.' },
        ],
      },
      {
        heading: 'How they work together',
        blocks: [
          { ol: ['An alert fires on a metric (error rate is up).', 'A dashboard narrows it to one service and one time window.', 'Logs for that service and window show the error message.', 'A trace shows which downstream call is failing or slow.'] },
        ],
      },
    ],
    takeaways: ['Metrics for "what and when", logs for "what exactly", traces for "where".', 'Start with metrics; add logs and traces where you need detail.'],
    practice: { label: 'Explore real-looking metrics', to: paths.play(4) },
  },
  {
    slug: 'golden-signals',
    title: 'The four golden signals, RED and USE',
    track: 'beginner',
    minutes: 7,
    icon: '🚦',
    summary: 'Three checklists that tell you what to put on a dashboard, so you do not stare at 200 graphs.',
    topics: ['Observability', 'Dashboards'],
    sections: [
      {
        heading: 'The four golden signals',
        blocks: [
          { p: 'From the Google SRE book. If you can only measure four things about a user-facing system, measure these:' },
          { ul: ['Latency: how long requests take (track failed requests separately).', 'Traffic: how much demand, such as requests per second.', 'Errors: the rate of failed requests.', 'Saturation: how full the system is (CPU, memory, queue depth).'] },
        ],
      },
      {
        heading: 'RED for services',
        blocks: [
          { p: 'For every request-driven service, chart Rate, Errors and Duration. One row per service makes a great first dashboard.' },
          { code: '# Rate\nsum by (service) (rate(http_requests_total[5m]))\n# Errors\nsum by (service) (rate(http_requests_total{status=~"5.."}[5m]))\n# Duration (average)\nsum by (service) (rate(http_request_duration_seconds_sum[5m]))\n  / sum by (service) (rate(http_request_duration_seconds_count[5m]))', lang: 'promql' },
        ],
      },
      {
        heading: 'USE for resources',
        blocks: [{ p: 'For every resource (CPU, disk, network, memory), check Utilization, Saturation and Errors. Brendan Gregg’s USE method is the fastest way to rule hardware in or out during an incident.' }],
      },
    ],
    takeaways: ['Golden signals: latency, traffic, errors, saturation.', 'RED for services, USE for resources.', 'Good dashboards answer one question per panel.'],
    practice: { label: 'Practice: traffic per service', to: paths.challenge(2) },
  },
  {
    slug: 'prometheus-basics',
    title: 'Prometheus and PromQL basics',
    track: 'beginner',
    minutes: 10,
    icon: '🔥',
    summary: 'The Prometheus data model, the four metric types and the five PromQL patterns you will use most.',
    topics: ['Prometheus', 'PromQL'],
    sections: [
      {
        heading: 'Data model',
        blocks: [
          { p: 'Prometheus pulls (scrapes) metrics from targets every 15–60 seconds. Every series is a metric name plus labels, for example `http_requests_total{service="api", status="500"}`.' },
          { tip: 'Each unique label combination is a separate series. Never put user IDs or request IDs in labels; that is how you get a cardinality explosion.' },
        ],
      },
      {
        heading: 'Metric types',
        blocks: [
          {
            table: {
              head: ['Type', 'Behaviour', 'Example', 'Query with'],
              rows: [
                ['Counter', 'Only goes up (resets on restart)', '`http_requests_total`', '`rate()`, `increase()`'],
                ['Gauge', 'Goes up and down', '`memory_bytes`', 'Directly, `avg_over_time()`'],
                ['Histogram', 'Counts observations in buckets', '`..._bucket{le="0.5"}`', '`histogram_quantile()`'],
                ['Summary', 'Client-side quantiles', '`..._quantile`', 'Directly (cannot aggregate)'],
              ],
            },
          },
        ],
      },
      {
        heading: 'Five patterns to know',
        blocks: [
          { code: '# 1. Filter with label matchers (= != =~ !~)\nhttp_requests_total{service="api", status=~"5.."}\n\n# 2. Per-second rate of a counter\nrate(http_requests_total[5m])\n\n# 3. Aggregate, keeping one label\nsum by (service) (rate(http_requests_total[5m]))\n\n# 4. Ratio (error percentage)\nsum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))\n\n# 5. Top N\ntopk(3, memory_bytes)', lang: 'promql' },
          { tip: 'Always rate() first, then sum(). Summing raw counters breaks when any pod restarts.' },
        ],
      },
    ],
    takeaways: ['Series = metric name + labels.', 'Counters need rate(); gauges do not.', 'sum by (label) (rate(x[5m])) is the most useful query in PromQL.'],
    practice: { label: 'Practice: total requests per second', to: paths.challenge(1) },
  },
  {
    slug: 'linux-for-sre',
    title: 'Linux essentials for SRE',
    track: 'beginner',
    minutes: 9,
    icon: '🐧',
    summary: 'The commands you reach for in the first five minutes on a misbehaving server.',
    topics: ['Linux'],
    sections: [
      {
        heading: 'The first 60 seconds',
        blocks: [
          { code: 'uptime                 # load averages for 1, 5 and 15 minutes\ntop   (or htop)        # what is using CPU and memory right now\nfree -m                # memory: look at "available", not "free"\ndf -h                  # disk space per filesystem\ndu -sh /var/log/*      # what is filling a directory\nss -tulpn              # which process listens on which port\njournalctl -u nginx -n 100 --no-pager   # recent service logs\nsystemctl status nginx # is the service running? why did it stop?\ndmesg -T | tail        # kernel messages: OOM kills, disk errors', lang: 'bash' },
        ],
      },
      {
        heading: 'Reading load average',
        blocks: [
          { p: 'Load average counts processes that are running or waiting (for CPU, and on Linux also for disk I/O). Compare it with the number of CPUs (`nproc`). A load of 8 on a 16-core box is fine; on a 2-core box it is a queue.' },
          { tip: 'High load with low CPU usage usually means processes are stuck waiting on disk or network I/O. Check `iostat -x 1` or `vmstat 1`.' },
        ],
      },
      {
        heading: 'Common culprits',
        blocks: [
          {
            ul: [
              'Disk full: usually logs. Find with `du`, then fix rotation (`logrotate`) rather than just deleting.',
              'Deleted but open files still using space: `lsof +L1`.',
              'OOM killer: `dmesg` shows "Out of memory: Killed process".',
              'Port already in use: `ss -tulpn | grep :8080`.',
            ],
          },
        ],
      },
    ],
    takeaways: ['uptime, top, free, df, ss, journalctl and dmesg cover most first looks.', 'Compare load average with CPU count.', 'Fix causes (log rotation, limits), not just symptoms.'],
  },
  {
    slug: 'incident-response',
    title: 'Incident response and on-call',
    track: 'beginner',
    minutes: 8,
    icon: '🚨',
    summary: 'What to do when the pager goes off: roles, severity, and why you mitigate before you debug.',
    topics: ['Incidents', 'On-call'],
    sections: [
      {
        heading: 'Mitigate first',
        blocks: [
          { p: 'During an incident the goal is to stop user pain, not to understand everything. Roll back the deploy, fail over, scale up or turn off the feature flag first. Root cause comes later, in the postmortem.' },
        ],
      },
      {
        heading: 'Roles',
        blocks: [
          {
            ul: [
              'Incident Commander (IC): coordinates, decides and delegates. Does not debug.',
              'Operations lead: hands on keyboard, investigates and applies fixes.',
              'Communications lead: posts regular status updates to stakeholders and customers.',
              'Scribe: keeps a timeline of what was seen and done, which is gold for the postmortem.',
            ],
          },
        ],
      },
      {
        heading: 'A simple severity scale',
        blocks: [
          {
            table: {
              head: ['Severity', 'Meaning', 'Response'],
              rows: [
                ['SEV1', 'Major outage, many users affected or data at risk', 'Page now, all hands, updates every 30 min'],
                ['SEV2', 'Significant degradation or a key feature down', 'Page on-call, updates every hour'],
                ['SEV3', 'Minor issue, workaround exists', 'Ticket, fix during working hours'],
              ],
            },
          },
          { tip: 'Declare early, downgrade later. It is cheaper to stand down a SEV2 than to discover an hour in that it was a SEV1.' },
        ],
      },
    ],
    takeaways: ['Stop the bleeding before finding the cause.', 'Separate coordinating (IC) from fixing.', 'Communicate on a schedule, even when nothing has changed.'],
    practice: { label: 'Practice: who is throwing errors?', to: paths.challenge(13) },
  },
  {
    slug: 'blameless-postmortems',
    title: 'Blameless postmortems',
    track: 'beginner',
    minutes: 6,
    icon: '📝',
    summary: 'How to learn from incidents without blaming people, and a template you can reuse.',
    topics: ['Incidents', 'Culture'],
    sections: [
      {
        heading: 'Why blameless',
        blocks: [{ p: 'People act sensibly given the information and tools they had. If one command could take production down, the problem is the system that allowed it. Blame makes people hide mistakes, and hidden mistakes repeat.' }],
      },
      {
        heading: 'Template',
        blocks: [
          { ol: ['Summary: two or three sentences a director can read.', 'Impact: who was affected, for how long, how much error budget was spent.', 'Timeline: detection, key decisions, mitigation and resolution, with timestamps.', 'Root cause and contributing factors: there is rarely only one.', 'What went well, and where we got lucky.', 'Action items: specific, each with an owner and a due date.'] },
          { tip: '"Be more careful" is not an action item. "Add a confirmation step and a dry-run flag to the deploy script" is.' },
        ],
      },
    ],
    takeaways: ['Focus on systems, not individuals.', 'Every action item needs an owner and a date.', 'Share postmortems widely so other teams learn too.'],
    practice: { label: 'Practice: find when a slowdown started', to: paths.challenge(14) },
  },
  {
    slug: 'burn-rate-alerting',
    title: 'SLO burn-rate alerting',
    track: 'experienced',
    minutes: 10,
    icon: '🔥',
    summary: 'Multi-window, multi-burn-rate alerts: the approach from the Google SRE Workbook that pages on real budget burn and little else.',
    topics: ['SLOs', 'Alerting', 'PromQL'],
    sections: [
      {
        heading: 'Why not "error rate > 1% for 5m"?',
        blocks: [{ p: 'Threshold alerts are either too noisy (they page on brief blips that barely touch the budget) or too slow (they miss a steady 0.5% leak that burns the month’s budget in days). Burn-rate alerts page in proportion to how much budget is actually at risk.' }],
      },
      {
        heading: 'The recommended thresholds (30-day SLO)',
        blocks: [
          {
            table: {
              head: ['Budget consumed', 'Burn rate', 'Long window', 'Short window', 'Action'],
              rows: [
                ['2%', '14.4', '1 h', '5 min', 'Page'],
                ['5%', '6', '6 h', '30 min', 'Page'],
                ['10%', '1', '3 d', '6 h', 'Ticket'],
              ],
            },
          },
          { p: 'The long window proves the problem is significant; the short window proves it is still happening, so the alert resets quickly after a fix.' },
        ],
      },
      {
        heading: 'PromQL for a 99.9% SLO',
        blocks: [
          { code: '(\n  sum(rate(http_requests_total{status=~"5.."}[1h]))\n    / sum(rate(http_requests_total[1h])) > (14.4 * 0.001)\n)\nand\n(\n  sum(rate(http_requests_total{status=~"5.."}[5m]))\n    / sum(rate(http_requests_total[5m])) > (14.4 * 0.001)\n)', lang: 'promql' },
          { tip: 'Precompute the ratios with recording rules (e.g. `job:slo_errors:ratio_rate1h`) so alert evaluation stays cheap.' },
        ],
      },
    ],
    takeaways: ['Alert on budget burn, not raw thresholds.', 'Pair a long and a short window for every alert.', 'Fast burn pages a human; slow burn opens a ticket.'],
    practice: { label: 'Practice: error ratio per service', to: paths.challenge(7) },
  },
  {
    slug: 'alerting-best-practices',
    title: 'Alerting that people trust',
    track: 'experienced',
    minutes: 7,
    icon: '🔔',
    summary: 'Symptom-based alerts, runbooks, routing and how to kill alert fatigue.',
    topics: ['Alerting', 'On-call'],
    sections: [
      {
        heading: 'Rules of thumb',
        blocks: [
          {
            ul: [
              'Page on symptoms users feel (errors, latency, SLO burn), not causes (CPU at 90%).',
              'Every page must be actionable and urgent. If the response is "wait and see", it is a ticket.',
              'Every alert links to a runbook: what it means, how to check, how to mitigate.',
              'Use a `for:` duration to ignore one-scrape blips.',
              'Review every page weekly. Delete or tune alerts that fired without action.',
            ],
          },
        ],
      },
      {
        heading: 'Routing',
        blocks: [
          { p: 'In Grafana Alerting, contact points define where notifications go (PagerDuty, Slack, email) and notification policies route by labels. Alertmanager does the same with routes and receivers. Route `severity="critical"` to the pager, `severity="warning"` to a channel, and group related alerts so one outage sends one notification.' },
          { code: 'groups:\n  - name: api\n    rules:\n      - alert: HighErrorRate\n        expr: job:slo_errors:ratio_rate5m{service="api"} > 0.05\n        for: 5m\n        labels:\n          severity: critical\n        annotations:\n          summary: "api 5xx above 5% for 5 minutes"\n          runbook_url: https://runbooks.example.com/api/high-error-rate', lang: 'yaml' },
        ],
      },
    ],
    takeaways: ['Symptoms page, causes go on dashboards.', 'No runbook, no alert.', 'Alert fatigue is a reliability risk: tune relentlessly.'],
    practice: { label: 'Practice: filter hot nodes like an alert rule', to: paths.challenge(6) },
  },
  {
    slug: 'promql-advanced',
    title: 'Advanced PromQL',
    track: 'experienced',
    minutes: 10,
    icon: '🧮',
    summary: 'Percentiles from histograms, vector matching, recording rules and the mistakes that produce wrong graphs.',
    topics: ['PromQL', 'Prometheus'],
    sections: [
      {
        heading: 'Percentiles from histograms',
        blocks: [
          { code: 'histogram_quantile(\n  0.99,\n  sum by (le, service) (rate(http_request_duration_seconds_bucket[5m]))\n)', lang: 'promql' },
          { tip: 'Always keep `le` in the `by` clause. Drop it and histogram_quantile has nothing to work with.' },
        ],
      },
      {
        heading: 'Vector matching',
        blocks: [
          { p: 'Binary operators match series with identical labels. When the two sides have different labels, use `on(...)` to say which labels to match on, or `ignoring(...)` to say which to ignore. Use `group_left` when one side has many series per match (for example, joining pod metrics with pod metadata).' },
          { code: 'rate(http_requests_total{status="500"}[5m])\n  / ignoring(status)\nrate(http_requests_total{status="200"}[5m])', lang: 'promql' },
        ],
      },
      {
        heading: 'Recording rules and common mistakes',
        blocks: [
          { p: 'Name recording rules `level:metric:operations`, for example `service:http_requests:rate5m`. They make dashboards fast and alert rules readable.' },
          {
            ul: [
              '`rate(sum(x))` is wrong: sum first loses counter resets. Use `sum(rate(x[5m]))`.',
              'A range shorter than 2× the scrape interval gives gaps; use at least 4× (`[1m]` for 15 s scrapes).',
              'Averaging percentiles across instances is mathematically meaningless; aggregate buckets instead.',
              'Use `absent(up{job="api"})` to alert when a target disappears entirely.',
              'Use `predict_linear(node_filesystem_avail_bytes[6h], 4*3600) < 0` to warn before disks fill.',
            ],
          },
        ],
      },
    ],
    takeaways: ['histogram_quantile needs le.', 'Match labels explicitly with on/ignoring.', 'Recording rules for anything used often or in alerts.'],
    practice: { label: 'Practice: average latency per service', to: paths.challenge(11) },
  },
  {
    slug: 'kubernetes-for-sre',
    title: 'Kubernetes failure modes',
    track: 'experienced',
    minutes: 9,
    icon: '☸️',
    summary: 'CrashLoopBackOff, OOMKilled, failing probes and pending pods: what they mean and how to debug them.',
    topics: ['Kubernetes', 'Troubleshooting'],
    sections: [
      {
        heading: 'Debugging toolkit',
        blocks: [
          { code: 'kubectl get pods -o wide                 # status, restarts, node\nkubectl describe pod <pod>              # events, last state, exit code\nkubectl logs <pod> --previous           # logs from the crashed container\nkubectl get events --sort-by=.lastTimestamp\nkubectl top pod                         # live CPU and memory (metrics-server)\nkubectl rollout undo deploy/<name>      # fastest mitigation for a bad deploy', lang: 'bash' },
        ],
      },
      {
        heading: 'Common states',
        blocks: [
          {
            table: {
              head: ['Symptom', 'Usual meaning', 'First check'],
              rows: [
                ['CrashLoopBackOff', 'Container starts then exits, repeatedly', '`logs --previous`, bad config or missing secret'],
                ['OOMKilled (exit 137)', 'Hit its memory limit', 'Memory trend: leak or limit too low?'],
                ['Pending', 'Scheduler cannot place it', '`describe`: insufficient CPU/memory, taints, PVC'],
                ['ImagePullBackOff', 'Cannot fetch the image', 'Tag typo, registry credentials'],
                ['Running but 0/1 Ready', 'Readiness probe failing', 'Probe path, port and timeouts'],
              ],
            },
          },
        ],
      },
      {
        heading: 'Requests, limits and probes',
        blocks: [
          { ul: ['Requests are what the scheduler reserves; limits are the hard ceiling. Memory over the limit is killed, CPU over the limit is throttled.', 'Liveness probes restart a stuck container; readiness probes remove it from load balancing. A liveness probe that checks dependencies can turn a database blip into a restart storm.'] },
        ],
      },
    ],
    takeaways: ['describe + logs --previous solve most crashes.', 'Exit 137 means SIGKILL, usually OOM.', 'Keep liveness probes simple and local.'],
    practice: { label: 'Practice: hunt a memory leak', to: paths.challenge(15) },
  },
  {
    slug: 'toil-and-capacity',
    title: 'Toil, automation and capacity planning',
    track: 'experienced',
    minutes: 7,
    icon: '⚙️',
    summary: 'Recognising toil, deciding what to automate, and planning headroom before you run out.',
    topics: ['Automation', 'Capacity'],
    sections: [
      {
        heading: 'What counts as toil',
        blocks: [
          { p: 'Toil is work that is manual, repetitive, automatable, tactical, has no enduring value, and grows linearly with the service. Restarting a stuck worker every night is toil; designing the worker so it does not get stuck is engineering.' },
          { tip: 'Measure toil for two weeks (a simple ticket label is enough). The top three items are your automation backlog.' },
        ],
      },
      {
        heading: 'Capacity planning',
        blocks: [
          {
            ul: [
              'Know your limits: load-test to find the requests per second where latency SLOs break.',
              'Keep headroom: N+1 (survive losing one instance or zone) at peak, not at average.',
              'Forecast from organic growth plus known launches and seasonal peaks.',
              'Alert on trends: `predict_linear` on disk, memory and connection pools.',
            ],
          },
        ],
      },
    ],
    takeaways: ['Toil scales with traffic; engineering does not.', 'Plan for peak, with N+1 headroom.', 'Forecast with data, then verify with load tests.'],
    practice: { label: 'Practice: top 3 CPU pods', to: paths.challenge(9) },
  },
  {
    slug: 'chaos-engineering',
    title: 'Chaos engineering',
    track: 'experienced',
    minutes: 6,
    icon: '🧪',
    summary: 'Breaking things on purpose, safely, to find weaknesses before your users do.',
    topics: ['Resilience'],
    sections: [
      {
        heading: 'The method',
        blocks: [
          { ol: ['Define steady state with metrics (for example, the SLI is above 99.9%).', 'Form a hypothesis: "If one api pod dies, error rate stays under 0.1%."', 'Inject a real-world failure: kill a pod, add latency, fill a disk, block DNS.', 'Keep the blast radius small, and have an abort button.', 'Compare with steady state. Fix what broke, then automate the experiment.'] },
        ],
      },
      {
        heading: 'Getting started',
        blocks: [
          { p: 'Start with a game day in staging: a scheduled session where the team runs experiments together and watches dashboards. Tools such as Chaos Mesh, LitmusChaos, Gremlin and AWS Fault Injection Service automate experiments once you trust the process.' },
          { tip: 'If you already know something will break, do not run the experiment. Fix it first. Chaos is for finding the unknowns.' },
        ],
      },
    ],
    takeaways: ['Chaos is controlled experiments, not random breakage.', 'Start small and in staging; always have an abort.', 'Every finding becomes a fix or an alert.'],
    practice: { label: 'Practice: spot a short CPU spike', to: paths.challenge(10) },
  },
];

export function lessonsFor(track: Track): Lesson[] {
  return LESSONS.filter((l) => l.track === track);
}
