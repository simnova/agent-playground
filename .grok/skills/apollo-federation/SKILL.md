---
name: apollo-federation
description: >
  Guide for authoring Apollo Federation subgraph schemas with entities, sharing, and cross-subgraph resolution. Use this skill when:
  (1) creating or evolving federated schemas for the backend (future split of apps/api or new subgraphs),
  (2) defining entities with @key,
  (3) using @shareable, @external, @requires, @provides, @override,
  (4) troubleshooting composition errors.
  In this monorepo, start with the single server in apps/api but prepare for federation. Coordinate with graphql-schema, update-graphql, rover. The UIs in staff/public would query the supergraph.
license: MIT
compatibility: Apollo Server / Federation 2.x, TypeScript. Fits the Hono setup if splitting.
metadata:
  author: apollographql (adapted for agentPlayground)
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep run_terminal_command search_replace
---

# Apollo Federation Schema Authoring (agentPlayground Monorepo)

Apollo Federation allows composing multiple GraphQL subgraphs into a supergraph. Currently this monorepo has a single Apollo Server in apps/api, but this skill prepares for splitting (e.g., separate subgraphs for different domains) while keeping the shared UIs in staff/public.

## Federation 2 Setup in This Repo

Every subgraph must opt-in:

```graphql
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.12",
        import: ["@key", "@shareable", "@external", "@requires", "@provides", "@override"])
```

Import only needed directives.

Use in apps/api/src/graphql/schema.ts alongside the existing types.

## Core Directives (Adapted)

- @key(fields: "id"): For entities like Message or future User/Product.
- @shareable: For value types shared across subgraphs.
- @external, @requires: For computed fields depending on other subgraphs.
- @override(from: "oldSubgraph"): For migrating fields.
- Entity stubs for references.

Example for this monorepo:

```graphql
type Message @key(fields: "id") {
  id: ID!
  text: String!
  # future: author: User @requires(fields: "authorId") or similar
}

# In another subgraph
type User @key(fields: "id") {
  id: ID!
  messages: [Message!]! @requires(fields: "id") # example
}
```

## Key Patterns for This Stack

- Start simple with the current schema (Message, Query/Mutation).
- When splitting (e.g., messages subgraph vs users), use @key for shared entities.
- The UIs (staff/public) would use the supergraph endpoint (update their apollo-client to point to router).
- Use rover supergraph compose for local validation (see rover skill).
- Test with portless: multiple subgraphs on different ports, composed router.

## Ground Rules

- ALWAYS use Federation 2.x with @link.
- COORDINATE with graphql-schema for type design and update-graphql for changes.
- USE with rover for composition and checks.
- For agents: this enables federated data for complex agent queries via MCP.
- REFERENCE apps/api/src/graphql/schema.ts and plan for multiple schema files in subgraphs.

## References

- Official apollo-federation skill (directives, schema-patterns, composition).
- This repo's graphql-schema, update-graphql, apollo-server, rover, apollo-mcp-server skills.
- Monorepo files: apps/api/src/graphql/* , staff/public clients.

Use this to design scalable GraphQL in the agentPlayground.
