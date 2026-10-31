Status: in progress - Tasks 1, 2, 3 and 7 (the logo row) done 2026-10-28. `logoRadius` shipped in `@quicktalog/common` 1.78.0; `logoScale` and the 0-100 rounding range need the next release. Awaiting a TEST browser check. Tasks 4, 5 and 6 not started

# PROD release testing 2026-10-27: failing items Implementation Plan

> **For agentic workers:** implement task by task, in order. Steps use checkbox (`- [ ]`)
> syntax for tracking. Follow the `code-conventions` skill for every new file.

**Goal:** Close the two FAIL rows from the release testing page, plus the two comments
left on passing rows. Source: Confluence "2026-10-27 PROD Release Testing"
(page `267354114`, v5), tested on <https://test.quicktalog.app/> against `origin/test`
`9d225bc` (v2.1.0).

**Architecture:** The logo row is four separate defects behind one test case, and three
of them share a shape: **the header and footer decide what the logo *is* from
`header.type`/`footer.type`, but decide where it *links* and how big it draws from
unrelated state.** The fix is to make the branch that picks the logo also pick its link
and its size ceiling. The search row is not reproducible from the code or the stored
data (see Task 4), so it is split: ship the tester's own ask, then confirm the symptom.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, Vitest + Testing Library (happy-dom).

**Spec:** the FAIL rows and test comments of 2026-10-27. Plain-language version:
[OVERVIEW.md](OVERVIEW.md).

## What was verified before planning

| Report | Verified | Evidence |
|---|---|---|
| Default navbar links to the old custom link | Confirmed in code | `src/components/catalogue/view/CatalogueHeader.tsx:147` uses `activeData?.contact?.website` with no `type` branch, while the logo, the CTA, the company name and the width at `:109-128` all branch on `type === "default"`. Same shape in the footer: `src/components/catalogue/view/components/Brand.tsx:29` |
| Logo stops growing | Confirmed in code | `.cat-nav-brand img { max-height: 44px }` — `src/styles/catalogue-chrome.css:92` — against a slider that runs to 300 px (`src/components/catalogue/inputs/sidebar/HeaderTab.tsx:150`). The tester read it as 48 px; it is 44 px. Footer cap is 72 px (`:496`) |
| Logo size active with no logo | Confirmed in code | The Logo size section is gated on `isCustom` only — `HeaderTab.tsx:137-162`; the footer's is never gated — `src/components/catalogue/inputs/sidebar/footer/LogoSizeSection.tsx:14-28`. `LogoHint` (`general/LogoHint.tsx`) covers the opposite case (a logo that will not show) |
| Search bar does not show | **Not reproduced** | TEST rows `basic` and `basic-catalog` store `appearance.search = {"isEnabled":true,"placeholder":""}` (read-only SELECT, 2026-10-28). Deployed code renders on `search?.isEnabled === true` (`CatalogueContent.tsx:98,265`) and falls back to `"Search items…"` for an empty placeholder (`CatalogueSearchBar.tsx:74`). The live page could not be loaded from this session (network blocked), so the symptom is unconfirmed |
| 1 AI credit stranded | Confirmed in code | Starter allows 15 (`../quicktalog-packages/src/constants/pricing.ts:22`); an ask costs `agentBase: 2` (`src/lib/ai/pricing.ts:10`) and `canStartAsk` needs the full base (`:22-24`), so the 8th ask is refused with 1 credit left. Basic/Pro/Growth/Premium are 50/150/300/600 — all even |

## Global Constraints

- No schema, RLS or data changes. Tasks 1-5 are app-only: no migration, no package release.
- Tasks 6 and 7 change `@quicktalog/common` (`../quicktalog-packages`) and need a release.
- TEST (`imhinsgyzzyblghwnedk`) only; nothing touches PROD.
- No commits, pushes or branches unless the user asks (CLAUDE.md).
- Before finishing: `npx tsc --noEmit`, `npm run check`, `npm test`.

