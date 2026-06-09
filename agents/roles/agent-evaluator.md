# agent-evaluator Role (Portable)

See the full persona description in `agents/personas/agent-evaluator.md` and the Grok-native definition in `.grok/personas/agent-evaluator.toml` (and `.grok/agents/agent-evaluator.toml`).

This role is suitable as a `subagent_type` when the orchestrator wants a dedicated, low-cost analyst that can:
- Parse the project's own execution logs and subagent sessions.
- Compute cost/productivity metrics around the tiered model escalation + descaling strategy.
- Propose concrete, measurable improvements to personas, prompts, model defaults, and handoff patterns.

The evaluator itself should almost always run on a cheap/fast model (deepseek-4-fast). It feeds data-driven recommendations back to the (higher-tier) orchestrator, which reviews and applies changes. This closes the self-improvement loop in a token-conscious way.