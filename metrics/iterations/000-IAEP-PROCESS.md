# Iterative Agent Efficiency Program (IAEP)

**Goal**: Systematically improve the orchestrated agent team's efficiency (lower token usage), productivity (more value per cycle), and reliability while maintaining (or improving) output quality and real verification signal.

**Philosophy**:
- Small, isolated, measurable changes per iteration.
- Data-driven (via cheap `agent-evaluator` + enhanced `analyze-agent-logs.ts`).
- Full transparency: every change, measurement, and decision is an artifact in the repo.
- Easy rollback and root-cause analysis if metrics regress.
- Builds on existing foundations: spawn hygiene, tiered models (deepseek-first + descale), background+resume_from, guardian for long sessions, `todo_write`, committed metrics + screenshots, `analyze-agent-performance` skill, browser-verifier protocol.

## Iteration Structure

An **iteration** is a bounded cycle with clear start/end, typically:
- 1 scoped BankBuckets "brief" (or 2-3 small tasks) + associated implementation.
- At least 1 public/staff UI or verification slice where relevant.
- 1 full cheap evaluator review (using the script + skill).
- Optional: 1 browser-verifier run (grok-4-fast for public/Epic-5+ scopes) using full resilient protocol.

**Duration**: Until the scoped work + measurement is complete (aim for 1-3 "real" subagent deliveries + review).

### Phases (executed by orchestrator + team)

1. **Baseline & Planning** (start of iteration)
   - Run cheap `agent-evaluator` (deepseek-4-fast) with scope = "current state + recent subagent IDs".
   - Execute `pnpm exec tsx scripts/analyze-agent-logs.ts` (or equivalent) to auto-capture numbers.
   - Record guardian health (if recent run), current @e surface (grep or from script), hygiene status, recent tier mix.
   - Create `metrics/iterations/NNN-iteration-name.md` from template.
   - Update `metrics/latest-token-effectiveness.md` with new "Iteration N baseline" section.
   - Use `todo_write` for the iteration plan items.

2. **Hypothesis** (1-3 targeted changes)
   - Derived from previous evaluator report or observed waste (e.g., high ctx in spawns, repeated analysis work, insufficient descaling, short guardian windows).
   - Examples of high-confidence changes (see past reports):
     - Auto-capture of public @e / hygiene / guardian metrics in analyzer (reduces evaluator tool calls).
     - Enforce spawn hygiene template (reduces stuck high-ctx patterns).
     - Mandatory cheap descale after senior work + track success rate.
     - Increase evaluator cadence.
     - Guardian LONG_TEST mode + external persistence guidance.
   - Document exact hypothesis + success criteria in the iteration doc.
   - Make changes **small and isolated** (one file or one clear pattern at a time). Add comments like `// IAEP Iteration 003: Added X for Y reason. See metrics/iterations/003-....md`.

3. **Execute**
   - Perform the scoped work using full current process (condensed spawns with explicit first actions + `read_file` for personas, `background: true` where useful, `todo_write`, guardian+monitor for any verif/UI work, hygiene fallbacks).
   - Log subagent IDs, task titles (include "public"/"Epic-5" where relevant).

4. **Verify & Re-measure**
   - Re-run cheap evaluator + analyzer script.
   - Run hygiene tests + any browser-verifier if UI changed (report @e coverage + hygiene passes explicitly).
   - Capture new guardian lifetime if long run attempted.

5. **Analyze, Decide, Document**
   - Compare before/after on the KPIs (see below).
   - Decision: Keep / Revert / Amplify / Combine with next.
   - Update the iteration markdown with results, raw numbers, deltas, lessons, and the git commit range for the changes.
   - Commit **all artifacts** as part of the work (metrics files, iteration doc, any screenshots, persona/AGENTS updates).

6. **Close & Hand off**
   - Update `AGENTS.md` (if process changed) and the relevant persona .toml (with reference to the iteration doc).
   - Add a "next iteration" todo with the top proposal from this cycle's evaluator.
   - Tag the commit: `git tag agent-iaep-iter-NNN` (optional but recommended for easy checkout).

## Key Performance Indicators (KPIs) — Must be reported every iteration

Use the auto-capturing script + manual notes from subagent outputs. Focus on ratios and trends.

- **Token Efficiency**
  - Tokens (or `model_elapsed_ms` proxy) per value unit. Value units: completed todo, net feature LOC changed, new public @e source added, brief completed, hygiene pass confirmed.
  - Evaluator analysis cost (its own tool count / tokens / wall time) per iteration.

