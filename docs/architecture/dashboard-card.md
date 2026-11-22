# The dashboard catalogue card

One card per catalogue on the dashboard overview, in
[`DashboardItem`](../../src/components/dashboard/overview/DashboardItem.tsx). Its
state decisions live apart from the markup in
[`lib/dashboard/catalogue-card.ts`](../../src/lib/dashboard/catalogue-card.ts), which
is what `tests/unit/lib/catalogue/catalogueCard.test.ts` asserts state by state.

## The button layout

Two rows, the same shape in every state a catalogue can be worked on:

```
[            View Catalogue            ]   <- navigation, never a mutation
[   Analytics   ] [     Options ▾      ]   <- everything else is in the menu
```

**The buttons never change; the menu does.** Slot one is always navigation, so no
button means two different things in two states. Every mutation — publish, edit,
status, duplicate, delete — lives only inside `Options`, whose rows vary.

This replaced a 40×40 `⋮` in the card's corner. Owners reach QR codes, embed and
delete through it, and an unlabelled icon that small was not findable. `Options` is a
real labelled button at the same weight as Analytics, and it carries an 8px amber dot
whenever its menu holds a publish action — the same idiom as
[`BuilderRail`](../../src/components/catalogue/builder/BuilderRail.tsx). Publishing is
never a button on the card face: when it was, a catalogue with changes grew a third
button and one without it looked unfinished.

## The states

`status` is `active`, `inactive`, `draft`, `in_preparation` or `error`; `draft.unpublished`
and an empty draft (no items and no sections) cut across it.

| State | Row 1 | Analytics | Publish row in the menu | Extra line |
|---|---|---|---|---|
| `active`, nothing waiting | View Catalogue | yes | — | — |
| `active`, newer edits | View Catalogue | yes | Publish changes | Changes not published yet |
| `draft`, has content | Open in Builder | disabled | Publish catalogue | — |
| `draft`, empty | Open in Builder | disabled | — | — |
| `inactive`, has content | Open in Builder | yes | Publish catalogue | — |
| `inactive`, empty | Open in Builder | yes | — | — |
| `inactive` by the traffic limit | Open in Builder | yes | — | Back online *date* |
| `error` | — (error text) | — | — | — |
| `in_preparation` | — (spinner) | — | — | — |

**One badge, not two.** The `StatusBadge` carries the lifecycle on its own. A second
pill saying "Not published yet" beside a `Draft` badge repeats it, so the extra line
appears only where the badge would otherwise be wrong: a *live* catalogue whose
builder holds newer edits, or a catalogue the plan's traffic limit switched off and
when it returns. Only ever one line — never both. An empty catalogue is reported with
its item count (`Items: nothing in it yet`), because emptiness is a fact about
content, not about publishing.

**Analytics is disabled for a draft**, which has no traffic to chart. It is a real
`<button disabled>` rather than a link, because an `<a>` can never match `:disabled`.

**The terminal states keep their menu.** `error` and `in_preparation` have no page to
visit, so `Options` takes the row alone. It stays *enabled*: Delete lives only there,
the error copy tells the owner to use it, and `countCatalogues` counts every status,
so a card that cannot be deleted would hold a plan slot for good.

## The menu

`Publish changes` / `Publish catalogue` (first, when applicable) · `Edit catalogue` ·
`Copy link` · `QR code` · `Embed on your site` · `Duplicate` · the status verbs
(`Activate` / `Switch off` / `Save as draft`) · `Delete`.

- Status changes are direct rows, not a sub-menu, so switching off takes one click.
- `Copy link` and `Embed` need a published page: the public route 404s on anything
  not active. **`QR code` and `Edit` do not** — neither page has a status guard, so a
  draft's QR can be designed before it goes live.
- The publish row is disabled at the traffic limit, and the dot is not drawn, because
  `publishCatalogue` runs `canActivate`, which refuses there whatever the status.
- `Delete` is held for ten minutes after creation while a catalogue is
  `in_preparation` (`DELETE_LOCK_MS`).

## Width

The grid is
`grid-cols-1 sm:grid-cols-2 md:grid-cols-1 min-[900px]:grid-cols-2 min-[1200px]:grid-cols-3`.
The `md:grid-cols-1` step matters: the sidebar appears at 768px, and two columns there
leave a 201px card, where the two-up row cannot fit. Card width by viewport — 296px at
360, 326px at 390, 281px at 640, 416px at 768, 267px at 900, 261px at 1200, 288px at
1280 and up. The narrowest case is not a phone.

Buttons are `h-11 md:h-9`: 44px is the touch minimum, and the dashboard's own height
returns from `md`.

## What the card cannot say

`catalogues.updatedAt` is **not** a publish date. `private.touch_updated_at()` sets it
on every update — a status flip, a duplicate, an appearance save, the Cloudflare
worker's traffic switch-off — and `catalogues` has no `published_at` column. The card
shows it as `Updated`, which is what it is.

"Never published" is not derivable either: `draft.unpublished` is
`published_at is null OR updated_at > published_at`, true both for a never-published
draft and for a live catalogue with newer edits. Both would need `d.published_at`
added to the draft summary in
[`lib/dashboard/overview.ts`](../../src/lib/dashboard/overview.ts).

A per-card view count is deliberately absent. `public.analytics` has the numbers per
catalogue, but it is the worker's 03:00 UTC daily rollup, while the analytics page one
tap away reads PostHog live ([analytics](analytics.md)) — two figures for the same
week, a tap apart.
