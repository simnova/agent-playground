# Add Ant Design Component (Portable)

Portable version of the add-antd-component skill.

Use when introducing new UI elements using antd as the primary library in staff, public, or the shared @repo/ui.

## Key Principles
- antd is primary for interactive components.
- Use the shared `AntdProvider` (from @repo/ui) for theming.
- Staff and public have (or can have) different theme overrides.
- Prefer composition of antd primitives (Button, Form, Card, List, etc.).
- Tailwind for layout/spacing.
- Make components theme-aware and accessible.
- Promote reusable pieces to `packages/ui` when appropriate.

## Process
1. Decide scope (one of the apps vs shared).
2. Explore existing antd usage and the AntdProvider.
3. Build with antd + proper TypeScript.
4. Integrate with Apollo if the component needs data from the backend.
5. Verify with Biome + tsgo.
6. Consider reviewing with the review-component guidelines.

See the full version (with more Ant Design specific tips) at `.grok/skills/add-antd-component/SKILL.md`.