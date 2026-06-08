import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'apps/api/schema.graphql',
  documents: ['apps/staff/src/**/*.{ts,tsx}', 'apps/public/src/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    // Typed GraphQL client code for the Staff Vite app
    'apps/staff/src/gql/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
      config: {
        // Use the project's strict style
        useTypeImports: true,
        // Scalars can be customized here if you add custom scalars later
      },
    },
    // Typed GraphQL client code for the Public Vite app
    'apps/public/src/gql/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
      config: {
        useTypeImports: true,
      },
    },
    // Fully typed resolvers for the API (highly recommended)
    'apps/api/src/graphql/resolvers.types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        // Point at the existing context type (use .js extension for NodeNext + tsgo strictness in the api package)
        contextType: './context.js#GraphQLContext',
        useTypeImports: true,
        // Make the generated Resolvers type the single source of truth for implementation
        // You can later do: import type { Resolvers } from './resolvers.types';
        // export const resolvers: Resolvers = { ... }
      },
    },
  },
};

export default config;
