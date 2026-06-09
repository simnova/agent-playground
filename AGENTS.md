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

**Defined Personas + Model Tiers** (Grok-native in `.grok/personas/*.toml`, portable in `agents/personas/*.md`):

We use a cost-effective **escalation chain** across model tiers (deepseek-4-fast → deepseek-4-pro → grok-4-fast → grok-4-pro). The orchestrator manages this.

- **Juniors (deepseek-4-fast — almost free)**: front-end-developer (initial implementation), back-end-developer (straightforward resolvers/models).
- **Helpers (deepseek-4-pro — cheap)**: back-end-developer (complex data layer), ux-designer, product-owner (idea refinement), muse (large-context BankBuckets analysis — already set), thorough-reviewer (first-pass reviews).
- **Seniors (grok-4-fast — affordable)**: orchestrator (default), architect (most guidance), muse-eyes (vision + codebase translation), senior front-end/back-end work.
- **Experts (grok-4-pro)**: orchestrator on difficult coordination, architect on major refactors, final expert reviews when lower tiers are stuck.

**Core Personas**:
- **front-end-developer**: React + Ant Design (primary) + Apollo Client expert... (starts on deepseek-4-fast for speed/cost).
- **back-end-developer**: Bun + Hono + Apollo GraphQL + Mongoose... (often starts on deepseek-4-pro).
- **ux-designer**: UX patterns, accessibility, critiques... (deepseek-4-pro).
- **product-owner**: Visionary who proposes... (deepseek-4-pro for ideation).
- **architect**: Guardian of maintainability... (grok-4-fast).
- **orchestrator** (default for main agent): Coordinates the team, manages the model escalation chain, uses `spawn_subagent` (with `background: true` for persistence) + `resume_from` for handoffs. (grok-4-fast or grok-4-pro).
- **muse**: ... (deepseek-4-pro for large context on bankbuckets + current codebase).
- **muse-eyes**: ... (grok-4-fast — strong on vision + codebase).
- **agent-evaluator** (new): Cheap meta-analyst (deepseek-4-fast default). Reads the team's own Grok logs and execution data to measure real productivity and token efficiency, then proposes concrete refinements to personas, model tiers, descaling logic, and the orchestrator itself. See `analyze-agent-performance` skill. This creates a closed self-improvement loop for the entire agent system.
- **browser-verifier** (new): Uses the agent-browser CLI (`pnpm exec agent-browser open ...; snapshot -i` for @eN refs; fill/click/wait) to perform real functional verification of the live staff and public UIs over portless .localhost. Provides ground-truth "did the UI actually work for a user?" data (including after GraphQL mutations). Scheduled periodically by the orchestrator and feeds results into agent-evaluator. See the `verify-ui-with-browser` skill.

**How the Team Works Together (with Model Escalation)**
- Orchestrator breaks work, creates/updates todos, and spawns subagents using the tiered model strategy (deepseek-4-fast juniors first for most implementation/ideation, escalating via `resume_from` + previous subagent_id when stuck). Embed persona instructions + relevant outputs from other roles.
- Run independent work in parallel (`background: true` — this keeps agents initialized so they can be resumed later for back-and-forth conversation).
- The product-owner works especially closely with the **muse** (who has exclusive access to the BankBuckets source and methodology, using deepseek-4-pro); the muse in turn converses with **muse-eyes** (grok-4-fast) for visual analysis needs. The orchestrator facilitates these specialist handoffs (spawn/resume_from) and keeps all voices balanced.
- Collect via `get_command_or_subagent_output` / `wait_commands_or_subagents`.
- Iterate with `resume_from` (for continuing the same higher-tier agent) **or new spawns** of lower-tier agents (this is how you descale after a senior/expert has solved the hard part — hand routine follow-up work back to cheap juniors with a clean summary + todos).
- Periodically delegate to `agent-evaluator` (via the `analyze-agent-performance` skill) on cheap models. Explicitly include browser verification by spawning `browser-verifier` (using the `verify-ui-with-browser` skill) for UI/GraphQL scopes. Use the combined reports (log metrics + real browser pass/fail with @e refs) to adapt personas, model defaults, handoff rules (including descaling), and your own orchestration logic for better productivity at lower token cost.
- Synthesize balanced output for the user, always crediting the team contributions.
- Use existing project skills (review-component, implement-feature, update-graphql, analyze-agent-performance, etc.) heavily.

**Note on limits**: `background: true` + `resume_from` is the supported way to keep agents "alive" with conversation history. There are practical limits (context size when many agents are active in one session, cumulative cost even on cheap models, runtime concurrency), so the orchestrator should be thoughtful about how many concurrent background agents to maintain.

See `.grok/personas/README.md`, `agents/personas/README.md`, `agents/STRUCTURE.md`, and the Grok user-guide (subagents + personas sections) for details on definition and `spawn_subagent` usage.

When the task is complex or benefits from multiple perspectives, the orchestrator will proactively use the team rather than doing everything alone.