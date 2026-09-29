# Documentation

Human documentation of Quicktalog as it works today. Plans and analyses made before implementing something live in [`plans/`](../.claude/plans/README.md), not here.

## Guides

How to work on the project.

| Doc | About |
|---|---|
| [guides/git-workflow.md](guides/git-workflow.md) | `test` and `main` branches, environments, release flow |
| [guides/vercel-env.md](guides/vercel-env.md) | Pulling environment variables from Vercel |
| [guides/drizzle.md](guides/drizzle.md) | Database changes: Supabase CLI migrations, Drizzle type generation |

## Standards

Rules the code must follow.

| Doc | About |
|---|---|
| [standards/solid-principles.md](standards/solid-principles.md) | S.O.L.I.D. principles in React, with examples |

## Architecture

How parts of the app work.

| Doc | About |
|---|---|
| [architecture/data-access.md](architecture/data-access.md) | How the app talks to Postgres: the three query blocks, RLS, and what fails without them |
| [architecture/ai-chat-flow.md](architecture/ai-chat-flow.md) | Builder AI assistant flow (partly outdated, see its note) |
| [architecture/catalogue-html-safety.md](architecture/catalogue-html-safety.md) | Where author HTML reaches a published catalogue and what filters it |
| [architecture/product-theme.md](architecture/product-theme.md) | Product theme tokens, primitives, page frames, and how the published catalogue stays independent of them |
| [architecture/analytics.md](architecture/analytics.md) | Catalogue analytics: the range, periods and deltas, the two PostHog queries, UTC days and ownership |
| [architecture/qr-codes.md](architecture/qr-codes.md) | QR editor: the stored design, URL pinning, validation and size limits, export composition and the unsaved-changes guard |
