# Update GraphQL (Portable)

Portable version of the update-graphql skill.

Use when changing the API contract between the frontend UIs (staff/public) and the shared backend (apps/api).

## Key Locations
- Backend schema: `apps/api/src/graphql/schema.ts`
- Resolvers: `apps/api/src/graphql/resolvers.ts`
- Context / data: `apps/api/src/graphql/context.ts`
- Frontend usage: `apps/staff/src/...` and `apps/public/src/...` (Apollo Client queries/mutations)

## Steps
1. Update the GraphQL schema (typeDefs) in the api.
2. Implement or adjust the corresponding resolvers.
3. Update any in-memory store or data layer in context if needed.
4. Update the consuming code in one or both UIs.
5. Ensure CORS in `apps/api/src/app.ts` still covers the relevant origins (especially .localhost domains via portless).
6. Verify with type checking (`tsgo`) and linting (biome).
7. Test the flow through the UIs or a GraphQL client.

See the full Grok version with more details at `.grok/skills/update-graphql/SKILL.md`.