# User manual v2 at /docs/new

Status: done

Spec for non-engineers: [OVERVIEW.md](OVERVIEW.md). Evidence: [research/](research/).

## Goal

End-user documentation for Quicktalog, written from the code, served from the app at
`/docs/new` as real Next.js routes rather than a generated HTML file.

## Decisions

Agreed with the owner before any code was written, recorded in
[research/decisions.md](research/decisions.md):

| Decision | Why |
|---|---|
| Site `Navbar` on top, then a docs frame, no marketing `Footer` | A reader who is working should not scroll into a footer. Route lives outside `(with-footer)`. |
| Generic names (`manual*`), new content folder | `/docs/new` is the next version of `/docs`, so it has to be switchable later. |
| Content as React, not MDX or HTML | Matches the existing `src/content/docs` pattern and lets pages use real components. |
| No reading themes or text-size control | The product has one theme. A parallel theme system would fight `--product-*`. |
| Screens drawn as React at real pixel sizes, scaled to the column | Stays sharp, matches the product's own tokens, and never drifts from the theme. |

## What was built

| Area | Files |
|---|---|
| Routes | `src/app/(site)/docs/new/page.tsx`, `src/app/(site)/docs/new/[slug]/page.tsx` |
| Content model | `src/content/manual/_types.ts`, `groups.ts`, `registry.ts`, `glossary-terms.ts` |
| Pages | 25 files in `src/content/manual/` |
| Accessors | `src/lib/content/manual.ts` |
| Framework | `src/components/manual/` (shell, sidebar, search, sections, steps, options, rules, notes, tables, messages, cards, checklist, screens) |
| Screen kit | `src/components/manual/screens/` (kit plus 7 drawn screens) |
| Metadata | `generateManualMetadata` in `src/constants/metadata.ts` |

The first entry in `manualPages` is served at `/docs/new`; the rest at `/docs/new/<slug>`
with `dynamicParams = false`, so an unknown slug 404s.

## Conventions followed

- `@/` imports, named exports, Biome formatting, tabs.
- `product-*` colours only; no hard-coded hex outside the drawn screens, which copy the
  catalogue's own colours on purpose.
- Reuses `Container`, `PageDisclosure`, `TableOfContents*` from `components/general` and
  `components/resources` instead of new copies.
- Browser storage (checklist ticks) is wrapped in try/catch and the page renders without it.

## Verification

- `npx tsc --noEmit`: clean.
- `npm run check`: clean for every new file. Two pre-existing warnings remain in
  `src/components/docs/DocHero.tsx` and `src/context/MainContext.tsx`, untouched here.
- `npm test`: 91 files, 816 tests, all passing.
- Label check: 549 quoted labels and messages compared against the app and
  `@quicktalog/common`. The misses are prerequisite lines written for the reader and
  strings the product builds at runtime.
- All 25 routes render; every internal manual link resolves.
- Every drawn screen was rendered in Chromium and compared against its component code.

## Open items for the product team

See the list at the end of [OVERVIEW.md](OVERVIEW.md). The sign-up question is the one
that could make a page wrong rather than merely untidy.
