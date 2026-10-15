Status: in progress

# Splitting Custom Code: custom visual block + analytics setting

Implements the owner's ask of 2026-10-08: "custom code is unsafe as one feature,
split it". Two deliverables, one shipped as a block rename and one as a
catalogue setting.

Supersedes the tracking half of
[2026-09-25-content-blocks-expansion](../2026-09-25-content-blocks-expansion/PLAN.md)
and implements a deliberately smaller variant of
[2026-10-01-catalogue-google-tag](../2026-10-01-catalogue-google-tag/designs/synthesis.md).
Agrees with [2026-09-30-content-block-strategy](../2026-09-30-content-block-strategy/PLAN.md)
that tracking is a setting, not a block.

## What shipped

### 1. `custom_code` → `custom_visual`

A pure rename, key included. The sandboxed renderer and the `code` field are
unchanged: `sandbox="allow-scripts"` without `allow-same-origin` already means
the fragment can animate but can reach no cookie, storage or parent DOM, which
is exactly the trust model the block should have had all along.

- `CustomVisualBlock` in `@quicktalog/common`; `CustomCodeBlock` kept
  `@deprecated` in the union so stored rows typecheck.
- `normalizeBlock` maps `custom_code` → `custom_visual` on read. **This mapping
  is permanent** - an unopened catalogue may carry the old key for years.
- Plan flag `sections.customCode` → `sections.customVisual`, and the gate moved
  to Pro and above (was Growth and above).

### 2. Analytics as a General-tab setting

Not a content block. It renders nothing, costs no section slot, and must not be
reachable by the AI agent.

- Stored as `metadata.googleAnalyticsId` and `metadata.metaPixelId`. **No
  migration**: `metadata` is already `jsonb`, already inside the
  `catalogues_other_json_size` check, and already in both
  `PUBLIC_CATALOGUE_COLUMNS` and `CATALOGUE_EDITABLE_FIELDS`.
- UI: an "Analytics & tracking" `PanelSection` in the General tab, using the
  same `handleChange("metadata.…")` pattern as "Search and sharing", wrapped in
  `LockedGroup`. Saves on publish like every other builder field.
- Plan flag: new `features.integrations.tracking`, true on Growth, Premium and
  the German Silva custom plan.
- Server gate: `applyPlanToCatalogue` strips both ids when the plan lacks the
  flag, because the client sends the whole `metadata` object back on save.
  `applyPlanDowngrade` clears them on downgrade, like branding and newsletter.
- Validation lives in `src/lib/catalogue/tracking-providers.ts` and runs in the
  builder, on save and **again at render**, so a hand-edited or imported row
  cannot inject either.
- Consent gate: `CatalogueAnalytics.tsx`. Nothing reaches Google or Meta until
  the visitor allows it. Consent Mode v2 defaults denied, then grants
  `analytics_storage` only; ad signals off. Equal-weight Decline/Allow, stored
  per catalogue for 6 months, with a withdrawal link that sets `ga-disable` and
  reloads.

## Decisions worth keeping

### Google Tag Manager is refused, and why

A `GTM-` container is arbitrary JavaScript its owner edits in Google's UI and
Google serves into the page. Published catalogues share an origin with the
signed-in app, and the session cookie is **script-readable by design**
(`src/lib/auth/cookie-options.ts:8` - the browser client has to read the refresh
token to rotate it). So a container could read a refresh token belonging to
staff or another customer who views that catalogue while signed in.

GA4 and Meta Pixel are not the same shape: both are fixed vendor scripts
selected by an id, with no custom-code tag type. That is the whole reason they
are offerable and GTM is not.

**Rejected: a `gtm.blocklist`.** It works, but a blocklisted container can only
run Google tags - which a `G-` id already gives - and blocklisting any class
also kills community templates, the main reason owners want GTM. Google does not
position it as a security boundary. See
[security-first.md:1032](../2026-10-01-catalogue-google-tag/designs/security-first.md).

**What would unblock GTM:** serving catalogues from a separate registrable
domain, ideally one origin per catalogue (`<slug>.<domain>`) so one tenant's
container cannot touch another's storage. A subdomain of `quicktalog.app` is not
enough - it could still write cookies scoped to the parent. Making the session
cookie `HttpOnly` (with refresh moved server-side) is a cheaper partial fix that
removes the credential from the origin.

### The frame guard is inverted, on purpose

The 10-01 design has the loader do nothing when framed, logged as accepted risk
R12. That is wrong for this product: `SuccessModal` hands every owner an
un-sandboxed `<iframe>` snippet the moment they publish, so embedding is a
promoted distribution channel and "no analytics when embedded" would gut the
feature.

Instead the tag **runs when framed**, and only our own frames opt out, by
`?qt_frame=1` on the iframe `src` (`withQtFrame`). Applied to `/showcases`,
which frames seven live customer catalogues. Not `window.top !== window.self`,
and not `ancestorOrigins` (absent in Firefox).

## Not done

- **Hotjar and Clarity.** Technically the same shape as GA4, but they are
  session recorders capturing DOM and keystrokes, so they need heavier consent
  copy and a DPA before being offered.
- **The 10-01 Phase 0 security probe.** Threat T2 there - whether a `G-`
  container can read a cookie and exfiltrate it as an event parameter - is still
  unverified. Shipping GA4 before either that probe or the `HttpOnly` change
  accepts that risk knowingly.
