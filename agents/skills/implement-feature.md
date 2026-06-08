# Implement Feature (Portable)

**Portable version for Claude, Cursor, Copilot, etc.**

Use this procedure when asked to build new functionality in this monorepo (especially the Vite UIs or shared packages).

## Process

1. **Clarify scope**
   - Which part? (staff, public, api, packages/ui, etc.)
   - Any specific requirements for theming (staff vs public have different Ant Design primary colors)?

2. **Explore patterns**
   - Read similar existing code.
   - Check `AGENTS.md` and the `agents/` directory for conventions.
   - For UI: Ant Design is primary. Prefer using `@repo/ui` components + AntdProvider when possible.

3. **Design**
   - UI: antd components + Tailwind for layout. Theme-aware.
   - Backend: Hono + Apollo GraphQL patterns.
   - Shared: Put reusable pieces in `packages/`.

4. **Implement**
   - Make focused changes.
   - Use proper TypeScript (see `packages/config-typescript`).
   - For UI work, ensure it works under both staff and public themes.

5. **Verify**
   - Run linting and type checking for the affected packages.
   - Review your own changes (use the review-component guidelines in `agents/skills/review-component.md`).

6. **Document**
   - Update relevant parts of AGENTS.md or add notes if introducing new patterns.

See the richer Grok version at `.grok/skills/implement-feature/SKILL.md`.