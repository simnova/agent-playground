---
name: create-new-skill
description: Create a new well-formed Grok skill (SKILL.md with frontmatter) inside .grok/skills/, and optionally a portable version in agents/skills/. Use when the user wants to capture a repeatable workflow as a reusable skill in this repo.
---

# Create New Skill Skill (Meta)

This is a meta-skill for expanding the capabilities of this repository.

## Steps

1. **Understand the workflow**
   - What repeatable task does the user want to capture?
   - Is it specific to this monorepo (e.g. "add new antd component following our patterns", "update GraphQL while keeping both UIs in sync")?

2. **Choose scope and name**
   - Name should be lowercase, hyphenated, clear (e.g. `add-graphql-field`, `setup-mcp-server`).
   - Decide if it belongs in `.grok/skills/` (Grok-first) and `agents/skills/` (portable).

3. **Write the SKILL.md**
   - Start with YAML frontmatter:
     ```yaml
     ---
     name: the-name
     description: Clear one-sentence description of when to use this skill. Mention key triggers.
     ---
     ```
   - Write clear, step-by-step instructions.
   - Reference specific files and packages in this repo when relevant.
   - Mention related skills or AGENTS.md sections.
   - Include verification steps (biome, tsgo, etc.).
   - If the skill should be invocable as a slash command, leave `user-invocable` default (true).

4. **Create the portable version (recommended)**
   - Write a clean `.md` version in `agents/skills/<name>.md`.
   - It should be useful even without Grok's frontmatter (for Claude, Cursor, Copilot, etc.).
   - Reference the full version in `.grok/skills/`.

5. **Update documentation**
   - Mention the new skill in `AGENTS.md` or `agents/OVERVIEW.md` / `agents/STRUCTURE.md` if it is broadly useful.
   - Consider adding it to any relevant agent role or persona.

6. **Test**
   - After creating, try invoking it (for Grok users) or have the user test the instructions.
   - Run `grok inspect` (or equivalent) to confirm it was discovered.

## Output
- Create the full `SKILL.md`.
- Create the portable markdown version.
- Update any cross-references.
- Give the user the exact paths and how to invoke it.