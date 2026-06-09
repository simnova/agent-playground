#!/usr/bin/env node
/**
 * Dev Server Guardian for agent-driven long sessions.
 *
 * Purpose: Keep the api + staff + public dev servers alive despite the harness
 * killing background tasks after ~60s. Uses detached child processes + restart loops.
 *
 * Hardened for PO Brief 6 (019eaa3e-b561-7aa3-b2fd-4013b1629bf7): longer auto-restart
 * windows (backoff), built-in health poll (periodic + GQL probe for api) writing
 * /tmp/agent-dev-guard/health.json for @e count hooks + readiness, explicit
 * public/Epic-5 mode (PUBLIC_ONLY=1 / --public / EPIC5=1), reduced harness kill
 * impact (better detach, signal handling, final health write, keepalive). Aligned to
 * browser-verifier persona (resilience protocol, public/Epic-5 on grok-4-fast, bg/monitor/pkill/direct
 * + hygiene/curl after 2 errs) + AGENTS.md long-session notes + harness reality.
 *
 * Usage (from repo root):
 *   node scripts/guard-dev-servers.js
 *   PUBLIC_ONLY=1 node scripts/guard-dev-servers.js   # or --public
 *   pnpm dev:agent
 *   pnpm dev:agent --public   # (if script updated in package for alias)
 *
 * Recommended for 30m+ agent work, browser-verifier runs (esp. public/Epic-5),
 * or the "1h15m uninterrupted analysis test". Direct ports (no portless).
 *
 * Servers:
 *   - API:    http://localhost:4000/graphql   (bun --hot, PORT=4000)
 *   - Public: http://localhost:5173           (vite, VITE_GRAPHQL_URL set)
 *   - Staff:  http://localhost:5174           (vite)  [skipped in public/Epic-5 mode]
 *
 * Attach pattern (browser-verifier public higher sustained @e, less immediate fallback):
 *   1. pnpm dev:agent:kill || true
 *   2. run_terminal_command( {command: 'PUBLIC_ONLY=1 pnpm dev:agent', background: true} )
 *   3. monitor on the task (persistent:true) for health curls + GraphQL
 *   4. Immediately: while :; do curl -sI http://localhost:4000 http://localhost:5173; cat /tmp/agent-dev-guard/health.json | head -30; sleep 8; done
 *   5. When health.json shows sustained checks>3 + public healthy: agent-browser open https://public.localhost ; snapshot -i (for @e); ...
 *   On repeated deaths: pkill -f 'bun|vite|guard' ; after 2: immediate hygiene+curl fallback (never loop). Report "Public browser @e coverage: N; hygiene: M (PASSED 20000 case); harness limit noted; guardian restarts: X".
 *
 * On harness kill of this guardian, children may also be reaped.
 * The browser-verifier / orchestrator MUST still follow full protocol: pkill + relaunch + monitor + hygiene fallback.
 * This hardening increases sustained windows (target 3-5min+ per Brief 6) + public verif yield.
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const LOG_DIR = '/tmp/agent-dev-guard';
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// PO Brief 6 hardening (parallel cheap back-end for public depth):
// explicit public/Epic-5 mode so browser-verifier (grok-4-fast) on public achieves
// higher sustained coverage with less immediate fallback to hygiene (per persona + AGENTS).
// Built-in health poll writes health.json as hook point for @e counts/readiness in
// verifier runs + agent-evaluator (kills/restarts/fallbacks tracked as 1st-class).
const IS_PUBLIC_EPIC5 =
  process.env.PUBLIC_ONLY === '1' ||
  process.env.EPIC5 === '1' ||
  process.env.MODE === 'public-epic5' ||
  process.argv.includes('--public') ||
  process.argv.includes('--epic5');
const HEALTH_POLL_INTERVAL_MS = IS_PUBLIC_EPIC5 ? 10000 : 15000; // tighter for public @e yield
const RESTART_BASE_MS = 2000; // longer initial window than old 1s fixed; + backoff

const serverHealth = {}; // live status for health.json (built-in poll for @e hooks)

function writeHealthFile() {
  try {
    const payload = {
      updated: Date.now(),
      mode: IS_PUBLIC_EPIC5 ? 'public-epic5' : 'full',
      note: 'Built-in health poll (Brief 6). Use for browser-verifier @e count hooks + readiness before public/Epic-5 snapshot-i/fill. cat this + curls to decide: full @e or hygiene fallback. Aligns AGENTS + browser-verifier.toml resilience.',
      servers: serverHealth,
      attachPattern: 'bg launch: PUBLIC_ONLY=1 pnpm dev:agent (or --public); monitor task; poll: curl :4000 :5173 + cat /tmp/agent-dev-guard/health.json; pkill on death (2x -> hygiene+curl). Report public @e coverage + guardian restarts + hygiene passes.',
      harnessNote: 'Reduces ~60s kill impact via backoff, periodic GQL/root polls, sustained logs, final health on SIGTERM.'
    };
    fs.writeFileSync(path.join(LOG_DIR, 'health.json'), JSON.stringify(payload, null, 2));
  } catch (e) { /* best effort */ }
}

