---
name: graphql-operations
description: >
  Guide for writing GraphQL operations (queries, mutations, fragments) in the staff and public UIs following best practices. Use when:
  (1) writing or reviewing GraphQL queries/mutations in apps/staff or apps/public (e.g. in App.tsx or lib/),
  (2) organizing operations with fragments for colocation with Ant Design components,
  (3) optimizing data fetching from the shared apps/api backend,
  (4) setting up type generation, linting, or reviewing for efficiency in the monorepo.
  Always coordinate with the schema in apps/api/src/graphql/schema.ts and the custom update-graphql skill. Use variables, name operations, request only needed fields, and ensure compatibility with both UIs and the shared @repo/ui + AntdProvider.
license: MIT
compatibility: Apollo Client (in Vite/React apps/staff and public), TypeScript via @repo/config-typescript/react.
metadata:
  author: apollographql (adapted for agentPlayground monorepo)
  version: "1.0.0"
allowed-tools: Read, Write, Edit, Glob, Grep, run_terminal_command, search_replace
---

# GraphQL Operations Guide (agentPlayground Monorepo)

This skill is tailored to writing operations for the Apollo Client usage in `apps/staff` and `apps/public` (Vite + React + Ant Design). Operations fetch/mutate data from the shared backend in `apps/api` (Hono + Apollo Server, typically at https://api.localhost/graphql via portless).

Current examples live in the UIs' App.tsx (GetMessages query, AddMessage mutation) and can be extracted to lib/ or component-colocated files.

## Operation Basics (Adapted)

### Naming

- Query: GetMessages, GetUser, ListItems (descriptive, reflects purpose)
- Mutation: AddMessage, CreatePost, UpdateUser
- Use consistent naming across staff and public where shared.

### Variables

Always use variables, never inline values:

```graphql
query GetMessages {
  messages { id text }
  hello
}
```

Better:

```graphql
query GetMessages {
  messages { id text }
  hello
}
```

(For dynamic: use $vars)

In components:

```tsx
const { data } = useQuery(GET_MESSAGES, { variables: { ... } });
```

### Fragments for Colocation (with AntD components)

Colocate fragments with components (e.g. a MessageCard using antd Card/List):

```tsx
// In a MessageList.tsx or near AntD usage
export const MESSAGE_FRAGMENT = gql`
  fragment MessageBasic on Message {
    id
    text
  }
`;

function MessageItem({ message }) {
  // Use antd components, inside AntdProvider
  return <Card>{message.text}</Card>;
}
```

Then in query:

```graphql
query GetMessages {
  messages {
    ...MessageBasic
  }
}
```

Use in both UIs, sharing fragments if possible via packages or duplication for now.

## Key Principles in This Repo

1. **Request Only What You Need**

   Current messages query is lean. When adding features (e.g. via implement-feature or add-antd-component), select only fields rendered in the AntD UI or needed for logic. Avoid over-fetching that bloats responses from the api.

2. **Name All Operations**

   No anonymous. Name reflects purpose and is used in Apollo Client hooks.

3. **Use Variables**

   For any dynamic values (ids, filters, input for mutations like addMessage).

4. **Colocate Fragments with Components**

   Especially useful with Ant Design: put fragment next to the component that uses the data (e.g. a MessageList using antd List).

5. **With Apollo Client in Vite Apps**

   - Define with gql from @apollo/client (as in current code).
   - Use useQuery/useMutation/useSuspenseQuery etc.
   - For cache: after mutations, update cache or refetch (see current onCompleted refetch in App.tsx).
   - Error/loading states: handle in UI (current code shows error div and loading).

6. **Coordination with Backend & Monorepo**

   - Operations must match schema in apps/api/src/graphql/schema.ts (use update-graphql skill when changing).
   - Both staff and public should stay in sync for shared features.
   - Test via portless: UIs at staff.localhost/public.localhost, API at api.localhost.
   - Use shared @repo/ui where possible, and respect AntdProvider theming (staff vs public may have different accents).
   - Type safety: rely on @repo/config-typescript/react + Apollo codegen if set up later (see tooling ref).

7. **Optimization**

   - Use fragments to avoid duplication.
   - For lists (messages): consider pagination later with Connection pattern (see graphql-schema skill).
   - Caching: configure in the shared apollo-client setup (lib/apollo-client.ts).
   - Avoid N+1 on server, but client-side: use @include/@skip for conditional fields if needed.

## Directives

Use @include/@skip for conditional data (e.g. based on UI state or props).

## Tooling Integration (This Repo)

- Define operations in .tsx near components or in lib/.
- For type gen: if adding graphql-codegen, follow the tooling ref; integrate with tsgo checks.
- Linting: operations can be linted with graphql-eslint if configured.
- Review: use review-component skill for UI parts consuming the ops; update-graphql for full stack.
- When building features: use implement-feature or add-antd-component, which may involve new ops.

## Ground Rules for This Monorepo

- ALWAYS name operations descriptively.
- ALWAYS use variables for dynamic values/inputs.
- ALWAYS request minimal fields needed for the AntD-rendered UI or logic.
- ALWAYS include `id` for cacheable types like Message.
- NEVER hardcode values in operations.
- PREFER fragments colocated with components (especially AntD ones).
- COORDINATE changes with backend schema via update-graphql skill.
- TEST in both UIs (staff/public) and against the portless API.
- RESPECT shared patterns: AntdProvider, @repo/ui, config-typescript, portless URLs.
- DOCUMENT new operations or patterns in relevant skills or AGENTS.md.

## References

- Official graphql-operations skill references (queries, mutations, fragments, variables, tooling).
- This repo: apps/staff/src/App.tsx (and public), lib/apollo-client.ts; apps/api/src/graphql/schema.ts + resolvers/context.
- Related: apollo-client skill, graphql-schema skill, update-graphql skill, implement-feature skill, add-antd-component skill.
- Apollo Client docs for hooks + caching in the Vite setup.

Use this when writing/reviewing client-side GraphQL in the UIs. Pair with server skills for complete GraphQL work.
