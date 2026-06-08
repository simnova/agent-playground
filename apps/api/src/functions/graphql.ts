import { app } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import honoApp from '../app.js';

// This registers the entire Hono app (including the /graphql Apollo endpoint)
// as an Azure Function using the v4 Node.js programming model.
//
// Deploy note:
// - The Function App should target Node 20/22 + Functions runtime ~4.
// - Use "route: '{*proxy}'" (or '/api/{*proxy}' depending on your hosting) to forward all traffic.
// - When deploying from this monorepo package, usually deploy the `apps/api` folder
//   (or a built dist version) as the root of your Function App.

app.http('graphql', {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  authLevel: 'anonymous',
  route: '{*proxy}',
  handler: azureHonoHandler(honoApp.fetch),
});

// You can register additional functions here if needed.
