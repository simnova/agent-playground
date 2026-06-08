# Skills

This directory contains Grok-native skills (directories with `SKILL.md`).

Each skill has:
- YAML frontmatter (`name`, `description`, optional fields like `allowed-tools`, `user-invocable`, etc.)
- A markdown body with step-by-step instructions, context gathering, verification steps, etc.

Skills can be invoked explicitly with `/<name>` or triggered automatically based on the `description`.

## Current Skills (including Apollo GraphQL ones)

- review-component
- add-ui-component
- add-antd-component
- implement-feature
- update-graphql
- configure-portless
- add-new-vite-app
- create-new-skill
- apollo-server
- apollo-client
- graphql-schema
- graphql-operations
- apollo-mcp-server
- rover
- apollo-federation
- apollo-connectors
- skill-creator
- apollo-router
- turborepo

Portable versions of the procedures (stripped of Grok-specific frontmatter) live in `agents/skills/`.

This dual structure makes the knowledge powerful for Grok while still usable by Claude, Cursor, Copilot, and other agents.

See the root `AGENTS.md` and `agents/STRUCTURE.md` for the big picture and cross-tool guidance.
