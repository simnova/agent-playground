# Grok Agents / Roles

This directory contains definitions for custom agent types (roles) that can be used with subagents in Grok.

Each role typically has:
- A `.toml` file with metadata (description, default_capability_mode, model, prompt_file, etc.)
- A `.md` file with the detailed system prompt / instructions for that role.

## Available Roles

**Existing**
- `ui-specialist` — Focused on the staff and public Vite + Ant Design UIs and the shared @repo/ui.
- `backend-expert` — Focused on the Hono + Apollo GraphQL backend in apps/api.
- `turborepo-expert` — Focused on monorepo coordination, Turborepo, portless, and cross-package work.
- `general-purpose-enhanced` — A stronger general agent with deep awareness of this specific monorepo and its agent system.

**New Specialized**
- `muse` and `muse-eyes` — See Team Roles above. The muse brings historical BankBuckets long-term budgeting inspiration (with exclusive source access); muse-eyes supplies vision and codebase translation.

**Team Roles (for orchestrated collaboration)**
- `front-end-developer` — React + Ant Design + Apollo Client specialist.
- `back-end-developer` — Bun/Hono/Apollo GraphQL + Mongoose specialist.
- `ux-designer` — UX patterns, critique, and experience design.
- `product-owner` — Vision, scope expansion, prioritization, and feedback.
- `architect` — System qualities and long-term maintainability.
- `orchestrator` — Servant leader / team coordinator (use as the main agent or a coordination subagent).
- `muse` — BankBuckets methodology specialist (long-term % + spillover + goal budgeting); exclusive access to old source; consultant to product-owner; partners with muse-eyes for visuals.
- `muse-eyes` — Vision + codebase partner to the muse (Grok models for images + full agentPlayground access).

Portable (non-Grok) versions of role descriptions live in `agents/roles/`.

See the root `AGENTS.md`, `agents/STRUCTURE.md`, and `.grok/personas/` (for behavioral overlays on any role) for team usage. The orchestrator spawns subagents using these roles/personas to run the team.

## Using the Team
The orchestrator (main agent) breaks down work, spawns subagents with the appropriate role + persona instructions + context from siblings, collects results (via `get_command_or_subagent_output`), balances input, tracks progress with `todo_write`, and synthesizes for the user. No single voice dominates; progress and quality stay in check.

This enables true team collaboration on complex, multi-perspective tasks.