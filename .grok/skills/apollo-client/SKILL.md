---
name: apollo-client
description: >
  Guide for building React applications with Apollo Client in the staff and public Vite apps. Use when:
  (1) setting up or configuring Apollo Client in apps/staff or apps/public,
  (2) writing GraphQL queries or mutations with hooks (useQuery, useMutation),
  (3) configuring caching, cache policies, or optimistic UI,
  (4) managing local state or error handling in the UIs that connect to the shared apps/api backend,
  (5) troubleshooting Apollo Client errors, performance, or integration with Ant Design components.
  Always coordinate with the backend schema in apps/api and use the shared @repo/ui + AntdProvider theming. Prefer patterns that work for both staff (internal) and public (customer-facing) experiences.
license: MIT
compatibility: React 18+/19 (as used in the Vite apps), Vite, TypeScript via @repo/config-typescript/react. Works alongside Ant Design and the existing lib/apollo-client.ts setup.
metadata:
  author: apollographql (adapted for agentPlayground monorepo)
  version: "1.0.0"
allowed-tools: Read, Write, Edit, Glob, Grep, run_terminal_command, search_replace
---

# Apollo Client Guide (agentPlayground Monorepo)

This skill is tailored to the Apollo Client usage in `apps/staff` and `apps/public` (Vite + React + Ant Design UIs). Both UIs connect to the same shared GraphQL backend in `apps/api` (Hono + Apollo Server, available at `https://api.localhost/graphql` via portless in local dev).

## Current Setup in This Repo

The clients are set up in:

- `apps/staff/src/lib/apollo-client.ts` (and the public equivalent)
- Used in `apps/staff/src/App.tsx` and `apps/public/src/App.tsx` for queries like GetMessages and mutations like AddMessage.
- Wrapped with `ApolloProvider` in main.tsx, inside `AntdProvider` for theming.
- Default endpoint: `import.meta.env['VITE_GRAPHQL_URL'] || 'https://api.localhost/graphql'`
- Uses `@apollo/client` (currently v3 in package.json, but patterns align with modern client usage; adapt to v4 if upgraded).

The apps use standard hooks for the messages demo, with Tailwind + Ant Design components for the UI shell.

**Key integration points:**

- GraphQL operations are defined inline with `gql` from `@apollo/client`.
- Queries/mutations hit the shared backend; changes to schema require updating both UIs (see the custom `update-graphql` skill).
- Theming: Components live inside `AntdProvider` (different primary colors for staff vs public).
- TypeScript: Extends `@repo/config-typescript/react`.

## Basic Patterns (Adapted to This Stack)

### Setting Up the Client (already done in lib/apollo-client.ts)

```ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const GRAPHQL_URL = import.meta.env['VITE_GRAPHQL_URL'] || 'https://api.localhost/graphql';

export const client = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});
```

Wrap in main.tsx:

```tsx
import { ApolloProvider } from '@apollo/client';
import { AntdProvider } from '@repo/ui/antd-provider';

<ApolloProvider client={client}>
  <AntdProvider>
    <App />
  </AntdProvider>
</ApolloProvider>
```

### Writing Queries (useQuery)

```tsx
import { gql, useQuery } from '@apollo/client';

const GET_MESSAGES = gql`
  query GetMessages {
    messages { id text }
    hello
  }
`;

function MessagesList() {
  const { data, loading, error, refetch } = useQuery<{ messages: Message[]; hello: string }>(GET_MESSAGES);

  // Render with Ant Design List or custom components inside AntdProvider
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    // Use antd components + Tailwind, respecting the current theme
    <List dataSource={data?.messages} ... />
  );
}
```

### Writing Mutations (useMutation)

```tsx
import { gql, useMutation } from '@apollo/client';

const ADD_MESSAGE = gql`
  mutation AddMessage($text: String!) {
    addMessage(text: $text) { id text }
  }
