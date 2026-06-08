# Configure Portless (Portable)

Portable instructions for working with portless in this monorepo.

## Relevant Files
- `portless.json` (root) — defines app names and inner scripts for the monorepo
- Each app's `package.json` (the `dev` / `dev:app` pattern)
- Vite configs for staff/public (portless injects the port)
- `apps/api/src/index.ts` (must respect `process.env.PORT`)
- CORS configuration in the API
- Root README (has a Portless section)

## Common Patterns
- To add a new Vite or Next app: add to `portless.json`, set up the dual dev scripts, update CORS if it calls the backend.
- Portless gives you nice URLs like `https://staff.localhost`, `https://api.localhost`, etc.
- Use `pnpm proxy` / `pnpm proxy:stop` to control the central proxy.
- `pnpm dev:direct` or `PORTLESS=0` to bypass when needed.

See the richer version in `.grok/skills/configure-portless/SKILL.md`.