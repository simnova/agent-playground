# Skill Creator (Portable)

Portable guidance for creating new skills in this repo's format.

See the detailed version in `.grok/skills/skill-creator/SKILL.md`.

High-level for other tools:
- Follow Agent Skills spec: SKILL.md with frontmatter (name, description with triggers).
- For this monorepo: reference paths like apps/api/src/graphql/, staff/public UIs with Apollo + AntD, portless, shared packages.
- Create rich in .grok/skills/ and portable in agents/skills/.
- Use the structure from existing skills (e.g., update-graphql, apollo-*).
- Make portable .md self-contained but point to .grok for full.

This helps maintain the dual (Grok + other agents) system.
