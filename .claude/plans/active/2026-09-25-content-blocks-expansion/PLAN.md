Status: in progress

> **Implemented 2026-09-26** (ahead of the roadmap below, at the owner's request):
> the `category`/`container` merge into a single `items` block with `showHeading`
> + `isExpanded` toggles, and the safe subset of the P0 bug fixes. Specifically:
> findings 1, 3, 4, 5, 6, 9, 10, 11, 12, 13, 15, 16, 18, 19 and the
> `CardsSwitcher` price guard from §6.7.
> `supabase/migrations/20260926130000_merge_category_container_into_items.sql`
> rewrites stored rows; [helpers/contentBlocks.ts](helpers/contentBlocks.ts)
> normalizes legacy keys on read regardless.
>
> **Still open from P0:** finding 2 - the block-type union is still hand-written
> in four files, just with one fewer member each; the `BLOCK_DEFINITIONS`
> registry (0c) is what retires it. Also the server-side `sanitizeContent` gate
> and one section-count rule (0d, findings 7 and 8), the host/CSP source of truth
> (0b, findings 28 and 29), and findings 14, 17, 20-27.

# Content blocks: inventory, gaps, and expansion plan

## 1. Verdict

We have 6 block types and the inventory is not the bottleneck - the **wiring** is. A block type's identity is hand-declared in four identical string unions plus a dead enum, the same plan-lock switch exists four times, the section count is computed three incompatible ways, and [`helpers/catalogueOperations.ts:154`](helpers/catalogueOperations.ts) silently converts any unregistered type into a **divider** while telling the AI it succeeded. There is **no server-side validation of `content` at all**, so per-type plan gating is client-only and a Starter user can POST and publish a `custom_code` block today. Adding ~8 blocks on that design is a few hundred coordinated edits with silent failure modes. So the first shipment is not a block: it is a block registry, the three fail-open fixes, one section-count rule, and a server-side content gate. After that each block is one registry entry plus a renderer/input pair. On tracking: **customer GTM/GA4 cannot be a content block and never will be** - the embed sanitizer deletes `<script>` and the custom-code frame is an opaque origin where a tag measures `about:srcdoc` with a fresh client id per hit. It belongs as a catalogue-level setting holding validated **GA4 and Meta Pixel IDs only**, rendered by the published page, behind a real consent gate. **GTM is explicitly out of scope** - a container ID dereferences to remotely-editable customer JavaScript running first-party on the same origin as the signed-in builder, and our CSP already allows `'unsafe-inline'` plus `*.googletagmanager.com`, so "behind an enforced CSP" is not a control over it. Separately, the most urgent thing in this whole area is unrelated to blocks: the sanitizer allows 37 iframe hosts while CSP `frame-src` allows 3, and the header is Report-Only - enforcing it as written kills every published embed.

---

## 2. What we have today

All six live in the `ContentBlock` union at [`../quicktalog-packages/src/types/catalogue.ts:97-103`](../quicktalog-packages/src/types/catalogue.ts). `BaseContentBlock` is `{ id, order }` and nothing else - there is no per-block visibility, width, background, padding, anchor or device-visibility field anywhere.

| Type key | Fields | Can | Cannot | Plan gate |
|---|---|---|---|---|
| `category` | `name` (required), `layout`, `items[]`, `isExpanded` | Only block with a visible heading; only collapsible block; holds priced items | Hold non-priced items (the card guard rejects them); be used for a titled non-item section | none (all tiers) |
| `container` | `name`, `layout`, `items[]` | Holds priced items, always expanded | Render its `name` at all - it is builder-only ([`inputs/ContentInput.tsx:37-42`](components/catalogue/inputs/ContentInput.tsx)); collapse (`showContent = true` hardcoded, [`sections/ContainerBlock.tsx:56`](components/catalogue/sections/ContainerBlock.tsx)) | none |
| `embedding` | `name?`, `code` (HTML string) | Render an iframe from one of 37 allowlisted hosts | Run any `<script>` - `EMBED_TAGS` has no `"script"` ([`helpers/sanitizeHtml.ts:107`](helpers/sanitizeHtml.ts)); store its own aspect ratio (guessed by regex over the src, [`sections/EmbeddingBlock.tsx:8-77`](components/catalogue/sections/EmbeddingBlock.tsx)); explain why a non-allowlisted iframe vanished | `features.sections.embedding` - Pro+ |
| `custom_code` | `name?`, `code` (raw) | Run scripts inside `sandbox="allow-scripts"` with no `allow-same-origin` | Read cookies, `localStorage`, the parent page, or the real URL; exceed 5000px height; be previewed before publishing | `features.sections.customCode` - Growth+ |
| `text` | `name?`, `content` (HTML, `text` profile) | Express `img`, `a`, full `table`, `blockquote`, `h1`-`h6` at the **data** layer | Author any of them - the toolbar has no link, image, table or heading control, and paste is flattened to plain text ([`sections/common/RichTextEditor.tsx:94-107`](components/catalogue/sections/common/RichTextEditor.tsx)) | none |
| `divider` | `name?`, `spacing` (rem), `border?{isEnabled,style,thickness,color,opacity}` | Render a rule, or pure whitespace via `border.isEnabled: false` | Render its `name` - view mode returns a bare `<div>` ([`sections/DividerBlock.tsx:42-50`](components/catalogue/sections/DividerBlock.tsx)) | `features.sections.divider` - Basic+ |

`Item` is `{ id, order, name, description, image, isFree?, discount?, price, denominator? }` and nothing else. Four card variants keyed by `layout` (`variant_1`..`variant_4`) render every item; every card opens the same read-only `ItemDetailModal`.

Current tier ladder, from [`../quicktalog-packages/src/constants/pricing.ts`](../quicktalog-packages/src/constants/pricing.ts): Starter 5 sections / 15 items / no block features; Basic 8/30 + `divider`; Pro 15/100 + `embedding`; Growth 30/200 + `customCode`; Premium 50/300; custom plan (id 5) 20/200 with `divider`+`embedding`. **The entire block-type ladder is three escape hatches, and the headline block feature of the cheapest paid tier is a horizontal rule.**

### Drift, bugs and dead code (all verified)

| # | Finding | Location |
|---|---|---|
| 1 | `ContentBlockType` lists 5 types, is **missing `"divider"`**, and is imported by zero files in either repo | [`../quicktalog-packages/src/types/enums.ts:16-21`](../quicktalog-packages/src/types/enums.ts) |
| 2 | The same block-type union is hand-written in 4 app files, none importing from the package | `AddContentModal.tsx:28-34`, `BlockConfigForm.tsx:12-18`, `BlockConfigHeader.tsx:6-12`, `ContentOptionsSelector.tsx:6-12` |
| 3 | **`buildSection`'s `default:` returns a `DividerBlock`** - a type in the union but not in this switch is silently written as a divider while the agent reports success | [`helpers/catalogueOperations.ts:154`](helpers/catalogueOperations.ts) |
| 4 | `isSectionTypeLocked` returns `false` for any type it does not know → a new gated block is **free** via the AI path | [`helpers/catalogueOperations.ts:47-55`](helpers/catalogueOperations.ts) |
| 5 | `allowedSectionTypes` uses `access?.divider !== false` → when `access` is undefined **every** type is granted | [`agent/schemas.ts:9-15`](agent/schemas.ts) |
| 6 | `SECTION_TYPE_LABELS` knows 3 types; a miss interpolates the literal string `"undefined"` into a user-facing upgrade message | [`helpers/catalogueOperations.ts:57-61`](helpers/catalogueOperations.ts) |
| 7 | **No server-side validation of `content`.** `pickEditable` copies it verbatim; `contentWithinPlan` only counts; `applyPlanToCatalogue` only touches header/footer. A Starter user can POST + publish `custom_code` | [`utils/db/columns.ts:58-66`](utils/db/columns.ts), [`lib/entitlements/plan.ts:86-135`](lib/entitlements/plan.ts), [`lib/entitlements/catalogue.ts:13-28`](lib/entitlements/catalogue.ts) |
| 8 | **Section count computed 3 ways**: modal exempts `text`; Add-Section button counts everything; server counts everything. A Starter catalogue with 5 text blocks cannot open the picker, and a client-legal draft is rejected on save | `AddContentModal.tsx:127-141` vs `Catalogue.tsx:253-262` vs [`lib/entitlements/plan.ts:94`](lib/entitlements/plan.ts) |
| 9 | `ContentOptionsSelector` declares `planFeatures` and a complete lock switch, but `AddContentModal` never passes it → **padlocks have never rendered**; users hit a blur overlay only after filling the form | `AddContentModal.tsx:251-254` vs `ContentOptionsSelector.tsx:17,38-51` |
| 10 | **Same-origin script sink #1**: a 53-line effect does `createElement("script")` + `replaceChild` over a subtree the sanitizer already stripped, so it always finds nothing - until someone adds `script` to a profile | [`sections/EmbeddingBlock.tsx:177-229`](components/catalogue/sections/EmbeddingBlock.tsx) |
| 11 | **Same-origin script sink #2**: `document.body.appendChild(script)` in the signed-in builder, gated only by state that is never set | [`inputs/custom-code/CodePreview.tsx:31-42`](components/catalogue/inputs/custom-code/CodePreview.tsx), setter commented out at `CustomCodeInput.tsx:60-92` |
| 12 | `CategoryHeader` sets `aria-controls="section-content-…"` pointing at an id **no element has** | `CategoryHeader.tsx:38` vs `Items.tsx:69-79` |
| 13 | Emoji `Overlay` is rendered **twice** for the same catalogue | [`view/Catalogue.tsx:211-213`](components/catalogue/view/Catalogue.tsx) and `:223-225` |
| 14 | Anchor ids are `${block.id}-${block.order}`, so they **change on every reorder**, and nothing in the codebase consumes them | `CategoryBlock.tsx:97` and siblings |
| 15 | Dead `src` field in the add/edit draft - no `ContentBlock` has it | `AddContentModal.tsx:36-54` |
| 16 | `showcase.json` is imported by nothing and contains a block with `type: "custom"`, which is not a valid `ContentBlock` - proof no schema has ever validated stored content | `showcase.json` |
| 17 | Search matches only item `name`+`description` inside category/container; every other block stays **fully rendered** during a search, so filtering shows stray banners between hidden sections | [`helpers/catalogueItems.ts:29-56`](helpers/catalogueItems.ts), `view/CatalogueContent.tsx:335-405` |
| 18 | `constants/catalogueTemplates.ts` is untyped (no `: ContentBlock[]`) and uses only `category` + one `container` | [`constants/catalogueTemplates.ts`](constants/catalogueTemplates.ts) |
| 19 | Card price is formatted with a hardcoded locale - a EUR catalogue renders `1,234.56`, not `1.234,56` | [`cards/index.tsx:65`](components/catalogue/cards/index.tsx), [`modals/ItemDetailModal.tsx:83`](components/catalogue/modals/ItemDetailModal.tsx) |
| 20 | `<html lang="en">` is hardcoded for every public catalogue while `catalogue.language` is stored and consumed only by the agent and OCR | [`app/layout.tsx:42`](app/layout.tsx) |
| 21 | Every item card is `<article role="article" tabIndex={0} onClick=…>` with **no key handler anywhere** - focusable, announced as non-interactive, not keyboard-operable. `slugId` derives from `record.name`, so duplicate names emit duplicate DOM ids | [`hooks/useCard.ts`](hooks/useCard.ts), [`cards/common/BaseCard.tsx:33-36`](components/catalogue/cards/common/BaseCard.tsx) |
| 22 | **Zero print styles** in the repo (no `@media print`, no `print:` utility) - a printed catalogue emits chrome, the search bar and collapsed sections | - |
| 23 | `prefers-reduced-motion` is honoured in exactly one place, an unrelated marketing component | [`components/articles/TableOfContents.tsx:65`](components/articles/TableOfContents.tsx) |
| 24 | **`images.unoptimized` is `true` in production** (`!NEXT_PUBLIC_BASE_URL?.includes("localhost")`) and `remotePatterns` is `hostname: "**"` over http **and** https. So `sizes`/WebP/crop are inert, and a pasted URL renders from any host | [`next.config.ts:14-26`](next.config.ts) |
| 25 | `docs/architecture/ai-chat-flow.md` documents a removed `chatEditCatalogue`/DeepSeek-JSON path and attributes snapshot logic to `catalogueEditor.ts`, a deleted file | [`docs/architecture/ai-chat-flow.md`](docs/architecture/ai-chat-flow.md) |
| 26 | The `adding-new-content-block` skill documents 5 wiring areas; the real set is 10+ (it omits `enums.ts`, `buildSection`, `SECTION_TYPE_LABELS`, `isSectionTypeLocked`, `types/ai.ts`, `agent/schemas.ts`, `features.sections`, and the `BlockConfigForm`/`BlockConfigHeader` split) | [`.claude/skills/adding-new-content-block/SKILL.md`](.claude/skills/adding-new-content-block/SKILL.md) |
| 27 | `Subscription.tsx:44-48` and `subscription/BillingHistory.tsx:23-25` **hand-expand** `features.sections` into `{divider, embedding, customCode}`. Any change to that shape silently blanks the plan-comparison table and the billing feature list | `components/dashboard/…` |
| 28 | The sanitizer allows 37 iframe hosts; CSP `frame-src` allows `'self'` + Cloudflare + Paddle + Clerk. Header is `Content-Security-Policy-Report-Only`, so **enforcing it as written breaks every published embed** | [`helpers/sanitizeHtml.ts:14-57`](helpers/sanitizeHtml.ts) vs [`next.config.ts`](next.config.ts) |
| 29 | `connect-src` lists `*.uploadthing.com`, but files are served from `file.ufsUrl` (`utfs.io` / `<appId>.ufs.sh`) - neither host is in any directive | [`app/api/items/uploadthing/core.ts:33`](app/api/items/uploadthing/core.ts) |
| 30 | `appearance.overlay` is `{ isEnabled: boolean; icon: string }` - **one** string, not a list | [`../quicktalog-packages/src/types/catalogue.ts`](../quicktalog-packages/src/types/catalogue.ts) |

---

## 3. Tracking: why `custom_code` cannot do it, and what to build instead

### 3.1 Why both existing paths are dead ends by design

**`embedding` deletes it.** The `embed` profile's allowlist has no `"script"` ([`helpers/sanitizeHtml.ts:107`](helpers/sanitizeHtml.ts)) and `disallowedTagsMode: "discard"` drops the tag *with its contents*. Running the real `EMBED_OPTIONS` over a full GTM + `gtag` + `noscript` snippet leaves a stripped `<div>` and a bare `<img>`. The GTM `noscript` iframe is dropped too, because `googletagmanager.com` is not in `EMBED_HOSTS` and a src-less iframe is deleted outright. This is correct behaviour, not an omission: `HtmlContent` writes into the same-origin document - including the owner's authenticated builder session - and the same field is writable by the AI editor while it holds scraped-page and OCR text ([`docs/architecture/catalogue-html-safety.md:11-15`](docs/architecture/catalogue-html-safety.md)).

**`custom_code` runs it blind.** The frame is `sandbox="allow-scripts"` with no `allow-same-origin` ([`sections/CustomCode.tsx:196`](components/catalogue/sections/CustomCode.tsx)), loaded via `srcDoc`, so it is an **opaque origin at `about:srcdoc`**. Chromium-verified in [`docs/architecture/catalogue-html-safety.md:68-76`](docs/architecture/catalogue-html-safety.md): `document.cookie` throws, `localStorage.setItem` throws, `parent.document.title` throws. Concretely a tag in there:

- cannot write `_ga`/`_gid`/`_fbp`, so **every hit is a brand-new client id** - the property fills with 100% new users, 100% bounce, zero sessions, zero attribution;
- reports `page_location` as `about:srcdoc`, never `/catalogues/<name>`;
- sees no click, scroll or element outside its own box;
- has a private in-frame `window.dataLayer` that nothing else can reach.

It is not a degraded tracker, it is a blind one - **worse than nothing, because the property looks populated**. That is exactly the complaint that started this review.

**Neither control may be relaxed.** With `allow-scripts`, adding `allow-same-origin` lets the frame remove its own `sandbox` attribute and reach the signed-in app's origin; the rationale is written into the code at [`sections/CustomCode.tsx:104-117`](components/catalogue/sections/CustomCode.tsx). Admitting `<script>` to any sanitizer profile is the same hole by another door.

**One thing does survive, and we should know it:** a bare `<img>` beacon to any https host, because `img-src` is `'self' data: blob: https:`. A Meta `noscript` pixel and a GA4 `/g/collect` GET already fire today - ungated, unconsented, undeduped, and equally usable to exfiltrate whatever the AI put in a URL. Shipping the supported path is the moment to either restrict `img` hosts in the `embed` profile or record this as knowingly accepted.

### 3.2 Recommended design

**Where the ids live.** A new nullable `integrations` jsonb column on `catalogues`, via a Supabase CLI migration on TEST first, then `drizzle-kit pull` in `@quicktalog/common` and a release.

```ts
// ../quicktalog-packages/src/types/catalogue.ts
export type Integrations = {
  ga4?: { measurementId: string };
  meta?: { pixelId: string };
  /** Premium: stop Quicktalog's own Clarity/GTM running on this catalogue's visitors. */
  suppressQuicktalogAnalytics?: boolean;
};
```

**IDs only - never markup, never a URL, never a snippet.** Validated server-side and rejected (not sanitized) on mismatch:

```ts
const GA4 = /^G-[A-Z0-9]{4,12}$/;
const META = /^\d{15,16}$/;
```

That regex is the whole security argument **for these two vendors specifically**, because the app emits the tag itself from a validated id: the surface collapses from "arbitrary markup an AI may have written from a scraped page" to "a string matching one of two patterns", and no prompt injection turns a matched id into code.

**Write path.** Add the column to `PUBLIC_CATALOGUE_COLUMNS` (ISR must read it) but **deliberately not** to `CATALOGUE_EDITABLE_FIELDS` ([`utils/db/columns.ts:10-53`](utils/db/columns.ts)). A dedicated `updateCatalogueIntegrations` action checks identity, re-derives the plan from `users.plan_id` + `tiers`, validates the ids, writes inside `withUser` with an explicit owner filter and a row-count check, then calls `revalidateCatalogue(name)` ([`helpers/server.ts:8-17`](helpers/server.ts)) **outside** the block.

> Precision matters here, because one earlier draft of this got the reason wrong. The `metadata` object would *not* let the AI write a tracking id - `catalogueFieldsSchema.metadata` is a closed `z.object({title, description, icon})` at [`agent/tools/general.ts:20-32`](agent/tools/general.ts) and zod strips unknown keys. The real reason to use a separate column is that `metadata` **is** in `CATALOGUE_EDITABLE_FIELDS`, and `pickEditable` forwards it verbatim from an entirely client-supplied draft with no validation - the same fail-open pattern this plan calls P0 everywhere else.

Also worth recording so nobody treats it as a leak later: **a GA4 measurement id and a Meta pixel id are public by construction** - they are in the rendered HTML of every site that uses them. Putting them in `PUBLIC_CATALOGUE_COLUMNS` exposes nothing the page does not already expose. The real consequence is that a third party can spray hits at a customer's property, which is inherent to client-side tracking and must be said in the docs, not engineered around.

**How it renders on an ISR page.** From the **published page**, [`app/catalogues/[name]/page.tsx`](app/catalogues/[name]/page.tsx), with `next/script`. **Not from a new `app/catalogues/[name]/layout.tsx`** - two reasons, both verified:

1. `app/catalogues/[name]/preview/page.tsx` exists. A layout at `[name]` wraps it, so a customer's tag would load **inside the owner's authenticated builder preview** - the precise scenario `catalogue-html-safety.md` invokes to justify the sandbox - and App Router has no way to exclude a child route from a parent layout.
2. A layout receives only `params`, so it would have to re-fetch the catalogue: a **second read per ISR regeneration on the product's hottest path**, plus a new cache tag to thread through the save action. The page already holds the row, tagged `catalogue-${name}`, so `revalidateCatalogue` already covers it.

A per-catalogue id is catalogue data, not visitor data, so baking it into the static HTML is exactly as safe as baking in the heading. Nothing per-visitor is decided server-side and no `Set-Cookie` is emitted, so the CDN cacheability that [`middleware.ts:32-33`](middleware.ts) protects is preserved.

**Consent, which is the real work - not a one-line unlock.** Three facts, all verified:

- [`components/general/CookieBanner.tsx:27-38`](components/general/CookieBanner.tsx) early-returns on any path containing `/catalogues/` **before** `initializeGTMConsent()`. So Quicktalog's own GTM, Clarity and PostHog already run on every customer catalogue with no consent gate at all - a joint-controller problem that exists *before* a single customer tag is added.
- `initializeGTMConsent()` is **not Google Consent Mode**. It pushes `{ event: "consent_default", consent: { … wait_for_update: 2000 } }` ([`utils/cookies.ts`](utils/cookies.ts)) - a named custom event carrying a `consent` object, which does nothing unless a container has a matching template. Consent Mode requires the gtag arguments form, `dataLayer.push(["consent","default",{…}])`, and the defaults must be set **before** the tag loads. This one runs from a `useEffect` after hydration.
- `CookieBanner` calls `useUserContext()`, which invokes the `getUserData()` server action for signed-in users. Dropping it onto a public ISR catalogue page would pull identity reading into that tree, against the project rule.

So the consent deliverable is a **new, small, identity-free client banner for `/catalogues/`** that sets real Consent Mode v2 defaults (denied, with `wait_for_update`) in an inline script before any tag, and mounts the customer's tag only after a client-side grant. Ship the banner first. If only one of the two can ship, **ship neither** - letting an EU restaurant fire GA4 or a Pixel on a Quicktalog-hosted page with no banner makes us joint controller for an unlawful transfer.

**CSP.** `script-src` already allows `googletagmanager` and `google-analytics`; **`connect.facebook.net` is absent**, so a Pixel is a report-only violation today and a hard failure the day the header is enforced. Add each supported vendor explicitly through the single host source-of-truth module in §6. The allowlist then *is* the published list of supported trackers - enforceable and reviewable, which is a feature.

**Plan gate.** `features.integrations.analytics`, **Pro+**, enforced server-side in the action from `users.plan_id`. Third-party analytics is the most consistently paid feature across Linktree, Carrd and Squarespace, so it is a legitimate upsell rather than a giveaway. `suppressQuicktalogAnalytics` is **Premium** and part of the white-label story.

**Stop shipping our own tags to customers' visitors.** [`app/layout.tsx:44-47`](app/layout.tsx) puts `<ClarityScript />` and `<GoogleTagManager />` in the **root** `<head>`. A nested layout cannot un-render that - this needs either pathname-aware client script components or splitting the app into route groups with two root layouts. Keep the PostHog `$pageview`: the plan-limit traffic meter is derived from those events matched by a `/catalogues/<name>` URL regex ([`../quicktalog-backend/src/utils/analytics.ts:9-26`](../quicktalog-backend/src/utils/analytics.ts)), so removing the wrong script silently zeroes both the meter and plan enforcement.

### 3.3 Explicitly NOT allowed

- **Google Tag Manager as a supported field.** A container id is a pointer to remotely-editable customer JavaScript; a GTM Custom HTML tag is arbitrary inline JS running first-party on the origin that `catalogue-html-safety.md:6-9` identifies as shared with the signed-in builder. Our `script-src` already carries `'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com`, so enforcing the CSP buys **nothing** against it. If we ever want it, it needs its own threat model, a render surface that provably excludes `/preview`, a Terms clause, and a nonce-based CSP - not a regex. See Open Questions.
- **A free-text head-snippet / code-injection field.** Squarespace ships it; we should not. It re-imports every risk the typed ids remove, is unreviewable against CSP, and lands in a field the client draft path can reach.
- **`<script>` through any sanitizer profile**, for any "trusted" host.
- **`allow-same-origin` on the custom-code sandbox.**
- Presenting customer tags as feeding the Quicktalog meter. Document at launch that **GA4 numbers will not match the dashboard**: the meter is a separate daily PostHog aggregation keyed `UNIQUE(date, current_url)` with different dedup and bot filtering, and ad blockers hit the two differently.

---

## 4. Proposed blocks

Six new types. Effort is graded **post-registry** (§6) - before the registry every one of these is ~26 edit sites across 15 files. Every new type is a two-repo change needing a `@quicktalog/common` release, so **batch all six into one release**.

### Media

#### `image` - Image

**Purpose.** One standalone photo, banner, certificate or storefront shot between sections. Today it is a fake one-item card (which forces a name *and* a price) or a hand-written `<img>` in a text block that the editor cannot insert.

```ts
export type ImageBlock = BaseContentBlock & {
  type: "image";
  name?: string;              // builder label + aria-label
  src: string;                // UploadThing URL or pasted https URL
  alt: string;                // required; "" allowed for decorative
  caption?: string;           // plain text
  href?: string;              // https only, validated server-side
  aspect?: "auto" | "16/9" | "4/3" | "1/1";
  align?: "left" | "center" | "right";
};
```

**Renderer.** Reuse [`components/general/ImageDropzone.tsx`](components/general/ImageDropzone.tsx) unchanged plus the paste-URL tab from [`inputs/item/ItemImage.tsx:49-73`](components/catalogue/inputs/item/ItemImage.tsx) - no new endpoint, no new auth, and because the URL lands in `catalogue.content` the nightly cleanup worker already protects it ([`../quicktalog-backend/src/handlers/cleanupImages.ts:13-14`](../quicktalog-backend/src/handlers/cleanupImages.ts)). Width/full-bleed comes from `presentation.width` (§6), not a block field. Radius `var(--border-radius)`, caption from `var(--content-font-size)` + the card-description token. Modal editing. **Do not promise `next/image` sizing** - `unoptimized` is true in production (#24), so pass a sane `maxDim`/`targetSizeKB` at upload instead and treat that as the only lever. SVG is rejected client-side; say so in the helper text. Render a neutral placeholder (not `DEFAULT_IMAGE`) when `src` is empty.

*Overlap, stated honestly:* the `text` profile already allows `img`, so this is not new *capability* - it is `alt`/`caption`/`href`/`aspect` as real fields, a stable anchor target, a block the agent can create deliberately, and an upload affordance. **Resolution: we ship the Image block and do NOT add insert-image to `RichTextEditor`** (§6), so there is exactly one way to place a picture.

**Plan:** Starter. **Effort:** S. **Priority:** P1.

#### `gallery` - Gallery

**Purpose.** Several images with no name or price: interior shots, before/after, a lookbook, dish photography - and, via `layout: "logos"`, the partner/brand/certification wall that `catalogue.partners` cannot do (3 max, **no image field**, footer-only text list).

```ts
export type GalleryImage = {
  id: string;
  order: number;
  src: string;
  alt: string;
  caption?: string;
  href?: string;              // used by layout "logos"
};

export type GalleryBlock = BaseContentBlock & {
  type: "gallery";
  name?: string;
  layout: "grid" | "carousel" | "masonry" | "logos";
  columns?: 2 | 3 | 4;        // grid/masonry, responsive down to 1
  aspect?: "original" | "1/1" | "4/3" | "16/9";
  lightbox?: boolean;         // default true; ignored for "logos"
  grayscale?: boolean;        // "logos" only
  images: GalleryImage[];     // cap 24, enforced in sanitizeContent
};
```

**Renderer.** Carousel reuses the existing Swiper wiring from [`sections/common/Items.tsx:80-143`](components/catalogue/sections/common/Items.tsx); grid reuses the column helpers in [`helpers/client.ts:96-109`](helpers/client.ts); masonry is CSS columns, no library. Lightbox is a small dedicated component, **not** `ItemDetailModal` (which assumes name/price/description) - and it must carry the catalogue font vars by hand, since portals inherit nothing (pattern at `CustomCode.tsx:135-142`). `layout: "logos"` is flex-wrap, fixed height, `object-contain`, grayscale via CSS filter. The 24 cap is enforced server-side because the 1MB `content` CHECK is **not** a payload guard (see §6). Reject `data:` URLs in the input. Loop `ImageDropzone` client-side for bulk adds - the upload route is `maxFileCount: 1` and should not change for this. Note for logos: `ImageDropzone` rejects SVG, and logos are overwhelmingly SVG - say "upload PNG" in the copy rather than quietly widening the dropzone.

Supersedes `partners` for new catalogues: keep the column readable and offer a one-click "move my partners into a Gallery" in the builder, never a data migration.

**Plan:** Basic+ (`features.blocks.gallery`). **Effort:** M. **Priority:** P1.

#### `video` - Video

**Purpose.** A YouTube/Vimeo video or a hosted MP4 as a section. Today it needs the Pro-gated `embedding` block *and* the owner must find and paste raw iframe markup, with the aspect ratio guessed by regex.

```ts
export type VideoBlock = BaseContentBlock & {
  type: "video";
  name?: string;
  provider: "youtube" | "vimeo" | "file";
  url: string;                // watch/share URL, or a direct https .mp4/.webm
  videoId?: string;           // parsed + stored server-side at save; never trusted from the client
  poster?: string;            // required for provider "file"
  aspect: "16/9" | "9/16" | "4/3" | "1/1";
  autoplay?: boolean;         // implies muted
  loop?: boolean;
  controls?: boolean;         // default true
  caption?: string;
};
```

**Renderer.** **We build the iframe** from the parsed id - `youtube-nocookie.com/embed/<id>`, `player.vimeo.com/video/<id>?dnt=1`. There is no author markup, so there is nothing to sanitize and `EMBED_HOSTS` is irrelevant here; the only control that applies is **CSP `frame-src`**, which must gain both hosts through the module in §6. (`youtube.com`, `youtube-nocookie.com` and `vimeo.com` are *already* in `EMBED_HOSTS` - adding them there is a no-op.) Default to a **poster facade**: thumbnail + play button, iframe mounted on click. That keeps the third-party frame off initial load, fixes the LCP cost of embeds, sidesteps autoplay policies, and means no third-party cookie before interaction. `provider: "file"` is a native `<video preload="metadata">` with the poster, **URL-only in v1** - no uploads (the route is image-only, 4MB) and no transcoding (a 60s Hobby route cannot). `autoplay` forces `muted` and is ignored under reduced motion.

**Plan:** **Basic+** - deliberately *not* Pro. Basic has `embedding: false`, so a Basic customer cannot show a video at all today; putting it at Pro alongside `embedding` would sell a convenience wrapper over a capability that tier already has.

**Effort:** M. **Priority:** P1.

#### `animation` - Animation (Lottie)

**Purpose.** The explicit Lottie ask: an animated logo, a decorative flourish, a scroll cue. Greenfield - no lottie dependency exists anywhere in the app.

```ts
export type AnimationBlock = BaseContentBlock & {
  type: "animation";
  name?: string;
  /** https URL to .json or .lottie on OUR asset host only. Never inline JSON. */
  src: string;
  loop?: boolean;             // default true
  speed?: number;             // 0.25–2, clamped server-side
  playOn?: "load" | "visible" | "hover";   // default "visible"
  maxWidth?: number;          // px, 80–1200, clamped
  align?: "left" | "center" | "right";
  /** Shown under prefers-reduced-motion or if the animation fails to load. */
  fallbackImage?: string;
};
```

**Renderer - the security decision *is* the library choice, not a footnote.**

- **Pin a player with expressions disabled.** `lottie-web`'s full build compiles After Effects expressions through `new Function`, and `script-src` already carries `'unsafe-eval'` - so an arbitrary JSON becomes first-party script execution on a published catalogue, the exact hole the custom-code sandbox closes. Use ThorVG-based `dotlottie` (or a `lottie-web` build with expressions stripped), verified against an expression-bearing fixture before merge.
- **First-party assets only.** `src` is restricted server-side to our UploadThing host. `lottie.host` / `assets*.lottiefiles.com` are **public UGC hosts** - allowlisting them constrains nothing, unlike `EMBED_HOSTS` where the host identifies a vendor.
- **Self-host the runtime, including the `.wasm`.** `dotlottie-web` fetches its ThorVG module from a CDN unless `setWasmUrl` is configured; leaving that default means a third-party runtime on every customer page plus a `connect-src` entry, contradicting the "no CDN player" rule. Self-hosting still needs `wasm-unsafe-eval` in `script-src` - decide that explicitly.
- Dynamic import, `ssr: false`, code-split so catalogues without an animation pay nothing.
- `src` is a **URL, not inline JSON** - for the upload path, CDN caching and the player's runtime fetch. Note: do **not** justify this with the 1MB `catalogues_content_size` CHECK; `pg_column_size` reports the *compressed/TOAST* datum size and Lottie JSON compresses heavily, so that math does not hold. The flip side matters more - that constraint is **not a payload guard**, which is why every array cap in this plan is enforced in `sanitizeContent`.
- Honour `prefers-reduced-motion` (render `fallbackImage` or a paused frame), gate `playOn: "visible"` behind `IntersectionObserver`, and cap to one auto-playing animation visible at a time.
- Needs a **new UploadThing route** (§6) and `connect-src` must name the real UploadThing host (`utfs.io` / `*.ufs.sh`), not `*.uploadthing.com` (#29).

**Plan:** Pro+ (`features.blocks.animation`). **Effort:** L. **Priority:** P2.

### Content

#### `faq` - FAQ

**Purpose.** Question/answer pairs that collapse: allergens, delivery radius, cancellation policy, warranty, parking. Highest market precedent of anything here (Squarespace Accordion, Shopify `collapsible-content`, Linktree FAQ, Wix collapsible text) and the highest-value missing block for this audience. Today the only collapsible thing in the product is a `CategoryBlock` full of priced items, so an FAQ is a wall of text.

```ts
export type FaqEntry = {
  id: string;
  order: number;
  question: string;           // plain text, max 200
  answer: string;             // HTML, rendered through HtmlContent profile="text"
};

export type FaqBlock = BaseContentBlock & {
  type: "faq";
  name?: string;              // rendered as the section heading when present
  entries: FaqEntry[];        // cap 30
  allowMultipleOpen?: boolean; // default false
  defaultOpenId?: string;
};
```

**Renderer.** [`components/ui/accordion.tsx`](components/ui/accordion.tsx) already wraps `@radix-ui/react-accordion` and is unused inside `components/catalogue/` - use it, themed from `--catalogue-card-*`. `answer` goes through `<HtmlContent profile="text" />`, never `dangerouslySetInnerHTML`. Render **all** answers into the DOM (collapsed by Radix) so they are in the static HTML and findable. Building this is the moment to extract a shared `<CollapsibleSection>` and fix `CategoryHeader`'s dangling `aria-controls` (#12) - after this, "collapsible" is no longer welded to "holds priced items". Register `searchText` over questions + tag-stripped answers, and count entries toward `SEARCH_MIN_ITEMS` so a long FAQ turns the search bar on.

**Plan:** Basic+ (`features.blocks.faq`). **Effort:** M. **Priority:** P1.

### Contact & actions

#### `cta` - Buttons

**Purpose.** In-flow actions: *Order on WhatsApp*, *Book a table*, *Call us*, *Get directions*, *Download the PDF menu*, *Copy code SUMMER20*. CTAs exist today as exactly **two singletons** pinned to header and footer, so a visitor who scrolls past a section cannot act on it.

```ts
export type CtaAction = {
  id: string;
  order: number;
  label: string;              // max 40
  kind: "link" | "tel" | "mailto" | "whatsapp" | "copy" | "file";
  /** link/file: https URL. tel/mailto/whatsapp: the raw number or address -
   *  the scheme is built by us, never supplied by the author. copy: the text. */
  value: string;
  style: "solid" | "outline";
  icon?: "phone" | "mail" | "whatsapp" | "calendar" | "map" | "download" | "external";
};

export type CtaBlock = BaseContentBlock & {
  type: "cta";
  name?: string;
  heading?: string;           // optional one-line prompt above the buttons
  buttons: CtaAction[];       // 1–3
  align?: "left" | "center" | "stretch";
};
```

**Renderer.** Reuse the header CTA styling ([`view/CatalogueHeader.tsx:109-138`](components/catalogue/view/CatalogueHeader.tsx)) so the page has one button language; tokens `--catalogue-primary` / `--catalogue-button-text` / `var(--border-radius)`. Validate in `sanitizeContent`: `link`/`file` → https only; `tel`/`mailto`/`whatsapp` → scheme built from a digits/address-validated value; **never** `javascript:` or `data:`. `rel="noopener noreferrer"` on external links. `kind: "copy"` uses `navigator.clipboard` with a select-on-click fallback, an `aria-live` confirmation and a keyboard-accessible button - this is how a promo code folds in instead of becoming its own type. `kind: "file"` points at an uploaded PDF (menu, price list, lookbook, spec sheet) and shows filename + size; that needs `pdf` added to the new asset route in §6, which is the whole "document download" feature for one field instead of a block.

Existing `CTAButton` (`{isEnabled,label,url}`) **stays** for header/footer - those are chrome. Do not reuse it verbatim here; it has no `id` and no `kind`.

**Plan:** Starter. **Effort:** S. **Priority:** P1.

#### `business_info` - Hours & Location

**Purpose.** Structured trading hours plus address, phone, email and directions, in one card. Today the docs literally tell owners to hand-type hours into a text block ([`content/docs/build-and-edit.tsx:113`](content/docs/build-and-edit.tsx)), so there is no "Open now", no per-day layout and no structured data. **No researched competitor ships standalone opening hours** - Linktree buries them inside Contact Details - so this is the one block where we can be ahead of the field rather than catching up.

```ts
export type DayHours = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;                  // 0 = Monday
  isClosed: boolean;
  ranges: { open: string; close: string }[];       // "HH:mm", max 2 (split shifts)
};

export type BusinessInfoBlock = BaseContentBlock & {
  type: "business_info";
  name?: string;
  show: { hours: boolean; contact: boolean; address: boolean; socials: boolean };
  /** Default true: read catalogue.contact / legal.address so one phone number
   *  is maintained once. Set false per block for a second location. */
  useCatalogueContact?: boolean;
  contactOverride?: { phone?: string; email?: string; whatsapp?: string; address?: string };
  hours?: DayHours[];
  timezone?: string;          // IANA, required when hours are shown
  showOpenNow?: boolean;
  notes?: string;             // plain text: holidays, "kitchen closes 30 min earlier"
  mapMode?: "none" | "link" | "embed";  // default "link"
  mapQuery?: string;          // address or "lat,lng"; we build the URL
  layout?: "card" | "split";
};
```

**Renderer.** The hours table renders **statically** from stored strings - ISR-safe, no `Date` maths on the server. **"Open now" and today's-row highlighting are computed client-side after hydration only**, from `timezone` via `Intl.DateTimeFormat`, and render nothing on the server pass: `revalidate = 86400` means a server-computed open state would be cached for a day and be wrong. `mapMode: "link"` is the default and needs no iframe, no third-party host, no consent question and no CSP change - a *Get directions* button to a maps URL we construct. `mapMode: "embed"` is a themed click-to-load shim; the frame is only inserted after a tap, and `google.com` must be added to CSP `frame-src`. Reuse the social-platform detection already written at [`view/CatalogueFooter.tsx:59-84`](components/catalogue/view/CatalogueFooter.tsx). Emit `schema.org` `LocalBusiness` + `openingHoursSpecification` JSON-LD - free SEO and the reason a restaurant will care.

**Repeatable by design.** `useCatalogueContact` defaults to true (one source of truth) but is per-block, so a gym with two studios or a clinic with branches uses two blocks with overrides. Note the cost: `CatalogueContent` today receives only `{data, currency, type, theme, mode, onEditBlock, userData}` - **not** `contact` or `legal` - so this block needs catalogue-level data threaded into the block render path, plus an edit-mode empty state. That plumbing is why this is M and not S.

**Plan:** Basic+ (`features.blocks.businessInfo`). **Effort:** M. **Priority:** P1.

#### `social_links` - Social Links

**Purpose.** A row of social icons in the body. Standard in every researched builder; today socials live only in `catalogue.contact.socials` and render only in the footer, so a visitor who never scrolls to the bottom never sees them.

```ts
export type SocialLinksBlock = BaseContentBlock & {
  type: "social_links";
  name?: string;
  useCatalogueSocials?: boolean;          // default true
  links?: { id: string; order: number; url: string; label?: string }[];
  style?: "icon" | "icon_label";
  size?: "sm" | "md";
  align?: "left" | "center";
};
```

**Renderer.** Reuse the URL→platform helper at `CatalogueFooter.tsx:59-84` - do not write a second sniffer. Icons from the installed `react-icons` set only, never an author-supplied image. https only, `rel="noopener noreferrer"`, `aria-label` per link. When `useCatalogueSocials` is true and `contact.socials` is empty, render nothing in view mode and an "add your socials in Contact settings" hint in edit mode.

**This is the weakest block in the set** and it is included knowingly: it is a *placement* option over existing catalogue data, and the cheaper alternative is a `placement` field on Contact rather than a block type. It ships last, or not at all. **Plan:** Starter. **Effort:** S. **Priority:** P2.

### Summary

| Type | Group | Plan | Effort | Priority |
|---|---|---|---|---|
| `cta` | Contact & actions | Starter | S | P1 |
| `image` | Media | Starter | S | P1 |
| `faq` | Content | Basic+ | M | P1 |
| `gallery` | Media | Basic+ | M | P1 |
| `video` | Media | Basic+ | M | P1 |
| `business_info` | Contact & actions | Basic+ | M | P1 |
| `animation` | Media | Pro+ | L | P2 |
| `social_links` | Contact & actions | Starter | S | P2 |

Revised ladder - **nothing is taken away from anyone**: `divider` moves *down* to Starter, `embedding` stays Pro, `custom_code` stays Growth.

| Tier | Gains |
|---|---|
| Starter | `image`, `cta`, `social_links`, `divider`/spacer (was Basic) |
| Basic | + `faq`, `gallery`, `video`, `business_info` - the "complete small business" bundle, and the first real reason Basic exists |
| Pro | + `animation`, `embedding` (unchanged), tracking (GA4 + Pixel) |
| Growth | + `custom_code` (unchanged) |
| Premium | + `suppressQuicktalogAnalytics` |

---

## 5. Picker groups

Six groups. Convergent with the market (Webflow `Layout/Basic/Typography/CMS/Media/Forms/Components`, Wix Studio `…Text/Media/Decorative/Contact & Forms/Embed & Social…`, Notion `Basic/Database/Media/Embeds/Advanced`), with the first group domain-native because we are a catalogue tool, not a worse Wix.

| # | Group | Members | Why |
|---|---|---|---|
| 1 | **Catalogue** | `container`, `category` | The item-bearing core and the only blocks that consume the item budget. First because it is what most adds are, and putting the two side by side makes their relationship legible - the owner's explicit example. |
| 2 | **Content** | `text`, `faq` | Words. No items, no prices; the authoring surface is a text editor. Deliberately small: with a fixed `RichTextEditor` a text block covers headings, links, tables and quotes. |
| 3 | **Media** | `image`, `gallery`, `video`, `animation` | Anything whose payload is an asset URL. Where the Lottie ask lands - as one member of a media family, exactly how Wix Studio and Webflow file it, not as a bolted-on feature. Also an implementation family: same upload/URL input, same aspect/width controls. |
| 4 | **Contact & actions** | `business_info`, `cta`, `social_links` | "How do I reach you / where are you / what do I tap." The group specific to our audience, and where catalogue-level data is *re-used* rather than re-collected. `cta` is ordered **first** inside the group - for a walk-in customer the action is the point of the page. |
| 5 | **Layout** | `spacer`, `divider` | Two picker entries backed by **one** `divider` type (`border.isEnabled` false/true). Not a one-row group, and it puts whitespace where users actually hunt for it instead of leaving them to add an empty text block. |
| 6 | **Advanced** | `embedding`, `custom_code` | The two escape hatches, last and labelled as such. Every builder keeps exactly one or two (Shopify `custom-liquid`, Squarespace Code block, Softr Custom Code). Clustering them clusters the padlocks into a coherent upsell shelf, and gives one place to say: *these render third-party content in isolation - for analytics use Settings → Tracking.* |

### The data-structure change

Grouping is genuinely cheap: `OPTIONS` and `ContentOptionsSelector` are referenced from exactly one other place ([`modals/AddContentModal.tsx:15,251`](components/catalogue/modals/AddContentModal.tsx)), so no block type, renderer or saved row changes. But do it **off the registry**, not as a fifth hand-maintained list.

Note the `spacer`/`divider` split means a picker entry is **not** the same thing as a block type. The registry is therefore keyed by a *picker key* carrying `blockType` + `defaultData`; for every entry but those two they are equal.

```ts
// derived in ContentOptionsSelector from BLOCK_DEFINITIONS
type PickerGroup = {
  id: "catalogue" | "content" | "media" | "contact" | "layout" | "advanced";
  label: string;
  order: number;
  entries: {
    key: string;            // picker key: "spacer" | "divider" | "image" | …
    blockType: ContentBlock["type"];
    label: string;
    description: string;    // one line, shown under the label
    icon: React.ElementType;
    locked: boolean;        // isBlockLocked(key, plan) - ONE implementation
    requiredPlanName?: string; // cheapest tier in `tiers` granting requiresFeature
    countsTowardLimit: boolean;
  }[];
};
```

Each row renders label + description + lock state + **which plan unlocks it** + whether it counts toward the section limit. That last one matters and cannot be implied by the group - `Media` mixes counted and uncounted, as does every other group. Desktop renders group headings; mobile replaces the single 14-item horizontal scroller with group chips over a 2-column grid, because a 14-item scroll row is unusable on a phone. Add search once the list passes ~10 entries - which it does on day one.

Two prerequisites in the same pass: **pass `planFeatures`** (#9 - one line, and without it the grouped entitlement hints have nothing to read), and teach the upgrade path about features rather than counts - [`helpers/client.ts:367-397`](helpers/client.ts) only understands count-based `LimitType`s and returns `undefined` for a locked block type, so the only feedback today is a generic "Upgrade your plan to unlock this feature".

---

## 6. Changes to existing blocks and to the plumbing

### 6.1 The registry - yes, and it lands first

**Verdict: introduce it.** Adding one block type today touches ~26 edit sites across 15 files in 2 repos, including four hand-synced copies of the same string union and four copies of the same lock switch. Eight blocks on that design is a few hundred coordinated edits whose failure mode is silent (#3, #4, #5). The drift has already started (#1).

One pure-data table in `@quicktalog/common` (new `src/constants/blocks.ts`), **no React**:

```ts
export type BlockFeatureKey =
  | "divider" | "embedding" | "customCode"
  | "faq" | "gallery" | "video" | "animation" | "businessInfo";

export type BlockDefinition<T extends ContentBlock = ContentBlock> = {
  /** Picker key; equals `blockType` except for spacer/divider. */
  key: string;
  blockType: T["type"];
  label: string;
  description: string;
  iconKey: string;                       // resolved to a component app-side
  group: PickerGroup["id"];
  groupOrder: number;
  /** null = always available. */
  requiresFeature: BlockFeatureKey | null;
  countsTowardLimit: boolean;
  itemBearing: boolean;
  editing: "modal" | "inline";
  hideWhileSearching: boolean;
  defaultData: () => Omit<T, "id" | "order">;
  /** Feeds catalogue search and the SEARCH_MIN_ITEMS threshold. */
  searchText: (block: T) => string[];
  /** What the AI sees in the snapshot instead of a bare "[3] image". */
  describeForSnapshot: (block: T) => string;
  /** The server-side gate's shape check, and the agent tool's `data` schema. */
  schema: z.ZodType<Omit<T, "id" | "order">>;
};

export const BLOCK_DEFINITIONS: Record<string, BlockDefinition> = { /* … */ };
export type BlockType = ContentBlock["type"];   // replaces the dead ContentBlockType
```

App-side, components only:

```ts
export const BLOCK_COMPONENTS = {
  category: { Renderer: CategoryBlock, Input: ContentInput },
  // …
} satisfies Record<ContentBlock["type"], { Renderer: BlockRenderer; Input: BlockInput }>;
```

Everything then derives from it: `ContentOptionsSelector`'s options and groups; `AddContentModal`'s `ContentOption` / `DEFAULT_BLOCK_DATA` / `handleAdd` / `isFormValid` / `isLocked` / `checkLimits`; `BlockConfigForm` + `BlockConfigHeader`; `CatalogueContent`'s branch chain; `buildSection` + `SECTION_TYPE_LABELS` + `isSectionTypeLocked` + `countSections`; `types/ai.ts` `AiSectionType`; `agent/schemas.ts` `allowedSectionTypes`; and the new server gate. One `isBlockLocked(key, plan)` replaces four switches.

**One thing must not be collapsed.** `allowedSectionTypes` is not a lock predicate - it builds the **per-request zod enum** so a locked type is *absent from the tool schema* rather than merely refused ([`agent/schemas.ts:18-23`](agent/schemas.ts)). That is the one part of the current design that scales correctly. The registry feeds it; it does not become a boolean check.

**Cost, honestly:** the registry itself is the largest single item in P0, it lands in the same `@quicktalog/common` release as the new types, and it must be done while there are 6 renderers to convert, not 14.

### 6.2 Close the fail-open paths (P0, before any new type exists)

| Change | Where |
|---|---|
| Replace `buildSection`'s `default:` with an exhaustive `never` check driven by the registry, so a missing case is a **tsc error** instead of a silent divider | `helpers/catalogueOperations.ts:154` |
| Make `isSectionTypeLocked` and `SECTION_TYPE_LABELS` registry lookups so an unknown type fails **closed** and always has a label | `helpers/catalogueOperations.ts:47-61` |
| Fix `allowedSectionTypes` to fail closed (`access?.divider === true`, not `!== false`) and derive the list from the registry | `agent/schemas.ts:9-15` |
| **Delete** `ContentBlockType`, the dead `src` draft field, `showcase.json`, and the commented-out custom-code template library | #1, #15, #16 |
| **Delete both same-origin script sinks.** `EmbeddingBlock`'s 53-line revival effect and `CodePreview` are `document.createElement("script")` primitives that are unreachable *only by accident* - one sanitizer change or one uncommented setter from live XSS in the owner's authenticated builder session, on fields the AI writes while holding scraped and OCR'd text. They also actively mislead: reading `EmbeddingBlock` alone you would conclude an embed can run GTM. | #10, #11 |

### 6.3 Server-side content gate (P0)

New `sanitizeContent(content, tier, storedContent)` run inside the same `withUser` block that already calls `applyPlanToCatalogue`/`sanitizeAppearance`, **before** `pickEditable`, in create/update/publish ([`actions/catalogue.ts`](actions/catalogue.ts)):

1. drop blocks whose `type` is not in the registry;
2. drop blocks whose `requiresFeature` the tier does not grant;
3. coerce each surviving block to its registry `schema` - strip unknown keys, clamp numbers (`speed`, `maxWidth`, `columns`), **cap arrays** (`gallery.images` 24, `faq.entries` 30, `cta.buttons` 3, item `media` 5);
4. validate every author-supplied URL: https / `tel:` / `mailto:` only, never `javascript:` or `data:`; `animation.src` restricted to our asset host.

**Grandfathering must not trust the client.** Block ids are generated in the browser (`crypto.randomUUID()` in `AddContentModal` and `catalogueOperations`), so any diff keyed on id or count is forgeable - a Starter user can submit a fresh `custom_code` block claiming a pre-existing id. So compare against the **stored row we already own inside `withUser`**, not the client's claim: a tier-locked type survives only if that exact type is present in `storedContent`. On create there is no prior row, so type-gating is strict. This preserves `contentWithinPlan`'s deliberate growth-only semantics ([`lib/entitlements/plan.ts:82-84`](lib/entitlements/plan.ts)) - a post-downgrade catalogue stays saveable - without opening a hole.

Also translate Postgres `23514` into a human message; nothing does today, so a content-size overflow surfaces as a raw constraint error.

### 6.4 One section-count rule (P0)

Replace all four counting sites with one registry-driven count used identically on client and server: `AddContentModal.tsx:127-141`, `Catalogue.tsx:253-262`, `catalogueOperations.ts:80-82`, `lib/entitlements/plan.ts:94`.

**The rule: every block counts.** That matches the server and matches what customers bought. Then, in the same release and as a deliberate, announced product change, **raise Starter 5 → 8 and Basic 8 → 12**. The Basic bundle is four weight-1 blocks (`faq`, `gallery`, `video`, `business_info`); at 8 sections a customer would buy the upgrade and immediately have three slots left for actual menu categories.

Rejected alternative: a `weight: 0 | 1` field exempting decorative blocks. It reads generous but it is an **uncompensated, retroactive giveaway** of the one limit the tiers actually price - every paying customer at their cap instantly gains a free real section per decorative block they already have - it needs an invisible secondary cap (`sections × 3`) that appears on no pricing page and is undefined for an `"unlimited"` tier, and it silently redefines what "does not grow" means in the downgrade comparison. A priced limit increase is the honest version of the same generosity. Also add a test for `contentWithinPlan`, which has none.

### 6.5 Feature flags (P0, package release)

```ts
// ../quicktalog-packages/src/types/general.ts
features: {
  /** Absent key = unlocked. Replaces the closed required trio. */
  blocks?: Partial<Record<BlockFeatureKey, boolean>>;
  /** @deprecated read through a compat shim for one release */
  sections?: { divider: boolean; embedding: boolean; customCode: boolean };
  integrations?: { analytics: boolean };
  // …
}
```

The keys are **required** today, so every new flag breaks `PricingPlan` until all six tier literals are edited. `Partial` means a free block needs no tier edits at all. Keep `sections` as a deprecated alias for one release so nothing breaks mid-deploy - and note the two files no audit caught: `Subscription.tsx:44-48` and `subscription/BillingHistory.tsx:23-25` **hand-expand that trio** for the plan-comparison table and the billing feature list (#27). Changing the shape without touching them silently blanks both.

### 6.6 `BaseContentBlock` + one `BlockShell` (P1)

```ts
export type BlockPresentation = {
  isHidden?: boolean;
  /** Stable, author-editable; replaces `${block.id}-${block.order}`. */
  anchor?: string;
  width?: "narrow" | "content" | "wide" | "full";
  background?: "none" | "section" | "card";
  paddingY?: "none" | "sm" | "md" | "lg";
  hideOn?: ("mobile" | "desktop")[];
};

export type BaseContentBlock = {
  id: string;
  order: number;
  /** Hoisted from the five blocks that already have it, so a section nav has something to read. */
  name?: string;
  presentation?: BlockPresentation;
};
```

`BlockShell` owns the `<section>`, the stable anchor id, the `aria-label` from `name`, the background/padding, the hidden state and the full-bleed escape - so six renderers do not each grow six branches. `background: "section"` finally uses `--catalogue-section-background`, which every theme defines and no component references.

Two things to get right: **`width: "full"` needs both wrappers changed** - `max-w-6xl mx-auto px-4` at [`view/CatalogueContent.tsx:216`](components/catalogue/view/CatalogueContent.tsx) is nested inside `max-w-7xl mx-auto lg:px-8` at `Catalogue.tsx:239-241`, so escaping only the inner one yields 1280px, not the viewport. And this must land **before or with** the Image block, because `width: "full"` is the banner case. Deliberately **no** per-block colours: a fixed token set keeps owner JSON away from the document and the `SAFE_VAR_NAME`/`SAFE_VAR_VALUE` allowlist in [`helpers/theme.ts:212-232`](helpers/theme.ts) untouched. (Narrower than it sounds - the text/embed profiles already allow a raw `style` attribute - but it is still the boundary that matters for CSS variables.)

### 6.7 What each existing block becomes

| Block | Becomes |
|---|---|
| `category` | Unchanged type key, clearer label - **"Category (collapsible)"** - and picker copy that says plainly *visible heading, can collapse*. Gains an optional `description?` line under the heading. Extract `<CollapsibleSection>` shared with `faq`, and fix the dangling `aria-controls`. |
| `container` | Relabel to **"Item Grid"**, copy says *no heading, always open*. `name` stays an internal label. **Do not merge with `category`** - the two renderers differ by ~20 lines and share `Items`, but changing the discriminant rewrites every saved catalogue and every Redis draft for a cosmetic win, against backward-readability. Instead converge them onto one `<ItemsSection>` driven by registry flags (`showHeader`, `collapsible`) while keeping both keys. Export **one** `isItemBlock` from the package, replacing the five inline `type === "category" \|\| type === "container"` checks in `CatalogueContext` plus the two server copies. |
| `text` | Type unchanged. The editor is the change: add **link** insert/edit, a **heading-level** picker (h2/h3/paragraph), **table** insert, and colour limited to palette tokens; change paste to run `text/html` through `sanitizeCatalogueHtml(html, "text")` instead of flattening to `innerText`. The profile already allows `a`, `img`, `table`, `blockquote`, `h1`-`h6` - the data layer and the security model already permit all of it, only the toolbar cannot author it. **Cheapest capability gain in this plan: no new type, no release, no security change**, and it removes the case for a Table block, a Quote block and a Heading block. **Deliberately not added: insert-image** - that is the Image block's job, so there is exactly one way to place a picture. |
| `divider` | **Ungate to Starter** and split into two picker entries, **Spacer** (`border.isEnabled: false`) and **Divider**, from one type. In view mode wrap in a `<section aria-hidden="true">` via `BlockShell` instead of returning a bare `<div>`, and either render `name` or drop the field - the `BlockNameInput` accessibility rationale does not hold for a block whose name is discarded. Charging for whitespace is the weakest thing in the pricing table. |
| `embedding` | Relabel **"Embed"** and re-scope as the escape hatch for services we have no typed block for. **Primary input becomes a URL**: paste a Maps/Calendly/Cal.com/Typeform/Spotify link, we resolve provider + embed URL + aspect server-side and build the iframe. Extend to `{ provider, url, aspect, minHeight }` with the legacy `code` string still readable behind an "advanced: paste embed code" toggle. Delete the 6-category regex src-sniffing and the `MutationObserver` that re-applies inline styles; delete the five fake presets in `EmbeddingInput.tsx:19-55` that are placeholder text and are **never stored**. Show a clear *"this provider is not supported yet"* naming the host instead of silently deleting the iframe. Add the hosts owners ask for (Google Forms, Typeform, Cal.com, OpenTable, Loom, Wistia) through §6.8. Loses most of its traffic to `video` and `business_info`, which is the point. |
| `custom_code` | **Keep one block and one sandbox, unchanged.** Relabel **"HTML Widget (sandboxed)"** with honest in-form copy: *runs in an isolated frame - no cookies, no storage, no access to this page or its URL. Installing GA4 or a Meta Pixel? Use Settings → Tracking.* Add a **live preview rendered through the same `buildWidgetDocument` sandbox** production uses, so nobody writes blind (and never an unsandboxed preview - that is sink #11). Re-enable a small curated template library, hardcoded strings only, through that same path. Add explicit `height: "auto" \| number` alongside the postMessage reporter and surface the 5000px cap instead of silently clipping. **Do not split into several code blocks** - every one would inherit the same sandbox and the same limits, multiplying the UI without changing a single constraint. |

### 6.8 One source of truth for third-party hosts (P0, independent of blocks)

Export one list from the package where each entry declares `{ host, purpose, directives: ("frame"|"script"|"connect"|"img")[] }`, and generate **both** `EMBED_HOSTS` and the CSP directives from it, with a drift test. Then reconcile and plan the move off Report-Only.

This is the most likely near-term production incident in this area and it has nothing to do with new blocks: the sanitizer allows 37 iframe hosts, `frame-src` allows 3, and enforcing the header as written kills every published YouTube, Maps, Calendly and Stripe embed. Every block below adds hosts (`youtube-nocookie`, `player.vimeo.com`, the real UploadThing host for Lottie, `connect.facebook.net` for Pixel), which multiplies the drift. Fix it **before** adding hosts.

Two precisions while in here: `youtube-nocookie.com`, `vimeo.com`, `google.com` and `maps.google.com` are **already** in `EMBED_HOSTS`, so "add them" is a no-op - and for typed blocks that build their own iframe, `EMBED_HOSTS` is not the relevant control at all, only `frame-src` is. And `connect-src` names `*.uploadthing.com` while files are served from `file.ufsUrl` (`utfs.io` / `*.ufs.sh`), so the Lottie fetch is already a report-only violation (#29).

### 6.9 AI agent (P1, in lockstep)

Derive `AiSectionType` and `allowedSectionTypes` from the registry. Replace `addSection`/`updateSection`'s fixed `name/layout/content/code/items/position` fields with a per-type **`data` object validated by the registry schema**, so a block with structured config (gallery images, a Lottie url+loop, a CTA's buttons) can be both created *and edited* by chat - today `update_section` patches only `name`/`layout`/`isExpanded`/`content`/`code` ([`helpers/catalogueOperations.ts:250-266`](helpers/catalogueOperations.ts)), so every new block would be add-and-delete-only. Generate the instructions' type roster from registry labels instead of hand-written prose. Give each definition `describeForSnapshot` so `agent/session.ts:345-367` stops printing a bare `[n] <type> - <name>`. **Forbid the agent from writing `integrations`** - structurally, by keeping the field out of every tool schema.

Useful canary: [`tests/unit/agent/instructions.test.ts:51-53`](tests/unit/agent/instructions.test.ts) asserts the locked-types sentence verbatim and **will** fail on any new gated block. Keep that assertion and update it deliberately.

### 6.10 Search (P1)

Drive it from the registry: `searchText(block)` contributes FAQ questions/answers, gallery captions, text content, heading text, `business_info` fields and item `tags` to the haystack; `hideWhileSearching` hides decorative blocks (`divider`, `image`, `gallery`, `animation`, `social_links`, `embedding`, `custom_code`) while a query is active. Count searchable units, not just items, toward `SEARCH_MIN_ITEMS`, or a 40-question FAQ never gets a search bar. `getDisplayItems` stops being typed to `CategoryBlock | ContainerBlock` only.

### 6.11 Uploads (P1)

Add a second UploadThing route beside the image-only one ([`app/api/items/uploadthing/core.ts:11-19`](app/api/items/uploadthing/core.ts) - `image`, 4MB, `maxFileCount: 1`, one shared `"upload"` rate-limit bucket):

```ts
assetUploader: f({
  "application/json": { maxFileSize: "2MB", maxFileCount: 1 }, // .json / .lottie
  pdf: { maxFileSize: "8MB", maxFileCount: 1 },                // cta kind: "file"
})
```

Its own rate-limit bucket, same `getVerifiedIdentity` middleware. **Verify the backend cleanup worker's UploadThing URL regex matches the new route's URLs before shipping** ([`../quicktalog-backend/src/utils/uploadthing.ts:19-27`](../quicktalog-backend/src/utils/uploadthing.ts)) - it stringifies the whole `content` column, so a URL in a block should be protected, but a miss deletes customers' animations on a daily cron with only a 20% `MAX_DELETE_RATIO` between them and a bad day. And the rule for every new block: **asset URLs go in `content`, never a new column**, or the cron orphan-deletes them.

### 6.12 Builder ergonomics (P2)

- **Insert at position.** `CatalogueContext.tsx:93-104` already accepts `addBlock(block, index)` and **nothing calls it** - `AddContentModal.tsx:210-212` bypasses it and always appends. Thread an `insertAtIndex` prop and add a between-blocks hover target.
- **Duplicate.** Clone, fresh `crypto.randomUUID()`, splice after index. All primitives exist; `BlockControls` offers only edit/layout/up/down/delete.
- **Drag and drop.** Reordering is single-step chevron swaps, so moving a block from position 12 to 1 is 11 clicks. No drag library is installed; `dnd-kit` over `content` fits because ordering is already normalised. This becomes the dominant pain point once pages are long.
- **Discriminated draft.** Replace the single flat `blockData` bag (the union of every block's fields) with a per-type draft from `defaultData`, and render `def.Input` from `BLOCK_COMPONENTS` instead of `BlockConfigForm`'s six `&&` conditionals with silent fallthrough - today a type with no branch shows an empty form and an enabled Add button.

### 6.13 Cross-cutting quality gaps nobody had scoped (P1/P2)

These are not blocks, but every block makes them worse, and two of them are correctness bugs:

- **Print / QR output (P1).** There is **not one** `@media print` rule or `print:` utility in the repo (#22). A QR code on a table is the core use, and owners print the menu as a paper backup. Printing today emits chrome, the search bar and - worse - collapsed `Category` sections, so pages come out partly blank. Every collapsible block we add makes it worse. Needed: hide chrome and edit affordances, **force-expand collapsibles**, `break-inside: avoid` on cards, render the catalogue URL.
- **i18n (P1).** `<html lang="en">` for every catalogue (#20), and prices formatted `toLocaleString("en-US")` (#19) so a EUR catalogue in Serbia renders `1,234.56`. `business_info` adds day-of-week rendering, the most locale-sensitive thing in the set. Derive both from `catalogue.language`, which is stored and currently feeds only the agent and OCR.
- **Item card keyboard operability (P1).** `<article role="article" tabIndex={0} onClick>` with no key handler (#21): focusable, announced as non-interactive, unopenable by keyboard. Adding a per-item CTA *inside* that clickable focusable article creates nested interactive content - **fix the role/handler before shipping per-item actions**, or the new button is the only reachable part of the card. Also derive `slugId` from `record.id`, not `record.name`, so duplicate names stop emitting duplicate DOM ids.
- **Alt text (P1).** The only alt on the public page is generated: `` alt={`Image of ${record.name}`} ``. Add `alt` to `Item`, make it authorable, and give the new `media[]` entries their own.
- **`images.unoptimized` (P1 decision, not code).** It is `true` in production and `remotePatterns` is `"**"` over http and https (#24). Every media block's `sizes`/WebP/crop is therefore inert, so a 24-image gallery ships 24 originals to a phone on 4G - the exact browsing context. Decide this **before** the media blocks: either enable optimisation with a real `remotePatterns` allowlist, or accept it and make upload-time downscaling the only lever (and say so in the block copy). The wildcard pattern also contradicts the allowlist discipline this plan demands everywhere else.
- **`prefers-reduced-motion` (P2).** Honoured in exactly one unrelated marketing component (#23), while framer-motion section animations, Swiper and the emoji Overlay run unconditionally. One shared hook at the catalogue root is cheaper than per-block guards and fixes the existing offenders.
- **Structured data (P2).** `application/ld+json` appears on ten marketing routes and **zero** catalogue routes. `business_info` gives `LocalBusiness`/`openingHours`, but the payload that earns a rich result for a menu is `Menu`/`ItemList`/`Offer` over the items, plus `BreadcrumbList`. Separately, the only share image is `metadata.icon`, so every shared catalogue link looks identical regardless of the gallery the owner just added.
- **Docs and skill (P0).** Rewrite [`.claude/skills/adding-new-content-block/SKILL.md`](.claude/skills/adding-new-content-block/SKILL.md) against the registry - afterwards it is genuinely *add the union member + one registry entry + a Renderer/Input pair + a test* - and record the full pre-registry list in the meantime. Rewrite [`docs/architecture/ai-chat-flow.md`](docs/architecture/ai-chat-flow.md) (#25). Anyone following either today ships a block the AI silently turns into a divider and no plan can gate.
- **Templates (P2).** Annotate `constants/catalogueTemplates.ts` as `ContentBlock[]` - it is the only place block shapes are hand-written with no type checking - and add 2–3 templates showcasing the new blocks (restaurant with hours + gallery + FAQ, salon with services + buttons). Today they use only `category` and one `container`, so most owners never discover anything else exists.
- Fix the duplicated `Overlay` render (#13) while in that file.

---

## 7. Media everywhere

The ask is not only new sections - it is richer *elements*. Today an `Item` holds exactly **one** image string (force-replaced with `DEFAULT_IMAGE` when empty), its name is a `truncate`d single-line text node, and every card opens the same read-only modal, so "Order this on WhatsApp" is impossible anywhere in the product. And `CardsSwitcher` renders a red **"Invalid item data"** box for any item where `price === undefined` ([`cards/index.tsx:46`](components/catalogue/cards/index.tsx)), which is what makes every non-priced item concept - a service at "from €30", a team member, a stat - literally unenterable.

```ts
export type ItemMedia = {
  id: string;
  order: number;
  kind: "image" | "animation";        // NOT video - see below
  src: string;
  alt?: string;
};

export type ItemBadge = {
  id: string;
  label: string;                       // "new", "vegan", "spicy", "bestseller"
  tone: "neutral" | "positive" | "warning" | "diet";
};

export type Item = {
  id: string;
  order: number;
  name: string;
  description: string;
  /** Kept as the cover + back-compat mirror of media[0]; the cleanup worker
   *  and every existing renderer keep working untouched. */
  image: string;
  alt?: string;
  media?: ItemMedia[];                 // cap 5
  badges?: ItemBadge[];                // cap 3
  tags?: string[];                     // search only
  /** One per-item action: "Order", "Book", "Ask about this". */
  action?: CtaAction;
  /** Free-form spec rows: duration, size, m², occupancy, EPC, materials. */
  attributes?: { label: string; value: string }[];   // cap 6
  isAvailable?: boolean;
  price?: number;                      // NOW OPTIONAL - breaking, see below
  priceMode?: "fixed" | "from" | "on_request" | "hidden";
  isFree?: boolean;
  discount?: ItemDiscount;
  denominator?: string;
};
```

**Render changes.** Loosen the `CardsSwitcher` guard to require only `name`; render price per `priceMode` and omit it entirely for `hidden`/`on_request` instead of showing an error box. Stop forcing `DEFAULT_IMAGE` when `image` is empty (`cards/index.tsx:76`) - render a text-forward layout so "no image" becomes a per-item state, not a per-block layout choice. Render badges in the discount-ribbon slot's positioning, and the action as a button that **stops propagation** so it does not open the detail modal (after the keyboard fix in §6.13). Extend `ItemDetailModal` to show `media[]` as a small gallery plus badges, attributes and the action. Add two card layout variants rather than new block types: **list-with-right-hand-CTA** and **masonry**. A layout variant is dramatically cheaper than a block type and reuses the item editor, the search index and the plan counting for free - Softr's named List layouts are the proof this scales better than multiplying types.

**`price?: number` is a breaking package change, not an additive one.** Named call sites beyond the card path: [`modals/ItemDetailModal.tsx:83`](components/catalogue/modals/ItemDetailModal.tsx) (`item.price.toLocaleString`, unguarded), [`modals/ItemModal.tsx:81`](components/catalogue/modals/ItemModal.tsx) (`item.price >= 0`), and [`agent/schemas.ts:44`](agent/schemas.ts) (`z.coerce`, required). Small work, but it is a tsc-breaking release - plan it as one.

**Deliberately excluded from item media:**

- **Video per item.** A dozen players on one scroll destroys mobile performance for exactly the audience browsing on 4G in a restaurant. Video stays section-level.
- **Variants / stock / SKU / structured allergens.** Four schemas, four editors, four renderers, and every market has different allergen rules. `badges` + `tags` + `attributes` cover the visible 90%, and `faq` covers the legal detail.
- **Per-item custom HTML or embeds.** An item renders in a grid, a carousel and a modal with three sets of line clamps; author markup across all three is a rendering and sanitizing problem with no upside over a sanitized `description`.

**Two companions this creates and must not ship without:**

1. **A badge legend.** A three-character chip means nothing to a visitor who does not know the vocabulary, and for an EU restaurant allergen information has to be findable and unambiguous. Cheapest version: an optional `showBadgeLegend` on item blocks that renders the distinct badges actually used in that block. Decide before badges ship.
2. **Item media is exactly where `sanitizeContent`'s array caps earn their keep** - the 1MB `content` CHECK is not a payload guard (§4, `animation`).

Elsewhere, media reaches other blocks through the blocks themselves rather than a second mechanism: `image`/`gallery`/`video`/`animation` as sections, `presentation.width: "full"` for a banner or hero, and `ItemMedia.kind: "animation"` for a small per-item flourish. That is the composition that lets this plan propose 6 new types instead of 15.

---

## 8. Rejected

**Rejected as the wrong shape**

- **Tracking as a content block.** Both rendering paths are architecturally incapable (§3); a block would additionally inherit the agent write path, the ordering UI and the section limit, to render something with no visual presence.
- **Google Tag Manager as a supported field.** A container id dereferences to remotely-editable customer JavaScript running first-party on the origin shared with the signed-in builder, and `script-src` already carries `'unsafe-inline'` + `*.googletagmanager.com`, so "behind an enforced CSP" is not a control. This is the free-text head-snippet field wearing a regex. GA4 + Meta Pixel are defensible because **we** emit those tags from a validated id.
- **A free-text head-snippet / code-injection setting.** Squarespace ships it; we should not.
- **`<script>` in any sanitizer profile, or `allow-same-origin` on the custom-code sandbox.** Not tradeoffs to price - lines.
- **Splitting `custom_code` into several purpose-specific code blocks.** Same sandbox, same limits, three ways to disappoint.
- **A tracking id inside `metadata`.** Zero-migration and *not* AI-writable (the agent schema is a closed `z.object`), but `metadata` is in `CATALOGUE_EDITABLE_FIELDS` and forwarded verbatim from a client draft with no validation.

**Rejected because a cheaper change already delivers it**

- **`heading` block.** The `text` profile already allows `h1`-`h6`, and the `RichTextEditor` heading-level picker in §6.7 delivers it. A whole block type to work around a missing dropdown, in a plan that rejects other blocks for being a fourth way to render a sentence. The nav-anchor argument is separately answered by hoisting `name?` onto `BaseContentBlock`.
- **Table block, and a chart block.** The sanitizer already allows full `table` markup; the gap is one toolbar button. Charts on a printed QR menu is a solution looking for a problem - Softr ships them because it sits on a database.
- **Quote / testimonial block.** Killed by this plan's own rule for team and stats blocks: quote→description, author→name, avatar→image, rating→badge, and `ContainerBlock` already renders a stack *and* a carousel. A text block's `blockquote` covers the single-quote case. If customers ask by name, the cheap version is a card layout variant.
- **Team-members and stats/metrics blocks.** Both become item lists the moment `price` is optional and `badges` exist.
- **Standalone `logo_wall`.** `gallery` plus one `href` - shipped as `layout: "logos"` instead of a type gated above the gallery it duplicates.
- **Standalone `promo_code`.** One string and a copy button - folded into `cta` as `kind: "copy"`.
- **Standalone document/download block.** Folded into `cta` as `kind: "file"`; the real gap was the upload route, not a block.
- **Dedicated Map block.** A real map is a third-party iframe (consent, `frame-src`, cookies) or a tile provider (API key, cost). `mapMode: "link"` gives the only thing visitors use - a *Get directions* button that opens their own maps app - with zero third-party surface. `mapMode: "embed"` covers the rest.
- **Search block.** Search already exists and switches itself on above the item threshold in view mode. A block for it would let an owner create zero or two.
- **Audio / music block.** Spotify, SoundCloud and Apple Music are iframe embeds on already-allowlisted hosts; the URL-first Embed change covers them with no new surface.
- **Hero block.** `catalogue.heading` owns the one h1; `image` at `width: "full"` + a text block + `cta` composes a hero from three primitives that all have other uses, and avoids a fourth place that owns the first impression.
- **Pricing/comparison table block.** A card layout variant on `category`/`container`, not a second divergent way to render priced things.
- **Before/after comparison.** A `gallery` layout variant candidate, recorded here so it does not come back as a block request.

**Rejected because the machinery isn't there yet**

- **`columns` / nested layout.** The largest single item anyone proposed, and it breaks the flat `content` array, the flat renderer chain, the flat section count, single-step reordering and the line-per-block AI snapshot **simultaneously**. Its own weight rule (sum of children) also contradicts a single registry counting field. `presentation.width` plus card layout variants buy most of the visual result. Revisit only after drag-and-drop ships and owners actually ask for side-by-side sections.
- **Tabs.** Same recursion cost for a narrower payoff, and tabs hide content from Ctrl-F and from in-catalogue search on a page whose job is finding a dish.
- **Form / lead-capture block.** The most-requested thing declined here. It needs a route handler, Turnstile, Resend, a `notifyEmail` verification story that does not exist, storage with RLS and a GDPR retention decision - on a page that is ISR and must never read identity. It is a feature with its own plan, not a block in this roadmap. Interim: `cta` to the owner's existing form, or an allowlisted embed (Linktree ships Typeform as a block for exactly this reason).
- **Newsletter as a repeatable block.** The insert is gated in SQL by `(c.footer -> 'newsletter') = 'true'::jsonb` plus `status='active'` inside a security-definer function ([`supabase/migrations/20260921181105_private_entry_points.sql:46-53`](supabase/migrations/20260921181105_private_entry_points.sql)), so a block version **silently no-ops every signup** until that predicate changes. Migration-first project or nothing.
- **Countdown, and start/end dates on blocks.** Both fight `revalidate = 86400` head-on: a block that hides itself by date either comes back or needs per-visitor server rendering. `presentation.isHidden` covers "turn it off"; a `cta` with a dated label covers the campaign.
- **Social feed blocks (Instagram grid, X grid, RSS).** OAuth tokens that expire, rate limits, request-time data on an ISR page, and content we cannot theme or sanitize. They rot, and a Meta API change becomes our outage on every customer catalogue.
- **Bespoke per-vendor reservation blocks (OpenTable, Tock, Calendly).** One host on the Embed allowlist each. Bespoke blocks per vendor is how a picker reaches 40 entries and how we inherit vendors' API changes as our bugs.
- **QR-code block.** A QR code on the page you are already looking at is useless; the printable catalogue QR lives elsewhere in the product.
- **Per-block colour / font overrides.** The `SAFE_VAR_NAME`/`SAFE_VAR_VALUE` allowlist is the boundary that stops owner JSON reaching the document, and unlimited per-section colour is how a page ends up looking worse than the template.
- ~~**Merging `category` and `container` into one type.**~~ **Reversed and shipped 2026-09-26.** The objection was the cost of rewriting every saved catalogue and Redis draft; that was answered by a read-time normalizer plus one jsonb migration whose transform was verified against seven edge cases before it was written. The merged `items` block carries `showHeading` and `isExpanded`, so a category is one with a heading and a container is one without. See the banner at the top of this file.
- **`weight: 0 | 1` section exemptions.** See §6.4 - an uncompensated retroactive giveaway with an invisible secondary cap.

**Deferred, and the strongest candidate for the next round**

- **Schedule / programme / timetable.** A dated or day-slotted agenda: gym class schedule, clinic consulting hours per practitioner, event lineup, conference sessions, a tradesperson's availability. Genuinely a different shape from recurring weekly hours (entries carry time + title + person + room, sometimes capacity or a booking link), so `business_info` does not cover it, and gyms and event organisers are named target customers who get nothing from this round. Not in scope now because it wants per-entry actions and a real date model. Revisit right after `business_info` ships and we see whether owners ask.
- **Per-item price variants** (`priceOptions?: { label, price }[]` - a coffee at S/M/L, a ring in three sizes). The canonical menu case, and `priceMode: "from"` only papers over it. Deferred because it collides with `discount`, `denominator` and the price render path across four card variants plus the modal. See Open Questions.

---

## 9. Roadmap

Effort is calendar-agnostic; **S ≈ a sitting, M ≈ a few, L ≈ a week+**. "Release" = a `@quicktalog/common` publish. Each phase ships something usable on its own.

### P0 - Foundation (nothing here is optional, and none of it is a block)

| # | Phase | Contents | Effort | Needs |
|---|---|---|---|---|
| 0a | **Stop the bleeding** | Delete both same-origin script sinks (#10, #11), the dead `ContentBlockType`, `src`, `showcase.json`, the commented template library. Exhaustive `never` in `buildSection`; fail-closed `isSectionTypeLocked` and `allowedSectionTypes`; registry-backed `SECTION_TYPE_LABELS`. Pass `planFeatures` (#9). Fix `aria-controls` (#12) and the duplicate `Overlay` (#13). | M | - |
| 0b | **Host source of truth + CSP** | One host list generating `EMBED_HOSTS` + CSP, drift test, real UploadThing host, `connect.facebook.net`. Then plan enforcement. **Independent of every block and the likeliest production incident in this area.** | M | **release** |
| 0c | **Registry** | `BLOCK_DEFINITIONS` + `BLOCK_COMPONENTS satisfies`; convert `ContentOptionsSelector`, `AddContentModal`, `BlockConfigForm`/`Header`, `CatalogueContent`, `catalogueOperations`, `types/ai.ts`, `agent/schemas.ts` to read it. `features.blocks` as `Partial<Record<…>>` + compat alias + the two dashboard files (#27). | **L** | **release** |
| 0d | **Server gate + one count** | `sanitizeContent(content, tier, storedContent)` in create/update/publish; one registry-driven section count across all four sites; Starter 5→8, Basic 8→12; `contentWithinPlan` test; translate `23514`. | M | **release** |
| 0e | **Docs** | Rewrite the `adding-new-content-block` skill against the registry; rewrite `ai-chat-flow.md`. | S | - |

After P0: no new blocks, but the picker shows real padlocks, the limits agree, the plan is enforced server-side, and adding a block is one registry entry plus two components.

### P1 - The blocks people ask for

| # | Phase | Contents | Effort | Needs |
|---|---|---|---|---|
| 1a | **Grouped picker + `BlockShell`** | Six groups from the registry; per-row description, lock, required plan, counts-toward-limit; mobile group chips; search. `BaseContentBlock.presentation` + `BlockShell` (stable anchors, hidden, background, padding, **full-bleed through both wrappers**). Ungate `divider` to Starter and split Spacer/Divider. | M | **release** |
| 1b | **Text editor** | Link, heading-level, table, sanitized paste. **Zero new types, zero release, zero security change** - the cheapest capability gain in the plan, and it retires the Heading, Table and Quote requests. | S | - |
| 1c | **Free-tier blocks** | `image`, `cta`. Depends on 1a for `width: "full"`. | M | **release** |
| 1d | **Item enrichment + card rework** | `price?`, `priceMode`, `media[]`, `badges`, `attributes`, `action`, `alt`, `tags`; loosen the `CardsSwitcher` guard; drop forced `DEFAULT_IMAGE`; extend `ItemDetailModal`; two new card variants. **Fix keyboard operability and `slugId` first** (#21), plus the locale bug (#19) in the same files. Decide the badge legend. | **L** | **release** (breaking) |
| 1e | **Basic bundle** | `faq`, `gallery`, `video`, `business_info`. `faq` extracts `<CollapsibleSection>`; `business_info` threads catalogue contact into the block render path. Embed becomes URL-first in the same pass. | **L** | **release** |
| 1f | **Quality** | Print stylesheet (force-expand collapsibles), `lang` + locale from `catalogue.language`, the `images.unoptimized` decision, alt text, registry-driven search + `hideWhileSearching`. | M | - |

### P2 - Tracking, polish, delight

| # | Phase | Contents | Effort | Needs |
|---|---|---|---|---|
| 2a | **Catalogue consent banner** | A new identity-free banner for `/catalogues/` with real Consent Mode v2 defaults set before any tag. Move our own GTM/Clarity off customer catalogues (route groups or pathname-aware components) while keeping the PostHog `$pageview` the meter depends on. **Ships before 2b; if only one can ship, ship neither.** | M | - |
| 2b | **Tracking (GA4 + Meta Pixel)** | `integrations` column; `PUBLIC_CATALOGUE_COLUMNS` yes / `CATALOGUE_EDITABLE_FIELDS` no; `updateCatalogueIntegrations` + regexes + `revalidateCatalogue`; `<Script>` from the **published page**; `features.integrations.analytics` Pro+; Settings → Tracking panel; docs on why GA4 ≠ the dashboard. | M | **migration + release** |
| 2c | **Asset route + `animation`** | `assetUploader` (json/lottie + pdf), verify the cleanup worker regex, `cta kind: "file"`. Then the Lottie block with a **pinned expression-free player, self-hosted wasm, first-party `src` only**. | **L** | **release** |
| 2d | **Builder ergonomics** | Insert-at-position, duplicate, `dnd-kit` reordering, discriminated per-type draft. | M | - |
| 2e | **Long tail** | `social_links`; reduced-motion hook; `Menu`/`ItemList` JSON-LD + a share image; typed templates showcasing the new blocks. | M | **release** |

**Migrations:** exactly one, in 2b (`integrations`). Everything else lives in `content` jsonb and needs none. **Releases:** 0b, 0c, 0d should be batched where possible; 1d is the breaking one; all new block types belong in a **single** release with the registry.

---

## 10. Open questions

1. **GA4 + Pixel only - agreed?** This plan refuses GTM on evidence (§3.3). It is also the single most-asked-for integration by anyone running ads, and refusing it means "we support GA4 and Meta, ask us for others". Accept that, or fund the harder version: a nonce-based enforced CSP, a render surface that provably excludes `/preview`, a Terms clause, and Premium-only with human review.
2. **Per-item price variants (S/M/L).** Deferred in §8, but it is the canonical menu case and `priceMode: "from"` only papers over it. Worth pulling into 1d despite the collision with `discount`/`denominator` and the four card variants?
3. **`images.unoptimized`.** Turn optimisation on with a real `remotePatterns` allowlist, or keep it off and accept upload-time downscaling as the only lever? This gates how good `gallery` can be, and a 24-image gallery is the worst case for the 4G-in-a-restaurant visitor.
4. **The limit raise.** Starter 5→8 and Basic 8→12 is the honest price of one section-count rule. Comfortable announcing that, or should the Basic bundle be smaller instead?
5. **Section navigation.** With `name` on `BaseContentBlock` and stable anchors, a TOC becomes possible for the first time. `CatalogueSidebar` is a mobile contact/CTA sheet, not a nav, so this is a new component. Worth a P2 slot, or leave long catalogues to search?
6. **The `<img>` beacon.** A bare `<img>` to any https host survives the embed sanitizer, so a Meta `noscript` pixel and a GA4 `/g/collect` GET already fire today, unconsented - and it is equally an exfiltration channel for whatever the AI put in a URL. Restrict `img` hosts in the `embed` profile, or record it as knowingly accepted?
7. **`social_links`.** Included but flagged as the weakest block here. Ship it, or make it a `placement` field on Contact instead?
8. **Schedule / programme block.** The clearest true gap left (§8) and it hits named target customers. Next round, or pull into P2?
9. **`suppressQuicktalogAnalytics` at Premium.** Once our own Clarity/GTM are off customer catalogues by default (2a), is there anything left for this flag to sell?
10. **`custom_code` height cap.** Raise the 5000px limit, or keep it and just surface it in the UI when hit?
