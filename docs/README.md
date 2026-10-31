# Documentation

Human documentation of Quicktalog as it works today. Plans and analyses made before implementing something live in [`plans/`](../.claude/plans/README.md), not here.

## Guides

How to work on the project.

| Doc | About |
|---|---|
| [guides/git-workflow.md](guides/git-workflow.md) | `test` and `main` branches, environments, release flow |
| [guides/vercel-env.md](guides/vercel-env.md) | Pulling environment variables from Vercel |
| [guides/drizzle.md](guides/drizzle.md) | Database changes: Supabase CLI migrations, Drizzle type generation |
| [guides/testing.md](guides/testing.md) | Unit and integration tests (Vitest) |

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
| [architecture/catalogue-chrome.md](architecture/catalogue-chrome.md) | Published catalogue navbar, opt-in search bar, footer, glass effect and custom background: settings, plan rules, styling |
| [architecture/builder.md](architecture/builder.md) | Builder frame (rail, panel push/overlay, phone sheet and bottom bar), edit controls inside the catalogue, builder dialogs |
| [architecture/product-theme.md](architecture/product-theme.md) | Product theme tokens, primitives, page frames, and how the published catalogue stays independent of them |
| [architecture/manual.md](architecture/manual.md) | The user manual at `/docs/new`: routes, the content registry, the page framework and the drawn screens |
| [architecture/analytics.md](architecture/analytics.md) | Catalogue analytics: the range, periods and deltas, the two PostHog queries, UTC days and ownership |
| [architecture/qr-codes.md](architecture/qr-codes.md) | QR editor: the stored design, URL pinning, validation and size limits, export composition and the unsaved-changes guard |
| [architecture/billing.md](architecture/billing.md) | Paddle checkout, plan changes vs cancellation, when the user is downgraded and emailed |
| [architecture/legal-consent.md](architecture/legal-consent.md) | Accepting the three legal documents: the record on `users.consents`, the one `terms_version` stamp, and the `/admin` gate |
