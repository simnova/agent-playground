# .grok — Grok-Native Configuration for This Repo

This directory contains the full-powered, Grok-specific agent definitions for this repository.

## Contents

- `skills/` — Reusable skills as `SKILL.md` files (with frontmatter). These become slash commands and can auto-activate.
- `agents/` — Custom agent/role definitions (`.toml` + prompt `.md`).
- `personas/` — Behavioral personas for subagents (`.toml` files).
- `rules/` — Additional project-specific markdown rules.
- `config.toml` — Project-scoped configuration (MCP servers, plugin settings, skill paths, etc.).

Grok automatically discovers these when you work in the repo.

## Relationship to the `agents/` folder

The top-level `agents/` directory contains **portable** versions of the same knowledge, intended for use with Claude, Cursor, Copilot, and other tools.

Use `.grok/` when you want the richest experience inside Grok itself.

See the root `AGENTS.md` and `agents/STRUCTURE.md` for the full picture and cross-tool guidance.