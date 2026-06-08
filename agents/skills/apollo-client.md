# Apollo Client (Portable)

Portable version of the apollo-client skill.

Use for the React Apollo Client in apps/staff and apps/public (Vite + Ant Design UIs).

## Key Locations in This Repo
- Clients: apps/staff/src/lib/apollo-client.ts (and public), src/App.tsx (queries like GetMessages, mutations)
- Backend: apps/api (shared GraphQL at portless https://api.localhost/graphql)
- Theming: AntdProvider from @repo/ui
- Custom skills: update-graphql, implement-feature, add-antd-component

## Guidelines (from Apollo + monorepo)
- Use Apollo Client 4 patterns (or current v3, adapt), hooks like useQuery/useMutation.
- Colocate fragments with components, request only needed fields.
- Cache updates, error handling, Suspense if modern.
- Coordinate with graphql-operations, graphql-schema, update-graphql.
- Test UIs with portless, respect AntD theming (different for staff/public).
- Use shared @repo/ui and config-typescript.

See the full Grok version at `.grok/skills/apollo-client/SKILL.md` for details and monorepo adaptations.