function updateServerHealth(name, patch) {
  const prev = serverHealth[name] || { restarts: 0, checks: 0, lastHealthy: null, status: 'unknown' };
  serverHealth[name] = { ...prev, ...patch, updated: Date.now() };
  writeHealthFile();
}

function performHealthCheck(server, isInitial) {
  const http = require('http');
  const t0 = Date.now();
  const label = isInitial ? 'initial' : 'poll';

  if (server.name === 'api') {
    // Real GQL probe (not just root) for backend readiness — gives browser-verifier
    // higher confidence for public @e (projections/apply/live preview) before snapshot.
    const postData = JSON.stringify({ query: '{ __typename hello }' });
    const req = http.request({
      hostname: 'localhost',
      port: server.port,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        const ok = res.statusCode < 500 && (body.includes('__typename') || body.includes('"hello"') || body.includes('Query'));
        const status = ok ? 'healthy-gql' : 'degraded';
        const latency = Date.now() - t0;
        console.log(`[guard] ${server.name} ${label} ${status} (status ${res.statusCode}, ${latency}ms)`);
        if (ok) {
          const prev = serverHealth[server.name] || {};
          updateServerHealth(server.name, {
            status,
            lastHealthy: Date.now(),
            checks: (prev.checks || 0) + 1,
            lastLatencyMs: latency
          });
          const c = (serverHealth[server.name] || {}).checks || 0;
          if (c > 2) {
            console.log(`[guard] ${server.name} SUSTAINED (${c} polls, restarts=${serverHealth[server.name].restarts || 0}) — PUBLIC/Epic-5 browser-verifier: ready for @e (higher coverage, delay fallback). See health.json`);
          }
        }
      });
    });
    req.on('error', (e) => {
      console.log(`[guard] ${server.name} ${label} error: ${e.message}`);
      updateServerHealth(server.name, { status: 'error', lastError: String(e.message) });
    });
    req.setTimeout(3000, () => req.destroy());
    req.write(postData);
    req.end();
  } else {
    // Vite apps: root HTML 200 is sufficient signal (serves the live src with @e data-refs)
    const req = http.get(`http://localhost:${server.port}`, (res) => {
      const ok = res.statusCode < 500;
      const latency = Date.now() - t0;
      console.log(`[guard] ${server.name} ${label} ${ok ? 'healthy' : 'degraded'} (status ${res.statusCode}, ${latency}ms)`);
      if (ok) {
        const prev = serverHealth[server.name] || {};
        updateServerHealth(server.name, {
          status: 'healthy',
          lastHealthy: Date.now(),
          checks: (prev.checks || 0) + 1,
          lastLatencyMs: latency
        });
        const c = (serverHealth[server.name] || {}).checks || 0;
        if (c > 2 && IS_PUBLIC_EPIC5 && server.name === 'public') {
          console.log(`[guard] PUBLIC SUSTAINED (${c} polls) for Epic-5 @e — browser-verifier (grok-4-fast): proceed with open public.localhost + snapshot -i now. Fewer immediate fallbacks thanks to guardian health.`);
        }
      }
    });
    req.on('error', (e) => {
      updateServerHealth(server.name, { status: 'error', lastError: String(e.message) });
    });
    req.setTimeout(2500, () => req.destroy());
  }
}

