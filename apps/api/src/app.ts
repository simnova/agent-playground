import { ApolloServer } from '@apollo/server';
import { honoMiddleware } from 'apollo-server-integration-hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import mongoose from 'mongoose';
import type { GraphQLContext } from './graphql/context.js';
import { resolvers } from './graphql/resolvers.js';
import { typeDefs } from './graphql/schema.js';

// Connect to MongoDB via Mongoose (ensures DB connection on server start)
const MONGO_URI = process.env['MONGO_URI'] || 'mongodb://127.0.0.1:27017/agentplayground';
await mongoose.connect(MONGO_URI);
console.log(`✅ Mongoose connected to ${MONGO_URI}`);

// In-memory demo store (replace with real DB in production)
let messages: Array<{ id: string; text: string }> = [
  { id: '1', text: 'Welcome to the GraphQL demo!' },
  { id: '2', text: 'Hono + Apollo Server running great.' },
];

let nextId = 3;

export const app = new Hono();

// Enable CORS so the UIs (staff/public via portless) and other apps (web/docs) can talk to the API.
// Supports *.localhost (portless) and common direct dev ports.
app.use(
  '*',
  cors({
    origin: (origin: string | undefined) => {
      if (!origin) return undefined;
      // Allow all .localhost (portless) and common direct dev ports
      if (origin.endsWith('.localhost') || origin.includes('localhost:5173') || origin.includes('localhost:3000') || origin.includes('localhost:3001') || origin.includes('localhost:4000')) {
        return origin;
      }
      return undefined;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

const apolloServer = new ApolloServer<import('./graphql/context.js').GraphQLContext>({
  typeDefs,
  resolvers,
});

// Must start Apollo before using the middleware
await apolloServer.start();

// Note: cast due to CJS/ESM type declaration differences in @apollo/server + integration package
app.use(
  '/graphql',
  honoMiddleware(
    apolloServer as any,
    {
      context: async (/* { c }: { c: Context } */): Promise<GraphQLContext> => ({
        messagesStore: {
          getAll: () => messages,
          add: (text: string) => {
            const msg = { id: String(nextId++), text };
            messages = [...messages, msg];
            return msg;
          },
        },
      }),
    } as any
  )
);

// Simple health + hello REST endpoints (optional)
app.get('/health', (c) => c.json({ status: 'ok', runtime: 'hono' }));

// Fallback for root
app.get('/', (c) =>
  c.json({
    message: 'GraphQL API — POST to /graphql',
    playground: 'Open /graphql in browser for GraphiQL (if enabled)',
  })
);

export default app;
