# agentPlayground

**A playground and living laboratory for advanced, self-improving AI agent teams.**

Focused on Grok but designed to be portable across tools (Claude, Cursor, GitHub Copilot, and more). Explore rich multi-agent orchestration, specialized personas, cost-conscious model tiers, real browser-based functional verification, and continuous self-improvement — all while building a modern full-stack monorepo.

## Why agentPlayground?

Traditional agent setups often rely on assumptions: "the code compiles, the review passed, so it must work." This project changes that.

- **Orchestrated team of specialists**: An `orchestrator` (servant leader) coordinates personas like `front-end-developer`, `back-end-developer`, `ux-designer`, `architect`, `product-owner`, `muse` (drawing inspiration from the historical BankBuckets long-term budgeting methodology with % allocations, spillover, caps, and goals), and more.
- **Real functional verification**: The new `browser-verifier` persona uses the [agent-browser](https://agent-browser.dev/) CLI to actually drive the live UIs (`https://staff.localhost`, `https://public.localhost`) with structured `@eN` element references, fill/click/wait flows, and snapshots. No more guessing — see what a real user would experience.
- **Cost-conscious & tiered intelligence**: Work starts on fast/cheap models (deepseek-4-fast "juniors"), escalates to stronger ones (deepseek-4-pro, grok-4-fast "seniors", grok-4-pro "experts") only when needed, then explicitly **descales** back to cheap agents for follow-on work using clean handoffs + shared todos.
- **Self-improving system**: The `agent-evaluator` (powered by the `analyze-agent-performance` skill) periodically reviews real execution data — Grok logs (tokens, model time, escalation success), todo progress, terminal outputs, **and actual browser verification results**. It proposes targeted refinements to personas, prompts, model defaults, and orchestration rules. The team literally gets smarter and more efficient over time.
- **Practical full-stack foundation**: Vite + React + Ant Design (primary) + Apollo Client UIs, Hono + Apollo GraphQL + Mongoose backend, Turborepo + pnpm, strict TypeScript 7 + tsgo, portless for stable HTTPS .localhost dev, and rich skills/personas for portability.

Whether you're researching advanced agent patterns, building your own team-based workflows, or just want a clean modern monorepo with real AI augmentation — this is the place.

## The Agent Team

The orchestrator manages a cross-functional team using `spawn_subagent` + personas (defined in `.grok/personas/` for Grok power and `agents/personas/` for portability). Key members include:

- **orchestrator** (grok-4-fast): Servant leader that breaks down work, manages the model escalation/descale chain, schedules performance reviews, and synthesizes results.
- **muse** (deepseek-4-pro): Historian and specialist inspired by the classic BankBuckets app. Brings long-term, percentage-driven, spillover-capable budgeting concepts into the modern stack.
- **browser-verifier** (grok-4-fast): Drives the actual browser with agent-browser to verify UIs are truly functional (not just "the code looks good").
- **agent-evaluator** (deepseek-4-fast): Cheap, data-driven analyst that measures productivity, token efficiency, escalation success, descaling effectiveness, and real browser pass rates — then proposes refinements.
- **front-end-developer**, **back-end-developer**, **ux-designer**, **architect**, **product-owner**, and supporting personas (reviewer, etc.).

See [AGENTS.md](AGENTS.md) and [agents/STRUCTURE.md](agents/STRUCTURE.md) for the full model.

## Screenshots

Screenshots are captured directly by the `browser-verifier` persona using `agent-browser screenshot` (and the `verify-ui-with-browser` skill) as new functionality is implemented. They are committed here so you can see real progress on GitHub.

**Staff App (Internal Portal)**

![Staff App](screenshots/staff-hero.png)

**Public App (Customer-Facing)**

![Public App](screenshots/public-hero.png)

*More targeted screenshots (message flows, future bucket budgeting UIs, verification runs, etc.) will be added automatically as the self-improving team builds and validates features.*

## Getting Started

### Local Development with Portless (Recommended)

This monorepo uses [portless](https://github.com/vercel-labs/portless) for stable HTTPS URLs like `https://staff.localhost` — perfect for realistic testing, cookies, and agent-browser verification.

```sh
# Trust the local CA (may prompt for sudo)
pnpm exec portless trust

# Start everything (staff + public + api) through the proxy
pnpm dev
```

Access the apps:
- Staff: https://staff.localhost
- Public: https://public.localhost
- GraphQL: https://api.localhost/graphql

See the full portless section below for escape hatches and direct usage.

### The Agent System

- Use `/agents` or `/personas` in the Grok TUI to explore.
- The orchestrator (you or a subagent) uses `spawn_subagent` with personas for collaboration.
- Self-improvement runs via `agent-evaluator` + `analyze-agent-performance` (includes real browser checks).
- All definitions are portable (Claude, Cursor, Copilot, etc. can use the `agents/` markdown versions).

## Architecture & Advanced Features

- **Monorepo**: Turborepo + pnpm workspaces, Vite (staff/public), Hono + Apollo (api with Mongoose).
- **Agent Capabilities**: Rich skills in `.grok/skills/` (Grok-native) and `agents/skills/` (portable). Custom personas with model/reasoning overrides.
- **Cost-Conscious Orchestration**: Explicit escalation (juniors → seniors) + descaling for follow-up work.
- **Real Verification Loop**: `browser-verifier` + agent-browser ensures the UIs are actually usable. Results drive the evaluator.
- **Self-Improvement**: Logs + browser outcomes → metrics → persona/prompt refinements → better future runs.

See:
- [AGENTS.md](AGENTS.md) — Primary instructions and team model.
- [.grok/personas/](.grok/personas/) and [agents/personas/](agents/personas/) — Persona definitions.
- The `analyze-agent-performance` and `verify-ui-with-browser` skills.

## Utilities & Tooling

- TypeScript 7 + `tsgo` (native Go compiler) for fast, strict checking.
- Biome for lint/format.
- Knip for dead code detection.
- Portless for HTTPS dev.
- agent-browser for agent-driven browser automation and verification.

## Useful Commands

```sh
pnpm dev                 # Full dev with portless
pnpm build               # Build everything
pnpm check-types         # Strict TS7 check with tsgo
pnpm lint:fix            # Biome fixes
pnpm knip                # Dead code / unused analysis
```

## License & Contributing

This is an open playground for agent experimentation. Contributions that advance the self-improving team model, add new personas/skills, or improve verification are especially welcome.

---

*Built as a showcase for what sophisticated, cost-aware, self-improving agent teams can achieve when given real feedback loops (logs + actual browser interactions) instead of assumptions.*