- **Events beyond `page_view`.** The 10-01 design's `view_item`,
  `generate_lead`, `book_appointment` and `get_directions` are not implemented.
- **CSP is still report-only.** `frame-ancestors 'self'` contradicts the embed
  feature and would break every owner iframe if enforced. Resolve with the
  domain move.
- **Server-side consent log**, needed before general availability per the 10-01
  legal verification.

## Review fixes (2026-10-09)

A code review of the first pass found eleven issues. Eight fixed, three noted.

**Fixed, highest severity first**

1. **Stored `custom_code` blocks rendered nothing.** No read path - not the
   public page, not `/api/items/[name]`, not the builder - called
   `normalizeContent`, and `CatalogueContent` matched `custom_visual` exactly.
   Legacy rows hit no branch and the section rendered blank with the row intact
   in the database. The items branches had survived earlier renames only because
   `asItemsBlock` normalizes inline at the match site; nothing did that here.
   `CatalogueContent` now normalizes once, in a `useMemo`, before any
   `block.type` match. Guarded by
   `tests/unit/components/catalogue-content-normalization.test.ts`.
2. **The owner's GA tag shared `window.dataLayer` with Quicktalog's own GTM**,
   which the root layout loads on every route. The owner's
   `consent/update` therefore granted `analytics_storage` to Quicktalog's
   container, and `allow_google_signals false` disabled signals on Quicktalog's
   own property. The tag now uses a private layer (`qtOwnerDataLayer`, passed as
   `&l=`) and its own push function.
3. **The session guard missed chunked Supabase cookies.** `@supabase/ssr`
   splits a large session across `<name>.0`, `<name>.1`, so matching `<name>=`
   never fired and signed-in visits were reported. Now matches the same two
   shapes as `src/utils/supabase/session.ts`.
4. **`pathname.includes("/preview")`** permanently blocked any catalogue whose
   slug starts with `preview`. Now `endsWith`.
5. **Downgrade left stale HTML in the ISR cache.** The ids were removed from the
   database but only *deactivated* catalogues were revalidated, so a catalogue
   that stayed published kept serving the tag for up to 24h.
   `applyPlanDowngrade` now returns `{ deactivated, trackingCleared }` and the
   webhook revalidates both.
6. **No save-time shape check**, despite the doc claiming one. An invalid id
   persisted and silently never loaded. `dropInvalidTrackingIds` now runs in
   `applyPlanToCatalogue`.
7. **Consent with a junk timestamp never expired** - `NaN > max` is false, so
   the 6-month re-ask never happened. Now re-asks.
8. **Withdrawal only stopped GA.** It now also drops `fbq` and clears the
   `_ga*`, `_gid`, `_fbp` and `_fbc` cookies, so allowing again starts fresh.

Also corrected stale copy that pointed at an "Analytics section" that no longer
exists, and the prompt's section-type list, which still taught `category` and
`container` - keys `sectionTypeSchema` rejects, so the model would have called
`addSection` with a type the schema refuses.

**Server-side block-type gate (the one finding left open, now closed)**

`contentWithinPlan` (`src/lib/entitlements/plan.ts`) now refuses a gated block
type, alongside the section and item counts it already judged. The builder and
the agent both gate these, but neither is a control: `content` arrives from the
client on every save.

- Judged the same way as the counts beside it - refused only when the save
  *adds* one, so a user who downgrades keeps the blocks they had and can still
  edit the catalogue.
- `GATED_SECTION_TYPES` maps each `features.sections` flag to the stored keys it
  governs, **including the pre-rename `custom_code`** - otherwise sending the
  legacy key walks straight past the gate.
- Covered by `tests/unit/lib/entitlements/content-within-plan.test.ts` (12
  cases, including the legacy key and the downgrade-then-edit path).

**Also found while fixing it: `duplicateItem` bypassed every content limit.**

`duplicateItem` copied `content` with no `contentWithinPlan` call, so
duplicating was a way to multiply sections, items *and* gated blocks past the
plan. It now judges the copy from scratch (`previous: null`), because a
duplicate is new usage. Returns `null` like the catalogue-quota check beside it.

**Behaviour change worth knowing:** a user whose catalogue already exceeds their
current plan can no longer duplicate it. That was previously allowed and
produced a catalogue over the plan's limits.

**Fixed: the suite's one long-standing failure**

`tests/unit/agent/skills.test.ts` "uses no em or en dashes" asserted
`/[-\u2013]/` - a plain hyphen-minus plus an en dash - so it matched every
hyphenated word ("second-person" in the authentic-writing skill) and never
tested for the em dash it was named for. Now `/[\u2014\u2013]/` via explicit
escapes, with a non-empty assertion on `SKILLS` so the loop cannot pass
vacuously. The skills were already clean, so this passes for the right reason.

## Verification

`npx tsc --noEmit` clean. `npm run check` 0 errors (18 warnings, all
pre-existing in `MainContext.tsx` and `tests/db-pglite/*.mjs`). `npm test`
**596 passing, 0 failing** across 58 files - including the dash test that had
been failing at HEAD `d785bb8`.

Needs `@quicktalog/common` 1.68.0 published.

Not verified in a browser: the consent banner, the General-tab section, and
whether a real GA4 property receives `page_view` from a published catalogue.
