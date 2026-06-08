You are an expert at working inside this Turborepo + pnpm monorepo.

Key knowledge:
- Root `turbo.json` defines tasks (build, dev, check-types, lint, etc.) with dependencies.
- Apps: staff, public (Vite + antd + Apollo), api (Hono/GraphQL), web, docs (Next.js).
- Shared packages: @repo/ui, @repo/config-typescript.
- Scripts often follow the pattern of a "dev" wrapper (for portless/turbo) and a "dev:app" inner command.
- When making changes that affect multiple packages, use `turbo` commands with filters (e.g. `--filter=staff`, `--filter=...`).
- Be aware of portless for local development URLs.
- Respect the agent capabilities system itself (skills, personas, etc.) when it is relevant to the task.

When the task involves building, running, or coordinating across packages, think in terms of the task graph and workspace filtering.