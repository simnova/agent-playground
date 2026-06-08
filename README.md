# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `staff`: a static UI site (Vite + React + Apollo Client) for staff/internal use, connecting to the shared backend
- `public`: a static UI site (Vite + React + Apollo Client) for public-facing use, connecting to the same shared backend
- `api`: Bun + Hono server with Apollo GraphQL, configured for Azure Functions (v4 Node model via `@marplex/hono-azurefunc-adapter`)
- `@repo/ui`: a stub React component library
- `@repo/config-typescript`: shared TypeScript configuration (base, node, next, react, vitest) modeled after quality-focused DDD monorepos like CellixJS
- Official **turborepo** skill (from vercel/turborepo) installed via `pnpm dlx skills add ...` into `.agents/skills/turborepo/` (universal for many agents) and `.grok/skills/turborepo/` (Grok-native). Includes authoritative guidance on task pipelines, caching, `--filter` / `--affected`, internal packages, monorepo best practices, etc. This is the recommended skill for all Turborepo work in the repo.

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

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
cd my-turborepo
turbo build
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo build
pnpm dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo build --filter=docs
```

Without global `turbo`:

```sh
npx turbo build --filter=docs
pnpm exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo dev
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo dev
pnpm exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo dev --filter=web
```

Without global `turbo`:

```sh
npx turbo dev --filter=web
pnpm exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
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
cd my-turborepo
turbo login
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo login
pnpm exec turbo login
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
