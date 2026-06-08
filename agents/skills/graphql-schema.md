# GraphQL Schema (Portable)

Portable version of the graphql-schema skill.

Use for designing/evolving the schema in apps/api/src/graphql/schema.ts.

## Key Locations in This Repo
- Schema: apps/api/src/graphql/schema.ts (types like Message, Query/Mutation)
- Backend: apps/api/src/graphql/ (resolvers, context), app.ts, functions/graphql.ts
- UIs: staff/public (update operations when schema changes)
- Custom: update-graphql, graphql-operations, apollo-server, apollo-client skills

## Guidelines (from Apollo + monorepo)
- Design for client needs (staff/public UIs), be explicit with nullability, plan for evolution.
- Use ! for non-null, [Type!]! for lists.
- Coordinate with update-graphql for full changes, rover for management.
- Test with portless, keep in sync with both UIs and AntD components.
- For future federation, see apollo-federation skill.

See the full Grok version at `.grok/skills/graphql-schema/SKILL.md` for details and monorepo adaptations.
