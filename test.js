import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const API_KEY  = 'sonic-key';
const BASE_URL = 'http://localhost:3000';

const hits200  = new Counter('responses_200');
const hits429  = new Counter('responses_429');

const deniedByPlan     = new Counter('denied_by_plan');
const deniedByIp       = new Counter('denied_by_ip');
const deniedByUser     = new Counter('denied_by_user');
const deniedByFallback = new Counter('denied_by_fallback');

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  stages: [
    { duration: '10s', target: 10 },
    { duration: '10s', target: 20 },
    { duration: '10s', target: 30 },
    { duration: '10s', target: 40 },
    { duration: '10s', target: 50 },
    { duration: '10s', target: 60 },
    { duration: '10s', target: 70 },
    { duration: '10s', target: 80 },
    { duration: '10s', target: 90 },
    { duration: '10s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

const PARAMS = {
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    'x-client-name': 'k6-Chaos-Tester',
  },
  timeout: '5s',
};

export default function () {
  // Stable per virtual-user identity — same IP/user across all of this
  // VU's requests, so IP-level and user-level limits actually get exercised
  // instead of looking like a fresh client on every single request.
  const userId = `user_${__VU}`;
  const ip     = `10.0.0.${__VU % 255}`;

  const body = JSON.stringify({ userId, ip });
  const res = http.post(`${BASE_URL}/api/check`, body, PARAMS);

  if (res.status === 200) {
    hits200.add(1);
  } else if (res.status === 429) {
    hits429.add(1);

    let deniedBy;
    try {
      deniedBy = res.json('deniedBy');
    } catch (e) {
      deniedBy = undefined;
    }

    if (deniedBy === 'plan') deniedByPlan.add(1);
    else if (deniedBy === 'ip') deniedByIp.add(1);
    else if (deniedBy === 'user') deniedByUser.add(1);
    else if (deniedBy === 'fallback') deniedByFallback.add(1);
  }

  check(res, {
    '✓ no crash (not 5xx)':        (r) => r.status < 500,
    '✓ valid response (200/429)':  (r) => r.status === 200 || r.status === 429,
    '✓ has RateLimit headers':     (r) => r.headers['X-Ratelimit-Remaining'] !== undefined || r.headers['X-RateLimit-Remaining'] !== undefined,
  });
}

export function handleSummary(data) {
  const dur   = data.metrics.http_req_duration?.values;
  const reqs  = data.metrics.http_reqs?.values;
  const r200  = data.metrics.responses_200?.values?.count ?? 0;
  const r429  = data.metrics.responses_429?.values?.count ?? 0;
  const total = reqs?.count ?? 0;
  const rps   = reqs?.rate?.toFixed(0) ?? '?';

  const byIp       = data.metrics.denied_by_ip?.values?.count ?? 0;
  const byUser     = data.metrics.denied_by_user?.values?.count ?? 0;
  const byPlan     = data.metrics.denied_by_plan?.values?.count ?? 0;
  const byFallback = data.metrics.denied_by_fallback?.values?.count ?? 0;

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(  '║          RATESHIELD — BENCHMARK RESULTS              ║');
  console.log(  '╠══════════════════════════════════════════════════════╣');
  console.log(`  Total Requests     : ${total}`);
  console.log(`  Peak RPS           : ${rps} req/s`);
  console.log(`  ────────────────────────────────────────────────────`);
  console.log(`  Avg Latency        : ${dur?.avg?.toFixed(2)} ms`);
  console.log(`  Median Latency     : ${dur?.med?.toFixed(2)} ms`);
  console.log(`  p90 Latency        : ${dur?.['p(90)']?.toFixed(2)} ms`);
  console.log(`  p95 Latency        : ${dur?.['p(95)']?.toFixed(2)} ms`);
  console.log(`  p99 Latency        : ${dur?.['p(99)']?.toFixed(2)} ms`);
  console.log(`  ────────────────────────────────────────────────────`);
  console.log(`  200 Allowed        : ${r200} (${total ? ((r200/total)*100).toFixed(1) : '0.0'}%)`);
  console.log(`  429 Rate Limited   : ${r429} (${total ? ((r429/total)*100).toFixed(1) : '0.0'}%)`);
  console.log(`  ────────────────────────────────────────────────────`);
  console.log(`  Denied by IP       : ${byIp}`);
  console.log(`  Denied by User     : ${byUser}`);
  console.log(`  Denied by Plan     : ${byPlan}`);
  console.log(`  Denied by Fallback : ${byFallback}`);
  console.log(  '╚══════════════════════════════════════════════════════╝\n');
  return {};
}