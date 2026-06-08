# Apollo Server (Portable)

Portable version of the apollo-server skill.

Use for building/maintaining the GraphQL server in apps/api (Hono + Apollo Server integration, Azure Functions adapter).

## Key Locations in This Repo
- Backend: apps/api/src/app.ts (Hono + honoMiddleware), src/graphql/schema.ts, resolvers.ts, context.ts, functions/graphql.ts
- UIs: staff/public using Apollo Client against https://api.localhost/graphql (portless)
- Custom skills: update-graphql (for changes), implement-feature

## Guidelines (from Apollo + monorepo)
- Use Apollo Server 4.x/5 patterns with Hono integration (not standalone for prod).
- Type context, use GraphQLError.
- Keep schema in sync with UIs via update-graphql skill.
- Test with portless, respect CORS for .localhost.
- Coordinate with graphql-schema, apollo-client, apollo-mcp-server skills.

See the full Grok version at `.grok/skills/apollo-server/SKILL.md` for details and monorepo adaptations.
