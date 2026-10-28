# Publishing, sharing, the public catalogue and the QR editor

Read-only research for end-user documentation. Every fact ends with `path:line` evidence.
Paths are relative to `/Users/nikola/Desktop/Quicktalog/quicktalog-app` unless they start
with `../quicktalog-packages` or `../quicktalog-backend`.

Labels are copied letter for letter, including capitals and the `…` / `-` characters the
code actually uses.

---

## Publishing from the builder (rail and phone bottom bar)

- The desktop rail (from `md`) holds, top to bottom: `Editor`, a divider, then `Save`,
  `Templates`, `Preview`, `Publish` (or `Update`), a spacer, a divider, `Dashboard` —
  `src/components/catalogue/builder/BuilderRail.tsx:38-82`, order set at
  `src/components/catalogue/inputs/sidebar/index.tsx:128-133`.
- The rail is 72px wide and fixed to the right edge on `md` and up (`md:w-[72px]`,
  `md:right-0`) — `src/components/catalogue/inputs/sidebar/index.tsx:114`.
- Each rail item is an icon over an 11px label, min height 52px —
  `src/components/catalogue/builder/BuilderRail.tsx:10-11`.
- The primary action's label is exactly `Publish` when the catalogue is not active and
  exactly `Update` when it is; the icon is `Rocket` or `RefreshCw` —
  `src/components/catalogue/builder/useBuilderActions.ts:174-181`, `:143`.
- On a phone (below `md`) the bottom bar is: `Quick AI`, `Templates`, the round editor
  button (`Editor` / `Close`), `Save`, and one slot whose dropdown holds `Preview` and
  `Publish`/`Update` — `src/components/catalogue/inputs/sidebar/ActionButtons.tsx:56-143`.
- `Preview` and `Publish` are disabled together, under one condition: no content blocks,
  an empty name, or an empty heading — `src/components/catalogue/builder/useBuilderActions.ts:75-78`,
  `:171`, `:180`.
- Publishing with no saved catalogue id shows the toast `Please save the catalogue first`
  — `src/components/catalogue/builder/useBuilderActions.ts:98-101`.
- Publish toasts while the catalogue is not yet active: loading `Publishing...`, success
  `Catalogue published successfully`, failure falls back to `Failed to publish catalogue`
  — `src/components/catalogue/builder/useBuilderActions.ts:105-120`.
- Publish toasts when the catalogue is already active: loading `Updating...`, success
  `Catalogue updated successfully`, a `View` action that opens `/catalogues/<name>` in a
  new tab, failure falls back to `Failed to update catalogue` —
  `src/components/catalogue/builder/useBuilderActions.ts:122-139`.
- There is **no confirmation dialog** before publishing from the builder; the action fires
  on click — `src/components/catalogue/builder/useBuilderActions.ts:97-141`.
- A first publish opens the success modal (`setIsSuccessModalOpen(true)`); an update of an
  already-active catalogue does not — `src/components/catalogue/builder/useBuilderActions.ts:112-113`
  vs `:126-131`.
- Pending AI changes are accepted before saving and before publishing (`acceptAiChanges()`)
  — `src/components/catalogue/builder/useBuilderActions.ts:51`, `:102`.

### What publishing changes on the server

- `publishCatalogue` writes the editable fields to the `catalogues` row, sets
  `status: "active"` and a fresh `updatedAt` — `src/actions/catalogue.ts:460-472`.
- Before that it checks: identity, that the row is the caller's, the plan (`canActivate`)
  and growth limits (`contentWithinPlan`) — `src/actions/catalogue.ts:444-458`.
- Server-owned fields never come from the client: only `logo, heading, language, currency,
  businessType, content, legal, appearance, contact, header, footer, partners, metadata,
  tags` can be written — `src/utils/db/columns.ts:37-52`.
- After publishing, the Redis draft is rewritten from the stored row, then the catalogue
  page and the dashboard are revalidated — `src/actions/catalogue.ts:479-486`.
- `Save` in the builder (`updateCatalogue`) does **not** touch the database row at all: it
  writes the draft to Redis only — `src/actions/catalogue.ts:346-380`. So edits stay
  private until a publish.
- A plain `Save` still calls `revalidateCatalogue(name)` — the public page's cache is
  purged even though nothing public changed — `src/actions/catalogue.ts:379`.

---

## Publishing from the dashboard card

- One catalogue per card; cards sit in a grid of 1 / 2 / 3 columns (`sm`, `min-[1200px]`),
  8 cards shown first, then a `Show More (N more)` button —
  `src/components/dashboard/overview/CatalogueGrid.tsx:24`, `:53`, `:63-72`.
- Empty state text: `No catalogues created yet.` —
  `src/components/dashboard/overview/CatalogueGrid.tsx:32-38`.
- Card order: title, `⋮` menu, status badge, `Updated:` / `Created:` dates, then the
  action buttons — `src/components/dashboard/overview/DashboardItem.tsx:116-196`.
- A `draft` or `inactive` card shows `Continue Editing` and `Publish Catalogue` (Rocket
  icon) — `src/components/dashboard/overview/DashboardItem.tsx:165-177`.
- An `active` card shows `View Catalogue` and `Analytics` instead — there is no publish
  button on a live card — `src/components/dashboard/overview/DashboardItem.tsx:152-164`.
- `Publish Catalogue` first re-reads the latest draft; if that fails the toast is
  `Could not retrieve catalogue data. Please try again.` —
  `src/components/dashboard/overview/DashboardItem.tsx:58-62`.
- Pre-flight check: a missing heading and/or missing content gives
  `Cannot publish: missing heading.`, `Cannot publish: missing content.` or
  `Cannot publish: missing heading and content.`, with a toast action labelled
  `Open Builder` that navigates to `/admin/<name>/builder` —
  `src/components/dashboard/overview/DashboardItem.tsx:68-83`.
- Toasts: `Publishing...` → `Catalogue published successfully` for a draft;
  `Updating...` → `Catalogue updated successfully` otherwise; both carry a `View` action
  that opens `/catalogues/<name>` in a new tab —
  `src/components/dashboard/overview/DashboardItem.tsx:50-55`, `:86-112`.
- No confirmation dialog on the dashboard publish either —
  `src/components/dashboard/overview/DashboardItem.tsx:57-113`.
- Status pill labels and their statuses: `Active`, `Draft`, `Inactive`,
  `In preparation`, `Error` — `src/components/dashboard/overview/StatusBadge.tsx:6-29`.
- An `error` card shows the line
  `Error occurred. Please delete the catalogue and retry.` —
  `src/components/dashboard/overview/DashboardItem.tsx:178-186`.
- An `in_preparation` card shows only a spinning icon, with the screen-reader text
  `Catalogue is being prepared` — `src/components/dashboard/overview/DashboardItem.tsx:187-195`.
- Cards are sorted by status (`in_preparation`, `error`, `draft`, `active`, `inactive`)
  then by newest `updatedAt` — `src/constants/sort.ts:3-9`,
  `src/components/dashboard/overview/CatalogueGrid.tsx:40-46`.

---

## The publish success modal (`SuccessModal`)

- Opens only after a first publish from the builder —
  `src/components/catalogue/builder/useBuilderActions.ts:113`,
  `src/components/catalogue/inputs/sidebar/ActionButtons.tsx:163-168`.
- Dialog box: max width 720px, max height `100dvh-24px`, padding 18px (28px from `sm`) —
  `src/components/modals/SuccessModal.tsx:102`.
- Two columns from `sm`: the QR panel on the left (`sm:order-1`), the text column on the
  right (`sm:order-2`); they stack on a phone —
  `src/components/modals/SuccessModal.tsx:109-173`.
- Title `Congratulations!` with description
  `Your Catalogue is now live and ready to share with your customers.` for a normal
  publish; `Your AI-generated Catalogue is now live and ready to share with your customers.`
  for `type="ai"`; `Changes Saved!` with
  `Your catalogue has been successfully updated. All changes are now live and visible to your customers.`
  for `type="edit"` — `src/components/modals/SuccessModal.tsx:57-75`.
- Only `type="regular"` is actually passed from the builder —
  `src/components/catalogue/inputs/sidebar/ActionButtons.tsx:167`.
- Link row: label `Direct link` (visually hidden below `sm`), a read-only input holding
  `window.location.origin + /catalogues/<name>`, and a button that reads `Copy` then
  `Copied` for 2 seconds (title `Copy link` / `Copied!`) —
  `src/components/modals/SuccessModal.tsx:45-49`, `:51-53`, `:114-140`.
- Embed row: `Embed on your website`, sub-line `A ready-made HTML file, full-screen.`
  (hidden below `sm`), button `HTML file` (`HTML` on a phone) —
  `src/components/modals/SuccessModal.tsx:143-164`.
- Footer buttons: `Dashboard` (goes to `/admin/dashboard`) and `View Catalogue` (opens the
  live URL in a new tab) — `src/components/modals/SuccessModal.tsx:77-93`.
