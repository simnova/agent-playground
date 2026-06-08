# Personas (Portable Versions)

This directory contains portable Markdown descriptions of the personas used in the agentPlayground project.

These are human-readable versions of the Grok-native `.toml` definitions in `.grok/personas/`.

## Available Personas

- `front-end-developer` — React + Ant Design + Apollo Client specialist for the staff and public UIs.
- `back-end-developer` — Bun + Hono + Apollo GraphQL + Mongoose specialist for the shared API.
- `ux-designer` — UX patterns, critique, accessibility, and experience design expert.
- `product-owner` — Vision, iterative scope expansion, prioritization, and balanced feedback.
- `architect` — System qualities, maintainability, evolvability, and long-term health guardian.
- `orchestrator` — Servant leader who coordinates the team, balances voices, tracks progress, and ensures productive collaboration via subagents.
- `muse` — Specialist on the BankBuckets long-term budgeting methodology (% allocations, spillover, caps, goals). Exclusive reader of `/Volumes/files/src/bankbuckets`; works closely with product-owner and calls on `muse-eyes` for visuals.
- `muse-eyes` — Vision (grok) + agentPlayground codebase analyst who converses with the muse to translate designs and UIs into modern implementation guidance.

See `.grok/personas/README.md` and the root `AGENTS.md` + `agents/STRUCTURE.md` for how to use these with `spawn_subagent` (include persona instructions in the prompt or rely on resolution when defined in config).

The orchestrator (main agent) uses these to run the team as subagents.