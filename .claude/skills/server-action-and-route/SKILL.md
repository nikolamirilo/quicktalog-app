---
name: server-action-and-route
description: Use when adding or editing a server-side mutation in Quicktalog - a server action in actions/*.ts or an API route handler in app/api/*/route.ts. Covers the identity check, the RLS wrapper that every query runs in, owner predicates, Redis sync, Sentry error capture, cache revalidation, and return-shape conventions.
---

# Server Action & API Route

Every server-side mutation follows the same skeleton. Miss a step and you get silent auth holes, stale caches, or errors that never reach Sentry. This skill is the checklist.

## When to Use

- Adding/editing a function in [actions/](../../../actions/) (`catalogue.ts`, `users.ts`, `themes.ts`, …).
- Adding/editing a handler in [app/api/](../../../app/api/)`*/route.ts`.
- Symptoms you skipped a step: a query fails with `42501`, a user can reach another user's data, the UI shows stale data after a write, or an error is swallowed and never appears in Sentry.

Background: [docs/architecture/data-access.md](../../../docs/architecture/data-access.md).

## Server action vs. API route

| Use a **server action** (`actions/`) | Use an **API route** (`app/api/`) |
|---|---|
| Called from React components (the default) | Needs a URL: webhooks (Clerk, Paddle), external callers, `fetch` from SWR hooks |

**Prefer a server action for new app mutations.** Reach for an API route only when something outside React must call it. Don't add a second write path for data a server action already owns (see [[data-revalidation]] §"two data layers").

## Pick the right block

Every query runs inside one of three blocks. There is no fourth way to reach the database: a stray query runs as a role with no privileges and fails with `42501`.

| Block | For | Runs as |
|---|---|---|
| `withUser(me, tx => …)` | anything a signed-in user does | `app_user`, RLS limits it to their rows |
| `withPublic(tx => …)` | visitors, ISR, sitemap, public signups | `app_public`, sees only active catalogues |
| `asAdmin(op, tx => …)` | webhooks, provisioning, scripts | `postgres`, **bypasses RLS** |

`asAdmin` is importable only from `@/utils/db/admin`, and only by system modules. `tests/unit/architecture/db-boundaries.test.ts` fails the build if a server action can reach it.

## Server action anatomy (the canonical pattern)

Modeled on [actions/catalogue.ts](../../../actions/catalogue.ts):

```typescript
"use server";
import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";
import { schema } from "@quicktalog/common";

const catalogues = schema.catalogues;

export async function updateThing(data: SomeType): Promise<boolean> {
  try {
    // 1. IDENTITY: derived here, never taken from an argument
    const me = await getVerifiedIdentity();
    if (!me) return false;

    // 2. ONE transaction: read and write together, with an owner predicate on
    //    every statement and the affected row checked
    const [row] = await withUser(me, (tx) =>
      tx
        .update(catalogues)
        .set({ /* only client-editable fields; see pickEditable */ })
        .where(and(eq(catalogues.name, data.name), eq(catalogues.createdBy, me.userId)))
        .returning({ id: catalogues.id, name: catalogues.name }),
    );
    if (!row) return false;   // not theirs, or gone

    // 3. Redis and revalidation AFTER the transaction: neither may hold a
    //    pooled connection open
    await writeOwnedDraft({ ...data, id: row.id });
    revalidateCatalogue(row.name);
    revalidateDashboard();

    return true;
  } catch (err) {
    // 4. ALWAYS capture + log in the catch
    Sentry.captureException(err, { tags: { op: "updateThing" } });
    console.error("Unexpected error while updating thing:", err);
    return false;
  }
}
```

## The required steps

1. **Identity** — `const me = await getVerifiedIdentity(); if (!me) return <fail>;`. Never accept `userId`, `ownerId` or `createdBy` as a parameter of an action; helpers that take one live in `server-only` modules under `lib/`.
2. **Owner predicate** — keep `eq(table.createdBy, me.userId)` (or `userId`/`ownerId`) in the statement even though RLS enforces it too. Two locks, and the predicate is what a reviewer can see.
3. **Check what came back** — `returning(...)` and treat zero rows as "not found". A blocked row is not an error, it is simply not returned.
4. **Trust nothing from the client** — status, plan flags and ids are decided by the server. Use `pickEditable()` for catalogue payloads and the helpers in `lib/entitlements/` for plan limits.
5. **Keep the transaction short** — no `fetch`, Redis, `revalidate*`, model call or streaming inside a block. It pins a pooled connection.
6. **Revalidate** — `revalidateCatalogue(name)` and/or `revalidateDashboard()`. See [[data-revalidation]].
7. **Catch** — wrap the body in `try/catch` with `Sentry.captureException(err, { tags: { op } })` + `console.error(...)`.

## Return-shape conventions

- **Boolean** for simple success/fail: `deleteItem`, `updateItemStatus`, `publishCatalogue` → `Promise<boolean>`.
- **Result object** when the caller needs data or a message: `{ success: boolean; data?: T; error?: string }` (e.g. `createCatalogue`). Declare the return type explicitly: the project has `strict: false`, so a union of literal shapes will not narrow at the call site.
- Pick one and stay consistent with the sibling functions in the same file.

## API route specifics

Export named `GET`/`POST`/`PATCH`, add `export const dynamic = "force-dynamic"` where the response must not be cached, and `Sentry.captureException` in every catch (500 for database errors, 400 for request errors, 404 for not-found).

- **Signed-in routes** do their own identity check and answer 401 — middleware is not enough.
- **Public routes** (`/api/items*`) use the helpers in `lib/catalogue/public.ts` and never read cookies or identity, so their output is the same for every visitor.
- **Webhooks** (`/api/clerk`, `/api/paddle`) verify their signature, use `asAdmin`, and let errors reach the caller as 5xx so the sender retries.

## Common Mistakes

- **Query outside a block** → `42501`. Wrap it, don't work around it.
- **Missing owner predicate** → works today because RLS saves you, but the next reader cannot tell the query is safe.
- **`await` on something slow inside the block** → a pooled connection is held open for the whole request.
- **Forgot Redis sync** → the builder shows a stale draft; drafts are keyed by catalogue **id** (`lib/catalogue/draft-cache.ts`), never by name.
- **Forgot revalidate** → dashboard or public page shows old data until a hard reload.
- **Error swallowed** → no `Sentry.captureException` in the catch, so production errors are invisible.