- **Tier Utilization & Descaling Effectiveness**
  - % of inference time/tokens on deepseek-4-fast (juniors) vs higher.
  - Descaling success rate: after any grok-4-* (senior) work, % of follow-on tasks completed by fresh cheap junior without re-escalation.
  - "Cost of hard part" vs "cost of follow-up".

- **Verification Yield & Quality**
  - Public @e coverage: source count (instances / unique / Brief6+ filtered from `apps/public/src/App.tsx`), committed `bv-public-*.png` count, % of new @e actually exercised in a verifier run (or hygiene proxy).
  - Guardian resilience: max/avg sustained checks before harness kill, restarts used, fallbacks triggered. (Target: move from 300s/30 checks toward longer windows.)

- **Productivity**
  - Value units delivered per iteration (or per 1000 tokens).
  - Wall time and subagent turns for the scoped brief.

- **Loop Health**
  - Number of concrete proposals generated by evaluator that were implemented in next iteration.
  - % of iteration changes that produced measurable positive delta on at least one KPI.

All numbers go into the iteration doc + the main `metrics/latest-token-effectiveness.md`.

## Meaningful Artifacts Left Behind (for rollback & diagnosis)

Every iteration **must** produce these (committed, not just in chat):

1. `metrics/iterations/NNN-short-name.md` (from template) — the single source of truth for the iteration:
   - Baseline numbers (copy from script + evaluator).
   - Exact hypothesis + success criteria.
   - List of changes made (file paths + 1-line description + commit SHA or range).
   - Execution notes (key subagent IDs, any harness events).
   - Post-iteration numbers + deltas table.
   - Decision + rationale.
   - Lessons / what to watch in next iteration.
   - Link to any related screenshots or logs.

2. Updated `metrics/latest-token-effectiveness.md` (with new "Iteration N" section or pointer) + a dated snapshot if the main one grows too large (`metrics/token-effectiveness-YYYY-MM-DD-iter-NNN.md` or append to existing dated file).

3. Any new `screenshots/bv-public-*.png` or other verifier artifacts.

4. Changes to process docs:
   - `AGENTS.md` (high-level process updates).
   - `.grok/personas/*.toml` or `agents/personas/*.md` (with inline comment referencing the iteration doc).
   - `scripts/analyze-agent-logs.ts`, guardian, etc. (with `// IAEP Iteration NNN` comments).

5. Git history:
   - Clear commit message(s) including "IAEP Iteration NNN".
   - Recommended: `git tag agent-iaep-iter-NNN` (or lightweight tag).
   - The full diff of the iteration is in git.

6. (Optional but valuable) `plan.json` or todo state at start/end of iteration (if using persistent plan files).

**Rollback / Investigation Process**:
- To go back: `git checkout agent-iaep-iter-NNN` (or specific files).
- Re-run the same brief/task that was used for measurement.
- Compare the iteration-N doc's "before" numbers vs what you observe now.
- Root cause: the iteration doc lists the exact changes; git blame/log on the changed files + the evaluator report from that time.
- If a change caused regression, revert the specific commit(s), document in a follow-up "Iteration N+1: Reverted X because..." note, and add to the "what not to do" section of the main plan.

This structure ensures that even if we veer off course, the artifacts + git history make it cheap to diagnose exactly which change, in which context, caused the regression.

## Current Baseline (as of start of IAEP)

See the most recent `metrics/latest-token-effectiveness.md` (post-Brief 6 + 300s guardian run + initial auto-capture implementation).
Key observations from last cycle:
- Strong cheap-tier delivery on Brief 6 (FE 34 tools / ~228s, guardian 46 tools).
- Guardian delivered 300s / 30 checks / 0 restarts (5× baseline).
- Public source @e at ~55-57 (good growth).
- But sustained server time still far from 75min goal (harness reality).
- Evaluator analysis still involves some manual extraction (addressed by auto-capture work).

All future iterations will compare against this (and the immediately previous iteration's numbers).

## How to Start a New Iteration

1. Orchestrator (or cheap evaluator) creates the `NNN-... .md` from the template.
2. Captures baseline using the script + `analyze-agent-performance` skill.
3. Picks 1-2 changes from the latest evaluator proposals or observed waste.
4. Implements, executes scoped work, measures, documents, commits, tags.
5. Updates the main plan doc if the overall process evolves.

The `agent-evaluator` persona + `analyze-agent-performance` skill are the primary engines that keep this loop honest and cheap.

See also: `AGENTS.md` (spawn hygiene, descaling, guardian protocol, harness notes), the `analyze-agent-performance` skill, and recent dated metrics files for examples of the data we track.

This process turns the agent team into a product that improves itself measurably, with a clear audit trail.
