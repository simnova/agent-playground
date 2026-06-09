# Verify UI with Agent-Browser (Functional Capability Checks)

**Purpose:** Allow the orchestrator and the self-improving agent system to *actually use and inspect* the running staff and public UIs inside a real browser. This provides ground-truth functional verification instead of relying on code inspection, builds, or static analysis alone.

It is the practical mechanism for the "periodic checks to see if things are actually shaping up to be capable" requirement.

## Key Benefits

- Real user flows (open app, interact with forms/lists, trigger GraphQL, observe results).
- Structured element references (@e1, @e2, ...) that are agent-friendly.
- Works seamlessly with the project's portless .localhost HTTPS setup.
- Feeds real-world success/failure data into the `agent-evaluator` + `analyze-agent-performance` loop.

## Basic Usage Pattern (for Subagents)

1. Open the target (staff or public).
2. Snapshot with interactive refs: `pnpm exec agent-browser snapshot -i`
3. Act using the @e refs (fill, click, wait, etc.).
4. Re-snapshot or inspect to verify outcomes.
5. Report findings with concrete refs and descriptions.

Always start by loading the built-in skills for reliable patterns:
`pnpm exec agent-browser skills get core --full`

## Integration

- Orchestrator schedules these checks (via shared todos or after UI changes).
- `agent-evaluator` (running the analyze skill) can trigger browser verification rounds and incorporate the results into performance reports and refinement proposals.
- Use the `browser-verifier` persona for dedicated, focused subagent runs.

See the full Grok-native skill at `.grok/skills/verify-ui-with-browser/SKILL.md` for detailed workflow, project-specific examples, and how it ties into the tiered model + self-improvement system.

This is a core part of making the multi-agent team trustworthy about the UIs it builds.