---
name: apollo-mcp-server
description: >
  Guide for using Apollo MCP Server to connect AI agents with GraphQL APIs in this monorepo. Use this skill when:
  (1) setting up or configuring Apollo MCP Server to expose the shared backend (apps/api),
  (2) defining MCP tools from GraphQL operations in the schema,
  (3) using introspection tools (introspect, search, validate, execute) from agents,
  (4) troubleshooting MCP server connectivity or tool execution for the staff/public UIs or custom agents.
  Perfect for the agentPlayground theme - use to let agents query the GraphQL API at https://api.localhost/graphql (via portless) or deployed. Coordinate with custom skills like update-graphql, implement-feature, and the .grok/skills/ system.
license: MIT
compatibility: Works with Claude Code, Cursor, and other MCP clients. Requires the Apollo MCP Server binary or npx.
metadata:
  author: apollographql (adapted for agentPlayground monorepo)
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep run_terminal_command search_replace
---

# Apollo MCP Server Guide (agentPlayground Monorepo)

This skill is tailored to exposing the GraphQL API in `apps/api` (Hono + Apollo Server) via Apollo MCP Server, so AI agents (in this Grok setup or others) can interact with it using MCP tools. The API is the shared backend for staff and public UIs, using the schema in `apps/api/src/graphql/schema.ts`, resolvers, and context (in-memory demo).

## Quick Start in This Repo

### Install Apollo MCP Server

```bash
# Linux / MacOS
curl -sSL https://mcp.apollo.dev/download/nix/latest | sh

# Or npm for cross-platform
npm install -g @apollo/mcp-server
```

### Configure for the Local API

Create `mcp-config.yaml` in project root (or per-app):

```yaml
transport:
  type: streamable_http
  address: 127.0.0.1
  port: 8000
endpoint: https://api.localhost/graphql  # Use portless local or deployed URL
schema:
  source: local
  path: ./apps/api/src/graphql/schema.ts  # Or introspect from running server
operations:
  source: local
  paths:
    - ./apps/api/src/graphql/  # Or define operations
introspection:
  introspect:
    enabled: true
  search:
    enabled: true
  validate:
    enabled: true
  execute:
    enabled: true
overrides:
  mutation_mode: explicit  # Require confirmation for mutations, important for agents
headers:
  # Add if auth needed
  # Authorization: "Bearer ${env.API_TOKEN}"
health_check:
  enabled: true
```

Start the MCP server:

```bash
apollo-mcp-server ./mcp-config.yaml
```

Or with npx if installed that way.

Connect from MCP clients (e.g., for Claude or in this Grok agent setup via MCP config in .grok/config.toml or similar).

The MCP endpoint will be at http://127.0.0.1:8000/mcp .

## Built-in Tools (from Apollo MCP)

- `introspect`: Explore the schema (types, fields) - use to understand apps/api/src/graphql/schema.ts
- `search`: Find types/fields by keyword
- `validate`: Check if an operation is valid against the schema
- `execute`: Run ad-hoc GraphQL operations (queries/mutations) - great for agents to query the backend

## Defining Custom Tools from Operations

Use operation files for predictable tools that agents can call (e.g., GetMessages, AddMessage from the demo).

In mcp-config:

```yaml
operations:
  source: local
  paths:
    - ./apps/api/src/graphql/operations/  # Create .graphql files here
```

Example operation file `GetMessages.graphql`:

```graphql
query GetMessages {
  messages {
    id
    text
  }
  hello
}
```

This becomes an MCP tool "GetMessages" that agents can invoke.

Similarly for mutations.

For the UIs: staff and public use similar queries - agents can use MCP to fetch data and then suggest UI changes using add-antd-component or implement-feature skills.

## Integration with This Monorepo's Agent Skills

- Use with `update-graphql` skill when the schema changes (update MCP config too).
- Use with `implement-feature` or `add-antd-component` : agents can use MCP to explore backend, then implement UI.
- For the API: reference the Hono setup, Azure adapter, in-memory store in context.ts.
- Test via portless: MCP server can point to https://api.localhost/graphql .
- When creating custom agents/personas: use apollo-mcp-server to give them GraphQL superpowers.
- Ties into .grok/skills/ and agents/ system - MCP makes the GraphQL API a tool for Grok agents, Claude, etc.

## Configuration for Production / Deployed

When deployed (e.g., Azure Functions):

```yaml
endpoint: https://your-deployed-api.azurewebsites.net/graphql  # Or whatever the URL
graphos:  # If using GraphOS
  apollo_key: ${env.APOLLO_KEY}
  apollo_graph_ref: ${env.APOLLO_GRAPH_REF}
headers:
  Authorization: "Bearer ${env.API_TOKEN}"
```

## Security Notes (Critical for Agents)

- ALWAYS use `mutation_mode: explicit` or `none` when exposing to AI agents (default is often none for safety).
- NEVER expose introspection tools in production without auth.
- Use headers for auth; forward only safe ones.
- For this demo: the in-memory messages store is public - in real, add auth in context.

## Troubleshooting

- Connection issues: Ensure the API is running (via portless or deployed), check CORS in apps/api/src/app.ts allows the MCP host.
- Schema not loading: Point to running endpoint or valid schema file.
- Use `rover` to validate schema if needed (see rover skill).

## Ground Rules for This Repo

- ALWAYS coordinate MCP config with the schema in apps/api/src/graphql/schema.ts and resolvers.
- ALWAYS test MCP tools against the portless local backend first.
- USE with custom skills like update-graphql for changes.
- PREFER operation files for tools that match the UIs' queries (GetMessages, AddMessage).
- REFERENCE the Hono + Apollo integration in app.ts and functions/graphql.ts.
- For agents: this enables querying the shared backend from Grok subagents, Claude, etc.

## References

- Official apollo-mcp-server skill references (tools, configuration, troubleshooting).
- This repo: apps/api/src/app.ts, src/graphql/*, the staff/public Apollo clients.
- Related: apollo-server, apollo-client, graphql-schema, graphql-operations, update-graphql, implement-feature skills.
- Apollo MCP Server docs, and how it fits the .grok/skills/ and MCP in Grok config.

Use this skill to give your agents (and other tools) direct access to the GraphQL API.
