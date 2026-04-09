# Revalidation & Data Refresh Logic - Analysis & Proposal

## Current Architecture

The app uses **4 independent refresh mechanisms** that are called together in most operations, creating redundancy and ambiguity about which one is actually responsible for updating the UI.

### The 4 Mechanisms

| # | Mechanism | Where | What it does |
|---|-----------|-------|-------------|
| 1 | `revalidateData()` (server action) | `helpers/server.ts` | Calls `revalidatePath("/", "layout")` - purges Next.js full route cache for the entire app |
| 2 | `refreshAll()` (SWR mutate) | `hooks/useDashboardData.ts` | Re-fetches `/api/dashboard/analytics` and `/api/dashboard/catalogues` client-side |
| 3 | `refreshUserData()` (context) | `context/UserContext.tsx` | Re-calls `getUserData()` server action to refresh user metadata |
| 4 | `router.refresh()` | Various components | Triggers App Router to re-render the current route's server components |

### How They're Called Today

Almost every mutation calls **all 4** sequentially:

```typescript
// Overview.tsx - confirmDelete, handleDuplicate, handleUpdateStatus, handleDeleteMultiple
await refreshAll();           // SWR
await revalidateData();       // Server action (purge cache)
await refreshUserData();      // Context
router.refresh();             // Router

// ActionButtons.tsx - handlePublish
await refreshAll();
await revalidateData();
await refreshUserData();
router.refresh();
```

---

## Problems

### 1. Redundant Calls - "Belt, Suspenders, and Duct Tape"

`revalidateData()` already invalidates the root layout which causes Next.js to re-fetch all data on the next navigation. Then `router.refresh()` forces that re-fetch immediately. Then `refreshAll()` ALSO re-fetches the same dashboard data via SWR. That's the same data being fetched 2-3 times.

### 2. Six Revalidation Functions, Unclear When to Use Which

`helpers/server.ts` exports 6 functions with overlapping responsibilities:

| Function | Used By | Scope |
|----------|---------|-------|
| `revalidateData()` | Most operations | Root layout (nuclear option) |
| `revalidateCataloguesData(name)` | Nothing directly (only via legacy alias) | Specific catalogue + tags |
| `revalidateAllCatalogues()` | `deleteMultipleItems` only | Catalogue listing pages |
| `revalidatePageData(name)` | Nothing (legacy wrapper) | Alias for `revalidateCataloguesData` |
| `revalidateCatalogueByTag(name)` | Nothing | Tag-only revalidation |
| `revalidateAfterCatalogueChange(name?)` | `deleteItem` only | Comprehensive parallel revalidation |

Only 3 of these 6 are actually used. The most specific/correct ones (`revalidateCatalogueByTag`, `revalidateCataloguesData`) are **never called directly**.

### 3. Inconsistent Revalidation Scope Per Operation

| Operation | Server Action Revalidation | Problem |
|-----------|---------------------------|---------|
| `deleteItem` | `revalidateAfterCatalogueChange(name)` | Correct - targeted |
| `deleteMultipleItems` | `revalidateAllCatalogues()` | OK - bulk operation |
| `updateItemStatus` | `revalidateData()` | Too broad - only needs dashboard + specific catalogue |
| `duplicateItem` | `revalidateData()` | Too broad |
| `createCatalogue` | `revalidateData()` | Too broad - should invalidate listing |
| `updateCatalogue` | `revalidateData()` | Too broad - should invalidate specific catalogue |
| `publishCatalogue` | `revalidateData()` | Too broad - should invalidate specific catalogue + listing |

Most operations default to the nuclear `revalidateData()` which purges the entire root layout cache.

### 4. Double Revalidation - Server Action + Client Component

The server actions (e.g., `deleteItem`) already call revalidation internally. Then the client component calls revalidation AGAIN:

```
deleteItem(name)                    // calls revalidateAfterCatalogueChange(name) internally
  -> client then calls refreshAll()   // redundant
  -> client then calls revalidateData() // ALSO redundant - already done in server action
  -> client calls router.refresh()    // forces re-render
```

### 5. SWR Configuration Asymmetry

- `useAnalytics()` has `refreshInterval: 300000` (polls every 5 min)
- `useCatalogues()` has **no** refresh interval

Analytics auto-refresh; catalogues don't. If the intent was to keep both fresh, they should match.

### 6. Promise.resolve Wrapping in revalidateAfterCatalogueChange

```typescript
revalidations.push(Promise.resolve(revalidateTag("catalogues-list")));
```

