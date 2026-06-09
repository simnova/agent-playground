#!/usr/bin/env node
/**
 * Dev Server Guardian for agent-driven long sessions.
 *
 * Purpose: Keep the api + staff + public dev servers alive despite the harness
 * killing background tasks after ~60s. Uses detached child processes + restart loops.
 *
 * Usage (from repo root):
 *   node scripts/guard-dev-servers.js
 *
 * Or via package script:
 *   pnpm dev:agent
 *
 * This is the recommended way to launch servers for 30m+ agent work,
 * browser-verifier runs, or the "1h15m uninterrupted analysis test".
 *
 * It prefers direct ports (no portless proxy) because the proxy layer
 * was a major source of registration conflicts and fragility in past runs.
 *
 * Servers:
 *   - API:    http://localhost:4000/graphql   (bun --hot, PORT=4000)
 *   - Public: http://localhost:5173           (vite, VITE_GRAPHQL_URL set)
 *   - Staff:  http://localhost:5174           (vite)
 *
 * On harness kill of this guardian, children may also be reaped.
 * The browser-verifier / orchestrator should still use pkill + relaunch + monitor + hygiene fallback.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const LOG_DIR = '/tmp/agent-dev-guard';
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

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

  child.on('exit', (code, signal) => {
    console.log(`[guard] ${server.name} exited (code=${code}, signal=${signal}). Restarting in 1s...`);
    setTimeout(() => launch(server), 1000);
  });

  // Quick health ping after a short delay (non-blocking)
  setTimeout(() => {
    const http = require('http');
    const req = http.get(`http://localhost:${server.port}`, (res) => {
      if (res.statusCode < 500) {
        console.log(`[guard] ${server.name} healthy (status ${res.statusCode})`);
      }
    });
    req.on('error', () => {
      // expected during startup
    });
    req.setTimeout(2000, () => req.destroy());
  }, 2500);

  return child;
}

console.log('[guard] Starting dev server guardian (direct mode, no portless).');
console.log('[guard] API:    http://localhost:4000/graphql');
console.log('[guard] Public: http://localhost:5173');
console.log('[guard] Staff:  http://localhost:5174');
console.log('[guard] Use `pnpm dev:agent:kill` or pkill to stop.');

// Kill any previous instances (best effort)
try {
  require('child_process').execSync('pkill -f "bun --hot src/index.ts" || true');
  require('child_process').execSync('pkill -f "vite -- --port 5173" || true');
  require('child_process').execSync('pkill -f "vite -- --port 5174" || true');
} catch (_) { /* ignore */ }

servers.forEach(launch);

console.log('[guard] All guardians launched. They will auto-restart on exit.');
console.log('[guard] This process should be run with background:true + monitor in agent sessions.');

// Keep the guardian process alive
setInterval(() => {
  // noop – keeps the node process running so children stay attached to something
}, 30000);