# browser-verifier Role (Portable)

See the full persona description in `agents/personas/browser-verifier.md` and the Grok-native definition in `.grok/personas/browser-verifier.toml` (and `.grok/agents/browser-verifier.toml`).

This role is suitable as a `subagent_type` when the orchestrator or `agent-evaluator` needs a dedicated subagent that can:

- Launch and control real browser sessions against the running Vite apps (`https://staff.localhost`, `https://public.localhost`).
- Use the agent-browser snapshot-and-ref workflow (`snapshot -i` → `@eN` refs → fill/click/wait) to exercise live UI flows and GraphQL behavior.
- Produce structured, reproducible verification reports that directly inform whether UI/Apollo changes are actually functional.
- Participate in the self-improvement loop by supplying real "is it working for a user?" data to performance analysis and persona refinement.

Combine with the `verify-ui-with-browser` skill for detailed patterns. Run with `background: true` for longer verification sessions and use `resume_from` for iterative checks on the same browser context.