---
name: data-revalidation
description: Use when a Quicktalog mutation needs to refresh data - deciding which cache to invalidate and how the UI updates after a create/update/delete/publish. Covers the two server-side revalidation helpers, Redis cache sync, and the client-side router.refresh / SWR mutate / refreshUserData split, so you avoid redundant or missing refreshes.
---

# Data Revalidation

Quicktalog has **four** independent freshness mechanisms. Calling the wrong ones gives stale UI; calling all of them gives redundant re-fetches. This skill defines who owns what. Background: [docs/revalidation-analysis.md](../../../docs/revalidation-analysis.md).

## The core rule

**The server action owns cache invalidation. The client only triggers a re-render.**

A mutation changes data → it invalidates the caches it touched (Next.js + Redis) → the client re-renders. The client should not re-invalidate what the server already invalidated.

## The four mechanisms

| Mechanism | Where | Owner | When |
|---|---|---|---|
| `revalidateCatalogue(name?)` | [helpers/server.ts](../../../helpers/server.ts) | **Server action** | Any create/update/publish/delete of a catalogue |
| `revalidateDashboard()` | [helpers/server.ts](../../../helpers/server.ts) | **Server action** | Anything that changes dashboard stats (status, delete, create, duplicate) |
| `redis.set/del(name)` | inside the server action | **Server action** | Catalogues are cached in Redis by `name` - sync on every write |
| `router.refresh()` | client component | **Client** | After awaiting the action, to re-render server components with fresh data |

Two client helpers exist on top of `router.refresh()` - use them only when their specific condition holds:

- **`refreshAll()`** ([hooks/useDashboardData.ts](../../../hooks/useDashboardData.ts)) - SWR `mutate()` for the dashboard's analytics/catalogues/newsletter. Use **only on the dashboard** for immediate/optimistic update. Pointless anywhere else.
- **`refreshUserData()`** ([context/UserContext.tsx](../../../context/UserContext.tsx)) - re-fetches the user's plan/usage. Use **only when the mutation changed the user's usage or limits** (creating/deleting a catalogue, hitting a plan gate). Not for edits within an existing catalogue.

## Which server helper to call

`revalidateCatalogue(name)` revalidates the `/catalogues` listing + the specific catalogue page and its tags. `revalidateDashboard()` revalidates `/dashboard` and the root layout.

| Operation | Server-side calls |
|---|---|
| create catalogue | `revalidateCatalogue(slug)` + `revalidateDashboard()` |
| update catalogue (content edit) | `revalidateCatalogue(name)` |
| publish catalogue | `revalidateCatalogue(name)` + `revalidateDashboard()` |
| update status | `revalidateCatalogue(name)` + `revalidateDashboard()` |
| duplicate | `revalidateCatalogue(newSlug)` + `revalidateDashboard()` |
| delete one | `revalidateCatalogue(name)` + `revalidateDashboard()` |
| delete many | `revalidateCatalogue()` (no name → listing only) + `revalidateDashboard()` |

Rule of thumb: pass the **name** whenever a single catalogue changed; add **`revalidateDashboard()`** whenever the change affects counts/stats shown on the dashboard. This matches [server_actions/catalogue.ts](../../../server_actions/catalogue.ts).

## Client side: the minimal pattern

```typescript
// In a dashboard component, after a mutation that changes plan usage:
await deleteItem(name);   // server action already invalidated Next.js + Redis
await refreshAll();       // SWR: instant dashboard update (dashboard only)
await refreshUserData();  // usage/limit changed (create/delete only)
router.refresh();         // re-render server components
```

Off the dashboard, or for an edit that doesn't touch usage, you need **only** `router.refresh()`. Don't reflexively paste all four - each extra call is a redundant network round-trip.

## Two data layers (know this)

Server actions write via **Drizzle**; `app/api/items/route.ts` writes the same `catalogues` table via **Supabase**. Both call revalidation, so a write can happen on two paths. Prefer the server-action (Drizzle) path for app mutations; don't introduce a second path for data an action already owns. See [[server-action-and-route]].

## Common Mistakes

- **Client re-invalidates what the server already did** - e.g. calling a `revalidateData()`-style purge from the component after the action already revalidated. Redundant; the action owns it.
- **`refreshAll()` outside the dashboard** - it only mutates dashboard SWR caches; useless elsewhere.
- **`refreshUserData()` on a content edit** - usage didn't change, so it's a wasted re-fetch. Reserve it for create/delete/plan-gate operations.
- **Forgot Redis sync in the action** - `getCatalogueByName` reads Redis before the DB, so the public page stays stale even after `revalidateCatalogue`. Always `redis.set`/`redis.del` on write.
- **Nuclear revalidation** - purging the root layout for a single-catalogue edit. Pass the `name` and target it instead.
- **Missing `revalidateDashboard()`** - a status change or delete that doesn't refresh dashboard stats.