- The QR panel (`PublishQrPanel`) is 262px wide from `sm`, amber-tinted, and holds the QR
  image then `Download PNG` (`Save PNG` on a phone) and `Customize` (a link to
  `/admin/<slug>/qr-editor`) — `src/components/modals/PublishQrPanel.tsx:59-95`.
- That QR is always the **default** design: the panel builds it from `defaultQrConfig(url)`
  and never reads the saved design — `src/components/modals/PublishQrPanel.tsx:34`,
  documented at `docs/architecture/qr-codes.md:26`.
- Frame text is never drawn or downloaded from this panel (`downloadQr(..., null)`) —
  `src/components/modals/PublishQrPanel.tsx:49`, `docs/architecture/qr-codes.md:28`.
- Download toast: `QR code downloaded as PNG.`; failure `The download failed. Please try again.`
  — `src/components/modals/PublishQrPanel.tsx:50-54`.

---

## Switching a catalogue off (unpublish) and the `⋮` menu

- There is no button called "Unpublish". The control is `Change Status` in the card's `⋮`
  menu, which opens a submenu — `src/components/dashboard/overview/ItemDropdownMenu.tsx:123-128`,
  `:194-227`.
- The submenu labels are exactly `Activate` (status `active`), `Deactivate` (status
  `inactive`) and `Save` (status `draft`) — `src/components/dashboard/overview/ItemDropdownMenu.tsx:67-71`.
- The current status is left out of the submenu, so a live catalogue shows `Deactivate`
  and `Save` — `src/components/dashboard/overview/ItemDropdownMenu.tsx:111`.
- `Activate` is disabled, with the tooltip `Traffic limit reached`, when this month's
  pageviews have reached the plan's `traffic_limit` —
  `src/components/dashboard/overview/ItemDropdownMenu.tsx:101-102`, `:207`, `:216-218`.
- No confirmation dialog for a status change: the submenu item calls the server action
  straight away — `src/components/dashboard/overview/ItemDropdownMenu.tsx:213-215`,
  `src/components/dashboard/Overview.tsx:105-128`.
- Only Delete has a confirmation, and its text is
  `Are you sure you want to delete this catalogue? This action cannot be undone.` with the
  title `Delete Catalogue`, buttons `Cancel` / `Confirm` (`Processing...` while busy) —
  `src/components/dashboard/Overview.tsx:204-214`, `src/components/modals/InformModal.tsx:45-46`,
  `:93`.
- A failed status change shows the server's reason, or
  `Could not activate this catalogue.` / `Failed to update status. Please try again.`;
  a thrown error shows `Failed to update status.` —
  `src/components/dashboard/Overview.tsx:109-125`.
- Server side: `inactive` and `draft` are plain status writes with an owner filter; only
  `active` re-runs the plan and traffic check — `src/actions/catalogue.ts:137-176`.
- The only statuses a client may set are `active`, `inactive`, `draft`; anything else is
  refused with `Invalid status` — `src/actions/catalogue.ts:37`, `:133-135`.
- A status change revalidates the catalogue page and the dashboard —
  `src/actions/catalogue.ts:180-181`.

### The whole `⋮` menu, in order

`Edit`, `Change Status`, `Share` / `Link Copied`, `QR Code`, `Embed`, `Duplicate`
(`Loading...` while working), separator, `Delete` —
`src/components/dashboard/overview/ItemDropdownMenu.tsx:114-171`, `:231`.

- Menu width 220px; the status submenu is 176px (`w-44`) —
  `src/components/dashboard/overview/ItemDropdownMenu.tsx:64`, `:205`.
- The trigger is a 40×40 round button labelled `Actions for <name>` —
  `src/components/dashboard/overview/ItemDropdownMenu.tsx:183-189`.
- Every item except `Delete` is disabled while the status is not one of `active`,
  `inactive`, `draft` (i.e. `in_preparation` or `error`) —
  `src/components/dashboard/overview/DashboardItem.tsx:125`,
  `src/components/dashboard/overview/ItemDropdownMenu.tsx:41-44`.
- `Delete` is disabled for 10 minutes after creation while a catalogue is
  `in_preparation`, with the title `Available 10 minutes after creation` —
  `src/components/dashboard/overview/ItemDropdownMenu.tsx:73-80`, `:166-167`.

### `Share` (copy link)

- Copies `${NEXT_PUBLIC_BASE_URL}/catalogues/<name>` to the clipboard; the menu stays open
  so the confirmation is visible — `src/components/dashboard/overview/ItemDropdownMenu.tsx:112`,
  `:129-140`.
- The label flips from `Share` to `Link Copied` (with a `CircleCheck` icon, green text) for
  3 seconds — `src/components/dashboard/overview/ItemDropdownMenu.tsx:130-134`,
  `src/hooks/useCopyLink.ts:5`, `:32-35`.
- If the clipboard is unavailable the toast is
  `Could not copy the link. Your browser blocked the clipboard.` —
  `src/hooks/useCopyLink.ts:26-31`.
- `Share` is available for a draft or inactive catalogue too — the link is copied whatever
  the status — `src/components/dashboard/overview/ItemDropdownMenu.tsx:135-139`.

### `Embed`

- Downloads a file named `<slug>.html` — not a snippet to paste —
  `src/lib/catalogue/download.ts:10`.
- The file is a complete HTML document whose body is one full-screen `<iframe src="<live
  URL>">`, fixed, `100vw × 100vh`, `z-index: 9999`, white background, title
  `Embedded Catalogue` — `src/lib/catalogue/download.ts:3`.
- No user-visible message on success or failure; errors only reach the console —
  `src/lib/catalogue/download.ts:24-26`.

---

## The public catalogue URL

- Shape: `<base>/catalogues/<name>`, where `<base>` is `NEXT_PUBLIC_BASE_URL` in the app
  and `https://www.quicktalog.app` in the canonical/OG tags —
  `src/lib/qr/design.ts:162-164`, `src/constants/metadata.ts:204`, `:209`.
- `<name>` is the stored `catalogues.name`, created once from the name typed at creation:
  lowercased, trimmed, spaces → `-`, repeated `-` collapsed, leading/trailing `-` removed
  — `../quicktalog-packages/src/helpers/index.ts:26-35`,
  `src/actions/catalogue.ts:268`, `:300`.
- An unusable name is refused with `Invalid catalogue name` —
  `src/actions/catalogue.ts:269`.
- A clashing name is refused with `A catalogue with this name already exists` —
  `src/actions/catalogue.ts:322-327`.
- Name availability is checked live, boolean-only, rate-limited; errors are `Unauthorized`,
  `Invalid name`, `Too many requests` — `src/actions/catalogue.ts:416-437`.
- **The URL cannot change.** `name` is not in `CATALOGUE_EDITABLE_FIELDS`, and both
  `updateCatalogue` and `publishCatalogue` write only those fields —
  `src/utils/db/columns.ts:32-52`, `src/actions/catalogue.ts:463-465`.
- There is no rename action anywhere in `src/actions` — the only places a catalogue `name`
  is written are create (`name: slug`) and duplicate (`name: candidate`) —
  `src/actions/catalogue.ts:300`, `:235`.
- Duplicating creates a **new** name: `generateUniqueSlug(name)` or `<slug>-copy`, with
  `-2`… `-20` appended while the name is taken, and the copy starts as `draft` —
  `src/actions/catalogue.ts:206-247`.
- Published catalogues are listed in the sitemap at `<base>/catalogues/<name>` with
  priority 0.9 — `src/app/sitemap.ts:118-125`.
- `robots.txt` allows `/` and disallows `/admin/`, `/api/`, `/test` — so public catalogue
  pages are crawlable — `src/app/robots.ts:4-11`.

---

## How long a change takes to reach customers

- The public route is ISR with `revalidate = 86400` (24 hours) —
  `src/app/catalogues/[name]/page.tsx:11`.
- The page fetches its own API (`/api/items/<name>`) with the cache tags
  `catalogue-<name>` and `catalogue-detail` —
  `src/app/catalogues/[name]/page.tsx:114-123`.
- Metadata is fetched with `type=meta`, tags `catalogue-<name>` and `catalogue-metadata`,
  `revalidate: 3600` — `src/app/catalogues/[name]/page.tsx:53-63`.
- The list of static params is fetched with the tag `catalogues-list` and
  `revalidate: 3600` — `src/app/catalogues/[name]/page.tsx:15-25`.
- `revalidateCatalogue(name)` purges `/catalogues` (page), `catalogues-list`,
  `/catalogues/<name>` (page), `catalogue-<name>`, `catalogue-detail` and
  `catalogue-metadata` — `src/lib/cache/revalidate.ts:8-18`.
- It runs on publish, create, delete, multi-delete, status change and draft save —
  `src/actions/catalogue.ts:485`, `:318`, `:77`, `:114-116`, `:180`, `:379`.
- `revalidateDashboard()` purges `/dashboard` (page) and `/` (layout) —
  `src/lib/cache/revalidate.ts:24-27`.
