import type { Resolvers } from './resolvers.types.js';

export const resolvers: Resolvers = {
  Query: {
    hello: () => 'Hello from Hono + Apollo Server (TypeScript 7 + tsgo)!',
    messages: (_parent, _args, context) => {
      return context.messagesStore.getAll();
    },
  },
  Mutation: {
    addMessage: (_parent, { text }, context) => {
      return context.messagesStore.add(text);
    },
  },
};
