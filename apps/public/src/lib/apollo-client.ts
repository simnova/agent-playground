import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

// biome-ignore lint/complexity/useLiteralKeys: VITE_* come from index signature in vite/client types; bracket required by noPropertyAccessFromIndexSignature
const GRAPHQL_URL = import.meta.env['VITE_GRAPHQL_URL'] || 'https://api.localhost/graphql';

export const client = new ApolloClient({
  link: new HttpLink({
    uri: GRAPHQL_URL,
    // credentials: 'include', // enable if using cookies/auth
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
