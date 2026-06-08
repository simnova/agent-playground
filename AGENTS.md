# AGENTS.md - Agent Playground

This repository is a playground and library for AI agent capabilities, focused on Grok but designed for portability across tools (Claude, Cursor, GitHub Copilot, etc.).

## Project Philosophy

- **Reusable definitions**: Skills, agents, personas, and rules live in version control under `.grok/` and top-level files.
- **Cross-tool friendly**: Core instructions are in this file and sub-`AGENTS.md` files so Claude, Cursor, Copilot, and others can consume them.
- **Grok-native power**: Full use of skills (`SKILL.md`), custom agents, personas, MCP, and subagents is available when using the Grok TUI / `grok` CLI.

## Directory Structure for Agents

```
.grok/
  skills/           # Grok skills (SKILL.md with frontmatter)
  agents/           # Custom agent/role definitions
  personas/         # Subagent behavioral personas (.toml)
  rules/            # Additional project rules (markdown)
  config.toml       # Project MCP servers, permissions, etc.

agents/             # Portable / human-readable agent library
  skills/
  personas/
  roles/

AGENTS.md           # This file (primary cross-tool instructions)
CLAUDE.md           # Claude-specific extensions
.cursorrules        # Cursor rules
.github/copilot-instructions.md  # GitHub Copilot instructions
```

Grok automatically discovers:
- Skills from `.grok/skills/` and `.agents/skills/`
- Project rules from `AGENTS.md`, `Claude.md`, etc. (and `.grok/rules/`)
- Agents and personas from the `.grok/` subdirectories

## How to Use With Different Tools

**Grok (this TUI / CLI)**:
- Skills appear as `/skill-name` slash commands and can auto-activate.
- Use `/agents` or `/personas` to manage.
- Subagents (`spawn_subagent`) can use custom roles + personas.
- Full tool access + MCP integration via `.grok/config.toml`.
- For Turborepo-specific work (pipelines, caching, `--filter`, internal packages, monorepo structure), use the official **turborepo** skill (`/turborepo`). It lives in `.grok/skills/turborepo/` and `.agents/skills/turborepo/`.

**Claude (Claude Code / Projects / Artifacts)**:
- Claude loads `AGENTS.md`, `CLAUDE.md`, `Claude.md`, and `.claude/rules/`.
- Copy key procedures from this file or skills into your project knowledge.
- For complex workflows, use the markdown bodies from `.grok/skills/*/SKILL.md`.

**Cursor**:
- Cursor respects `.cursorrules`, `AGENTS.md`, and `.cursor/rules/`.
- The rules in this repo are written to be directly usable.

**GitHub Copilot**:
- Uses `.github/copilot-instructions.md` and workspace-level instructions.
- We maintain a version that references the core guidance here.

**Other tools** (Windsurf, Continue.dev, Aider, etc.):
- Most look for `AGENTS.md` or similar at the repo root or in context.
- Point them at this file + relevant subdirectories.

## Core Conventions (Apply Everywhere)

- Use TypeScript + strict mode where possible (see `packages/config-typescript`).
- Prefer composition over inheritance.
- Write clear, testable code with good naming.
- For UI work (staff/public Vite apps): Ant Design is the primary component library. Use the shared `AntdProvider` from `@repo/ui`.
- Backend (api): Hono + Apollo GraphQL. Keep it lightweight.
- Always respect the existing monorepo structure (Turborepo + pnpm workspaces).
- Use Biome for lint/format, Knip for dead code, tsgo for type checking.
- When adding capabilities, consider portability (skills/personas should have clear markdown explanations).

## Skills in This Repo

Skills are located in `.grok/skills/<name>/SKILL.md`.

See individual skill files for detailed procedures (e.g. code review, feature implementation, documentation, etc.).

Grok users: invoke with `/<skill-name>` or let it auto-trigger based on the description.

Other tools: Treat the body of `SKILL.md` as high-quality, step-by-step instructions you can paste into custom instructions or rules.

## Agents and Personas

