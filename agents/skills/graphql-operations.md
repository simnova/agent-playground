# GraphQL Operations (Portable)

Portable version of the graphql-operations skill.

Use for writing GraphQL queries/mutations/fragments in the staff and public UIs.

## Key Locations in This Repo
- UIs: apps/staff/src/App.tsx (and public), lib/apollo-client.ts (GetMessages, AddMessage etc.)
- Backend schema: apps/api/src/graphql/schema.ts
- Custom: update-graphql (sync changes), apollo-client, graphql-schema skills
- Theming: AntD + @repo/ui

## Guidelines (from Apollo + monorepo)
- Name operations, use variables, request only needed fields, colocate fragments with components.
- ALWAYS include id for cacheable types.
- Coordinate with update-graphql when schema changes, use with apollo-client.
- Test in both UIs with portless (https://api.localhost/graphql), respect AntD.
- For optimization, see apollo-client caching.

See the full Grok version at `.grok/skills/graphql-operations/SKILL.md` for details and monorepo adaptations.
