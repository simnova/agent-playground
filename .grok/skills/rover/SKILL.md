---
name: rover
description: >
  Guide for using Apollo Rover CLI to manage GraphQL schemas in this monorepo. Use this skill when:
  (1) publishing or fetching the schema for the shared backend (apps/api),
  (2) composing or validating schemas,
  (3) running local supergraph development with rover dev (useful even for single subgraph),
  (4) validating schema changes with check and lint,
  (5) exploring the schema for agent-driven discovery.
  Coordinate with update-graphql, graphql-schema, and the agent skills system. Use portless local endpoint https://api.localhost/graphql for dev.
license: MIT
compatibility: Node.js, requires Rover CLI. Works with the Hono/Apollo setup in apps/api.
metadata:
  author: apollographql (adapted for agentPlayground monorepo)
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep run_terminal_command search_replace
---

# Apollo Rover CLI Guide (agentPlayground Monorepo)

Rover is the official CLI for Apollo GraphOS and schema management. In this monorepo, use it to manage the GraphQL schema in `apps/api/src/graphql/schema.ts` and the resolvers/context.

The API is a single Apollo Server (Hono + adapter), but Rover is still useful for introspection, validation, and future federation.

## Quick Start in This Repo

### Install Rover

```bash
# macOS/Linux
curl -sSL https://rover.apollo.dev/nix/latest | sh

# npm (cross-platform)
npm install -g @apollo/rover
```

### Authenticate (if using GraphOS)

```bash
rover config auth
# or export APOLLO_KEY=...
```

### Common Commands Tailored

- Explore schema: `rover graph fetch <graph-ref> | rover schema describe -` or for local: use introspection.

For local dev with portless:

Use `rover subgraph introspect https://api.localhost/graphql` to get the schema.

- Validate changes: `rover subgraph check <graph-ref> --name api --schema ./apps/api/src/graphql/schema.ts`

- For local supergraph dev (even single): `rover dev --supergraph-config supergraph.yaml` (create a config pointing to local subgraph).

See the monorepo's update-graphql skill for when schema changes.

## Integration with Agent Skills

- Use with `graphql-schema` and `graphql-operations` for design and client queries.
- With `update-graphql` when evolving the API.
- Expose via MCP (see apollo-mcp-server skill) so agents can use Rover-like tools if configured.
- For the UIs (staff/public): after schema changes, update client operations and test via portless.

## Ground Rules for This Repo

- ALWAYS use the local portless URL for dev introspection: https://api.localhost/graphql
- COORDINATE with custom skills: update-graphql for full-stack changes, implement-feature for new backend features.
- USE rover to validate before deploying the api (Azure Functions).
- REFERENCE the schema file apps/api/src/graphql/schema.ts and the Hono integration in app.ts.

## References

- Official rover skill references (subgraphs, graphs, supergraphs, dev, schema, configuration).
- This repo: apps/api/src/graphql/* , the staff/public clients.
- Related skills: apollo-server, graphql-schema, update-graphql, apollo-mcp-server.

Use this to manage and explore the GraphQL schema in the monorepo.