- Custom agent roles live in `.grok/agents/`.
- Personas (for subagents) live in `.grok/personas/`.

These allow specialized behavior (e.g. "researcher", "strict-reviewer", "implementer").

## Getting Started with Agent Work in This Repo

1. Read this `AGENTS.md` and the relevant `AGENTS.md` in subdirectories.
2. Explore `.grok/skills/`.
3. For Grok users: Use the agents modal (`/agents`) and skills.
4. When contributing new capabilities, add them under `.grok/` with good documentation so other tools can benefit too.

## Subdirectory Rules

Subdirectories may contain their own `AGENTS.md` for more specific guidance (e.g. `apps/staff/AGENTS.md` for staff-portal specific patterns). Deeper files take precedence.

---

*This file is the canonical source for agent instructions in the repo. Update it when project-wide conventions change.*

## Team of Specialized Agents (for Complex Work)

The project defines a cross-functional team of personas for subagent collaboration. The main agent acts as **orchestrator** (servant leader) and delegates to specialists via `spawn_subagent`.

**Defined Personas** (Grok-native in `.grok/personas/*.toml`, portable in `agents/personas/*.md`):

- **front-end-developer**: React + Ant Design (primary) + Apollo Client expert for staff/public UIs and @repo/ui. Follows antd conventions, review-component skill, shared theming.
- **back-end-developer**: Bun + Hono + Apollo GraphQL + Mongoose expert for apps/api. Handles schema, resolvers, context, Azure adapter, mongodb-memory-server for tests.
- **ux-designer**: UX patterns, accessibility, critiques, flows, and specs. Strong on Ant Design systems and balancing staff vs public experiences.
- **product-owner**: Visionary who proposes iterative expansions, prioritizes, gives feedback on progress, and translates ideas into briefs.
- **architect**: Guardian of maintainability, evolvability, performance, and system qualities. Enforces AGENTS.md/Turborepo/AntD/Apollo patterns and flags technical debt.
- **orchestrator** (default for main agent): Coordinates the team. Spawns subagents with the right persona + cross-role context. Uses `todo_write` for shared progress. Ensures balance (no voice dominates), productivity, and clean handoffs. Servant leader who synthesizes results.
- **muse**: Creative specialist and historian of the BankBuckets long-term budgeting system (percent allocations of deposits, MaxAmount caps, SpillOverOrder + spillover buckets for automatic prioritized long-term funding, hierarchical buckets, linkage to aspirational Goals). Has **exclusive** access to the full source at `/Volumes/files/src/bankbuckets`. The product-owner consults the muse closely; the muse may use deepseek4pro for large-context synthesis and summons **muse-eyes** for any image or design analysis.
- **muse-eyes**: Vision + codebase partner to the muse. Uses Grok models (with image understanding) + full access to the agentPlayground monorepo to analyze old BankBuckets visuals (designs, screenshots) or current UIs and provide concrete modern mappings (AntD components, Apollo patterns, Mongoose models, etc.). Enables rich back-and-forth with the muse.

**How the Team Works Together**
- Orchestrator breaks work, creates/updates todos, spawns subagents (embed persona instructions + relevant outputs from other roles in the prompt).
- Run independent work in parallel (`background: true` where useful).
- The product-owner works especially closely with the **muse** (who has exclusive access to the BankBuckets source and methodology); the muse in turn converses with **muse-eyes** for visual analysis needs. The orchestrator facilitates these specialist handoffs (spawn/resume_from) and keeps all voices balanced.
- Collect via `get_command_or_subagent_output` / `wait_commands_or_subagents`.
- Iterate with `resume_from` or new spawns.
- Synthesize balanced output for the user, always crediting the team contributions.
- Use existing project skills (review-component, implement-feature, update-graphql, etc.) heavily.

See `.grok/personas/README.md`, `agents/personas/README.md`, `agents/STRUCTURE.md`, and the Grok user-guide (subagents + personas sections) for details on definition and `spawn_subagent` usage.

When the task is complex or benefits from multiple perspectives, the orchestrator will proactively use the team rather than doing everything alone.