const servers = [
  {
    name: 'api',
    cmd: 'bun',
    args: ['--hot', 'src/index.ts'],
    cwd: path.join(__dirname, '..', 'apps', 'api'),
    env: { PORT: '4000', ...process.env },
    log: path.join(LOG_DIR, 'api.log'),
    port: 4000,
  },
  {
    name: 'public',
    cmd: 'pnpm',
    args: ['exec', 'vite', '--', '--port', '5173', '--host', 'localhost'],
    cwd: path.join(__dirname, '..', 'apps', 'public'),
    env: {
      PORTLESS: '0',
      VITE_GRAPHQL_URL: 'http://localhost:4000/graphql',
      ...process.env,
    },
    log: path.join(LOG_DIR, 'public.log'),
    port: 5173,
  },
  {
    name: 'staff',
    cmd: 'pnpm',
    args: ['exec', 'vite', '--', '--port', '5174', '--host', 'localhost'],
    cwd: path.join(__dirname, '..', 'apps', 'staff'),
    env: {
      PORTLESS: '0',
      VITE_GRAPHQL_URL: 'http://localhost:4000/graphql',
      ...process.env,
    },
    log: path.join(LOG_DIR, 'staff.log'),
    port: 5174,
  },
];

const activeServers = IS_PUBLIC_EPIC5 ? servers.filter(s => s.name !== 'staff') : servers;

function launch(server) {
  const out = fs.openSync(server.log, 'a');
  const err = fs.openSync(server.log, 'a');

  console.log(`[guard] Launching ${server.name} on :${server.port} (logs: ${server.log})`);

  const child = spawn(server.cmd, server.args, {
    cwd: server.cwd,
    env: { ...process.env, ...server.env },
    detached: true,
    stdio: ['ignore', out, err],
  });

  child.unref();

  const pidFile = path.join(LOG_DIR, `${server.name}.pid`);
  fs.writeFileSync(pidFile, String(child.pid));

  // Track initial restarts from health (or 0); backoff for longer windows (Brief 6 target 3-5min sustained)
  const currentRestarts = (serverHealth[server.name] && serverHealth[server.name].restarts) || 0;

  child.on('exit', (code, signal) => {
    const delay = Math.min(RESTART_BASE_MS * Math.pow(1.6, currentRestarts), 45000);
    console.log(`[guard] ${server.name} exited (code=${code}, signal=${signal}, restarts=${currentRestarts}). Backoff restart in ${Math.round(delay/1000)}s (longer window, reduced harness kill churn)...`);
    updateServerHealth(server.name, { restarts: currentRestarts + 1, lastExit: Date.now(), status: 'restarting' });
    setTimeout(() => launch(server), delay);
  });

  // Initial health + start built-in periodic health poll (for @e count hooks + sustained readiness)
  // Uses performHealthCheck (GQL for api, root for vites). Writes health.json each success.
  setTimeout(() => {
    performHealthCheck(server, true);
    const pollInterval = setInterval(() => {
      // crude liveness: if we are still in restart loop the child var is stale but poll continues harmlessly
      performHealthCheck(server, false);
    }, HEALTH_POLL_INTERVAL_MS);
    // (poll continues across restarts; health.json always reflects latest)
  }, 2800);

  return child;
}

