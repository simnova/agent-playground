# agentPlayground

A playground and library for AI agent capabilities (focused on Grok but portable across tools).

This is a custom Turborepo monorepo (not the vanilla starter).

## What's inside?

This Turborepo includes the following apps and packages:

### Apps

- `staff`: Internal staff portal — Vite + React + TypeScript + Ant Design (primary UI library) + Apollo Client. Blue theme.
- `public`: Public / customer-facing site — same stack as staff (green theme).
- `api`: Backend — Bun + Hono + Apollo GraphQL + Mongoose (with mongodb-memory-server for tests). Also has Azure Functions adapter.

### Packages

- `@repo/ui`: Shared React components, including the theme-aware `AntdProvider`.
- `@repo/config-typescript`: Strict TypeScript configuration (base, react, node, vitest, etc.) + tsgo support.

- Official **turborepo** skill (from vercel/turborepo) is available in both `.grok/skills/turborepo/` (Grok-native) and `agents/skills/turborepo/` (portable). Use it for any monorepo / turbo questions.

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/). (Using TypeScript 7 + `tsgo` for checking.)

### TypeScript 7 + tsgo

This repo uses **TypeScript 7** via the native Go-based compiler (`tsgo`) from [@typescript/native-preview](https://www.npmjs.com/package/@typescript/native-preview).

- Type checking tasks (`check-types`) run with `tsgo --noEmit` instead of `tsc`.
- The `@typescript/native-preview` package provides the `tsgo` executable.
- For the best editor experience, install the [TypeScript (Native Preview)](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview) VS Code extension and enable it:
  ```json
  { "js/ts.experimental.useTsgo": true }
  ```
### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) (via `tsgo` / native preview) for static type checking
- [Biome](https://biomejs.dev/) for linting and formatting
- [Knip](https://knip.dev/) for finding unused files, exports and dependencies
- [@e18e/cli](https://e18e.dev/) for ecosystem performance and dependency analysis

### Build

To build all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
turbo build
```

Without global `turbo`, use your package manager:

```sh
npx turbo build
pnpm dlx turbo build
pnpm exec turbo build
```

You can build a specific app or package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo build --filter=staff
```

Without global `turbo`:

```sh
npx turbo build --filter=staff
pnpm exec turbo build --filter=staff
```

### Develop

To develop all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
turbo dev
```

Without global `turbo`, use your package manager:

```sh
npx turbo dev
pnpm exec turbo dev
```

You can develop a specific app by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo dev --filter=staff
```

Without global `turbo`:

```sh
npx turbo dev --filter=staff
pnpm exec turbo dev --filter=staff
```

### Local Development with Portless (HTTPS .localhost URLs)

This monorepo uses [portless](https://github.com/vercel-labs/portless) to provide stable HTTPS URLs (e.g. `https://staff.localhost`, `https://api.localhost`) instead of raw ports. This is especially useful for auth flows, secure cookies, and production-like local dev.

**Setup (first time):**

```sh
# Trust the local CA (may prompt for sudo on macOS/Linux)
pnpm exec portless trust

# Start the proxy (optional; it auto-starts when you run apps)
pnpm proxy
```

**Run development (recommended with Turborepo):**

```sh
# Starts all apps through portless (staff, public, api)
pnpm dev

# Or without portless (plain ports, for CI or quick checks)
pnpm dev:direct
```

**Direct usage:**

- `portless` from repo root → starts all workspace "dev" scripts through the proxy.
- `portless staff` (or cd into app and run `portless`) → specific app.
- Access UIs at:
  - Staff: https://staff.localhost
  - Public: https://public.localhost
  - API (GraphQL): https://api.localhost/graphql


The `portless.json` at root configures names and inner scripts for the monorepo + Turborepo integration.

Each app's `package.json` uses the pattern:

```json
"dev": "portless",
"dev:app": "<real command>"
```

Portless injects `PORT`, `PORTLESS_URL`, etc., into the child processes. The API respects `process.env.PORT`. Vite configs have the port override commented so portless controls it.

**Escape hatches:**

- `PORTLESS=0 pnpm dev` or `pnpm dev:direct` — bypass portless.
- Run a specific app directly: `PORTLESS=0 pnpm --filter staff dev:app`

See `portless --help` or the [portless README](https://github.com/vercel-labs/portless) for more (including LAN mode, Tailscale sharing, etc.).

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
turbo login
```

Without global `turbo`, use your package manager:

```sh
npx turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo link
```

Without global `turbo`:

```sh
npx turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
