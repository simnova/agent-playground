# Apollo Federation (Portable)

Portable version for authoring federated GraphQL schemas.

## Relevance to This Repo
- Current: single Apollo Server in apps/api.
- Future: split into subgraphs (e.g., messages, users) for the shared backend used by staff/public UIs.
- Use with graphql-schema, update-graphql, rover.

## Core Concepts
- @key for entities
- @shareable for value types
- @external/@requires for computed fields
- @override for migrations
- Use rover supergraph compose for local testing.
- Update UIs to query the supergraph.

See `.grok/skills/apollo-federation/SKILL.md` for monorepo-specific guidance and examples tied to the current schema.