- **The owner does nothing extra**: the publish action revalidates, so the next visitor
  gets the new page. Without a publish the page would refresh on its own after at most
  24 hours — `src/actions/catalogue.ts:485`, `src/app/catalogues/[name]/page.tsx:11`.
- The background worker can also force a purge via `POST /api/revalidate` with the shared
  `x-revalidate-secret` header and a body of `{ names?: string[], dashboard?: boolean }`;
  up to 500 names, each name max 200 characters and free of `/ ? #` and whitespace —
  `src/app/api/revalidate/route.ts:10-22`, `:29-63`.
- Unauthorized calls get `{"error":"Unauthorized"}` (401); bad JSON `{"error":"Invalid JSON"}`
  (400); a bad body `{"error":"Invalid body"}` (400) —
  `src/app/api/revalidate/route.ts:36`, `:44`, `:49`.
- The Redis draft (the builder's unsaved work) has a 30-day TTL and is keyed by the
  catalogue id, never the slug — `src/lib/catalogue/draft-cache.ts:9`, `:17-18`.

---

## Preview

- Route: `/catalogues/<name>/preview` — `src/app/catalogues/[name]/preview/page.tsx`.
- Opened from the builder's `Preview` action, which **saves first** and then points a tab
  (opened synchronously so Safari does not block it) at the preview URL —
  `src/components/catalogue/builder/useBuilderActions.ts:80-95`.
- If the save returns a catalogue with no name the tab is closed and the toast is
  `Catalogue has no name/slug` — `src/components/catalogue/builder/useBuilderActions.ts:84-90`.
- `Preview` is disabled under the same condition as `Publish` (no content, no name, empty
  heading) — `src/components/catalogue/builder/useBuilderActions.ts:171`.
- Not signed in → redirect to `/auth?next=/catalogues/<name>/preview` —
  `src/app/catalogues/[name]/preview/page.tsx:26-28`.
- Only the owner can see it: the data comes from `getCatalogueByName` →
  `readOwnedDraft(me, name)`, which filters on `catalogues.user_id = me.userId` —
  `src/app/catalogues/[name]/preview/page.tsx:31`, `src/actions/catalogue.ts:396`,
  `src/lib/catalogue/draft-cache.ts:26-31`.
- Anyone else (and a missing catalogue) gets the same `Catalogue Not Found` dialog as an
  inactive public page — `src/app/catalogues/[name]/preview/page.tsx:32-34`.
- Differences from the live page:
  - It shows the **unsaved draft** (Redis draft merged over the database row), so it
    renders edits that are not published — `src/lib/catalogue/draft-cache.ts:40-71`.
  - It is never cached: `export const dynamic = "force-dynamic"` —
    `src/app/catalogues/[name]/preview/page.tsx:10`.
  - Its metadata is fixed: title `Preview | Quicktalog`, description
    `Preview your catalogue`, `robots: { index: false, follow: false }` —
    `src/app/catalogues/[name]/preview/page.tsx:12-16`.
  - It shows a catalogue of **any** status, including `draft` and `inactive` — there is no
    status check — `src/app/catalogues/[name]/preview/page.tsx:31-36`.
  - The owner's own analytics tags never load there: any path ending in `/preview` is a
    blocked context — `src/components/catalogue/view/CatalogueAnalytics.tsx:76-78`.
- Otherwise it renders the identical component tree as the live page
  (`<Catalogue item type="view" />`) — `src/app/catalogues/[name]/preview/page.tsx:36`
  vs `src/app/catalogues/[name]/page.tsx:144`.

---

## The live public catalogue — what a visitor sees and can do

- Renders only when `item.status === "active"`; anything else renders the
  `Catalogue Not Found` dialog — `src/app/catalogues/[name]/page.tsx:143-147`.
- Public reads run as the `app_public` role, which RLS limits to active catalogues, and
  never select the owner id — `src/lib/catalogue/public.ts:9-15`,
  `src/utils/db/columns.ts:6-30`.

### Navigation (the floating navbar)

- A sticky pill, 64px tall, max width 1240px, 12px side padding, `top: 9px + safe-area`,
  `z-index: 50` — `src/styles/catalogue-chrome.css:46-73`.
- Past 8px of scroll it gains a stronger shadow —
  `src/components/catalogue/view/CatalogueHeader.tsx:32`, `:37`,
  `src/styles/catalogue-chrome.css:78-83`.
- Left: the logo (max height 44px), linking to the owner's website if set, otherwise `/`
  — `src/components/catalogue/view/CatalogueHeader.tsx:143-156`,
  `src/styles/catalogue-chrome.css:89-95`.
- Right, from 768px up: 40×40 icon buttons for `Email` and `Phone` (only when the owner
  filled them in **and** turned on `emailCta` / `phoneCta`), then the CTA button with the
  owner's label or `Learn more` — `src/components/catalogue/view/CatalogueHeader.tsx:88-123`,
  `:158-178`.
- **On a phone (below 768px) the icons and the CTA move into a burger menu**: a 44×44
  button labelled `Open menu` / `Close menu` opens a sheet 16px under the pill with the
  heading `Contact us`, one 48px row per contact (showing the address or number itself),
  then the CTA — `src/components/catalogue/view/CatalogueHeader.tsx:180-221`,
  `src/styles/catalogue-chrome.css:121-141`, `:142-211`, `:243-250`.
- The sheet closes on outside pointer-down, on `Escape`, and when a row is tapped —
  `src/components/catalogue/view/CatalogueHeader.tsx:63-77`, `:208`.
- A catalogue with the **default** (unbranded) header shows Quicktalog's own navbar
  instead: an `Email` icon for `quicktalog@outlook.com` and a CTA
  `Create Your Catalog` → `/auth?mode=signup` —
  `src/components/catalogue/view/CatalogueHeader.tsx:80-87`, `:110-116`.
- If there are no contacts and no CTA, neither the action row nor the burger renders —
  `src/components/catalogue/view/CatalogueHeader.tsx:126`, `:158`, `:180`.

### The search bar

- Rendered only when the owner switched it on (`appearance.search.isEnabled === true`),
  directly above the content — `src/components/catalogue/view/CatalogueContent.tsx:97`,
  `:261-268`.
- Available **on every plan** — `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:13`.
- Accessible name `Search catalogue items`; placeholder is the owner's text or
  `Search items…` — `src/components/catalogue/view/CatalogueSearchBar.tsx:68`, `:74`.
- 52px tall, max width 560px, centred, 28px bottom margin —
  `src/styles/catalogue-chrome.css:314-327`.
- Typing is debounced 200ms, then written to the URL as `?q=` on the published page (not in
  the builder) — `src/components/catalogue/view/CatalogueSearchBar.tsx:24`, `:37-41`,
  `src/components/catalogue/view/CatalogueContent.tsx:114-123`.
- Back/forward sync the box from `?q=` — `src/components/catalogue/view/CatalogueContent.tsx:125-132`.
- Pressing `/` anywhere outside a text field focuses and scrolls to the bar; a `/` key cap
  is shown inside the bar from 768px up (title `Press / to search`) —
  `src/components/catalogue/view/CatalogueSearchBar.tsx:43-53`, `:89-91`,
  `src/styles/catalogue-chrome.css:419-423`.
- `Escape` or the `Clear search` button empties it —
  `src/components/catalogue/view/CatalogueSearchBar.tsx:55-59`, `:71-73`, `:80-87`.
- Status line under the bar: `No items match “<query>”.` or
  `<n> item matches “<query>”` / `<n> items match “<query>”` (curly quotes, no trailing
  period in the match case) — `src/components/catalogue/view/CatalogueSearchBar.tsx:94-99`.
- While searching, sections with no match are hidden and every remaining section is forced
  open — `src/components/catalogue/view/CatalogueContent.tsx:276-286`.

### Items and sections

- Sections can be collapsed/expanded; the initial state comes from the section's own
  `isExpanded` when it shows a heading, otherwise open —
  `src/components/catalogue/view/CatalogueContent.tsx:134-159`.
- Tapping an item card opens the item detail dialog —
  `src/components/catalogue/cards/index.tsx:103`, `:110-117`.
- Below 720px that dialog is a bottom sheet with a drag handle and swipe-to-close; above it
  a centred dialog — `src/components/catalogue/modals/ItemDetailModal.tsx:29-30`, `:48-49`,
  `:65-106`.
- With a photo the sheet shows a `Close` button and an `Enlarge photo` button —
  `src/components/catalogue/modals/ItemDetailModal.tsx:81-97`.
- A price of 0 reads `Free`; a missing price shows nothing —
  `src/components/catalogue/cards/index.tsx:70-77`.
- An item with no name renders the alert `Invalid item data` —
  `src/components/catalogue/cards/index.tsx:54-65`.
- A published catalogue with no content blocks shows `Nothing here yet` and
  `Content you add will appear here. Get started by adding your first item.` —
  `src/components/catalogue/view/CatalogueContent.tsx:230-256`.
- Content column: `max-w-6xl` with 16px side padding —
  `src/components/catalogue/view/CatalogueContent.tsx:260`.

### Footer

- A custom footer shows only the columns the owner filled: brand, `Contact`,
  company info, and the newsletter form (newsletter needs the plan) —
  `src/components/catalogue/view/CatalogueFooter.tsx:126-137`, `:155-174`.
- `Contact` lists `mailto:` for the email, `tel:` for the phone and the website domain —
  `src/components/catalogue/view/components/Contact.tsx:12-44`.
- Newsletter failure text: `Failed to subscribe. Please try again.` —
  `src/components/catalogue/view/CatalogueFooter.tsx:111-117`.
- The default (unbranded) footer is Quicktalog's own: brand + socials,
  `Contact & Support` (`Contact Us`), a features column, and `Create your own` with
  `Build a catalogue like this one in minutes.` and the button
  `Create Your Digital Catalog` → `/auth?mode=signup` —
  `src/components/catalogue/view/CatalogueFooter.tsx:31-77`,
  `src/components/catalogue/view/components/DefaultActions.tsx:5-16`.
- Bottom line: `© <year> <legal name or "Your Company">. All rights reserved.` for a
  custom footer, `© <year> Quicktalog. All rights reserved.` otherwise —
  `src/components/catalogue/view/CatalogueFooter.tsx:140-142`, `:183-186`.
- The footer reserves extra bottom padding on phones (`pb-24 sm:pb-8`) —
  `src/components/catalogue/view/CatalogueFooter.tsx:147`.

### The owner's analytics tags and the visitor's choice

- Only rendered on a published page (`type === "view"`) and only when the catalogue carries
  a valid Google Analytics or Meta Pixel id —
  `src/components/catalogue/view/Catalogue.tsx:306-313`,
  `src/components/catalogue/view/CatalogueAnalytics.tsx:148-162`.
- First visit shows a bottom bar: `<business name or "This business"> uses <vendors> to see
  how this page is used.`, an optional `Privacy policy` link, and the buttons `Decline`
  and `Allow` (equal weight) — `src/components/catalogue/view/CatalogueAnalytics.tsx:169-236`.
- After a choice, a small link lets the visitor switch: `Turn off analytics cookies` /
  `Allow analytics cookies`; it reloads the page —
  `src/components/catalogue/view/CatalogueAnalytics.tsx:240-256`.
- The choice is stored per catalogue in `localStorage` under
  `qt-analytics-consent:<slug>` and re-asked after 6 months —
  `src/components/catalogue/view/CatalogueAnalytics.tsx:27-29`, `:46-48`.
- No tag loads in `/admin`, on `/preview`, inside a Quicktalog frame, or in a browser that
  holds a Quicktalog session — `src/components/catalogue/view/CatalogueAnalytics.tsx:67-101`.

---

## "Catalogue Not Found" — what a visitor sees when a catalogue is off

- The same dialog is used for an inactive catalogue, an error on the public page and a
  failed preview — `src/app/catalogues/[name]/page.tsx:146`, `:150`,
  `src/app/catalogues/[name]/preview/page.tsx:33`, `:40`.
- It is an `AlertDialog` forced open (`isOpen={true}`), 600px wide, scrolling inside the
  viewport, with a 46px search icon tile —
  `src/components/modals/LimitsModal.tsx:36-43`, `src/components/modals/AppDialog.tsx:11-18`,
  `:39`, `:72-93`, `src/components/modals/limits/LimitsModalHeader.tsx:35-36`.
- Exact title: `Catalogue Not Found` —
  `src/components/modals/limits/LimitsModalHeader.tsx:59-60`.
- Exact description:
  `The selected catalogue is inactive or doesn't exist. Join thousands of businesses already using Quicktalog to showcase their offerings digitally.`
  — `src/components/modals/limits/LimitsModalHeader.tsx:64-65`.
- Body: a tinted box headed `Create Your Digital Catalogue with Quicktalog` with the three
  ticks `Beautiful, mobile-friendly catalogs in minutes`,
  `Share via QR codes and get real-time analytics`,
  `No coding required - start today`, then the button `Get Started Today` opening
  `NEXT_PUBLIC_BASE_URL` in a new tab —
  `src/components/modals/limits/NotFoundContent.tsx:10-30`.
- The `X` in the corner is **not** a close button here: with no `onClose` it is a link
  labelled `Go to dashboard` pointing at `/admin/dashboard` —
  `src/components/modals/limits/LimitsModalHeader.tsx:38-55`; the public page passes no
  `onClose` — `src/app/catalogues/[name]/page.tsx:146`.
- The link itself keeps working (same URL); only the page content changes. Nothing in the
  status change touches the slug — `src/actions/catalogue.ts:168-172`.

### If the public page throws

- `src/app/catalogues/[name]/error.tsx` shows the heading
  `This catalogue couldn't load`, the line
  `Please try again - if the problem continues, head back home.`, and the buttons
  `Try Again` and `Home` — `src/app/catalogues/[name]/error.tsx:44-59`.
- A known browser-translator reconciliation error silently retries once instead of showing
  that screen — `src/app/catalogues/[name]/error.tsx:17-33`.

### Metadata for an unknown catalogue

- `generateMetadata` falls back to title `Catalogue Not Found | Quicktalog`, description
  `The service catalogue you're looking for doesn't exist or has been removed.` —
  `src/app/catalogues/[name]/page.tsx:65-81`.
- On a thrown error it falls back to `Catalogue | Quicktalog` /
  `Explore this digital service catalogue created with Quicktalog.` —
  `src/app/catalogues/[name]/page.tsx:96-103`.

---

## How a shared link previews on social media

- `generateCatalogueMetadata(title, description, name, icon, opengraphImage)` builds the
  tags — `src/constants/metadata.ts:178-222`.
- Title: `<catalogue title> | Quicktalog`, where the title is
  `metadata.title` → the slug turned into Title Case → the heading as plain text —
  `src/app/catalogues/[name]/page.tsx:82-85`, `src/constants/metadata.ts:185`.
- Description: `metadata.description` → the heading as plain text → else
  `Explore <name>'s services and offerings in this interactive digital catalogue.` —
  `src/app/catalogues/[name]/page.tsx:86`, `src/constants/metadata.ts:186-188`.
- OG/Twitter image: the catalogue's `logo`, else `/images/brand/opengraph-image.png` —
  `src/app/catalogues/[name]/page.tsx:87`, `src/constants/metadata.ts:211`, `:217`.
- Favicon / apple icon: `metadata.icon` → `logo` → `/favicon.ico` —
  `src/app/catalogues/[name]/page.tsx:88`, `src/constants/index.ts:218`,
  `src/constants/metadata.ts:194-197`.
- Canonical and OG url: `https://www.quicktalog.app/catalogues/<name>` (hard-coded host) —
  `src/constants/metadata.ts:204`, `:209`.
- Twitter card type `summary_large_image`, creator `Quicktalog` —
  `src/constants/metadata.ts:214-220`.
- The browser tab title and favicon are also swapped client-side while the catalogue is on
  screen, and restored when leaving — `src/components/catalogue/view/Catalogue.tsx:91-148`.

---

## The QR code editor — how to reach it and the screen frame

- Route: `/admin/<name>/qr-editor` — `src/app/admin/[name]/qr-editor/page.tsx`.
- Two ways in: the dashboard card's `⋮` → `QR Code`
  (`src/components/dashboard/overview/ItemDropdownMenu.tsx:142-147`) and the publish
  success modal's `Customize` button (`src/components/modals/PublishQrPanel.tsx:85-94`).
  There is no link from the builder rail (grep over `src` finds only those two).
- Not signed in → redirect to `/auth?next=/admin/<name>/qr-editor` —
  `src/app/admin/[name]/qr-editor/page.tsx:17`, `src/lib/auth/session.ts:12-15`.
- Not the owner → 404 (`notFound()`); ownership and the saved design are read in one
  transaction — `src/app/admin/[name]/qr-editor/page.tsx:21-30`.
- **No plan check anywhere on this page** — the editor is on every plan —
  `src/app/admin/[name]/qr-editor/page.tsx:11-41`.
- Frame: the signed-in `AppShell` (navbar, a 1280px column with 20px + 16/24/32px side
  padding, top padding 96/112/120px, footer) —
  `src/app/admin/[name]/qr-editor/page.tsx:33`, `src/components/navigation/AppShell.tsx:27-43`,
  `src/components/general/Container.tsx:19`.
- Header: a pill link `Back to dashboard` (32px tall, `ArrowLeft`), then the `h1`
  `QR code editor` (clamp 28–40px), then the line
  `Create beautiful, customized QR codes for your brand with our easy-to-use editor.`
  (max width 560px) — `src/components/qr-editor/QrEditor.tsx:31-48`.

### Layout for drawing

- One column below `lg`; from `lg` two columns
  `minmax(0,1fr) minmax(360px,420px)` with a 24px gap —
  `src/components/qr-editor/QrEditor.tsx:50`.
- The **preview is the right-hand column** (`lg:order-2`) and sticks at `top: 104px`; the
  controls are the left column (`lg:order-1`) — `src/components/qr-editor/QrEditor.tsx:51-54`.
- On a phone the preview comes **first** (source order), controls after —
  `src/components/qr-editor/QrEditor.tsx:51-57`.
- Left column order: the URL bar, then the tabbed controls card, 14px apart —
  `src/components/qr-editor/QrEditor.tsx:54-57`.
- Preview card padding 16px (20px from `sm`); the QR art box is max 216px wide, 236px from
  `md`, 280px from `lg`, with four 22px (26px from `lg`) corner brackets and an animated
  scan line — `src/components/qr-editor/QrPreview.tsx:72`, `:106-153`, `:19-20`, `:16-17`.
- Download row: a 3-column grid `minmax(0,1fr) auto auto`, 8px gap —
  `src/components/qr-editor/QrPreview.tsx:168`.
- Save button: full width, 46px tall, pill, with a dot that appears when dirty and a status
  line on the right — `src/components/qr-editor/QrPreview.tsx:197-222`.
- Controls card: tab strip of 4 equal columns with a sliding highlight; each panel has
  8px/14px side padding and 20px/22px top padding —
  `src/components/qr-editor/QrControls.tsx:27`, `:49-70`.

### The URL bar (pinning behaviour)

- Shows the live URL, 48px minimum height, globe icon, the URL as a monospace link
  (opens in a new tab) with `https://` and `www.` stripped for display —
  `src/components/qr-editor/QrUrlBar.tsx:28-40`.
- Button reads `Copy`, turns to `Copied` (green, check icon) for 1.8 seconds —
  `src/components/qr-editor/QrUrlBar.tsx:11-15`, `:50-56`.
- Clipboard failure toast:
  `Could not copy the link. Select it and copy it instead.` —
  `src/components/qr-editor/QrUrlBar.tsx:22`.
- The note under the bar is exactly:
  `This QR code links to your catalog. The URL cannot be changed.` (with an info icon) —
  `src/components/qr-editor/QrUrlBar.tsx:58-61`.
- That is enforced twice: the page overwrites `data` with `catalogueUrl(name)` when loading
  (`loadQrConfig`) and the save action overwrites it again
  (`normalizeQrConfig(parsed, catalogueUrl(catalogue))`) —
  `src/app/admin/[name]/qr-editor/page.tsx:35`, `src/lib/qr/design.ts:195-216`,
  `src/actions/qr-configs.ts:34-37`, `docs/architecture/qr-codes.md:41`.

### The preview panel

- Heading `Preview` (17px, extra bold) — `src/components/qr-editor/QrPreview.tsx:77-83`.
- A pill to its right reads `Scannable` (green) or `May be hard to scan` (amber) —
  `src/components/qr-editor/QrPreview.tsx:84-103`.
- Caption under the code: `Version <n> · <m>×<m> modules · error correction <L|M|Q|H>`, or
  just `Error correction <level>` when the version cannot be worked out —
  `src/components/qr-editor/QrPreview.tsx:156-159`, `src/lib/qr/version.ts:32-52`.
- Modules per side = `version * 4 + 17` — `src/lib/qr/version.ts:52`.
- A bold tip may follow on its own line; the three possible tips, most important first:
  `Logo may be too large for this correction level`,
  `Use error correction M or higher with a logo`,
  `Darker corner dots scan more reliably` —
  `src/lib/qr/scan-risk.ts:71-77`, `src/components/qr-editor/QrPreview.tsx:160-165`.
- `Scannable` requires all four of: contrast OK, logo not too big, no logo at level `L`,
  corner dots at ≥ 3:1 against the background — `src/lib/qr/scan-risk.ts:60-86`.
- Low contrast is flagged when the weaker of dots/corner-frames contrast is under 3:1, or
  corner dots under 1.6:1, or the dots are lighter than the background —
  `src/lib/qr/scan-risk.ts:62-69`.
- It is always a warning, never a block — `src/lib/qr/scan-risk.ts:45-49`.
- The frame text is drawn in the preview as an SVG bar with the export's own sizing rule, so
  the preview matches the download —
  `src/components/qr-editor/FrameTextBar.tsx:10-13`, `:43-69`.

### Save

- Button label `Save design`, `Saving…` while in flight (ellipsis character) —
  `src/components/qr-editor/QrPreview.tsx:205`.
- The status line to its right is one of exactly `Unsaved changes`,
  `All changes saved`, `Default design, not saved yet` —
  `src/components/qr-editor/QrPreview.tsx:63-67`.
- Success toast: `QR code configuration saved successfully.` —
  `src/hooks/useQrActions.ts:51`.
- Failure toast: the server's message, else `Failed to save configuration.`; a thrown error
  gives `An unexpected error occurred.` — `src/hooks/useQrActions.ts:53`, `:56`.
- Dirty state is a deep, key-sorted comparison of the design against the last saved one —
  `src/context/QRContext.tsx:38`, `:52-55`, `src/lib/qr/design.ts:303-317`.
- One saved design per catalogue (unique on `catalogue_id`), upserted in one statement —
  `src/lib/qr/configs.ts:37-66`.

---

## QR editor controls, tab by tab

Tabs, in order, with their icons: `Colors` (Palette), `Style` (Shapes), `Logo` (Image),
`Settings` (SlidersHorizontal); the strip is labelled `QR settings` —
`src/components/qr-editor/QrControls.tsx:20-25`, `:52`.
The `Logo` panel stays mounted when you switch away so an upload in progress survives —
`src/components/qr-editor/QrControls.tsx:97-102`.

### Tab 1 — `Colors`

- Panel heading `Color palette`, description `Customize your QR code colors.` —
  `src/components/qr-editor/controls/ColorControls.tsx:164-167`.
- Preset row, group label `Color presets`, 5 equal columns —
  `src/components/qr-editor/controls/ColorControls.tsx:168-172`.
- The five presets and their colours (dots / background / corner frames / corner dots):
  - `Ink & amber` — `#16140F` / `#FFFFFF` / `#16140F` / `#C77F00`
  - `Coffee` — `#2A1F14` / `#F5F0E8` / `#6B4C20` / `#8B6914`
  - `Navy` — `#010E58` / `#FFFFFF` / `#010E58` / `#C77F00`
  - `Organic` — `#354834` / `#F5F3EA` / `#5C7453` / `#5C7453`
  - `Classic` — `#000000` / `#FFFFFF` / `#000000` / `#000000`
  — `src/lib/qr/design.ts:81-127`.
- A preset tile shows as pressed when all four colours match —
  `src/components/qr-editor/controls/ColorControls.tsx:173-177`.
- Four colour rows (1 column, 2 from `sm`), each a 36×36 native colour swatch, a name, a
  hint and an 86×34 hex field:
  - `QR Dots` — `The data pattern`
  - `Background` — `Behind the code`
  - `Corner Frames` — `Outer ring of the 3 markers`
  - `Corner Dots` — `Centre of the 3 markers`
  — `src/components/qr-editor/controls/ColorControls.tsx:10-19`, `:102-141`, `:198-208`.
- The hex field accepts at most 7 characters, uppercases, auto-prefixes `#`, and only
  commits a valid `#RRGGBB` — `src/components/qr-editor/controls/ColorControls.tsx:126`,
  `:131-136`, `src/lib/qr/design.ts:24`.
- An invalid hex turns the field red and exposes the screen-reader message
  `Use a 6-digit hex colour like #16140F.` —
  `src/components/qr-editor/controls/ColorControls.tsx:142-146`.
- Accessible field names are `<Name> color` (swatch) and `<Name> hex value` (text) —
  `src/components/qr-editor/controls/ColorControls.tsx:105`, `:119`.
- A pill under the rows reads `Contrast <n.n>:1 · Low` or `Contrast <n.n>:1 · Good`,
  30px tall — `src/components/qr-editor/controls/ColorControls.tsx:210-220`.
- When contrast is low, a warning box appears with the bold line `Low Contrast Warning` and
  the text `Your QR code may be hard to scan. Try increasing the contrast between colors.`
  — `src/components/qr-editor/controls/ColorControls.tsx:222-238`.

### Tab 2 — `Style`

Three radio-tile groups, keyboard-navigable with the arrow keys (roving tabindex) —
`src/components/qr-editor/controls/RadioTiles.tsx:24-28`, `src/hooks/useRadioKeys.ts:4-36`.

- `Dots pattern` — `Choose the style for your QR code dots.`; 6 options, 3 columns (6 from
  `sm`): `Square`, `Dots`, `Rounded`, `Extra`, `Classy`, `Classy+` —
  `src/components/qr-editor/controls/ShapeControls.tsx:119-130`,
  `src/lib/qr/design.ts:129-136`, `src/components/qr-editor/controls/RadioTiles.tsx:34-37`.
- `Corner frames` — `Style the frame around corner markers.`; 3 options: `Square`, `Dot`,
  `Rounded` (stored as `extra-rounded`) —
  `src/components/qr-editor/controls/ShapeControls.tsx:132-143`,
  `src/lib/qr/design.ts:138-143`.
- `Corner dots` — `Style the dot inside corner markers.`; 2 options: `Square`, `Dot` —
  `src/components/qr-editor/controls/ShapeControls.tsx:145-156`,
  `src/lib/qr/design.ts:145-148`.
- Each tile is a 52×52 glyph box over the label, with an amber check badge when selected —
  `src/components/qr-editor/controls/RadioTiles.tsx:53-80`.
- Defaults a brand-new design starts with: dots `rounded`, corner frames `extra-rounded`
  (shown as `Rounded`), corner dots `dot` — `src/lib/qr/design.ts:182-185`.
- If a value is missing the controls fall back to `square` for all three —
  `src/components/qr-editor/QrControls.tsx:82-84`.

### Tab 3 — `Logo`

- Panel heading `Logo upload`, description
  `Add your brand logo to the center of your QR code.` —
  `src/components/qr-editor/controls/LogoControls.tsx:39-42`.
- With no logo: a dashed dropzone whose own label is `Choose a file or drag it here` and
  whose allowed-content line is
  `PNG, JPG or WebP, up to 50 MB. We resize it for you.` —
  `src/components/qr-editor/controls/LogoControls.tsx:44-61`,
  `src/components/general/ImageDropzone.tsx:11`, `:18`, `:264-269`, `:244-252`.
- A second line under the dropzone reads exactly
  `PNG or JPG · resized to max 512 px and 200 KB` —
  `src/components/qr-editor/controls/LogoControls.tsx:62-64`.
- Those limits are the props the QR editor passes: `maxDim={512}`, `targetSizeKB={200}` —
  `src/components/qr-editor/controls/LogoControls.tsx:50`, `:59`.
- Input limits before resizing: any raster image the browser can decode, ≤ 50 MB; SVG is
  refused — `src/components/general/ImageDropzone.tsx:11`, `:65-78`.
- Upload errors (shown as toasts via `onError`): `Please select a valid image file`,
  `File is too large. Please select a smaller image`,
  `SVG images aren't supported here. Please upload a PNG or JPG.`, else
  `Logo upload failed.` — `src/components/general/ImageDropzone.tsx:66`, `:70`, `:75-77`,
  `src/components/qr-editor/controls/LogoControls.tsx:53`.
- The upload route itself allows one image of at most `4MB`, requires a signed-in user and
  is rate-limited (`Unauthorized`, `Too many uploads, try again later`) —
  `src/app/api/items/uploadthing/core.ts:11-32`.
- Success toast: `Logo uploaded successfully` —
  `src/components/qr-editor/controls/LogoControls.tsx:55`.
- With a logo: a green row showing a 48×48 thumbnail (alt `Your logo`), the bold line
  `Logo uploaded successfully`, the sub-line `Shown in the centre of your code`, and a
  `Remove` button (Trash icon) — `src/components/qr-editor/controls/LogoControls.tsx:66-95`.
- Three setting rows below:
  - Toggle `Show logo` — hint `Upload a logo to show it in the code.` with no logo, else
    `Turn off to keep the logo without printing it.`; disabled with no logo; default on —
    `src/components/qr-editor/controls/LogoControls.tsx:98-108`,
    `src/components/qr-editor/QrControls.tsx:119`, `src/lib/qr/design.ts:187`.
  - Slider `Logo size` — min `0.1`, max `0.6`, step `0.05`, shown as e.g. `0.6×`; hint
    `From 0.1× to 0.6×. Higher error correction fits a bigger logo.` —
    `src/components/qr-editor/controls/LogoControls.tsx:109-119`,
    `src/lib/qr/design.ts:35`.
  - Toggle `Hide dots behind logo` — hint `Clean background for better visibility.`;
    default on in a new design —
    `src/components/qr-editor/controls/LogoControls.tsx:120-126`,
    `src/lib/qr/design.ts:177-181`.
- A new design starts at `imageSize: 0.6`; when a saved design has no value the control
  falls back to `0.4` — `src/lib/qr/design.ts:179`,
  `src/components/qr-editor/QrControls.tsx:108`.
- Only an UploadThing URL is accepted as a logo: `https`, host `utfs.io` or
  `<app>.ufs.sh`, path starting `/f/`, no port or credentials, at most 512 characters —
  `src/lib/qr/design.ts:26-71`.
- A saved logo that breaks that rule is silently dropped when the editor loads —
  `src/lib/qr/design.ts:205-210`, `docs/architecture/qr-codes.md:59`.
- Logo size is clamped to 0.6 on load, on normalise and before drawing —
  `src/lib/qr/design.ts:37-45`, `:201`, `:234`, `:247`.

### Tab 4 — `Settings`

- Panel heading `Advanced settings`, description
  `Fine-tune your QR code's technical properties.` —
  `src/components/qr-editor/controls/SettingsControls.tsx:40-43`.
- Group label `Error correction level`, then a 4-column radio group showing the letter over
  `<name> · <percent>%`: `L` `Low · 7%`, `M` `Medium · 15%`, `Q` `Quartile · 25%`,
  `H` `High · 30%` — `src/components/qr-editor/controls/SettingsControls.tsx:44-77`,
  `src/lib/qr/design.ts:150-159`.
- Default `Q` — `src/lib/qr/design.ts:175`, `src/components/qr-editor/QrControls.tsx:126`.
- Note under the group: `Higher correction levels allow the QR code to be scanned even if
  partially damaged or obscured.` —
  `src/components/qr-editor/controls/SettingsControls.tsx:78-81`.
- Slider `Margin (padding)` — min `0`, max `50`, step `1`, shown as e.g. `16px`; hint
  `Add space around the QR code for better scanning.` —
  `src/components/qr-editor/controls/SettingsControls.tsx:83-94`.
- Default margin `16`; the control falls back to `0` when the value is missing —
  `src/lib/qr/design.ts:174`, `src/components/qr-editor/QrControls.tsx:131`.
- Section `Frame text` with a `New` badge and the description
  `A short label printed under the code, so people know what they are scanning.` —
  `src/components/qr-editor/controls/SettingsControls.tsx:96-105`.
- Toggle `Show frame text` (no hint), off in a new design —
  `src/components/qr-editor/controls/SettingsControls.tsx:107-111`,
  `src/lib/qr/design.ts:186`.
- Field labelled `Text`, 40px tall, `maxLength` 28, disabled while the toggle is off;
  the default text is `Scan it!` —
  `src/components/qr-editor/controls/SettingsControls.tsx:112-130`,
  `src/lib/qr/design.ts:21-22`, `src/components/qr-editor/QrControls.tsx:129`.
- Blank or whitespace-only frame text prints nothing even when the toggle is on —
  `src/lib/qr/design.ts:256-259`.
- Slider rows show the value in a monospace chip at least 52px wide, with the slider on its
  own full-width line — `src/components/qr-editor/controls/rows.tsx:111-128`.

---

## Downloading / exporting the QR code

- Three buttons in one row: `Download PNG` (primary, Download icon),
  `SVG` (outline, accessible name `Download SVG`), `JPEG` (outline, accessible name
  `Download JPEG`) — `src/components/qr-editor/QrPreview.tsx:168-195`.
- All three are disabled while any download is running —
  `src/components/qr-editor/QrPreview.tsx:171`, `:179`, `:188`,
  `src/hooks/useQrActions.ts:17`, `:23`.
- File name: `<catalogue name>-qr.<png|svg|jpeg>` —
  `src/hooks/useQrActions.ts:29`, `src/lib/qr/export.ts:61`.
  From the publish modal it is `<slug>-qr.png` —
  `src/components/modals/PublishQrPanel.tsx:49`.
- Success toast: `QR code downloaded as PNG.` / `... as SVG.` / `... as JPEG.` (the
  extension uppercased) — `src/hooks/useQrActions.ts:34`.
- Failure toast: `The download failed. Please try again.` —
  `src/hooks/useQrActions.ts:37`.
- Without frame text the file is exactly what `qr-code-styling` produces —
  `src/lib/qr/export.ts:51-54`.
- With frame text a bar is composed under the code: bar height 15% of the width in the dots
  colour, text in the background colour, one line in the heading font at 5.8% of the width,
  shrunk to fit 90% of the width, never below 8px —
  `src/lib/qr/export.ts:32-36`, `:101-121`, `docs/architecture/qr-codes.md:73-74`.
- The whole canvas (including the bar) is filled with the background colour first —
  `src/lib/qr/export.ts:214-215`, `:159`.
- PNG/JPEG are drawn on a canvas at quality `0.95`; a canvas failure throws
  `Export failed` / `Canvas is not available` / `QR image could not be loaded` —
  `src/lib/qr/export.ts:197-232`, `:189-193`.
- SVG files declare the font stack
  `'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif` and pin the text with
  `textLength` + `lengthAdjust="spacingAndGlyphs"`; the font is **not** embedded and every
  user value is XML-escaped — `src/lib/qr/export.ts:42-43`, `:123-159`,
  `docs/architecture/qr-codes.md:79`.
- The drawn size is the design's `width`/`height`, 300×300 in a new design, so a PNG is
  300px wide (plus 45px of bar when frame text is on) —
  `src/lib/qr/design.ts:168-170`, `src/lib/qr/export.ts:32`.
- A render failure throws `QR code could not be rendered` —
  `src/lib/qr/export.ts:56`.

---

## The unsaved-changes guard

- Active only while the design differs from the saved one —
  `src/components/qr-editor/QrEditor.tsx:20`, `:27-30`,
  `src/hooks/useBeforeUnload.tsx:80`.
- In-app link clicks open a dialog with the exact title `Unsaved Changes`, the exact
  message `You have unsaved changes. Are you sure you want to leave?`, and the buttons
  `Stay` (cancel) and `Leave` (confirm) —
  `src/hooks/useBeforeUnload.tsx:161-180`.
- The dialog is the small 440px `InformModal` —
  `src/components/modals/InformModal.tsx:61`, `src/components/modals/AppDialog.tsx:13`.
- `Leave` continues with the Next router, so there is no full reload —
  `src/hooks/useBeforeUnload.tsx:115`, `:143-150`.
- Reload, tab close and links to other sites get the browser's own prompt instead —
  `src/hooks/useBeforeUnload.tsx:100-105`.
- Left alone (no dialog): Ctrl/Cmd/Shift/Alt clicks, non-primary buttons, `target` other
  than `_self`, `download` links, other origins, and same-page `#fragment` links —
  `src/hooks/useBeforeUnload.tsx:26-57`.
- Back button: while dirty one extra tagged history entry for the same URL sits on top;
  pressing Back steps off it, the guard restores it and opens the dialog, and `Leave` goes
  back two entries — or to `/admin/dashboard` when the tab opened on the editor —
  `src/hooks/useBeforeUnload.tsx:83-98`, `:119-131`, `:9`.
- After a save the extra entry stays, so one Back press lands on the same page before a
  second one leaves — `docs/architecture/qr-codes.md:89`.

---

## Limits, counts and caps in this area

| What | Limit | Evidence |
|---|---|---|
| Frame text length | 28 characters | `src/lib/qr/design.ts:21`, `src/components/qr-editor/controls/SettingsControls.tsx:123` |
| Logo size slider | 0.1× – 0.6×, step 0.05 | `src/lib/qr/design.ts:35`, `src/components/qr-editor/controls/LogoControls.tsx:113-116` |
| Logo image, in the browser | resized to max 512 px, target 200 KB | `src/components/qr-editor/controls/LogoControls.tsx:50`, `:59` |
| Logo image, input | raster only, ≤ 50 MB, no SVG | `src/components/general/ImageDropzone.tsx:11`, `:65-78` |
| Logo image, upload route | 1 file, `4MB` | `src/app/api/items/uploadthing/core.ts:11-19` |
| Logo URL length | 512 characters | `src/lib/qr/design.ts:27` |
| Margin | 0 – 50 px in the UI, 0 – 100 accepted by the schema | `src/components/qr-editor/controls/SettingsControls.tsx:86-90`, `src/constants/schemas.ts:463` |
| Logo margin | 0 – 50 (schema only, no control) | `src/constants/schemas.ts:483` |
| Code width / height | 100 – 2000 (schema); 300 by default | `src/constants/schemas.ts:461-462`, `src/lib/qr/design.ts:168-169` |
| Saved design size | 16 KB of UTF-8 JSON in the app, 64 KB at the database check | `src/constants/schemas.ts:527`, `docs/architecture/qr-codes.md:55-57` |
| QR `data` length | 2048 characters (schema) | `src/constants/schemas.ts:464` |
| Saved designs per catalogue | 1 (unique on `catalogue_id`) | `src/lib/qr/configs.ts:37-39` |
| Search placeholder | 40 characters | `src/lib/catalogue/items.ts:44`, `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:41` |
| Catalogue heading | 100 characters | `src/lib/catalogue/heading.ts:4` |
| Revalidate API batch | 500 names, 200 chars each | `src/app/api/revalidate/route.ts:13-20` |
| Dashboard cards shown first | 8 | `src/components/dashboard/overview/CatalogueGrid.tsx:24` |
| Duplicate name attempts | 20 | `src/actions/catalogue.ts:225` |
| Delete lock for `in_preparation` | 10 minutes after creation | `src/components/dashboard/overview/ItemDropdownMenu.tsx:74` |

---

## Plan rules that touch sharing

- **The QR editor needs no paid plan.** The page checks only sign-in and ownership —
  `src/app/admin/[name]/qr-editor/page.tsx:17-30`. The save action checks only identity,
  ownership, shape and size — `src/actions/qr-configs.ts:19-49`.
- **The link, Share, Embed and the QR code are not plan-gated** either —
  `src/components/dashboard/overview/ItemDropdownMenu.tsx:114-171` has no plan condition on
  those items.
- **The search bar is on every plan** —
  `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:13`.
- **Going live needs a full plan fit.** `canActivate` refuses publishing or activating until
  the catalogue fits the plan, and refuses when this month's traffic allowance is used up —
  `src/lib/entitlements/plan.ts:77-97`, used at `src/actions/catalogue.ts:453` and `:148`.
- Traffic refusal text (shown as the toast): `This month's traffic limit for your plan is reached`
  — `src/lib/entitlements/plan.ts:92-93`.
- Over-plan content refusal text: `Remove <n> item(s), <n> section(s) and the <Label> sections to fit the <Plan> plan.`
  (parts are joined with commas and a final "and"; only the parts that apply appear) —
  `../quicktalog-packages/src/helpers/plan-fit.ts:93-111`.
- Gated section labels in that sentence: `Divider`, `External content`, `Custom visual` —
  `../quicktalog-packages/src/helpers/plan-fit.ts:33-41`.
- Growth-only limits on a save/publish produce
  `Your plan allows <n> sections per catalogue`,
  `Your plan allows <n> items per catalogue`, and
  `<Label> sections are not part of your plan` —
  `src/lib/entitlements/plan.ts:134-165`.
- `applyPlanToCatalogue` silently resets anything the plan lacks before storing: a custom
  header/footer becomes `default` without `branding`; tracking ids are stripped without
  `integrations.tracking`; style, overlay, glass, background and custom themes reset
  without `advancedAppearance`; `footer.newsletter` becomes `false` without `newsletter` —
  `src/lib/entitlements/catalogue.ts:28-84`.
- Plan limits that matter for sharing (Starter → Premium):
  catalogues 1 / 1 / 6 / 20 / 50; `traffic_limit` 500 / 2000 / 5000 / 15000 / 40000;
  `branding` false / true / true / true / true; `newsletter` false / false / false / true /
  true — `../quicktalog-packages/src/constants/pricing.ts:14-158`.
- Dashboard banners when a limit is hit: `You've reached your current catalogue limit` with
  `Upgrade your plan to get more catalogues, features, and higher limits.`, and
  `You've reached your traffic limit` with
  `Upgrade your plan to increase your traffic limit and reactivate your catalogues.`, both
  with the button `Upgrade plan` → `/pricing` —
  `src/components/dashboard/overview/LimitCTAs.tsx:19-34`.
- The catalogue-quota refusal on create reads
  `You have reached the catalogue limit of your plan` —
  `src/actions/catalogue.ts:275-277`.

---

## Surprising behaviour worth documenting

- **A catalogue cannot be renamed, so the link and every printed QR code are permanent.**
  `name` is not an editable field, and no action writes it after creation —
  `src/utils/db/columns.ts:32-52`, `src/actions/catalogue.ts:300`. The only way to a
  different URL is `Duplicate`, which creates a separate catalogue starting as `draft` —
  `src/actions/catalogue.ts:206-247`.
- **Old QR codes keep working after any content change**, because the code only ever
  encodes `<base>/catalogues/<name>`, which is pinned on load and on save —
  `src/lib/qr/design.ts:162-164`, `src/actions/qr-configs.ts:34-37`.
- **Deactivating does not break the code — it makes the page say "Catalogue Not Found".**
  Re-activating brings the same link back — `src/app/catalogues/[name]/page.tsx:143-147`,
  `src/actions/catalogue.ts:155-165`.
- **Deleting a catalogue frees the name**, and the draft cache is keyed by id so a reused
  name never shows the previous owner's draft —
  `src/actions/catalogue.ts:61-71`, `src/lib/catalogue/draft-cache.ts:12-18`.
- **A plan downgrade can switch a live catalogue off without the owner doing anything.**
  On a Paddle cancellation the user drops to the free plan and `applyPlanDowngrade`
  deactivates every active catalogue beyond the new quota (keeping the most recently
  updated), resets branding, newsletter and advanced appearance, and strips tracking ids —
  `src/lib/entitlements/catalogue.ts:95-172`, `src/utils/paddle/process-webhook.ts:206-211`.
- Those catalogues are revalidated right after, and a cancellation email lists the
  unpublished ones — `src/utils/paddle/process-webhook.ts:260-276`.
- **The background job also switches catalogues off**: once a user's monthly pageviews reach
  their plan's `traffic_limit`, every active catalogue of theirs goes `inactive`; and any
  active catalogue that no longer fits its owner's plan is deactivated too —
  `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:135-163`.
- That job runs on the cron described in `CLAUDE.md` (03:00 UTC with analytics ingestion,
  plus 11:00 and 19:00 UTC for plan checks) and calls `/api/revalidate` so the public pages
  stop being served from cache —
  `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:165-178`.
- **The traffic switch-off skips free-plan users**: step 1 of the job excludes users whose
  `plan_id` is the Starter monthly price —
  `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:126-129`. But the app
  still refuses to publish or re-activate for them once 500 pageviews are used —
  `src/lib/entitlements/plan.ts:86-95`.
- **Downgraded content can still be edited, just not grown.** Saves are judged against the
  previous draft, so an over-limit catalogue can be trimmed one save at a time —
  `src/lib/entitlements/plan.ts:99-168`, `src/actions/catalogue.ts:344`, `:355`.
- **A plain `Save` purges the public page cache** even though a save never writes the
  database row — `src/actions/catalogue.ts:379` with `:346-377`.
- **The "Catalogue Not Found" dialog's X sends a visitor to `/admin/dashboard`.** On the
  public page no `onClose` is passed, so the corner control becomes a link labelled
  `Go to dashboard` — `src/components/modals/limits/LimitsModalHeader.tsx:38-55`,
  `src/app/catalogues/[name]/page.tsx:146`. The dialog cannot be dismissed
  (`open={isOpen}` with `isOpen={true}` and no cancel) —
  `src/components/modals/LimitsModal.tsx:36`.
- **`Save` in the status submenu means "take it back to draft"**, which takes a live
  catalogue offline — `src/components/dashboard/overview/ItemDropdownMenu.tsx:70`,
  `src/app/catalogues/[name]/page.tsx:143`.
- **`Embed` downloads a whole HTML file, not a snippet**, and that file points at the live
  URL in an iframe — `src/lib/catalogue/download.ts:3`, `:10`.
- **The publish modal's QR is always the default design**, so a code customised in the
  editor is not what that modal downloads — `src/components/modals/PublishQrPanel.tsx:34`,
  `docs/architecture/qr-codes.md:26`.
- **Frame text never appears in the publish modal's download**, only in the editor's —
  `src/components/modals/PublishQrPanel.tsx:49`, `src/hooks/useQrActions.ts:29-33`.
- **A logo saved before the URL rule existed is dropped on load**, so the editor opens with
  no logo and the design must be saved again — `src/lib/qr/design.ts:205-210`.
- **A design saved with a logo larger than 0.6× is clamped down on load** —
  `src/lib/qr/design.ts:37-45`, `:201`.
- The `Share` menu item copies the link even for a draft or inactive catalogue, which will
  show "Catalogue Not Found" to whoever opens it —
  `src/components/dashboard/overview/ItemDropdownMenu.tsx:135-139`,
  `src/app/catalogues/[name]/page.tsx:143-147`.
- The public page fetches its own API over HTTP using `NEXT_PUBLIC_BASE_URL`, so a wrong
  base URL breaks every published page —
  `src/app/catalogues/[name]/page.tsx:15-16`, `:114-115`.
- `generateStaticParams` asks for `?type=name&status=active`, but the route ignores both
  query parameters — the filtering is done by RLS on `app_public` —
  `src/app/catalogues/[name]/page.tsx:16`, `src/app/api/items/route.ts:10-14`,
  `src/lib/catalogue/public.ts:17-21`.

---

## Contradictions

1. **The existing user docs describe a "share dialog" that does not exist.**
   `src/content/docs/share-your-catalogue.tsx:80-83` says "The share dialog on each
   catalogue carries all three". In the code there is no share dialog: `Share` copies the
   link straight from the `⋮` menu, `QR Code` navigates to another page, and `Embed`
   triggers a file download — `src/components/dashboard/overview/ItemDropdownMenu.tsx:129-153`.
2. **"Embed" is documented as a snippet, but it is a downloaded HTML file.**
   `src/content/docs/share-your-catalogue.tsx:95-98` ("A snippet you paste into a page you
   already run") vs `src/lib/catalogue/download.ts:3-10`, which builds and downloads
   `<slug>.html`.
3. **The QR-code architecture doc says the editor page reads the catalogue's status; the
   page does not use it.** `docs/architecture/qr-codes.md:9` ("ownership, status and saved
   design in one `withUser` block") vs `src/app/admin/[name]/qr-editor/page.tsx:21-30`,
   which only returns `config`; `status` comes back from `getOwnedCatalogue`
   (`src/lib/catalogue/ownership.ts:25`) and is discarded.
4. **The default logo size differs between the default design and the control fallback.**
   `defaultQrConfig` uses `imageSize: 0.6` (`src/lib/qr/design.ts:179`), while
   `QrControls` and `assessScanRisk` fall back to `0.4` when the value is absent
   (`src/components/qr-editor/QrControls.tsx:108`, `src/lib/qr/scan-risk.ts:54`). Only
   designs saved without `imageOptions.imageSize` are affected.
5. **The default margin differs the same way:** `16` in the default design
   (`src/lib/qr/design.ts:174`) vs a `0` fallback in the control
   (`src/components/qr-editor/QrControls.tsx:131`).
6. **The logo-size UI cap (0.6) is stricter than the schema (1.0).** The slider and
   `LOGO_SIZE_MAX` stop at 0.6 (`src/lib/qr/design.ts:35`,
   `src/components/qr-editor/controls/LogoControls.tsx:113`), the Zod schema accepts up to
   1 (`src/constants/schemas.ts:482`), and `normalizeQrConfig` clamps it back to 0.6 before
   storing (`src/lib/qr/design.ts:233-240`). Noted as intentional at
   `docs/architecture/qr-codes.md:61`.
7. **The margin UI cap (50) is stricter than the schema (100)** —
   `src/components/qr-editor/controls/SettingsControls.tsx:88` vs
   `src/constants/schemas.ts:463`.
8. **The schema accepts a `shape` option (`square` | `circle`) that no control exposes** —
   `src/constants/schemas.ts:460`; nothing in `src/components/qr-editor/**` sets it.
9. **Free-plan users are exempt from the automated traffic switch-off but not from the
   publish check.** The backend job skips them
   (`../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:126-129`), while
   `canActivate` still blocks publishing/activating at 500 pageviews
   (`src/lib/entitlements/plan.ts:86-95`). So a free catalogue over its allowance keeps
   serving but cannot be re-published.
10. **The dropzone's own allowed-content line and the QR editor's own line disagree.**
    The dropzone says `PNG, JPG or WebP, up to 50 MB. We resize it for you.`
    (`src/components/general/ImageDropzone.tsx:18`), the line directly beneath it says
    `PNG or JPG · resized to max 512 px and 200 KB`
    (`src/components/qr-editor/controls/LogoControls.tsx:63`). Both render.

---

## Could not confirm

- **Exported file sizes.** Nothing in the code states or bounds the size of a downloaded
  PNG, JPEG or SVG. Only the drawing size (300×300 by default,
  `src/lib/qr/design.ts:168-169`) and the JPEG quality (`0.95`,
  `src/lib/qr/export.ts:230`) are defined. Any byte figure would need a real export, which
  I did not run. `?`
- **Whether an unknown catalogue name shows the 404 page or the "Catalogue Not Found"
  dialog.** `notFound()` is called inside a `try` whose `catch` returns the dialog
  (`src/app/catalogues/[name]/page.tsx:126-128`, `:148-151`). Reading the code, the catch
  would swallow Next's not-found signal and render the dialog; whether Next re-throws it
  past a user `catch` in this version is not something I can confirm without running the
  app. `?`
- **Whether anything other than the builder opens `SuccessModal` with `type="ai"`,
  `"ocr"` or `"edit"`.** The only usage found passes `type="regular"`
  (`src/components/catalogue/inputs/sidebar/ActionButtons.tsx:167`), so the other three
  strings may be dead copy. `?`
- **Real-world propagation time after a publish.** The code revalidates synchronously
  (`src/actions/catalogue.ts:485`), but how quickly Vercel's edge serves the regenerated
  page is a hosting behaviour, not a code fact. `?`
- **PostHog/Clarity/GTM pageview counting on the public page.** `CatalogueAnalytics`
  handles only the *owner's* GA/Meta tags; where Quicktalog's own pageview numbers (the
  ones the traffic limit uses) are recorded is outside the files I read — the limit reads
  `private.my_usage()` (`src/lib/entitlements/plan.ts:86-88`) and the backend reads the
  `analytics` table (`../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:31-38`).
  The ingestion path itself is unconfirmed. `?`
- **Any share surface outside the dashboard card, the builder publish modal and the QR
  editor.** Greps for `qr-editor`, `SuccessModal` and share/copy labels found nothing else
  (see the grep results cited above), but I did not read every component in `src`. `?`
