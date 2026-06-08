# Apollo MCP Server (Portable)

Portable version of the apollo-mcp-server skill.

Use when setting up or using Apollo MCP Server to connect AI agents with your GraphQL API in this monorepo.

## Key Locations in This Repo
- Backend: `apps/api` (Hono + Apollo Server)
- Schema: `apps/api/src/graphql/schema.ts`
- UIs: `apps/staff` and `apps/public` using Apollo Client
- Local dev: portless domains like `https://api.localhost/graphql`
- Agent skills: `.grok/skills/` and `agents/skills/`

## Quick Start
Install Apollo MCP Server and configure to point at your API endpoint (use portless local or deployed).

Use the built-in tools (introspect, search, validate, execute) or define custom tools from your operations.

## Integration with This Repo
- Use with `update-graphql` skill when schema changes.
- Expose your GraphQL as tools for Grok agents, Claude, etc., via MCP.
- Great for the agentPlayground theme - agents can query the backend to inform UI changes, etc.

See the full Grok version with monorepo specifics at `.grok/skills/apollo-mcp-server/SKILL.md`.
