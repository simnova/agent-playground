---
name: apollo-server
description: >
  Guide for building and maintaining GraphQL servers with Apollo Server in this monorepo. Use when:
  (1) modifying the backend in apps/api (Hono + Apollo Server integration),
  (2) defining or updating schemas/resolvers in apps/api/src/graphql/,
  (3) handling context, auth, or plugins for the shared API used by staff and public UIs,
  (4) troubleshooting Apollo Server errors, performance, or Azure Functions compatibility.
  Strongly prefer patterns that keep the API clean for both UIs while following the existing Hono adapter setup.
license: MIT
compatibility: Node.js (via Bun or tsgo), Hono, Apollo Server 4.x (as used in apps/api), TypeScript via @repo/config-typescript/node.
metadata:
  author: apollographql (adapted for agentPlayground monorepo)
  version: "1.0.0"
allowed-tools: Read, Write, Edit, Glob, Grep, run_terminal_command, search_replace
---

# Apollo Server Guide (agentPlayground Monorepo)

This skill is tailored to the Apollo Server setup in `apps/api` (Hono + `apollo-server-integration-hono` + Azure Functions adapter). The backend serves both `apps/staff` and `apps/public` (Vite + Apollo Client UIs) over the shared GraphQL endpoint (typically `https://api.localhost/graphql` via portless).

## Quick Start / Current Setup in This Repo

The current implementation lives in:

- `apps/api/src/app.ts` — Hono app + Apollo setup with `honoMiddleware`
- `apps/api/src/graphql/schema.ts` — typeDefs (using `graphql-tag`)
- `apps/api/src/graphql/resolvers.ts` — resolvers
- `apps/api/src/graphql/context.ts` — context shape (messagesStore in the demo)
- `apps/api/src/functions/graphql.ts` — Azure Functions registration using `@marplex/hono-azurefunc-adapter`

**Current pattern (Hono + Apollo):**

```ts
import { ApolloServer } from "@apollo/server";
import { honoMiddleware } from "apollo-server-integration-hono";
import { Hono } from "hono";

const apolloServer = new ApolloServer<MyContext>({ typeDefs, resolvers });
await apolloServer.start();

app.use("/graphql", honoMiddleware(apolloServer, { context: async ({ c }) => ({ ... }) }));
```

**Key rules for this repo:**

- ALWAYS use the existing Hono + `honoMiddleware` integration (not standalone or Express).
- ALWAYS type context with generics: `ApolloServer<MyContext>`.
- ALWAYS use `GraphQLError` from `graphql` for errors.
- Context is created per-request via the Hono middleware.
- Keep the demo in-memory store in `context.ts` simple unless replacing with real persistence.
- Both UIs share this single backend — changes must not break either (staff vs public theming differences are client-side only).

## Schema Definition

Follow the same patterns as the existing `schema.ts`.

Use descriptions, non-null where appropriate (`!`), and input types for mutations.

Example (aligned with current messages demo):

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

**Best practices in this codebase:**

- Keep schema in one file (`schema.ts`) for now (small API).
- Use the `gql` tag from `graphql-tag`.
- When adding new types, also update the in-memory store shape in `context.ts` and resolvers.
- Prefer returning the created/updated object from mutations so clients can update cache easily.

## Resolvers

Resolvers receive `(parent, args, context, info)`.

In this repo the context provides `messagesStore` (see `context.ts`).

```ts
const resolvers = {
  Query: {
    hello: () => "Hello from Hono + Apollo Server...",
    messages: (_, __, { messagesStore }) => messagesStore.getAll(),
  },
  Mutation: {
    addMessage: (_, { text }, { messagesStore }) => messagesStore.add(text),
  },
};
```

**Best practices here:**

- Keep resolvers thin — delegate to the store / services in context.
- Use the existing `messagesStore` pattern for demo data.
- Handle auth/authorization in context or resolvers if you add protected fields later.
- Return the full object from mutations so the UIs (using Apollo Client) can update optimistically or via cache.

## Context & Shared State

Context is built in the Hono middleware in `app.ts`.

Current demo:

```ts
context: async ({ c }) => ({
  messagesStore: {
    getAll: () => messages,
    add: (text: string) => { ... return msg; },
  },
}),
```

**Guidelines:**

- Add new data sources or services here (e.g., real DB clients, loaders).
- Make context strongly typed and share the type between server and (if needed) client codegen.
- For the Azure Functions path, the same context logic must work (the adapter calls the same Hono fetch).

## Error Handling

Use `GraphQLError`:

```ts
import { GraphQLError } from "graphql";

throw new GraphQLError("Not authenticated", {
  extensions: { code: "UNAUTHENTICATED" },
});
```

Never leak stack traces in production responses.

## CORS & Deployment Notes (This Monorepo)

- CORS is configured in `app.ts` to allow the portless domains (`*.localhost`) + direct dev ports.
- The `/graphql` route is exposed both for local Bun dev and via the Azure Functions adapter in `src/functions/graphql.ts`.
- When testing via portless: UIs hit `https://api.localhost/graphql`, the API should be running through `portless`.

## Testing & Tooling in This Repo

- Use the existing `update-graphql` skill when making schema/resolver changes (it coordinates backend + both UIs).
- Run `pnpm --filter api check-types` (tsgo) and `biome check`.
- The UIs (`staff` / `public`) use Apollo Client — after schema changes, update operations in the UIs and verify with their type checks.
- You can test the endpoint directly at the portless URL or via the UIs' message forms.

## Common Tasks in This Codebase

- Adding a new query/mutation → update schema + resolver + context store + at least one UI.
- Adding auth → put user/token in context, check in resolvers.
- Performance → consider DataLoader for N+1 if you add relations.
- Azure Functions → ensure the handler in `src/functions/graphql.ts` still routes everything through the Hono app.

## Ground Rules for This Repo

- ALWAYS follow the existing Hono + apollo-server-integration-hono pattern.
- ALWAYS keep the backend changes in sync with the two UIs (use the `update-graphql` or `implement-feature` skills).
- NEVER break the portless local dev flow (`https://api.localhost/graphql`).
- PREFER returning full objects from mutations for easy client cache updates.
- USE the shared TypeScript config (`@repo/config-typescript/node`).
- Document significant schema changes in the root AGENTS.md or a relevant skill.

## References (from Apollo + this repo)

- Original Apollo Server skill references (resolvers, context, plugins, errors, data sources).
- This repo's `apps/api/src/graphql/*` for current implementation.
- `apps/api/src/app.ts` for Hono wiring.
- `apps/api/src/functions/graphql.ts` for Azure adapter.
- Existing custom skills: `update-graphql`, `implement-feature`, `add-new-vite-app`.

Use this skill together with the repo-specific ones for consistent changes across the monorepo.
