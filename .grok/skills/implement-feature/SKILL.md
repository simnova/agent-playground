---
name: implement-feature
description: Implement a new feature or component following the conventions of this monorepo. Use when the user asks to build something new in the staff/public UIs, shared packages, or api. Strongly prefer using Ant Design for UI work and the shared @repo/ui library.
---

# Implement Feature Skill

Follow this process when asked to add new functionality.

## 1. Understand the Request
- Clarify scope: Which app(s)? (staff, public, api, packages/ui, etc.)
- Check existing patterns by reading similar code.
- Look for relevant skills (e.g. review-component, add-ui-component) and AGENTS.md.

## 2. Design
- For UI work: Use antd as primary. Wrap with AntdProvider theming. Reuse or extend from @repo/ui when possible.
- For backend: Follow the Hono + Apollo patterns in apps/api.
- For shared code: Put reusable logic/types in the appropriate package.
- Prefer TypeScript, strict config from @repo/config-typescript.
- Consider both staff and public UIs — share what makes sense.

## 3. Implementation Steps
- Plan the changes (files to create/edit).
- Implement incrementally, using search_replace or write.
- Keep components focused and typed.
- Add necessary GraphQL schema/resolvers/mutations if touching the backend.
- Update any relevant documentation or AGENTS.md notes.

## 4. Quality
- Run `biome check .` and fix issues.
- Run `tsgo --noEmit` (or the project's check-types) and fix.
- If UI, make sure it works with the current theming (different primary colors for staff vs public).
- Consider accessibility and responsive behavior.

## 5. Review & Test
- Use the `review-component` skill (or thorough-reviewer persona) on the changes.
- Provide a summary of what was built and how to test it.

Always prefer small, reviewable changes. Reference specific files and the monorepo structure.

**Backend calc / pure module hygiene (cross-skill, per agent-evaluator):** When touching portable engines (e.g. `calculateDepositAllocation` or similar in api/src/graphql/*), after the main implementation:
- Verify the named export.
- Run a live sample call with realistic BankBuckets seed data (percentAlloc + maxAmount + spillOverOrder buckets; deposit sized to hit caps + trigger waterfall + remainder handling). Assert no NaN, correct allocated/capped/spillOverBucketUsed, and projected values. Use the project's runner (bun for api .ts). Record "sample verified" in your todo/hand-off.
This directly prevents the class of runtime NaN bugs that block server apply/persist even when client preview works.