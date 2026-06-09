# Personas (Portable Versions)

This directory contains portable Markdown descriptions of the personas used in the agentPlayground project.

These are human-readable versions of the Grok-native `.toml` definitions in `.grok/personas/`.

## Available Personas

- `front-end-developer` — React + Ant Design + Apollo Client specialist (typically deepseek-4-fast juniors).
- `back-end-developer` — Bun + Hono + Apollo GraphQL + Mongoose specialist (deepseek-4-pro base).
- `ux-designer` — UX patterns, critique, accessibility, and experience design expert (deepseek-4-pro).
- `product-owner` — Vision, iterative scope expansion, prioritization, and balanced feedback (deepseek-4-pro).
- `architect` — System qualities, maintainability, evolvability, and long-term health guardian (grok-4-fast).
- `orchestrator` — Servant leader who coordinates the team + manages the cost-effective model escalation chain (deepseek-4-fast → pro → grok-4-fast → grok-4-pro) using `background: true` + `resume_from` for persistent conversational agents.
- `muse` — Specialist on the BankBuckets long-term budgeting methodology (% allocations, spillover, caps, goals). Exclusive reader of `/Volumes/files/src/bankbuckets` (deepseek-4-pro for large context).
- `muse-eyes` — Vision (grok) + agentPlayground codebase analyst who converses with the muse (grok-4-fast).

See `.grok/personas/README.md` and the root `AGENTS.md` + `agents/STRUCTURE.md` for how to use these with `spawn_subagent` (include persona instructions in the prompt or rely on resolution when defined in config).

The orchestrator (main agent) uses these to run the team as subagents.