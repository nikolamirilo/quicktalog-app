# Agent and plan limits: findings (2026-10-24)

How the builder agent (`/api/agent`) applies the user's plan to what it builds (items,
sections, block types, branding, appearance, newsletter), where it can go past the plan,
and the tester's reports. Read from the code on branch `test` at `1c59c70`; nothing was
run against TEST or PROD. AI credit limits are a separate plan:
[2026-10-24-ai-credit-hard-cap](../2026-10-24-ai-credit-hard-cap/FINDINGS.md).

## How limits reach the agent today

```
route.ts → openAiTurn (lib/ai/turn.ts)
             limits = { sections, items, sectionTypes, branding }   ← tier from users.plan_id
           → new CatalogueSession(body.catalogue, limits, …)        ← draft sent by the browser
             tool → session.run(op) → applyCatalogueOperations(working, [op], limits)
           ← streamed tool result { operation }
browser   → useCatalogueChat → context.applyAiOperations([op])     ← replayed with NO limits
save      → actions/catalogue.ts updateCatalogue / publishCatalogue
             applyPlanToCatalogue + contentWithinPlan(next, storedRow, tier)
```

Three places can enforce a limit: the agent (server), the browser replay, and the save.
Today only the agent and the save do, and the agent counts against a draft the browser
supplies.

## Items and sections

### L1. The agent counts against the browser's draft

`itemBudget` and the section check in `applyCatalogueOperations` count `session.working`,
which starts from `body.catalogue`. The server never compares it with anything it holds.
A draft that is stale or edited by hand gets a fresh budget.

### L2. The browser replays agent edits ungated

`CatalogueContext.applyAiOperations` calls `applyCatalogueOperations(…, undefined)`
(`src/context/CatalogueContext.tsx:322`); with no limits, it gates nothing. Whatever the
server allowed against its copy lands on the real draft, even when the real draft is
already full.

### L3. A continuation can send a stale draft

The resume effect in `useCatalogueChat` sends `context.catalogue` as it was in the render
the effect runs in. The apply effect has just called `setCatalogue` with the round's
last edits, so the next request can carry a draft missing the last batch. The server
then sees room for another 20 items, and L2 adds them on top.

**L1 + L2 + L3 are the likely route to the tester's 50 items on Basic** ("by adding items
in batches", the 20-item batches the instructions prescribe). Not reproduced. The save
still refuses it (`contentWithinPlan`: `items > limit && items > storedItems`), but
nothing stops the builder draft from growing past the plan. The user sees 50 items and
then cannot save them.

### L4. The model does not know the limits

- The instructions never state the item or section limit, or that they apply to the
  whole catalogue.
- At the limit, the tool says `Item limit reached - nothing added to "Coffee"`, which
  reads as a per-section limit. This is the tester's "15 per category" on Starter.
- When `addSection` drops items to stay within the limit, it reports success ("Added
  section … with 5 items") and never says items were cut.
- `Section limit reached - new section not added.` gives no counts.

### L5. Text blocks are exempt in the builder and the agent, but they count

The owner's rule (2026-10-24): every block counts toward `sections_per_catalogue`, text
included; only the catalogue heading (its title) does not, and it is not a block. The save
(`contentWithinPlan`, `content.length`) already counts this way. The applier
(`countSections`) and `AddContentModal.checkLimits` exempt `text`, and so does the
`adding-new-content-block` skill. So the agent and the builder can add text blocks past
the limit, and the save then refuses the catalogue ("Your plan allows 5 sections").

### L7. A downgrade leaves over-limit catalogues live

The owner's rule (2026-10-24): after a downgrade, a catalogue that no longer fits is
deactivated, and it can be reactivated only once it fits. Today:

- The Paddle downgrade (`applyPlanDowngrade`) deactivates catalogues over the
  *catalogue count* only, and strips branding, newsletter and tracking. It does not touch
  styles or custom themes.
- The backend's daily job (`quicktalog-backend/src/handlers/subscriptionProcessingJob.ts`)
  deactivates for the *traffic* limit only, and it skips free-plan users.
- Reactivation (`updateItemStatus` → `canActivate`) and publish check traffic only.
  `contentWithinPlan` lets a catalogue that is already over stay over as long as it does
  not grow.

So a Premium catalogue with 300 items and custom code stays live on the free plan.

### L6. The manual builder allows one item past the limit (tester: 31 on Basic)

This is not the agent. `CatalogueContent.checkItemLimits` (`src/components/catalogue/view/CatalogueContent.tsx:193`)
runs only when the item modal opens. "Add another" keeps the modal open and calls
`addItem` again without checking.

## Plan flags the agent ignores

| Flag | Plans without it | What the agent can do | Saved? |
|---|---|---|---|
| `apperance.customThemes` | Starter, Basic | `updateAppearance.customColors` and `setCustomTheme` apply a custom palette; `setCustomTheme` also writes `user_themes` (tester: custom theme on Basic) | **Yes**: neither `applyPlanToCatalogue`, the save actions nor `saveOwnTheme` check it |
| `apperance.styles` | Starter, Basic | font, font size, corner radius, shadow (`AppearanceTab` locks these and the overlay) | **Yes**, same gap |
| `newsletter` | Starter, Basic, Pro, German Silva | `updateFooter({ newsletter: true })` reports success (only `branding` is checked) | No: stripped on save, after the user has seen it and paid for it |
| `sections` (after a downgrade) | any plan that lost a block type | `updateSection` rewrites the `code` of an `embedding`/`custom_visual` block the plan no longer includes; the builder refuses this (`AddContentModal.isLocked`) | Yes: the save refuses only *added* gated blocks |

## Tester reports

| # | Report | Where it lands |
|---|---|---|
| T1 | Basic allows 31 items; the AI reached 50 in batches; wants a hard server-side limit | L6 (31, manual); L1–L3 (50, agent) |
| T2 | Free plan: the AI thinks 15 per category | L4 |
| T3 | Custom theme on Basic | Plan flags table |
| T4 | AI changes reverted to the default catalogue | **Not reproduced.** Two candidates. (a) `CatalogueBuilder` resets the context to `defaultCatalogueData` on unmount, and `CatalogueInitializer` then reseeds from the server copy because the ids differ. Any remount of the builder page throws away unsaved AI edits, and on a new catalogue the server copy *is* the default. (b) "Undo" restores the snapshot taken before the ask, which on a new catalogue is the default |
| T5 | "Upgrade now" throws away AI changes the user paid for | **Confirmed.** The chat's limit modal links to `/pricing` with a plain `<Link>` (`LimitUpgradeComparison.tsx:150`) without saving, and the builder has no unsaved-changes guard (`NavigationGuard` is used only by the QR editor). `LimitsOverlay` saves first but navigates in `finally`, so a refused save still leaves the page |
| T6 | Chat tip: detailed prompts give better results | Not present in the chat's empty state (`CatalogueChat.tsx:330`) |

## Already respected (checked, no change needed)

- `branding`: logo, contact, SEO, legal, header and footer are refused in the applier and
  reshaped on save.
- `sections` flags when *adding* a block: fail-closed in the applier, refused on save.
- `integrations.tracking`: there is no agent field for it, and the save strips it.
- `catalogues`: the agent never creates a catalogue. `traffic_limit`, `analytics` and
  `support` are not reachable from the agent. There is no overlay field.
  `custom_features` is not read anywhere in the app.
- The plan comes from `users.plan_id` on the server, never from the request body.
