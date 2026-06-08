---
name: add-antd-component
description: Add a new Ant Design based component or page feature to the staff or public Vite apps, or extend the shared @repo/ui library. Use when the user wants to introduce new UI elements using antd as the primary library.
---

# Add Ant Design Component Skill

Follow this workflow when adding UI components that use Ant Design (antd) v5+.

## Steps

1. **Determine scope**
   - Is this for `apps/staff`, `apps/public`, or a shared component in `packages/ui`?
   - Staff and public have different themes via `AntdProvider` (staff often blue primary, public green in examples).

2. **Explore existing patterns**
   - Read current components in the target app and in `packages/ui/src/` (especially `antd-provider.tsx`).
   - Check how antd components are currently used (Button, Form, Card, List, Input, etc.).
   - Look at `agents/skills/add-ui-component.md` and the Grok-native `add-ui-component` skill for general guidance.

3. **Design**
   - Prefer composing antd primitives.
   - Use `ConfigProvider` theme tokens where possible.
   - Keep layout/spacing with Tailwind if needed, but antd for interactive components.
   - Make the component theme-aware and responsive.
   - If reusable, place it in `packages/ui/src/` and export it.

4. **Implementation**
   - Create or edit `.tsx` files.
   - Use proper TypeScript (extends `@repo/config-typescript/react`).
   - If it needs data, integrate with Apollo Client cleanly (the UIs talk to the shared `apps/api` GraphQL backend).
   - Add the component to a page or create a small demo section.

5. **Polish**
   - Run `biome check . --write` on the changed files.
   - Run `tsgo --noEmit` (or the package's `check-types`).
   - Consider accessibility (antd handles a lot, but verify).

6. **Review**
   - Strongly consider running the `review-component` skill on the new work.

## Ant Design Specific Tips

- Use `Form`, `Input`, `Button`, `Card`, `Modal`, `Table`, `Select`, etc. as primary building blocks.
- Leverage `theme` prop on `ConfigProvider` / `AntdProvider` for differentiation between staff and public.
- For icons, use `@ant-design/icons`.
- Avoid heavy custom CSS; use antd's design system and token overrides.

## Output

- Create the component files.
- Show a short usage example in the relevant App or a new demo page.
- Note any updates needed to the shared library or theming.
- Suggest whether this should also get a portable version in `agents/skills/`.