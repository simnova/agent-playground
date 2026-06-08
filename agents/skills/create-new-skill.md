# Create New Skill (Portable)

Portable guidance for authoring new reusable procedures in this repository.

See the detailed Grok-native version in `.grok/skills/create-new-skill/SKILL.md`.

High-level:
- Write a clear, named procedure as markdown.
- Put the rich version (with any frontmatter or tool notes) in `.grok/skills/<name>/SKILL.md`.
- Put a clean, tool-agnostic version in `agents/skills/<name>.md`.
- Reference it from AGENTS.md or the agents/ overview when it is generally useful.
- Make sure the instructions are specific enough that another model (Claude, etc.) can follow them without the Grok activation system.

This pattern lets the same knowledge be powerful for Grok while still being valuable to other coding agents.