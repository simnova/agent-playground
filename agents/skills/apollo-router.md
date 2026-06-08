# Apollo Router (Portable)

Portable guide for Apollo Router in federated setups.

## In This Monorepo
- Currently single subgraph (apps/api Hono/Apollo).
- Use with apollo-federation for future subgraphs.
- UIs (staff/public) would query the Router (update apollo-client URI).
- Local with rover dev + portless.
- CORS for .localhost, headers propagation.
- Ties to apollo-mcp-server for agent access to the supergraph.

See `.grok/skills/apollo-router/SKILL.md` for details and cross-skill refs.
