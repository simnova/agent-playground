# Agent Capabilities Structure in this Repository

This repo provides a multi-tool agent definition system.

## Grok-Native (Full Features)

Located in `.grok/` (and also discoverable from `.agents/`):

- **Skills**: `.grok/skills/<name>/SKILL.md`  
  Full Grok skills with YAML frontmatter, description for auto-invocation, steps, and tool guidance. Activated via `/skill-name` or automatically.

- **Agents / Roles**: `.grok/agents/<name>.toml` + optional `.md` prompt file  
  Define custom agent types with model, capability mode, prompt, etc. Usable with `spawn_subagent`.

- **Personas**: `.grok/personas/<name>.toml`  
  Behavioral overlays for subagents (tone, format, input/output contracts). Can specify model and reasoning effort.

- **Rules**: `.grok/rules/*.md`  
  Additional project instructions loaded by Grok.

- **Config**: `.grok/config.toml`  
  Project-scoped MCP servers, plugin settings, skill paths, etc.

Grok also loads root-level project rules: `AGENTS.md`, `Claude.md`, `CLAUDE.md`, `AGENT.md`, etc.

## Portable / Cross-Tool Versions

Located in `agents/` at the repo root. These are designed to be readable and useful by:

- Claude (Projects, Artifacts, Claude Code)

## The Orchestrated Team

This project defines a full cross-functional team using the agent/persona system (see `.grok/personas/` and `agents/personas/`, plus roles in `.grok/agents/` and `agents/roles/`):

- front-end-developer, back-end-developer, ux-designer, product-owner, architect, orchestrator.
- **muse** — Deep specialist in the historical BankBuckets long-term budgeting methodology (percent-driven automatic allocation, MaxAmount caps, SpillOverOrder waterfall for prioritized long-term goals, hierarchical buckets, Goal linkage). Has **exclusive** access to the full source tree at `/Volumes/files/src/bankbuckets`. The product-owner consults the muse closely for scope that realizes this methodology in the modern codebase.
- **muse-eyes** — Vision-enabled partner (Grok models) to the muse. Has full access to the agentPlayground codebase and can analyze images (old BankBuckets designs/screenshots in the historical repo or current UIs). The two converse to drive visual and implementation direction.

The main agent acts as **orchestrator** (servant leader) and uses `spawn_subagent` (with embedded persona instructions + cross-role context) to run the team. Use `todo_write` for shared visibility. This enables balanced, multi-perspective work on complex tasks while keeping progress and quality in check.

See the updated root `AGENTS.md` (Team section) and the Grok user-guide docs on subagents/personas for details on usage and "conversing" via spawn → output → resume/spawn handoffs. The muse + muse-eyes pair is a special consulting relationship (product-owner works with muse; muse works with muse-eyes for images and codebase translation).
- Cursor
- GitHub Copilot / Codex
- Aider, Continue.dev, Cline, Windsurf, etc.

Contents:
- `skills/*.md` — Portable procedure descriptions (the body of the corresponding SKILL.md, without Grok-specific frontmatter).
- `personas/*.md` — Behavioral instructions.
- `roles/*.md` — Agent role descriptions.

These can be:
- Pasted into custom instructions / project knowledge.
- Referenced from `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, or `.github/copilot-instructions.md`.
- Used as context for any LLM coding agent.

## Root Compatibility Files

- `AGENTS.md` — Primary instructions. Loaded automatically by Grok. Respected by most other agent tools.
- `CLAUDE.md` — Claude-specific guidance (points to AGENTS.md + Claude paths).
- `.cursorrules` — Cursor rules.
- `.github/copilot-instructions.md` — GitHub Copilot workspace instructions.

These files instruct the respective tools to read the relevant parts of `agents/` and `.grok/`.

## How to Add New Capabilities

1. For Grok power users: Create the full definition in the appropriate `.grok/` subdirectory.
2. For portability: Create a clean `.md` version in the corresponding `agents/<category>/`.
3. Update the relevant root file (AGENTS.md, etc.) if the new capability should be highlighted.
4. If it's a procedure, consider writing it so the SKILL.md body and the portable .md are similar or one includes the other.

## Recommended Workflow

- Use Grok with this repo checked out → you get automatic `/skill` commands, custom agents via spawn_subagent, personas, full project rules, and any MCPs defined in `.grok/config.toml`.
- Use Claude / Cursor / Copilot on the same repo → they primarily read `AGENTS.md` + the markdown files under `agents/`. The procedures are still high-quality and actionable.

This gives the best of both worlds: rich, structured definitions for Grok + broadly usable instructions for other frontier coding agents.

See the root `AGENTS.md` for more project-specific guidance.