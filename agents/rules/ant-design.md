# Ant Design Rules (Portable)

- Ant Design (antd) is the primary component library for the Vite UIs (staff and public).
- The shared `AntdProvider` (in @repo/ui) should wrap the app root.
- Staff and public use different theme tokens (e.g. primary color).
- Use antd primitives for interactive components; Tailwind for layout/spacing.
- Reusable components should live in or be promoted to `packages/ui` when appropriate.
- See `agents/skills/add-antd-component.md` and `agents/skills/review-component.md` for detailed guidance.