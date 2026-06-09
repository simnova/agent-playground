# Personas

This directory holds persona definitions (as .toml files) for use with subagents in Grok.

Personas are behavioral overlays — they influence tone, focus, output format, and constraints without changing the underlying agent type or tool access.

## Available Personas

**Core / General**
- `concise` — Short, high-signal responses.
- `thorough-reviewer` — Detailed, citation-heavy code reviews with clear severity levels.

**Team Roles (for orchestrated subagent collaboration) + Model Tiers**

We use a cost-aware escalation chain (deepseek-4-fast juniors → deepseek-4-pro helpers → grok-4-fast seniors → grok-4-pro experts). The orchestrator manages starting tier and escalation via `resume_from`.

- `front-end-developer` — React + Ant Design + Apollo Client specialist (often starts on deepseek-4-fast).
- `back-end-developer` — Bun + Hono + Apollo GraphQL + Mongoose specialist (deepseek-4-pro base).
- `ux-designer` — UX patterns, critique, accessibility, and experience design expert (deepseek-4-pro).
- `product-owner` — Vision, iterative scope expansion, prioritization, and balanced feedback (deepseek-4-pro).
- `architect` — System qualities, maintainability, evolvability, and long-term health guardian (grok-4-fast).
- `orchestrator` — Servant leader who coordinates the team + manages the full escalation **and descaling** chain. Uses `background: true` + `resume_from` (to continue higher-tier agents) and explicit new lower-tier spawns (to hand routine follow-up work back to cheaper models after hard problems are solved).
- `muse` — Specialist historian of the BankBuckets long-term budgeting methodology... (deepseek-4-pro for large context).
- `muse-eyes` — Vision-enabled analyst... (grok-4-fast).

Portable markdown versions are available in `agents/personas/`.

See `agents/STRUCTURE.md`, the root `AGENTS.md`, and the user-guide docs on subagents/personas for how the orchestrator uses `spawn_subagent` with these (include persona instructions in the subagent prompt + relevant cross-role context).

The orchestrator (main agent) spawns subagents using these personas to run the team. Use `todo_write` to maintain shared visibility into team progress.