console.log('[guard] Starting dev server guardian (direct mode, no portless). PO Brief 6 hardening active (backoff restarts, built-in health.json for @e hooks, public/Epic-5 mode, harness resilience).');
if (IS_PUBLIC_EPIC5) {
  console.log('[guard] *** PUBLIC / EPIC-5 MODE ACTIVE *** (api + public only; staff skipped)');
  console.log('[guard] Optimized for browser-verifier (grok-4-fast per persona) on public: higher sustained server lifetime, more @e coverage (target 35+), fewer immediate hygiene fallbacks. Parallel to FE public depth work.');
  console.log('[guard] Public: http://localhost:5173 (VITE_GRAPHQL_URL=direct)');
} else {
  console.log('[guard] Full mode (api + public + staff).');
}
console.log('[guard] API:    http://localhost:4000/graphql');
console.log('[guard] Public: http://localhost:5173');
if (!IS_PUBLIC_EPIC5) console.log('[guard] Staff:  http://localhost:5174');
console.log('[guard] Use `pnpm dev:agent:kill` or pkill to stop.');
console.log('[guard] Health poll file (for @e count hooks + attach): /tmp/agent-dev-guard/health.json (updated on every poll + restart).');
console.log('[guard] Recommended attach (per AGENTS + browser-verifier.toml): background launch + persistent monitor + immediate curl+cat health.json loop; pkill + relaunch on deaths; 2x cutoff -> hygiene (bun -e runHygieneTest) + curl fallback. Report restarts, sustained checks, public @e coverage, hygiene passes.');

// Kill any previous instances (best effort; include self for reduced impact)
try {
  require('child_process').execSync('pkill -f "guard-dev-servers" || true');
  require('child_process').execSync('pkill -f "bun --hot src/index.ts" || true');
  require('child_process').execSync('pkill -f "vite -- --port 5173" || true');
  require('child_process').execSync('pkill -f "vite -- --port 5174" || true');
} catch (_) { /* ignore */ }

activeServers.forEach(launch);

console.log('[guard] All guardians launched. They will auto-restart on exit with backoff (longer windows for 3-5min+ target).');
console.log('[guard] Run this with background:true + monitor (persistent) in agent sessions for long work / public verif. Built-in polls reduce reliance on immediate fallback.');

// Brief 6: immediate health.json marker (built-in poll / @e hook point) so attach patterns see it
// even if guardian node is short-lived (common in harness/pnpm bg; see metrics baseline + AGENTS).
// If proc lives, the ~3s scheduled performHealthCheck + recurring will update with checks, SUSTAINED,
// restarts, GQL status etc. This enables browser-verifier to cat health.json right after launch
// as readiness/@e-count hook, achieve higher public sustained coverage, and fall back less often.
try {
  const marker = {
    updated: Date.now(),
    mode: IS_PUBLIC_EPIC5 ? 'public-epic5' : 'full',
    status: 'launched-pending-boot',
    note: 'Immediate marker from guardian (post activeServers.forEach). health.json is the built-in poll hook for @e counts/readiness (per PO Brief 6 + browser-verifier persona). browser-verifier: cat this + curls immediately after bg launch; watch for SUSTAINED in guardian output/logs before long @e sequences. If no sustained after 10s: pkill + hygiene/curl fallback. Fewer immediate fallbacks for public/Epic-5.',
    pidsWritten: activeServers.map(s => ({ name: s.name, port: s.port, pidFile: path.join(LOG_DIR, `${s.name}.pid`) })),
    attach: 'PUBLIC_ONLY=1 pnpm dev:agent (bg) ; monitor; while sleep 3; do curl -sI :4000 :5173; cat /tmp/agent-dev-guard/health.json; done',
    harness: 'Guardian proc often reaped (~60s or wrapper); restart wiring + marker still delivered value. Use pkill/relaunch per protocol.'
  };
  fs.writeFileSync(path.join(LOG_DIR, 'health.json'), JSON.stringify(marker, null, 2));
} catch (e) { /* best effort for hook */ }

// Signal handlers for reduced harness kill impact (write health, log for evaluator metrics)
process.on('SIGTERM', () => {
  console.log('[guard] SIGTERM (harness kill, typical exit 143 after ~60s). Final health.json written. Detached children may survive or be reaped — orchestrator/browser-verifier: pkill + relaunch or hygiene+curl per protocol. This is tracked in evaluator as harness resilience data.');
  writeHealthFile();
  // allow natural exit
});

process.on('uncaughtException', (err) => {
  console.error('[guard] uncaughtException (resilience):', err && err.message);
  writeHealthFile();
});

// Keep the guardian process alive (active health ensure + occasional tick). Strengthened vs original.
setInterval(() => {
  try {
    fs.writeFileSync(path.join(LOG_DIR, '.liveness'), String(Date.now()));
  } catch (_) {}
  writeHealthFile(); // ensure latest even if no polls
}, 8000);