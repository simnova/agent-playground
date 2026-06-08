---
name: apollo-connectors
description: >
  Guide for writing Apollo Connectors schemas to integrate REST APIs into GraphQL. Use this skill when:
  (1) connecting REST services to the GraphQL backend in apps/api,
  (2) using @source and @connect directives,
  (3) implementing entity resolvers with batching from external APIs.
  In this monorepo, use to extend the Hono/Apollo API without duplicating logic. The staff/public UIs can then query unified data. Coordinate with graphql-schema, update-graphql, apollo-server. Test via portless https://api.localhost/graphql.
license: MIT
compatibility: Requires Rover. Fits Apollo Server / Hono in apps/api.
metadata:
  author: apollographql (adapted for agentPlayground)
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep run_terminal_command search_replace
---

# Apollo Connectors Schema Assistant (agentPlayground Monorepo)

Apollo Connectors let you declaratively integrate REST APIs into your GraphQL schema using @source and @connect.

## Process in This Repo

1. Research the REST API (ask for examples if needed).
2. Use the connectors-spec if available via MCP.
3. Create schema using the template, referencing apps/api/src/graphql/schema.ts style.
4. Validate with `rover supergraph compose` (even for single + connectors).
5. Execute/test with `rover connector run`.
6. Integrate into the Hono app if needed (connectors are schema-level, but may require router or server config).
7. Update UIs (staff/public) via implement-feature or update-graphql if new fields.

## Schema Template (Tailored)

```graphql
# Note to AI Friends: This is an Apollo Connectors schema...

extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.12")
  @link(url: "https://specs.apollo.dev/connect/v0.3", import: ["@source", "@connect"])

@source(name: "rest_api", http: { baseURL: "https://api.example.com" })

type Query {
  externalData(id: ID!): ExternalData
    @connect(
      source: "rest_api"
      http: { GET: "/data/{$args.id}" }
      selection: """
      id
      value
      """
    )
}
```

## Key Rules (Adapted)

- Use sub-selections for mapping.
- For entities: create stubs.
- Use $() for literals.
- Headers with $env or $config.
- Batching with $batch.

## Ground Rules

- ALWAYS research the REST API first.
- VALIDATE with rover compose.
- COORDINATE with existing schema in apps/api and the UIs.
- USE with apollo-mcp-server to let agents call the connected data.
- REFERENCE the monorepo's portless for local testing of connectors.

## References

- Official apollo-connectors skill (grammar, methods, variables, entities, validation, troubleshooting).
- This repo: apps/api/src/graphql/schema.ts, update-graphql skill, apollo-server, graphql-schema, apollo-mcp-server, rover.
- Hono/Apollo setup in app.ts.

Use connectors to enrich the shared GraphQL API for the agent skills and UIs.
