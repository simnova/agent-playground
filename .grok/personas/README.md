# Personas

This directory holds persona definitions (as .toml files) for use with subagents in Grok.

Personas are behavioral overlays — they influence tone, focus, output format, and constraints without changing the underlying agent type or tool access.

## Available Personas

**Core / General**
- `concise` — Short, high-signal responses.
- `thorough-reviewer` — Detailed, citation-heavy code reviews with clear severity levels.

**Team Roles (for orchestrated subagent collaboration)**
- `front-end-developer` — React + Ant Design + Apollo Client specialist for the staff and public UIs.
- `back-end-developer` — Bun + Hono + Apollo GraphQL + Mongoose specialist for the shared API.
- `ux-designer` — UX patterns, critique, accessibility, and experience design expert.
- `product-owner` — Vision, iterative scope expansion, prioritization, and balanced feedback.
- `architect` — System qualities, maintainability, evolvability, and long-term health guardian.
- `orchestrator` — Servant leader who coordinates the team, balances voices, tracks progress via todos, and ensures productive collaboration (no single voice dominates).
- `muse` — Specialist historian of the BankBuckets long-term budgeting methodology (percent allocations, caps, spillover ordering, hierarchical buckets, goal linkage). Has exclusive access to the full source at `/Volumes/files/src/bankbuckets`; primary consultant to the product-owner; summons `muse-eyes` for all visual/image analysis.
- `muse-eyes` — Vision-enabled (Grok models) analyst with full access to the agentPlayground codebase. Converses with the muse to interpret old BankBuckets designs/screenshots and current UIs, providing concrete modern implementation guidance.

Portable markdown versions are available in `agents/personas/`.

See `agents/STRUCTURE.md`, the root `AGENTS.md`, and the user-guide docs on subagents/personas for how the orchestrator uses `spawn_subagent` with these (include persona instructions in the subagent prompt + relevant cross-role context).

The orchestrator (main agent) spawns subagents using these personas to run the team. Use `todo_write` to maintain shared visibility into team progress.