# Ant Design Conventions

- antd is the **primary** UI component library for `apps/staff` and `apps/public`.
- Use the shared `AntdProvider` (from `@repo/ui/antd-provider`) at the app root.
- Different apps can (and do) use different theme overrides (primary color, etc.).
- Prefer antd components for buttons, forms, cards, lists, modals, tables, etc.
- Tailwind is used for layout and spacing, not for replacing antd's visual design system.
- When creating reusable pieces, consider putting them in `packages/ui` and making them theme-aware.
- See the `add-antd-component` and `add-ui-component` skills for implementation guidance.
- Review work with the `review-component` skill, paying special attention to antd + theming usage.