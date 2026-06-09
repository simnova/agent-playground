#!/usr/bin/env tsx
/**
 * Lightweight analyzer for Grok agent performance logs.
 * Designed to be run by the agent-evaluator persona (or orchestrator) via terminal.
 *
 * Focus: token/cost efficiency, escalation/descale effectiveness, tier utilization.
 *
 * Usage examples:
 *   tsx scripts/analyze-agent-logs.ts --session 019ea8fa-8d7e-7882-9ab1-01562cfd1f3f
 *   tsx scripts/analyze-agent-logs.ts --help
 *
 * It reads from ~/.grok (or GROK_HOME) and prints a structured report.
 * The evaluator persona is expected to call this, parse the output, and turn it into
 * proposals for persona/model refinements.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface CliArgs {
  session?: string;
  workspace?: string;
  limit?: number;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--session' || a === '-s') args.session = argv[++i];
    if (a === '--workspace' || a === '-w') args.workspace = argv[++i];
    if (a === '--limit' || a === '-l') args.limit = parseInt(argv[++i], 10);
    if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function getGrokBase(): string {
  return process.env.GROK_HOME || join(homedir(), '.grok');
}

function getEncodedWorkspace(workspace: string): string {
  // Matches how Grok encodes paths in sessions/
  return workspace.replace(/\//g, '%2F');
}

function readJsonSafe(path: string): any | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function readJsonlSafe(path: string, limit = 1000): any[] {
  try {
    if (!existsSync(path)) return [];
    const lines = readFileSync(path, 'utf8').trim().split('\n').slice(-limit);
    return lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const args = parseArgs();
  if (args.help) {
    console.log(`
Usage: tsx scripts/analyze-agent-logs.ts [options]

Options:
  --session, -s <id>     Specific session or subagent ID to analyze deeply
  --workspace, -w <path> Workspace path (default: /Volumes/files/src/agentPlayground)
  --limit, -l <n>        Max lines to read from unified.jsonl (default 2000)
  --help, -h             Show this help

The script emits a compact JSON report on stdout that the agent-evaluator
can consume. It focuses on cheap-to-extract signals: model IDs per subagent,
inference timing, and token/turn counters from signals.json.
`);
    process.exit(0);
  }

  const grokBase = getGrokBase();
  const workspace = args.workspace || '/Volumes/files/src/agentPlayground';
  const encoded = getEncodedWorkspace(workspace);
  const sessionsRoot = join(grokBase, 'sessions', encoded);
  const unifiedLog = join(grokBase, 'logs', 'unified.jsonl');

  console.error(`[analyze] Using Grok base: ${grokBase}`);
  console.error(`[analyze] Workspace: ${workspace} -> ${encoded}`);

  const report: any = {
    generatedAt: new Date().toISOString(),
    workspace,
    mainSession: null,
    subagents: [] as any[],
    unifiedTimingSample: [] as any[],
    summary: {},
  };

  // Main session
  const mainSessionDir = args.session
    ? join(sessionsRoot, args.session)
    : sessionsRoot; // the root dir for the workspace group

  const mainSummaryPath = join(mainSessionDir, 'summary.json');
  const mainSignalsPath = join(mainSessionDir, 'signals.json');
  report.mainSession = {
    path: mainSessionDir,
    summary: readJsonSafe(mainSummaryPath),
    signals: readJsonSafe(mainSignalsPath),
  };

  // Find subagent summaries (they appear as sub-dirs or sibling sessions)
  try {
    const entries = require('fs').readdirSync(sessionsRoot, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && (e.name.includes('subagent') || e.name.startsWith('019'))) {
        const subDir = join(sessionsRoot, e.name);
        const s = readJsonSafe(join(subDir, 'summary.json'));
        const sig = readJsonSafe(join(subDir, 'signals.json'));
        if (s || sig) {
          report.subagents.push({
            id: e.name,
            path: subDir,
            summary: s,
            signals: sig,
          });
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Sample unified.jsonl for timing (very cheap to stream the tail)
  const limit = args.limit || 2000;
  const unifiedLines = readJsonlSafe(unifiedLog, limit);
  const inferenceDone = unifiedLines
    .filter((l: any) => l.msg === 'shell.turn.inference_done' && l.sid && l.ctx?.model_elapsed_ms)
    .slice(-50)
    .map((l: any) => ({
      sid: l.sid,
      modelElapsedMs: l.ctx.model_elapsed_ms,
      loop: l.ctx.loop_index,
      ts: l.ts,
    }));
  report.unifiedTimingSample = inferenceDone;

  // High-level summary
  const allModels = new Set<string>();
  if (report.mainSession.summary?.current_model_id) allModels.add(report.mainSession.summary.current_model_id);
  report.subagents.forEach((s: any) => {
    if (s.summary?.current_model_id) allModels.add(s.summary.current_model_id);
  });

  const totalModelMs = inferenceDone.reduce((sum: number, x: any) => sum + (x.modelElapsedMs || 0), 0);

  report.summary = {
    distinctModelsSeen: Array.from(allModels),
    sampledInferenceTurns: inferenceDone.length,
    totalSampledModelMs: totalModelMs,
    subagentCount: report.subagents.length,
    note: 'Run with a specific --session to drill into one subagent. Use jq on signals.json for precise token counts.',
  };

  // Emit machine-readable report
  console.log(JSON.stringify(report, null, 2));
}

main();