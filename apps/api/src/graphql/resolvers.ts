import type { Resolvers } from './resolvers.types.js';
import { AgentMetric } from './agent-metrics.js';

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
    recordAgentMetric: async (_parent, { input }) => {
      const doc = await AgentMetric.create({
        ...input,
        rawSummary: input.rawSummary ? JSON.parse(input.rawSummary) : undefined,
      });
      return doc.toObject();
    },
  },
};
