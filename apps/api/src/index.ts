import app from './app.js';

const port = parseInt(process.env['PORT'] || '4000', 10);

// Bun native server (excellent DX + speed for local dev)
// Port is provided by portless when running through the proxy.
export default {
  port,
  fetch: app.fetch,
  development: process.env['NODE_ENV'] !== 'production',
};

const url = process.env['PORTLESS_URL'] || `http://localhost:${port}`;
console.log(`🚀 API ready at ${url}/graphql (Bun + Hono + Apollo)`);