`revalidateTag` is synchronous in Next.js (it marks tags as stale, doesn't return a promise). Wrapping in `Promise.resolve()` is misleading - it suggests async behavior that doesn't exist. Same for `revalidatePath`.

### 7. No Return Value Checking

All revalidation functions return `{ success: boolean }` but no caller ever checks the result:

```typescript
await revalidateData(); // result ignored
```

### 8. API Route Uses Supabase, Server Actions Use Drizzle

- `app/api/items/route.ts` uses **Supabase client** directly
- `server_actions/catalogue.ts` uses **Drizzle ORM**

Same data, two different access patterns. The API route also calls `revalidateData()` after mutations, creating a second pathway where cache invalidation can happen.

---

## Proposed Improvement

### Principle: One Path In, One Path Out

Each mutation should have a **single, predictable revalidation strategy** based on what data it changed.

### Step 1: Consolidate to 2 Revalidation Functions

Replace the 6 functions with 2:

```typescript
// helpers/server.ts
"use server";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidate a specific catalogue and related listings.
 * Use after: create, update, publish, delete of a single catalogue.
 */
export async function revalidateCatalogue(catalogueName?: string) {
  revalidatePath("/catalogues", "page");
  revalidateTag("catalogues-list");

  if (catalogueName) {
    revalidatePath(`/catalogues/${catalogueName}`, "page");
    revalidateTag(`catalogue-${catalogueName}`);
    revalidateTag("catalogue-detail");
    revalidateTag("catalogue-metadata");
  }
}

/**
 * Revalidate the dashboard/admin area.
 * Use after: operations that affect dashboard stats (status changes, deletes).
 */
export async function revalidateDashboard() {
  revalidatePath("/dashboard", "page");
}
```

### Step 2: Move All Revalidation Into Server Actions

The server action is the single source of truth for "what changed." It should own revalidation:

```typescript
// server_actions/catalogue.ts

export async function deleteItem(name: string): Promise<boolean> {
  await drizzleClient.delete(catalogues).where(eq(catalogues.name, name));
  await redis.del(name);
  revalidateCatalogue(name);
  revalidateDashboard();
  return true;
}

export async function publishCatalogue(data: Catalogue): Promise<boolean> {
  // ... db + redis update ...
  revalidateCatalogue(data.name);
  revalidateDashboard();
  return true;
}

export async function updateCatalogue(data: Catalogue) {
  // ... redis update ...
  revalidateCatalogue(data.name);
  return { success: true, data };
}

export async function createCatalogue(data: Catalogue) {
  // ... db + redis insert ...
  revalidateCatalogue(slug);
  revalidateDashboard();
  return { success: true, data };
}
```

### Step 3: Simplify Client-Side Refresh

Since server actions handle revalidation, the client only needs to trigger a re-render:

```typescript
// Before (4 calls)
await refreshAll();
await revalidateData();
await refreshUserData();
router.refresh();

// After (1-2 calls)
await deleteItem(name);     // revalidation happens inside
router.refresh();            // re-render with fresh server data
// SWR will pick up changes on next focus/interval automatically
```

For the dashboard specifically, SWR `mutate()` can be used for **optimistic UI** (instant feedback) while the server revalidation ensures correctness:

```typescript
await deleteItem(name);
mutate();  // optimistic: remove from local SWR cache immediately
```

### Step 4: Decide on SWR's Role

Two options:

**Option A: SWR for dashboard, server components for public pages (recommended)**
- Keep SWR for admin dashboard (real-time feel, optimistic updates)
- Keep server components + ISR for public catalogue pages (SEO, performance)
- Remove `refreshAll()` from non-dashboard contexts (e.g., ActionButtons)

**Option B: Fully server-driven**
- Replace SWR with server components everywhere
- Use `router.refresh()` as the single client-side refresh mechanism
- Simpler mental model, fewer moving parts

### Step 5: Remove Dead Code

Delete these unused functions:
- `revalidatePageData()` - legacy alias, unused
- `revalidateCatalogueByTag()` - never called
- `revalidateCataloguesData()` - only called via legacy alias

### Step 6: Align Data Access

Pick one data access layer. Currently `api/items/route.ts` uses Supabase while server actions use Drizzle. Both shouldn't coexist for the same data. If Drizzle is the primary ORM, route the API through Drizzle too, or deprecate the API routes in favor of server actions.

---

## Summary of Changes

| Area | Current | Proposed |
|------|---------|----------|
| Revalidation functions | 6 (3 unused) | 2 with clear purposes |
| Client refresh calls per mutation | 4 redundant calls | 1 (`router.refresh()`) + optional SWR mutate |
| Revalidation ownership | Split between server actions + client | Server actions only |
| Revalidation scope | Nuclear (`revalidatePath("/", "layout")`) for most ops | Targeted per-catalogue + per-page |
| Dead code | 3 unused functions + legacy wrapper | Removed |

### Impact

- Fewer redundant network requests per mutation
- Clear mental model: "server action changes data and invalidates cache, client re-renders"
- No more guessing which of the 6 functions to call
- Targeted invalidation instead of purging the entire cache on every change
