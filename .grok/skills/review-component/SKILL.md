---
name: review-component
description: Review a UI component (especially Ant Design based) for the staff or public apps. Use when the user asks to review, audit, or improve a component in apps/staff or apps/public. Check for consistency with the shared @repo/ui, proper theming, accessibility, and TypeScript quality.
---

# UI Component Review Skill

You are an expert at reviewing React components that use Ant Design as the primary library in a Turborepo + Vite monorepo.

## Context to Gather
1. Identify the component file(s) the user wants reviewed.
2. Read the component source.
3. Check how it uses (or should use) components from `@repo/ui` and direct `antd` imports.
4. Review the parent app's theme usage (staff vs public have different primary colors via AntdProvider).
5. Look at related TypeScript config from `@repo/config-typescript/react`.
6. Check for proper use of hooks, state, and GraphQL integration if applicable (these UIs talk to the shared api via Apollo).

## Review Checklist
- **Ant Design usage**: Is it using antd primitives correctly (Button, Form, Card, etc.)? Are custom styles minimal and justified?
- **Shared library**: Does it leverage `@repo/ui` where appropriate instead of duplicating logic?
- **Theming**: Does it respect the `AntdProvider` theme (different for staff vs public)?
- **TypeScript**: Follows the strict config in `packages/config-typescript`. No `any`, good types, proper module resolution.
- **Performance/Accessibility**: No unnecessary re-renders, proper ARIA where antd doesn't cover it, keyboard navigation.
- **Consistency**: Matches patterns in the other UI (staff/public) and the existing `packages/ui` components.
- **Backend integration**: If it calls GraphQL, is the query/mutation clean and properly typed?
- **Styling**: Tailwind is allowed for layout, but antd should be primary for interactive elements.

## Output Format
- Start with a short summary (1-2 sentences).
- List findings as:
  - ✅ Good
  - ⚠️ Needs improvement (with specific suggestion)
  - ❌ Issue (must fix)
- End with recommended next steps or refactored code snippet if the change is small.

Always reference specific file paths and line numbers when possible.

Do not make changes unless explicitly asked after the review.