## Decisions to confirm

1. **A default header or footer links to the Quicktalog site, never to the owner's
   website.** Cost: an owner on a free plan loses the logo as a route to their own site;
   their website stays reachable from the footer's website icon and the contact row.
2. **The navbar logo ceiling follows the owner's width up to 72 px, not 44 px.** Cost:
   the floating navbar grows by up to 28 px on desktop for owners who push the slider.
   Phones stay at 44 px. The alternative — capping the slider at the width that fits
   44 px — keeps the navbar fixed but takes range away.
3. **An empty search placeholder is stored as the default text, not as `""`.** Cost: an
   owner who wants a bar with no placeholder at all cannot have one.
4. **Corner rounding is a percentage of fully round, 0-100 %**, so 100 % is a circle on
   a square logo (CSS gets half that, since a circle is a 50 % radius). Cost: the whole
   slider changes meaning, and a radius stored during testing now draws half as round.

5. **Starter moves to 16 AI credits, not 14.** Cost: one extra ask per free account per
   month (8 instead of 7); 14 would take one away. Needs a package release and the
   pricing surfaces to be re-checked.
6. **Logo rounding (Task 7) ships with a package release.** Implemented as
   `header.logoRadius`/`footer.logoRadius`, a percentage (0 = square, 50 = a circle on a
   square logo), defaulting to 0 so no existing catalogue changes. `@quicktalog/common`
   shipped in `@quicktalog/common` 1.78.0, and `logoScale` needs the next release. The app reads the field through
   `logoRadiusOf`, the defensive read the published page needs for catalogues saved
   before the setting existed.

## Task 1: a default header or footer links to the Quicktalog site

- [x] In `src/components/catalogue/view/CatalogueHeader.tsx`, give the brand link the
      same `type === "default"` branch the logo and CTA already use: default → `"/"`,
      custom → `activeData?.contact?.website || "/"`.
- [x] In `src/components/catalogue/view/components/Brand.tsx`, do the same from
      `activeData?.footer?.type`: default → `"/"`, custom → `contact?.website || ""`.
- [x] Keep `ariaLabel` in step with the target: the default header already says
      `Go to Quicktalog homepage` through `companyName`; the footer passes
      `legal.legalName`, so it needs the same split.
- [x] Move the choice into `src/lib/catalogue/logo.ts` next to `catalogueLogos`, as
      `catalogueLogoHref({ type, website })`, so the header, the footer and the tests
      read one rule.
- [x] Test (`tests/unit/lib/catalogue/logo.test.ts`): default type with a website set
      returns `"/"`; custom type returns the website; custom type with no website
      returns the fallback.

## Task 2: Logo size is inactive until a logo is uploaded

- [x] Export `LOGO_PANEL_ID = "panel-logo"` from the General tab's logo section and put
      the id on that `PanelSection`, mirroring `GLASS_PANEL_ID`
      (`appearance/GlassConfiguration.tsx:18`).
- [x] Add `openLogoSettings` to `src/components/catalogue/inputs/sidebar/index.tsx`
      beside `openGlassSettings` (switch to General, then scroll on the second frame),
      and pass it to `HeaderTab` and `FooterTab` as `onOpenLogo`.
- [x] In `HeaderTab.tsx` and `footer/LogoSizeSection.tsx`, disable the Logo size section
      when `!catalogue.logo` the way the tab already disables on `!isCustom`
      (`pointer-events-none select-none opacity-50` plus `inert`), and show an
      `Upload a logo →` button styled like `Open glass settings`.
- [x] Reword the section's hint for that state: "Upload a logo first — this sets how big
      it draws."

## Task 3: the logo is sized as a share of what each place allows

Revised 2026-10-28 on the owner's call: a width in pixels was the wrong model, since what
the navbar limits is height. Size is now one percentage per place.

