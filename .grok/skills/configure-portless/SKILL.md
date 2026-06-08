---
name: configure-portless
description: Add or update portless configuration for local HTTPS development in this monorepo. Use when setting up new apps/services or changing routing for staff, public, api, web, or docs.
---

# Configure Portless Skill

Portless (https://github.com/vercel-labs/portless) provides stable .localhost HTTPS URLs for local development.

## Relevant Files in This Repo
- `portless.json` at repo root (defines apps and their inner scripts)
- Individual app `package.json` scripts (`dev` and `dev:app`)
- `apps/staff/vite.config.ts` and `apps/public/vite.config.ts` (port management)
- `apps/api/src/index.ts` (respects `PORT` env)
- `apps/api/src/app.ts` (CORS for .localhost domains)
- Root README section on Portless
- `apps/*/package.json` for the "dev" / "dev:app" pattern

## Common Tasks

1. **Adding a new Vite app (like a third UI)**
   - Add entry in `portless.json`
   - Add `"dev": "portless", "dev:app": "vite"` to its package.json
   - Create `vite.config.ts` (usually without hard-coded port, let portless inject)
   - Update CORS in api if it needs to call the backend
   - Update Apollo client default URL if applicable
   - Add to root README if it's a first-class app

2. **Adding a new Next.js app**
   - Similar to above, but `"dev:app": "next dev --port XXX"`
   - Next.js apps often hardcode port in the script for direct runs.

3. **Changing backend port behavior**
   - Ensure `src/index.ts` (or equivalent) reads `process.env.PORT`
   - Update any hardcoded logs or defaults

4. **Updating CORS**
   - Edit the origin function in `apps/api/src/app.ts` to accept new .localhost names or patterns.

5. **Portless config changes**
   - Edit `portless.json` carefully — names become the subdomains (staff.localhost, api.localhost, etc.)
   - Run `pnpm proxy:stop && pnpm proxy` or restart your dev processes after changes.

## Best Practices
- Keep the `dev` script as `portless` so `turbo run dev` goes through the proxy.
- Keep `dev:app` as the "real" command so people can still run `PORTLESS=0 pnpm --filter X dev:app` for direct access.
- Document new services in the Portless section of the root README.
- Use descriptive names in portless.json (e.g. "staff", "public", "api").

## Verification
- After changes, run `pnpm dev` (or the specific app) and confirm you can reach it at the expected https://name.localhost URL.
- Check that GraphQL calls from the UIs still work over the proxied domain.

## Output
- Make the minimal config + script + CORS changes needed.
- Update documentation.
- Suggest running `pnpm proxy:stop` / restart if the proxy was already running.