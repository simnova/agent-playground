# Add New Vite App (Portable)

Portable instructions for adding another Vite + React frontend to this monorepo (usable by Claude, Cursor, Copilot, etc.).

Follow the same high-level steps as the Grok-native `add-new-vite-app` skill:

- Create `apps/<name>/`
- Wire package.json with portless "dev" / "dev:app" pattern
- Add to root `portless.json`
- Set up Vite + React + antd + Tailwind
- Use `@repo/config-typescript/react` and `@repo/ui` + AntdProvider
- Configure Apollo Client pointing at the shared backend (default `https://api.localhost/graphql`)
- Update CORS in the api if necessary
- Update root README and any relevant docs
- Ensure Biome + tsgo pass

See the fuller version with more details in `.grok/skills/add-new-vite-app/SKILL.md`.