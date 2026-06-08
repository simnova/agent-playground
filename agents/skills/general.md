# General Guidance for Agents in this Repo

See the root `AGENTS.md` and the files under `agents/` for the main reusable instructions.

When working here:
- Leverage the existing structure for skills/agents/personas.
- Keep new capabilities documented in a way that works for Grok (full SKILL.md etc.) and for other tools (plain markdown).
- The two main UIs (staff + public) share a backend — changes to one often have implications for the other and the api.

This directory (`agents/`) is the portable layer. The `.grok/` directory has the full-powered versions.