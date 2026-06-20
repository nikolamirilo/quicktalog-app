---
name: server-action-and-route
description: Use when adding or editing a server-side mutation in Quicktalog — a server action in server_actions/*.ts or an API route handler in app/api/*/route.ts. Covers the auth + ownership check, Drizzle/Supabase data access, Redis sync, Sentry error capture, cache revalidation, and return-shape conventions.
---

# Server Action & API Route

Every server-side mutation in Quicktalog follows the same skeleton. Miss a step and you get silent auth holes, stale caches, or errors that never reach Sentry. This skill is the checklist.

## When to Use

- Adding/editing a function in [server_actions/](../../../server_actions/) (`catalogue.ts`, `users.ts`, `paddle.ts`, …).
- Adding/editing a handler in [app/api/](../../../app/api/)`*/route.ts`.
- Symptoms you skipped a step: a user can mutate another user's data, the UI shows stale data after a write, or an error is swallowed and never appears in Sentry.

## Server action vs. API route

| Use a **server action** (`server_actions/`) | Use an **API route** (`app/api/`) |
|---|---|
| Called from React components (the default) | Needs a URL: webhooks (Clerk, Paddle), external callers, `fetch` from SWR hooks |
| Uses **Drizzle** (`drizzleClient`) — the primary ORM | Some legacy routes use **Supabase** (`createClient`) |

**Prefer a server action for new app mutations.** Reach for an API route only when something outside React must call it. Don't add a second write path for data a server action already owns (see [[data-revalidation]] §"two data layers").

## Server action anatomy (the canonical pattern)

Modeled on [server_actions/catalogue.ts](../../../server_actions/catalogue.ts):

```typescript
"use server";
import * as Sentry from "@sentry/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { drizzleClient } from "@/utils/drizzle";
import { redis } from "@/utils/redis";
import { schema } from "@quicktalog/common";

const catalogues = schema.catalogues;

export async function updateThing(data: SomeType): Promise<boolean> {
  try {
    // 1. AUTH: get the user, bail if not signed in
    const user = await currentUser();
    if (!user?.id) return false;

    // 2. OWNERSHIP: confirm the row belongs to this user (SECURITY-CRITICAL)
    const existing = await drizzleClient.query.catalogues.findFirst({
      where: eq(catalogues.name, data.name),
      columns: { createdBy: true },
    });
    if (!existing || existing.createdBy !== user.id) return false;

    // 3. MUTATE via Drizzle
    await drizzleClient.update(catalogues).set({ /* … */ }).where(eq(catalogues.name, data.name));

    // 4. SYNC the Redis cache (catalogues are cached by `name`)
    await redis.set(data.name, JSON.stringify(data));

    // 5. REVALIDATE — the server action owns cache invalidation
    revalidateCatalogue(data.name);
    revalidateDashboard();

    return true;
  } catch (err) {
    // 6. ALWAYS capture + log in the catch
    Sentry.captureException(err);
    console.error("Unexpected error while updating thing:", err);
    return false;
  }
}
```

## The 6 required steps

1. **Auth** — `const user = await currentUser(); if (!user?.id) return <fail>;`
2. **Ownership** — fetch `{ createdBy: true }` and check `existing.createdBy !== user.id` before any write. Skipping this lets any signed-in user edit anyone's data.
3. **Mutate** — Drizzle in server actions; `createClient()` (Supabase) only in legacy routes.
4. **Redis sync** — if the entity is cached (catalogues are keyed by `name`), update or `redis.del()` it so reads don't serve stale data.
5. **Revalidate** — call `revalidateCatalogue(name)` and/or `revalidateDashboard()`. See [[data-revalidation]] for which to call.
6. **Catch** — every handler wraps its body in `try/catch` with `Sentry.captureException(err)` + `console.error(...)`.

## Return-shape conventions

- **Boolean** for simple success/fail: `deleteItem`, `updateItemStatus`, `publishCatalogue` → `Promise<boolean>`.
- **Result object** when the caller needs data or an error message: `{ success: boolean; data?: T; error?: string }` (e.g. `createCatalogue`, `updateCatalogue`).
- Pick one and stay consistent with the sibling functions in the same file.

## API route specifics

From [app/api/items/route.ts](../../../app/api/items/route.ts): export named `POST`/`PATCH`/`GET`, add `export const dynamic = "force-dynamic"` for mutating routes, return `new Response(JSON.stringify(...), { status, headers: { "Content-Type": "application/json" } })`, and `Sentry.captureException` in every catch (status 500 for DB errors, 400 for request errors, 404 for not-found).

**Security note:** the existing `items/route.ts` has **no Clerk auth/ownership check** — do not copy that. New routes that mutate user data MUST do steps 1–2 (`currentUser()` + ownership) just like the server actions.

## Common Mistakes

- **No ownership check** → users can mutate each other's catalogues. The single most important step.
- **Forgot Redis sync** → public catalogue page serves stale data even after revalidation (Redis is checked before the DB in `getCatalogueByName`).
- **Forgot revalidate** → dashboard/listing shows old data until a hard reload.
- **Error swallowed** → no `Sentry.captureException` in the catch, so prod errors are invisible.
- **New write path for owned data** → adding a Supabase route for something a Drizzle server action already writes creates two divergent paths. Extend the server action instead.
