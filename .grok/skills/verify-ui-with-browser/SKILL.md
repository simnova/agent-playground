# Verify UI with Agent-Browser (Functional Capability Checks)

**Purpose:** Give the orchestrator (and supporting personas like agent-evaluator or browser-verifier) a reliable way to *actually drive and inspect* the running staff and public UIs in a real browser. This ensures that what is being built is functionally correct — not just that the code compiles or looks good in static analysis.

This is the "periodic checks to see if things are actually shaping up to be capable" capability.

## When to Use

- As part of the self-improvement loop (triggered by `agent-evaluator` via `analyze-agent-performance`).
- After UI-related changes (new components, GraphQL mutations affecting the UI, new features in staff/public).
- On a recurring "UI capability verification" todo managed by the orchestrator.
- Before claiming a UI feature is "done" — always verify with real browser interactions.

## Prerequisites

- Dev servers running (recommended via the project's `pnpm dev` which uses portless for stable HTTPS .localhost domains).
- Access to `pnpm exec agent-browser` (the CLI is a devDependency).

Key domains (when using the standard portless setup):
- Staff: `https://staff.localhost`
- Public: `https://public.localhost`
- API (for reference): `https://api.localhost/graphql`

## Core Workflow (for AI Agents)

1. Ensure servers are up (orchestrator can delegate or use background tasks).
2. Open the target app:
   ```
   pnpm exec agent-browser open https://staff.localhost
   ```
3. Take an interactive snapshot to discover elements:
   ```
   pnpm exec agent-browser snapshot -i
   ```
   This returns structured element references like `@e1`, `@e2` with descriptions of what is visible (buttons, forms, lists, etc.). Use these refs for all subsequent actions — they are stable for the agent.

4. Perform actions using the refs:
   - `pnpm exec agent-browser fill @e3 "some text"`
   - `pnpm exec agent-browser click @e5`
   - `pnpm exec agent-browser wait --load networkidle` (or specific selectors)
5. Re-snapshot or use targeted checks to verify outcomes (e.g., new message appeared in list, GraphQL response reflected in UI, error states, loading states).
6. For GraphQL-heavy flows: the browser will show network activity; you can also cross-check via the API if needed, but the point is to verify the *integrated* experience.
7. Report structured results back: what was verified, what broke (with @e refs and descriptions), screenshots if the tool supports them in the current version, and recommendations.

Always prefer the built-in skills for patterns:
```
pnpm exec agent-browser skills get core --full
```
This gives version-matched workflow patterns, ref usage, and templates. Load specialized skills as needed.

## Integration with the Agent Team

- The **orchestrator** schedules these checks (add a recurring todo like "periodic UI capability verification" or trigger after UI work).
- The **agent-evaluator** (via `analyze-agent-performance`) can invoke browser verification as part of its metrics gathering. Real browser outcomes (successful interactions, failures) feed into productivity/token-efficiency reports and persona refinement proposals.
- Use a dedicated **browser-verifier** persona (see `.grok/personas/browser-verifier.toml`) for focused subagent runs. It knows the command patterns, the project's portless URLs, common flows (message sending in the demo, future bucket UIs, etc.), and how to report findings in a way that is useful for the evaluator and implementers.
- Findings should be captured in the shared `todo_write` system and can trigger:
  - Bug-fix tasks for front-end-developer / back-end-developer.
  - Refinements to the browser-verifier persona itself or to the analyze skill.
  - Updates to review-component skill expectations.

## Cost & Efficiency Notes

- Run the verifier subagent with `background: true` when possible.
- Use `resume_from` for iterative verification on the same browser session if the tool supports long-lived contexts.
- Keep snapshots targeted (`-i` for interactive refs) rather than full page dumps to control token usage.
- Combine with the tiered model strategy: run initial verification on cheaper models; escalate the verifier only for complex diagnosis.

## Example Commands (Project-Specific)

```bash
# Staff app basic smoke
pnpm exec agent-browser open https://staff.localhost
pnpm exec agent-browser snapshot -i
pnpm exec agent-browser fill @eN "Test message from agent-browser"
pnpm exec agent-browser click @eM
pnpm exec agent-browser snapshot -i   # verify the new message appears

# Similar for public app
pnpm exec agent-browser open https://public.localhost
...
```

See the browser-verifier persona for more guided patterns and the analyze-agent-performance skill for how these checks feed the self-improvement loop.

This capability closes the "assume it works" gap by giving the agent team direct, observable access to the live product experience on every relevant cycle.