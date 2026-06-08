# Agent Capabilities in agentPlayground

This repository is designed as a living example and library of reusable agent definitions that work well with **Grok** while remaining useful to **Claude, Cursor, GitHub Copilot, and other coding agents**.

## Quick Start for Different Tools

**Using Grok (the TUI / `grok` CLI):**
- Skills are available as slash commands (`/implement-feature`, `/review-component`, `/add-antd-component`, etc.).
- Custom agents and personas are available via the agents modal or `spawn_subagent`.
- Project rules from `AGENTS.md` + `.grok/rules/` are loaded automatically.
- Everything under `.grok/` is first-class.

**Using Claude, Cursor, Copilot, Aider, etc.:**
- Start by reading the root `AGENTS.md`.
- For detailed procedures, read the corresponding file under `agents/skills/`, `agents/personas/`, or `agents/roles/`.
- These are written as high-quality, self-contained instructions that can be pasted into custom instructions, rules, or project context.
- The structure under `agents/` is intentionally portable.

## Source of Truth vs Portable Layer

- **Rich / Grok-native definitions** live in `.grok/`:
  - `skills/<name>/SKILL.md` (with frontmatter for auto-invocation, allowed tools, etc.)
  - Includes the official `turborepo` skill (installed from vercel/turborepo) plus custom ones for this monorepo (Ant Design, GraphQL, portless, etc.)
  - `personas/<name>.toml`
  - `agents/<name>.toml` + prompt file
  - `rules/*.md`
  - `config.toml` (project MCPs, etc.)

- **Portable versions** live in `agents/` (plain markdown). These are what other tools consume most easily.

- Root compatibility files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`) tie everything together and give instructions to the respective tools.

## Contributing New Capabilities

When adding something new:
1. Create the full-powered version in the right place under `.grok/`.
2. Create (or update) a clean portable `.md` version in the matching `agents/<category>/`.
3. Mention it in the relevant root file (`AGENTS.md` etc.) if it should be highlighted.
4. Consider whether it should also be exposed as a skill that Grok can invoke by name.

This dual approach lets the repo serve as both a powerful Grok workspace and a reusable library for the broader agent ecosystem.

See `agents/STRUCTURE.md` and the root `AGENTS.md` for more details.