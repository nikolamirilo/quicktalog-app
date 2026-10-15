Status: proposed

# Content block strategy: prepared blocks, split by trust model

Research done 2026-09-30/10-01 on four questions from the owner. How well does each current block serve customers? Should `embedding` and `custom_code` be split by purpose (embeds / tracking scripts / banners and custom HTML)? Primitives or prepared blocks? Which lineup gives the fastest time to value?

- Full report: [reports/Quicktalog content block strategy.md](reports/Quicktalog%20content%20block%20strategy.md)
- Notes: [research_notes/Quicktalog content block strategy/](research_notes/Quicktalog%20content%20block%20strategy/). Two codebase audits (the second includes sanitizer and Chromium sandbox probes) and four market studies: 24 vertical competitors, 13 builders on embeds/tracking/code, primitives vs prepared, and SMB demand.

## What it proposes

1. **Prepared blocks, not primitives.** Blocks come with named variants, the theme owns styling, and the AI can fully edit every block. No grid/flex/columns.
2. **Split by trust model, not by label.**
   - Embed: one URL-first engine shown as named picker entries (Video, Map, Social post, Booking, Form), click-to-load; static HTML as its advanced entry.
   - Tracking: not a block. GA4 and Meta Pixel IDs become a catalogue setting, shipped only after a consent banner exists on `/catalogues/`. GTM and head code wait on serving catalogues from a separate domain.
   - Banners: a native Banner block. `custom_code` becomes the "Interactive widget" sandbox.
3. **Lineup, in four waves:**
   - **Wave 0:**
     - Truthful prices: blank no longer renders "Free".
     - Text editor gets links and headings; size picker fixed.
     - Groundwork: registry, server-side block-type gate, one section-count rule, and one host list shared by the sanitizer and CSP.
   - **Wave 1:** Hours & Location, Buttons and Banner on all plans; price modes; allergen badges; contact basics on Starter; vertical templates.
   - **Wave 2:** URL-first embed, Gallery, FAQ, highlight badges and a per-item action.
   - **Wave 3:** consent banner, then tracking; Interactive widget; reviews.

## Relationship to 2026-09-25-content-blocks-expansion

- **Agrees:**
  - Tracking is a setting, not a block.
  - Registry, server gate and host list come first.
  - No columns, tabs or social feeds.
- **Changes:**
  - `custom_code`'s jobs are split three ways: a Banner block, a static-HTML embed entry, and the widget sandbox. The earlier plan kept one relabelled block.
  - A Banner block replaces "compose a hero from image + text + cta".
  - Video becomes an embed entry.
  - `animation` (Lottie) and `social_links` are dropped.
  - Hours, Buttons and Banner move to all plans.
  - GTM becomes conditional on a separate domain rather than refused outright.
- **Corrects:** inside the sandbox, GA4 sends no hits at all; the earlier plan said "fresh client id per hit". It also adds findings the earlier plan lacked: the price-0 "Free" bug, the stripped text sizes, and Starter catalogues showing Quicktalog's email and sign-up button instead of the owner's.

## Open decisions

1. Run the drafted read-only PROD query (in the embed/custom-code notes) before building. Quicktalog's own usage is unmeasured: TEST is empty.
2. Section counting: either count item sections only and give non-item blocks their own cap, or count all blocks and raise Starter from 5 to 8.
3. Unlock contact basics (phone, address, email) on Starter.
4. Serve public catalogues from a separate registrable domain? This gates GTM and head code.
5. Allow popups or top-level navigation on tap in the widget sandbox?
6. Contact customers whose `custom_code` tracking stopped when the sandbox shipped (`e87e1f2`, 2026-09-15)?
