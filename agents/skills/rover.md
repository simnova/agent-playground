# Rover (Portable)

Portable version of the rover skill.

Use for managing GraphQL schemas with Apollo Rover CLI in this monorepo.

## Key Locations
- Schema: apps/api/src/graphql/schema.ts
- Backend: apps/api (Hono + Apollo)
- Clients: staff/public UIs
- Local: https://api.localhost/graphql via portless

## Common Uses
- Introspect local schema: rover subgraph introspect https://api.localhost/graphql
- Validate changes with rover subgraph check (if using GraphOS)
- Local dev with rover dev
- Explore schema with rover schema describe / search (pipe from fetch)

See the full version at `.grok/skills/rover/SKILL.md` for monorepo integration with update-graphql etc.
