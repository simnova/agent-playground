# IAEP Iteration NNN: [Short Descriptive Title]

**Dates / Scope**: [e.g., 2026-06-09, Brief X + public verif + evaluator review]
**Orchestrator**: [main session or sub ID]
**Evaluator**: [cheap sub ID that produced the report]

## Baseline (Start of Iteration)
- Key numbers copied from `pnpm exec tsx scripts/analyze-agent-logs.ts` + cheap evaluator run:
  - Public @e (source): instances / unique / Brief6+ filtered
  - Public browser artifacts: # bv-public-*.png
  - Guardian health (if recent): mode, checks, restarts
  - Hygiene / test status
  - Recent tier mix / descaling observations
  - Tokens per value (recent briefs or from latest metrics)
  - Any other relevant from `metrics/latest-token-effectiveness.md`

- Link to the exact evaluator report / analyzer output used.

## Hypothesis & Changes
- What waste or opportunity was targeted (reference previous evaluator proposals or observed pattern).
- Success criteria (e.g., "reduce evaluator manual grep cost by 50%", "increase descaling success to >80%", "guardian sustained checks >50 on average").
- Exact changes made (list files + 1-line + commit):
  - e.g., `scripts/analyze-agent-logs.ts` — added comprehensive auto-capture (IAEP-001)
  - `.grok/personas/orchestrator.toml` — ...
  - `AGENTS.md` — ...

All changes must include an inline comment: `// IAEP Iteration NNN: ... See metrics/iterations/NNN-....md`

## Execution
- Scoped work performed (briefs, verif runs, etc.).
- Key subagent IDs and titles (especially any using `background: true` or public/Epic-5 scopes).
- Notable events (guardian runs, harness kills, fallbacks used, hygiene calls).

## Post-Iteration Results & Deltas
- Re-run numbers (same format as baseline).
- Delta table (before → after, % change) on the core KPIs.
- Qualitative: did the change produce the expected behavior? Any side effects?

## Decision & Rationale
- Keep / Revert / Amplify.
- Why (tied to numbers + original hypothesis).
- Any new proposals generated for next iteration.

## Lessons & Watch Items
- What worked / didn't.
- Things to monitor in future iterations (e.g., "if we add more auto-capture, watch evaluator context size").
- Impact on 75min / long-run goal (if relevant).

## Artifacts Produced
- This file.
- Updates to `metrics/latest-token-effectiveness.md` (+ any dated snapshot).
- New screenshots (if any).
- Git commit range: `abc1234..def5678` (or list of SHAs).
- Tag (if created): `agent-iaep-iter-NNN`
- Any persona / script / AGENTS.md updates with references.

**Rollback note**: To investigate a regression, `git checkout agent-iaep-iter-NNN` (or specific files), re-execute the same brief, and compare against the numbers recorded here.

---

*This template ensures every iteration leaves a self-contained, auditable record.*

## Close & Publish
- ...
- Commit + tag.
- **Publish**: `git push origin main` (CLI). Record success/failure and any output in this report.
- Update this file with the publish result.

**IAEP Loop Note**: Publishing is now a standing requirement for every iteration to keep the self-improvement artifacts (this report, metrics, tags, helpers) live on GitHub without user intervention.