`;

function AddMessageForm() {
  const [addMessage, { loading: adding }] = useMutation(ADD_MESSAGE, {
    onCompleted: () => refetch(),
  });

  const handleSubmit = (text: string) => {
    addMessage({ variables: { text } });
  };

  // Use Ant Design Form + Input + Button inside the themed provider
  return <Form onFinish={...}>...</Form>;
}
```

## Best Practices in This Monorepo

- **Request only what you need**: The current messages query is minimal. When adding features, keep operations lean to avoid over-fetching.
- **Colocate fragments** (when scaling): For complex components in staff/public, define fragments next to components and compose them.
- **Cache policies**: The default InMemoryCache is used. Add `typePolicies` in the client setup for pagination or custom merging if you add more complex data (e.g., users, feeds).
- **Optimistic UI**: For mutations like addMessage, consider optimistic responses to keep the Ant Design List snappy.
- **Error handling**: Use the error from useQuery/useMutation and display nicely with Ant Design alerts or the existing error UI.
- **Loading states**: Handle loading in the UI (current code does this for the list and form).
- **Shared backend**: Always keep staff and public UIs in sync when the API changes (use `update-graphql` skill). The endpoint is the same.
- **Theming integration**: Apollo data feeds into Ant Design components rendered inside AntdProvider. Test both staff (default theme) and public (green accent) experiences.
- **TypeScript**: Leverage the strict config from `@repo/config-typescript/react`. Operations should be typed.
- **Portless / local dev**: Test against `https://api.localhost/graphql`. Update VITE_GRAPHQL_URL when needed.
- **Performance**: Use `fetchPolicy: 'cache-and-network'` (already in the client) for fresh data without blocking UI.
- **With Ant Design**: Wrap forms with antd Form for the mutations. Use List, Card, etc., for query results. Keep custom Tailwind for layout.

## Suspense / Modern React (Future-Proofing)

If upgrading or using React 19 features:

- Consider `useSuspenseQuery` from `@apollo/client/react` with `<Suspense>` boundaries.
- The current setup uses classic hooks, which is fine for the demo.

## Error Handling & Troubleshooting

- Network errors vs GraphQL errors: Check `error.graphQLErrors` and `error.networkError`.
- For this stack: The backend uses GraphQLError; surface messages cleanly in the UIs.
- Common issues: CORS (handled in api), wrong endpoint (use portless URL), cache staleness (refetch or update cache after mutations).
- Use Apollo DevTools (browser extension) when debugging the staff/public UIs.
- If schema changes break the UIs, run the `update-graphql` or `implement-feature` skills.

## Coordination with Other Skills

- Use alongside `update-graphql` when the backend schema changes.
- Use with `implement-feature` or `add-antd-component` when building new UI that fetches/mutates data.
- Use with `add-new-vite-app` if creating another client app.
- Reference `graphql-schema` and `graphql-operations` (if added) for design guidance.

## Ground Rules for This Repo

- ALWAYS use the shared Apollo client setup in `src/lib/apollo-client.ts` (or equivalent).
- ALWAYS wrap with ApolloProvider + AntdProvider.
- ALWAYS keep operations in sync across staff and public (or share them).
- PREFER cache updates over refetching when possible after mutations.
- USE variables for all dynamic values; name operations.
- RESPECT the Ant Design + Tailwind + shared ui patterns.
- TEST against the portless backend URL.
- RUN biome check and tsgo --noEmit after changes.
- When the backend changes, also update the UIs (see existing `update-graphql` skill).

## References

- Apollo Client skill references (queries, mutations, caching, state, errors, troubleshooting).
- This repo: apps/staff/src/lib/apollo-client.ts, apps/staff/src/App.tsx (and public counterparts).
- Backend: apps/api/src/graphql/* and the Hono integration.
- Theming: packages/ui/src/antd-provider.tsx.
- Related custom skills: update-graphql, implement-feature, add-antd-component.

Use this skill when touching Apollo Client code in the UIs. Combine with backend skills for full-stack GraphQL work.
