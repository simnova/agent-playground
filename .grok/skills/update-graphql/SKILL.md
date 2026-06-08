---
name: update-graphql
description: Add or modify GraphQL types, queries, mutations, or resolvers in the shared backend (apps/api) and update the consuming UIs (staff/public) if needed. Use when changing the API contract between frontend and backend.
---

# Update GraphQL Schema / Resolvers Skill

This skill is for evolving the GraphQL API in this monorepo.

## Context
- Backend: `apps/api` uses Hono + Apollo Server (via `apollo-server-integration-hono`).
- Schema lives in `apps/api/src/graphql/schema.ts` (using `graphql-tag`).
- Resolvers in `apps/api/src/graphql/resolvers.ts`.
- Context (e.g. in-memory store) in `apps/api/src/graphql/context.ts`.
- Frontend: `apps/staff` and `apps/public` use `@apollo/client` with queries/mutations in their `src/App.tsx` (or dedicated files).
- Both UIs share the same backend.

## Steps

1. **Understand the change**
   - What new type, field, query, or mutation is needed?
   - Will it affect both UIs or just one?

2. **Update the backend**
   - Edit `schema.ts` (add to typeDefs using `gql`).
   - Update `resolvers.ts` (add Query/Mutation resolvers).
   - Update context/store in `context.ts` if new data is needed (currently in-memory messages example).
   - Ensure the Hono/Apollo handler in `app.ts` still works.
   - If using Azure Functions adapter, make sure nothing breaks the function registration.

3. **Update the frontends (when relevant)**
   - Add corresponding `gql` queries/mutations in the UI code (staff and/or public).
   - Update React components (forms, lists, etc.) using the new data.
   - Use proper TypeScript types (often inferred from Apollo).

4. **Cross-cutting concerns**
   - CORS in `apps/api/src/app.ts` must allow the origins (portless domains + localhost).
   - Consider authentication/authorization patterns if adding protected fields later.
   - Update any demo data or seeding.

5. **Verify**
   - Run `biome check` on changed files.
   - `tsgo --noEmit` on api and the affected UIs.
   - If possible, test the GraphQL endpoint (e.g. via the UIs or a tool like GraphQL Playground / Apollo Sandbox).
   - Use the `review-component` skill on any UI changes.

6. **Documentation**
   - If this introduces a new pattern, consider updating `AGENTS.md` or adding a note in `agents/`.

## Output
- Make the schema/resolver changes.
- Update at least one UI to exercise the new capability.
- Provide clear instructions on how to test the change.
- Note any follow-up work (e.g. real database, auth, pagination).