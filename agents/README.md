# Agents, Skills & Personas Library

This directory contains **portable, tool-agnostic** versions of the capabilities defined in this repository.

## Purpose

- `.grok/` contains the **Grok-native** definitions (full power: SKILL.md frontmatter, .toml personas with contracts, etc.).
- `agents/` contains simplified Markdown / documentation versions that other tools can easily consume:
  - **Claude** (via CLAUDE.md or project knowledge)
  - **Cursor** (via .cursorrules or rules)
  - **GitHub Copilot** (via .github/copilot-instructions.md)
  - Aider, Continue, Windsurf, Cline, etc. (most respect AGENTS.md or similar)

## Structure

```
agents/
  README.md
  skills/           # Markdown versions of procedures
  personas/         # Behavioral instructions
  roles/            # Agent role descriptions
```

The source of truth for Grok remains under `.grok/`.

## How to Use

1. Point your tool at the root `AGENTS.md`.
2. For specific workflows, load the relevant file from `agents/skills/` or `agents/personas/`.
3. For Grok users: the richer versions in `.grok/skills/`, `.grok/personas/`, and `.grok/agents/` are automatically available.

See the root `AGENTS.md` for the full system overview and cross-tool guidance.