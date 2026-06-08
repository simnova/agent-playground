---
name: apollo-router
description: >
  Guide for configuring and running Apollo Router for federated GraphQL supergraphs in this monorepo. Use this skill when:
  (1) setting up Router to serve the composed supergraph (future use of federation in apps/api or new subgraphs),
  (2) configuring routing, headers, CORS for the UIs (staff/public),
  (3) custom plugins or telemetry,
  (4) troubleshooting Router with the Hono/Apollo subgraphs.
  Use with apollo-federation, rover, apollo-mcp-server. The UIs would point to the Router instead of direct api.
license: MIT
compatibility: Apollo Router, Federation 2. Fits the monorepo's portless dev and Azure deployment.
metadata:
  author: apollographql (adapted)
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep run_terminal_command search_replace
---

# Apollo Router Guide (agentPlayground Monorepo)

Apollo Router runs federated supergraphs. In this repo, currently single subgraph (apps/api), but this prepares for splitting while serving staff and public UIs.

## Quick Start / Config

Create router.yaml:

```yaml
supergraph:
  listen: 127.0.0.1:4000  # or use portless
  path: /graphql
cors:
  origins:
    - https://staff.localhost
    - https://public.localhost
headers:
  all:
    request:
      - propagate:
          named: authorization
telemetry:
  # tracing, metrics
```

Run with supergraph schema from rover compose (see rover skill).

For dev: `rover dev --supergraph-config supergraph.yaml --router-config router.yaml`

## Integration

- Update UIs' Apollo Client URI to the Router (instead of direct api).
- Use with federation for subgraphs.
- MCP via apollo-mcp-server on the Router endpoint.
- CORS must allow portless domains (update in router or api).

## Ground Rules

- COORDINATE with apollo-federation for schema, rover for compose, update-graphql for changes.
- TEST UIs (staff/public) against Router + portless.
- For agents: Router + MCP gives unified GraphQL access.

## References

- Official apollo-router skill (config, headers, plugins, telemetry, troubleshooting).
- This repo: apollo-federation, rover, apollo-mcp-server, apollo-server, the UIs' clients, portless config.
- apps/api for subgraph.

Use to run the federated layer for the agent skills and UIs.
