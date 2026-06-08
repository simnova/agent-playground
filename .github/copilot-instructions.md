# GitHub Copilot Instructions

This repository's main instructions live in the root `AGENTS.md`.

**Please read `AGENTS.md` (at the root of the repository) before making changes.**

It covers:
- The agent/skills/personas system in this repo (designed to be somewhat portable)
- Coding conventions
- Monorepo structure (Turborepo + pnpm)
- UI: Ant Design is primary for `apps/staff` and `apps/public`
- Backend patterns
- Tooling (Biome, tsgo, Knip, etc.)

Additional context:
- Skills and detailed procedures are in `.grok/skills/`
- A more human-readable version of the agent capabilities lives under `agents/`
- Use project TypeScript configs from `packages/config-typescript`

For the two main UIs (`staff` and `public`), they share the same backend but can have different theming and focus.

When editing, prefer changes that keep definitions reusable across Grok, Claude, Cursor, and Copilot where possible.