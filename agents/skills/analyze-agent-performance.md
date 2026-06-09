# Analyze Agent Performance (Portable Skill)

**Purpose:** Let the orchestrator or a dedicated evaluator persona periodically review how the multi-agent team is actually performing, with heavy emphasis on token/cost efficiency, escalation and descaling effectiveness, and real productivity. Use the findings to refine personas, model tier strategy, prompts, and orchestration rules over time.

This is a self-improvement loop for the entire agent system in the repo.

## Core Idea

Run cheap analysis on Grok's own execution logs and artifacts (unified.jsonl, per-subagent `signals.json` / `summary.json`, todo state, actual code changes) to answer questions like:

- Are we successfully pushing the majority of work to deepseek-4-fast juniors while only using grok tiers for the hard parts?
- When we escalate, does it actually help? When we descale (new cheap spawn after a senior plan), does the cheap agent deliver?
- What is the real token cost per unit of delivered value (completed todos, shipped changes, passed reviews)?
- Which persona instructions or default models are causing unnecessary escalations?

## How to Run (as the Orchestrator or Evaluator)

1. The orchestrator adds or references a "performance review" item in the shared todo list.
2. Spawn the `agent-evaluator` persona (or run this skill directly) with `background: true` on a cheap model, passing the current session ID(s) and review scope.
3. The evaluator uses terminal commands + jq / small scripts to extract data from:
   - `~/.grok/logs/unified.jsonl` (timing of model calls)
   - `~/.grok/sessions/<encoded-workspace>/<session-id>/` (especially `summary.json` for model used, `signals.json` for tokens, `plan.json` for todos)
   - Subagent session directories (each has its own independent metrics — this is key for tier comparison)
4. Compute the metrics listed in the full skill. The `analyze-agent-logs.ts` script now also generates and writes a human-readable periodic summary markdown file to `metrics/token-effectiveness-YYYY-MM-DD.md` (plus `metrics/latest-token-effectiveness.md`). Commit these as part of the work being accomplished — exactly parallel to how the `browser-verifier` commits screenshots to the `screenshots/` directory.
5. Produce a report + concrete, low-risk proposals for changes (e.g., specific new wording for a persona's instructions, adjustment to default model on a role, new rule for the orchestrator about when to force a fresh junior spawn).
6. The (higher-tier) orchestrator reviews the output and applies changes via search_replace on the relevant `.toml` / `.md` files. The generated metrics md files become the "shown periodically" evidence in the project README (just like screenshots).

## Recommended Metrics

- Tokens (or `model_elapsed_ms`) per completed todo / per useful code change.
- Escalation success rate (did moving to a higher tier unblock the work?).
- Descaling success rate (did a fresh cheap agent successfully implement a senior's plan?).
- Tier utilization (% of total cost on each model tier).
- Handoff quality (clarity of summaries in transcripts; how often juniors had to re-solve hard problems after a descale).
- Self-cost of the analysis.

## Cost Discipline

- The analyzer itself should almost always run on deepseek-4-fast.
- Prefer streaming filters, jq, and summary files over loading full chat histories.
- Only escalate the analysis to a more expensive model when the data is truly ambiguous after cheap extraction.

## Integration Points

- See the `agent-evaluator` persona for the dedicated behavioral overlay.
- The orchestrator persona contains guidance on when and how to schedule these reviews and act on the results.
- Results and proposed changes should be tracked in the shared todo system so the whole team has visibility.
- Over time, store historical metric snapshots (e.g., via the project's own Mongoose-backed API) so you can see whether refinements are actually moving the needle.

Full detailed procedure, exact log paths, example jq commands, and output contracts live in the Grok-native version: `.grok/skills/analyze-agent-performance/SKILL.md`.

Use this regularly and the entire agent team (personas, escalation logic, model choices) will improve in a data-driven, cost-conscious way.