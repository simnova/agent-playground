# Analyze Agent Performance (Self-Improvement Skill)

**Purpose:** Enable the orchestrator (or a dedicated agent-evaluator persona) to periodically review how the multi-agent team is performing — with a strong emphasis on productivity, escalation/descale effectiveness, and token/cost efficiency — and then drive targeted refinements to personas, model tier usage, prompts, and orchestration strategy.

This turns the agent system into a learning loop that gets better (and cheaper) over time.

## When to Use

- After a significant batch of work (several features, a complex refactoring, or a full cycle involving multiple personas).
- On a recurring "performance review" todo item managed by the orchestrator.
- When the team seems to be spending too much on high-tier models or when handoffs feel inefficient.
- Before making broader changes to the agent/persona setup.

The evaluator persona (`.grok/personas/agent-evaluator.toml`) is the recommended way to invoke this skill.

## Core Metrics to Compute

Focus on ratios and trends rather than raw numbers. Prioritize data that is cheap to extract.

1. **Token / Cost Efficiency**
   - Tokens (or `model_elapsed_ms` from logs) per completed todo item.
   - Tokens per meaningful code change (search_replace, successful build, merged change).
   - Tokens per successful handoff (escalation that unblocked work or descaling that led to correct implementation).

2. **Escalation & Descaling Effectiveness**
   - Escalation success rate: % of times a junior (deepseek-4-fast) hitting a wall led to a higher tier (via `resume_from`) that produced clearly better output or allowed the task to progress without further escalation.
   - Descaling success rate: after a senior/expert produced a plan or key decision, how often a fresh cheap junior (new `spawn_subagent` on deepseek-4-fast with summary + updated todos) successfully executed it?
   - Compare aggregate cost of "junior → escalate → descale to new junior" vs. "stayed on high tier the whole time".

3. **Tier Utilization**
   - % of total inference time / tokens spent on each tier (deepseek-4-fast vs pro vs grok-4-fast vs pro).
   - Goal: maximize volume on the cheapest effective tier while reserving expensive models for the hard parts.

4. **Qualitative / Productivity Signals**
   - Handoff clarity (from subagent transcripts): do summaries from seniors contain clear, actionable plans that juniors can follow without re-deriving the hard parts?
   - Stuck report frequency per tier.
   - Real outcomes: number of successful reviews, builds, tests, or user-visible changes per 1000 tokens across the team.
   - **Functional capability from browser verification**: % of critical UI flows that actually succeed when driven by `browser-verifier` using agent-browser (open, snapshot -i @e refs, fill/click/wait, re-snapshot). This is the "did a real user interaction work end-to-end?" signal.
   - Self-cost of the analysis itself.

## Data Sources & Access Patterns (Be Token-Efficient)

Grok stores rich data outside the workspace. Use tools surgically — prefer summaries, counters, and timing over full histories.

- **Primary sources** (relative to `~` or the user's home):
  - `~/.grok/logs/unified.jsonl` — stream for `shell.turn.inference_done` events. Extract `model_elapsed_ms`, session IDs, loop counts. Excellent proxy for relative cost.
  - `~/.grok/sessions/<encoded-cwd>/<session-or-subagent-id>/`
    - `summary.json` — `current_model_id` (critical for verifying which tier was actually used), `num_messages`.
    - `signals.json` — authoritative token usage, tool counts, turn counters.
    - `plan.json` — current todo state (correlate with log activity).
    - `chat_history.jsonl` / `updates.jsonl` — only read targeted sections for handoff quality when metrics suggest a problem.
- Browser verification artifacts (from `verify-ui-with-browser` skill runs and `browser-verifier` subagents): agent-browser command logs, @e-ref snapshots before/after, success/failure of specific flows. These provide the ground-truth "is the UI actually usable?" data that log metrics alone cannot.

- For the current agentPlayground workspace the encoded path is usually `%2FVolumes%2Ffiles%2Fsrc%2FagentPlayground`.
- Subagents have their own independent session records (with their own model and signals) — this is what makes tier comparison possible.
- Use the terminal tool + `jq`, `grep -A/-B`, or small Node one-liners. Avoid loading entire large histories.

**Example lightweight extraction (run via terminal tool):**
```bash
# Model and rough size for a specific subagent
jq '{model: .current_model_id, messages: .num_messages}' \
  ~/.grok/sessions/%2FVolumes%2Ffiles%2Fsrc%2FagentPlayground/<subagent-session-id>/summary.json

# Token counters
cat ~/.grok/sessions/.../signals.json | jq .

# Inference cost pattern from unified log
grep "inference_done" ~/.grok/logs/unified.jsonl | jq -r '.ctx.model_elapsed_ms' | awk '{s+=$1} END {print s " total ms"}'
```

## Step-by-Step Process

1. **Receive scope** from the orchestrator (current session IDs, recent major todos, specific questions like "how is descaling performing on backend work?").

2. **Lightweight data gathering** (start here — stay cheap):
   - List recent subagent sessions under the workspace.
   - Pull `summary.json` + `signals.json` for the main session and key subagents.
   - Sample `inference_done` timing from unified.jsonl for the relevant time window.
   - Pull high-level todo state from `plan.json`.

3. **Compute metrics** using the definitions above. Use scripts in `scripts/` (e.g. `analyze-agent-logs.ts`) when they exist for repeatability.

4. **Analyze patterns**:
   - Where is expensive time being spent unnecessarily?
   - Are descaling handoffs working (cheap agents successfully executing senior plans)?
   - Are there persona instructions or model defaults that are causing too many escalations?
   - What is the actual token delta between "always high tier" vs. the current chain?

5. **Generate output**:
   - Clear performance report (markdown, with numbers and trends).
   - 2–5 prioritized, concrete refinement proposals (with exact suggested text for persona instructions, model changes, new rules in the orchestrator, etc.).
   - Suggested measurement for the next cycle ("re-run this analysis after the next 3 UI features and compare descaling token ratio + browser-verifier pass rate").

6. **Handoff** to the orchestrator (usually on a higher tier). The orchestrator reviews, may ask for clarification or a deeper (more expensive) analysis on one area, then applies changes via search_replace on `.toml` files, documentation updates, etc.

## Integration with the Team

- The `agent-evaluator` persona is the primary consumer of this skill.
- The orchestrator should treat performance reviews as first-class work (add them to the shared todo list).
- After changes are applied, the next cycle becomes the measurement of whether the refinement helped.
- Always run the evaluator itself on a cheap tier (`deepseek-4-fast` by default) unless the data volume genuinely requires more power.

## Cost & Safety Notes

- Analysis must itself be token-conscious. Prefer filters, counters, and summaries.
- Never propose changes that would increase overall cost without clear evidence of quality or speed gains.
- The orchestrator (higher tier) is the final approver of any persona or strategy changes. The evaluator only recommends.
- Store historical metric snapshots (in the DB via the api, or as dated files) so trends are visible over multiple cycles.

See the `agent-evaluator` persona for the behavioral overlay and the orchestrator persona for how reviews are scheduled and acted upon.

This skill + persona closes the loop so the agent team continuously tunes itself for higher productivity at lower cost.