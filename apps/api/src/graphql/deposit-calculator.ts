/**
 * @deprecated Pure calc logic extracted to packages/bankbuckets-core (architect suggestion 1: extract to shared package for maintainability / dedup client+server computes / single source of truth + tests).
 *
 * This file is now a thin re-export ONLY.
 * - Preserves exact hygiene command compatibility used across the system:
 *     bun -e '
 *       import("./apps/api/src/graphql/deposit-calculator.ts").then(m => { m.runHygieneTest?.(); });
 *     '
 *   (and equivs in browser-verifier.md, analyze-agent-logs.ts, metrics, skills/verify, AGENTS notes, prior subagent handoffs, etc.)
 * - Existing relative imports in this package (resolvers) can migrate; the reexport keeps old path working for direct runs.
 * - New code / other apps should import directly from '@repo/bankbuckets-core'.
 *
 * Hygiene kept: runHygieneTest + the realistic 4-bucket 20000 high-deposit case + hierarchy scaffold continue to work unchanged.
 * Core now has vitest coverage for the same cases in packages/bankbuckets-core/test/hygiene.test.ts .
 */

export * from '@repo/bankbuckets-core';