- [x] Store `logoScale` (10-100 %) on the header and footer; `logoSize` stays in the type
      as `@deprecated` so stored catalogues still parse, and nothing renders from it.
- [x] Draw a custom logo from its scale: `height = round(LOGO_MAX_HEIGHT[scope] * scale /
      100)`, 56 px in the navbar and 72 px in the footer, so 100 % is as big as the place
      carries and the whole slider does something. The CSS ceilings stay as the
      responsive guard (44 px on phones, 56 px from `md`, 72 px in the footer).
- [x] Leave our own logo alone: the Quicktalog wordmark keeps its fixed width (160 px in
      the navbar, 100 px in the footer) and takes neither the scale nor the rounding.
- [x] Move the AI builder onto the same field: `logoWidth` in pixels became `logoScale`
      as a percentage, in the tool schema, the applier and the agent field shapes.

## Task 4: the search placeholder is never empty

- [ ] Add the default text as one exported constant next to `SEARCH_PLACEHOLDER_MAX`
      (`src/lib/catalogue/items.ts:44`) and have `normalizeSearch` return it when the
      stored placeholder is blank, so the builder input, the published bar and the
      server all read the same value.
- [ ] Drop the inline `placeholder || "Search items…"` fallback at
      `CatalogueSearchBar.tsx:74` once the value is guaranteed.
- [ ] In `general/SearchSection.tsx`, show the default as the field's value rather than
      as grey placeholder text, so the owner sees what visitors will see.
- [ ] Test: `normalizeSearch` fills a blank, a whitespace-only and a missing placeholder;
      a set placeholder is kept and still truncated at 40 characters.

## Task 5: close the search-bar report

- [ ] Reproduce on TEST with the tester's steps, on a catalogue with glass **off**: turn
      the search bar on, save, publish, then hard-reload the published page twice.
- [ ] If the bar appears only on the second load, the report is ISR propagation after
      publish, not the search setting: raise it as its own finding, since it would
      affect every publish, and check it against `revalidateCatalogue`
      (`src/lib/cache/revalidate.ts:8-18`, which does bust both the path and the tags).
- [ ] If the bar is present but invisible, it is glass contrast on the search surface:
      check `.cat-search` against the glass targets (`apply.search`) over a photo
      background and raise the contrast finding instead.
- [ ] Record the outcome in this folder as `VERIFICATION.md` and update the Confluence
      row to PASS or to a new, narrower FAIL.

## Task 6: Starter's AI credits land on an even number

- [ ] In `../quicktalog-packages/src/constants/pricing.ts:22`, set Starter's
      `ai_credits` to the confirmed number (Decision 4).
- [ ] Re-check the three plan surfaces that print it (pricing page, the plan tables and
      the usage meter) and the AI credits meter's hidden state.
- [ ] Release `@quicktalog/common`, bump the app, and confirm the builder's pre-run
      estimate agrees with the server's charge.

## Task 7: the logo can be rounded

- [x] Add an optional radius to the header and footer logo settings in
      `@quicktalog/common`'s `Catalogue` type, defaulting to square so existing
      catalogues do not change.
- [x] Apply it on the logo image in the header and the footer, and add the control under
      Logo size in both tabs.
- [x] Enforce it in `applyPlanToCatalogue`
      (`src/lib/entitlements/catalogue.ts:48-72`) the way glass and background are, so a
      free-plan payload cannot set it.
- [x] Release the package and bump the app: `@quicktalog/common` 1.78.0 carries
      `logoRadius` on `Header` and `Footer` plus the `logoRadius: 0` defaults, and the app
      depends on `^1.78.0`. `logoRadiusOf` stays as the one read of the field, now typed
      against the released package, because stored catalogues predate it.

## Out of scope

- The Confluence row "Delete the 'version 4 33x33' …" assigned to Nikola Mirilo is a
  page cleanup, not product work.
- Everything else on the page passed; the plan-limit, credit-cap, Paddle and Supabase
  Auth rows need no follow-up here.
