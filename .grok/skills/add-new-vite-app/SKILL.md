---
name: add-new-vite-app
description: Scaffold a new Vite + React + TypeScript app in this Turborepo (e.g. a third UI besides staff and public). Use when the user wants to add another frontend that will also connect to the shared api backend.
---

# Add New Vite App Skill

This skill helps add a new Vite-based frontend to the monorepo following existing patterns.

## High-Level Steps

1. **Create the app directory**
   - Usually under `apps/<name>` (e.g. `apps/admin`, `apps/marketing`).
   - You can copy `apps/staff` or `apps/public` as a starting point, or run `pnpm create vite@latest apps/<name> -- --template react-ts`.

2. **Wire it into the monorepo**
   - Update `apps/<name>/package.json`:
     - Name: e.g. "admin" or "marketing"
     - Dependencies: `@apollo/client`, `graphql`, `@repo/config-typescript`, `@repo/ui`, react, react-dom, etc.
     - Dev deps: Vite, @vitejs/plugin-react, Tailwind if used, types.
     - Scripts:
       ```json
       "dev": "portless",
       "dev:app": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "check-types": "tsgo --noEmit",
       "lint": "biome check ."
       ```
   - Create `vite.config.ts` (use the same plugins as staff/public; remove hardcoded port so portless can inject it).

3. **Add to portless**
   - Edit `portless.json` root:
     ```json
     "apps/<name>": {
       "name": "<name>",
       "script": "dev:app"
     }
     ```

4. **Connect to the backend**
   - Copy/adapt `src/lib/apollo-client.ts` from staff or public.
   - Default to `https://api.localhost/graphql` (or make it configurable via VITE_GRAPHQL_URL).
   - Update CORS in `apps/api/src/app.ts` if the new app uses a different origin pattern.

5. **Theming & shared UI**
   - Wrap root with `<AntdProvider>` (from `@repo/ui/antd-provider`).
   - Optionally pass a custom theme for visual distinction.
   - Import `antd/dist/reset.css` in main.tsx.
   - Use antd as primary + Tailwind for layout.
   - Depend on and use `@repo/ui` components where appropriate.

6. **TypeScript**
   - The app's `tsconfig.json` should extend `@repo/config-typescript/react` (or base + overrides).
   - Add Vite client types, paths if using aliases.

7. **Polish**
   - Add the app to root README "Apps and Packages" section.
   - Update any workspace docs or AGENTS.md notes.
   - Run full `biome check` and type checks across affected packages.

8. **Optional: Make it a first-class citizen**
   - Consider whether it should also get its own entry in `knip.json` with tailored entry/project globs.

## Output
- Create the directory and files.
- Wire up portless + scripts.
- Make the GraphQL connection work.
- Update documentation.
- Provide clear commands to run the new app (e.g. `pnpm --filter <name> dev`).

See `agents/skills/add-new-vite-app.md` for a portable version of these instructions.