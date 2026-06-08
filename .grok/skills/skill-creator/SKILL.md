---
name: skill-creator
description: >
  Guide for creating effective skills for Apollo GraphQL and GraphQL development in this agentPlayground repo. Use this skill when:
  (1) creating a new skill (e.g., for GraphQL, AntD UI, portless, Turborepo tasks),
  (2) updating existing skills like the custom update-graphql or the Apollo ones,
  (3) learning best practices for SKILL.md in .grok/skills/ or portable in agents/skills/.
  Follow the structure used in this monorepo: rich frontmatter for Grok, references to specific files (apps/api/src/graphql/, staff/public, packages/, portless), coordination with other skills, and portable .md versions.
license: MIT
compatibility: Agent Skills format for Grok and other tools.
metadata:
  author: apollographql (adapted)
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep run_terminal_command search_replace
---

# Skill Creator Guide (agentPlayground Monorepo)

This meta-skill helps create skills following the Agent Skills spec, tailored to this Turborepo with GraphQL (Apollo Server/Client), Ant Design UIs, portless, etc.

## Directory Structure in This Repo

- .grok/skills/<name>/SKILL.md : Rich for Grok (frontmatter, allowed-tools, references to monorepo paths)
- agents/skills/<name>.md : Portable markdown for Claude/Cursor/Copilot
- Use subdirs for references/ if complex.

See existing: .grok/skills/ has update-graphql, implement-feature, apollo-*, etc. agents/skills/ has matching .md

## SKILL.md Format (Adapted)

Frontmatter:

```yaml
---
name: my-skill
description: >
  Clear triggers: (1) ..., (2) ...
license: MIT
compatibility: ...
metadata:
  author: ...
  version: "1.0.0"
allowed-tools: Read Write ... run_terminal_command search_replace
---
```

Body: Overview, Process (with checkboxes), Quick Reference, Security (if sensitive), References (link to other skills/files in repo), Key Rules, Ground Rules (ALWAYS/NEVER tied to this monorepo's conventions like using tsgo, Biome, portless URLs, AntDProvider, shared packages).

## Best Practices for This Repo

- Reference specific paths: apps/api/src/graphql/schema.ts, apps/staff/src/App.tsx, packages/ui/src/antd-provider.tsx, portless.json, turbo.json, etc.
- Tie to existing skills: "Use with update-graphql when changing API", "Coordinate with add-antd-component for UIs".
- For portable: Keep the .md version clean but reference the .grok one.
- Use the create-new-skill skill itself for meta.
- Follow Apollo Voice: approachable, opinionated, direct.
- Progressive disclosure: SKILL.md <500 lines, refs for details.
- Security: Add ## Security section if config/code affects data/auth (e.g., for MCP or schema).

## Progressive Disclosure & Structure

- Frontmatter for discovery.
- Instructions in SKILL.md.
- references/ for deep dives (e.g., monorepo-specific patterns).
- Scripts/templates if needed (e.g., for validation with tsgo/biome).

## Ground Rules

- ALWAYS make descriptions trigger-specific with (1) (2) lists.
- ALWAYS use checkboxes for steps.
- ALWAYS link references to this repo's files and other skills.
- NEVER exceed limits; use refs.
- COORDINATE new skills with the agent system (subagents, personas, .grok/config.toml).
- PREFER skills that help with the stack: GraphQL, AntD, Turborepo, portless, TS7/tsgo, Biome.

## References

- Official skill-creator (apollo-skills.md for Apollo specifics).
- This repo: agents/STRUCTURE.md, agents/OVERVIEW.md, .grok/README.md, existing skills like create-new-skill, update-graphql, apollo-*.
- User guide for .grok/skills/ format.

Use this to expand the skills library in agentPlayground, keeping it useful for Grok and portable for other agents.
