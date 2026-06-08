# UI Conventions (staff & public apps)

- Ant Design (antd) is the **primary** component library.
- Use the shared `AntdProvider` from `@repo/ui/antd-provider` at the root of each app.
- Staff and public can (and should) have different theme overrides (primary color, etc.).
- Prefer antd components (Button, Form, Input, Card, List, Table, Modal, etc.) for interactive elements.
- Use Tailwind (via the Vite plugin) for layout, spacing, and custom non-component styling.
- Keep components in `apps/*/src/` or promote reusable ones to `packages/ui/src/`.
- All new UI work should be consumable by both "staff" (internal) and "public" (customer) experiences where possible, with clear differentiation only where needed.
- Follow the React + TypeScript config from `@repo/config-typescript/react`.

When reviewing or implementing UI, prefer the `review-component` skill (or its portable version in `agents/skills/`).