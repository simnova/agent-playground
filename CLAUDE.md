# CLAUDE.md

This project uses `AGENTS.md` as the primary source of truth for coding standards, architecture, and agent instructions.

Please read the root `AGENTS.md` first. It contains:

- Project philosophy and structure
- How skills, agents, and personas are organized in this repo
- Core conventions for TypeScript, UI (Ant Design), backend (Hono + GraphQL), monorepo practices, etc.
- Guidance on cross-tool usage

Key locations:
- `.grok/skills/` — Detailed, step-by-step procedures (Grok-native skills)
- `agents/` — Portable documentation of the same capabilities
- `.grok/personas/` and `.grok/agents/` — Specialized agent behaviors

For Claude-specific workflows, also check:
- `.claude/rules/` (if present)
- Any `CLAUDE.local.md` (gitignored for personal overrides)

When working in subdirectories, also read any local `AGENTS.md` or `CLAUDE.md` files — they take precedence for that scope.