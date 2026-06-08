# Review Component Skill (Portable Version)

This is a portable version of the review-component skill for use in Claude, Cursor, Copilot, etc.

**When to use:** When asked to review, audit, or improve a UI component in `apps/staff` or `apps/public`.

## Process

1. Identify the component and read its source + related files.
2. Check usage of antd vs `@repo/ui`.
3. Verify theming via AntdProvider.
4. Review TypeScript quality against `packages/config-typescript`.
5. Assess accessibility, performance, consistency with the other UI.
6. If it talks to GraphQL, check the integration.

## Review Format

- Summary
- ✅ Good
- ⚠️ Improvements
- ❌ Issues
- Recommendations / refactored example

Reference specific paths and lines.

See the full Grok-native version at `.grok/skills/review-component/SKILL.md` for more details.