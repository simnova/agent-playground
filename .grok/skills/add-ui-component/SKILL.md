---
name: add-ui-component
description: Create a new reusable UI component or page feature in one of the Vite UIs (staff or public), or extend the shared @repo/ui library. Use when the user wants to add a new button, form, page section, or feature using Ant Design as the primary library.
---

# Add UI Component Skill

You are helping add a new UI component or feature to the staff or public frontend apps, or to the shared `packages/ui`.

## Prerequisites
- Read the relevant files in `apps/staff/src` or `apps/public/src` (or `packages/ui/src`).
- Understand the current theming via `AntdProvider` from `@repo/ui/antd-provider`.
- Check existing components in `@repo/ui` (button, card, code, antd-provider) to avoid duplication.
- Follow the TypeScript config from `@repo/config-typescript/react`.

## Steps
1. Clarify with the user: Which app (staff, public, or shared ui)? What is the component's purpose? Any specific antd components to use?
2. Design the component using antd primitives (Button, Form, Input, Card, Table, Modal, etc.) + Tailwind for layout.
3. If it makes sense as a shared piece, place it in `packages/ui/src/` and export it.
4. Use proper TypeScript. Prefer composition.
5. If the component needs data, integrate cleanly with Apollo (queries/mutations from the shared api).
6. Make it theme-aware (use tokens from ConfigProvider where possible).
7. Add basic usage example or integrate it into an existing page (e.g. App.tsx in the target app).
8. Ensure it passes `biome check` and `tsgo --noEmit`.
9. If appropriate, suggest adding or updating an AGENTS.md note or a new skill.

## Output
- Create/edit the necessary .tsx files using search_replace or write.
- Show a diff summary of changes.
- Provide a short usage example.
- Note any cross-app implications (staff vs public).

Do not introduce new global styles that would conflict with antd or Tailwind setup.