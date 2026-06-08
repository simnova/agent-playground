---
name: graphql-schema
description: >
  Guide for designing and evolving GraphQL schemas in this monorepo. Use when:
  (1) designing or reviewing the schema in apps/api/src/graphql/schema.ts,
  (2) adding new types, fields, pagination, errors, or security patterns,
  (3) ensuring the schema works well for both staff and public UIs,
  (4) following best practices for type design, naming, nullability, and evolution.
  Always coordinate with the existing in-memory demo, Hono setup, and client usage in the Vite apps. Prefer patterns that keep the API clean and maintainable across the Turborepo.
license: MIT
compatibility: Apollo Server (via Hono in apps/api), graphql-js, TypeScript via @repo/config-typescript.
metadata:
  author: apollographql (adapted for agentPlayground)
  version: "1.0.0"
allowed-tools: Read, Write, Edit, Glob, Grep, run_terminal_command, search_replace
---

# GraphQL Schema Design Guide (agentPlayground Monorepo)

This skill is tailored to the schema in `apps/api/src/graphql/schema.ts` (using graphql-tag) and the resolvers/context in the same directory. The schema powers both `apps/staff` and `apps/public` UIs (Vite + React + Ant Design + Apollo Client) via the shared backend.

## Current Schema in This Repo

See `apps/api/src/graphql/schema.ts` for the live version (currently a simple messages + hello demo).

It uses:

```graphql
type Query {
  hello: String!
  messages: [Message!]!
}

type Mutation {
  addMessage(text: String!): Message!
}

type Message {
  id: ID!
  text: String!
}
```

With supporting in-memory store in context.ts and resolvers.

## Schema Design Principles (Adapted)

1. **Design for Client Needs**
   - The clients are simple React apps using queries/mutations for a messages feature.
   - Think about what the staff (internal tools) and public (customer-facing) UIs will need.
   - Expose domain concepts, not internal Hono/Express or DB details.

2. **Be Explicit**
   - Use clear names (already following "Message", "addMessage").
   - Make nullability intentional (use ! where values are always present).
   - Add descriptions for documentation (GraphQL supports """ or " ").

3. **Design for Evolution**
   - Plan for adding more features (e.g., users, auth, pagination).
   - Use deprecation before removal.
   - Return affected objects from mutations so clients can update cache easily (see current addMessage).

## Quick Reference (Tailored)

### Type Definition Syntax

```graphql
"""
A message in the shared demo.
"""
type Message {
  id: ID!
  text: String!
}

type Query {
  hello: String!
  messages: [Message!]!
}

type Mutation {
  addMessage(text: String!): Message!
}
```

### Nullability Rules (Best Practice)

- Use `String!` for required fields.
- For lists: prefer `[Type!]!` (non-null list of non-null items) over nullable variants unless null is semantically valid.
- In the current demo, lists and items are non-null.

### Input vs Output Types

For mutations, use dedicated input types when there are multiple fields:

```graphql
input AddMessageInput {
  text: String!
}

type Mutation {
  addMessage(input: AddMessageInput!): Message!
}
```

(Currently using flat args for simplicity in the demo.)

### Pagination (When Scaling)

When adding lists beyond the simple messages demo, use cursor-based Connection pattern:

```graphql
type MessageConnection {
  edges: [MessageEdge!]!
  pageInfo: PageInfo!
}

type MessageEdge {
  node: Message!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type Query {
  messages(first: Int, after: String): MessageConnection!
}
```

See the official references for full details.

### Error Modeling

- Use GraphQLError in resolvers (as done in the Apollo Server skill).
- Consider result unions for client-friendly errors (e.g., `union AddMessageResult = Message | AddMessageError`).

### Custom Scalars

For domain values (e.g., DateTime, Email, ID formats), define custom scalars and implement in the server.

## Best Practices for This Monorepo

- **Type design**: Base types on the domain (Message, etc.), not the in-memory store.
- **Naming**: Follow the existing style (camelCase fields, PascalCase types). Be consistent between schema and the UIs.
- **Nullability**: Be strict where possible; the current schema uses ! appropriately.
- **Evolution**: When changing schema, use the `update-graphql` skill to keep backend + both UIs in sync.
- **Security**: As the API grows, consider query complexity, depth limiting, and auth in context/resolvers.
- **Documentation**: Add descriptions to types/fields.
- **Client impact**: Schemas should return data that's easy to consume in Apollo Client + React + Ant Design components. Avoid deep nesting.
- **Monorepo specifics**: The schema is in one place (apps/api), but changes affect staff and public. Use portless for local testing (`https://api.localhost/graphql`).
- **With existing code**: The demo uses a simple in-memory store in context.ts. When adding real data (e.g., DB), update resolvers and context accordingly, but keep the schema stable.

## Coordination with Other Skills

- Pair with `update-graphql` for full-stack changes (schema + resolvers + UIs).
- Use with `implement-feature` or `add-antd-component` when new UI features require schema updates.
- Reference `apollo-server` for the server implementation details.
- For client operations, see `apollo-client` and `graphql-operations`.
- Use `graphql-operations` (if added) for writing good queries against the schema.

## Ground Rules

- ALWAYS add descriptions to new types and fields.
- ALWAYS use non-null (`!`) thoughtfully.
- ALWAYS prefer `[Type!]!` for lists unless null/empty has meaning.
- NEVER expose implementation details (Hono, in-memory array, Azure specifics) in the schema.
- NEVER make breaking changes without deprecation + coordination via update-graphql skill.
- PREFER dedicated input types for complex mutations.
- USE `ID` type for identifiers.
- KEEP the schema in sync with the UIs (staff/public) and the shared packages.
- DOCUMENT significant design decisions in AGENTS.md or relevant skills.
- TEST changes with the UIs running via portless and the API.

## References

- Official graphql-schema skill references (types, naming, pagination, errors, security).
- This repo: apps/api/src/graphql/schema.ts (current), context.ts, resolvers.ts, app.ts.
- Apollo Server skill (for implementation).
- Custom skills: update-graphql, implement-feature, add-antd-component.
- Client side: apps/staff/src/lib/apollo-client.ts and App.tsx (and public).

Use this skill when evolving the GraphQL schema. Combine with backend and client skills for end-to-end work.
