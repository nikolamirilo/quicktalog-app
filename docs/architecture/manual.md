# The user manual at `/docs/new`

End-user documentation for people running a business, served from the app as ordinary
Next.js routes. It is separate from `/docs`, which is the older tutorial path, and is built
so `/docs` can be switched over to it later.

Written from a read of the code; the evidence sits in
[`.claude/plans/active/2026-10-28-user-docs-v2/research/`](../../.claude/plans/active/2026-10-28-user-docs-v2/research/).

## Routes

| Route | File | Notes |
|---|---|---|
| `/docs/new` | `src/app/(site)/docs/new/page.tsx` | Serves the **first** page in the registry |
| `/docs/new/<slug>` | `src/app/(site)/docs/new/[slug]/page.tsx` | `dynamicParams = false`, so an unknown slug 404s |

Both sit under `(site)` and not `(with-footer)`: the manual keeps the site `Navbar` and has
no marketing `Footer`. `/docs/new` is a static segment, so it wins over `/docs/[slug]`
without a route conflict.

## Content

| Kind | Location |
|---|---|
| Types | `src/content/manual/_types.ts` |
| Modules (sidebar groups) | `src/content/manual/groups.ts` |
| The page list, in reading order | `src/content/manual/registry.ts` |
| Glossary terms | `src/content/manual/glossary-terms.ts` |
| One file per page | `src/content/manual/<slug>.tsx` |
| Accessors, search index, hrefs | `src/lib/content/manual.ts` |

A page exports `{ meta, Body }`. `meta` carries the slug, its module, the "In short" and
"Result" lines, the Where path, prerequisites, badges, keywords, synonyms, related slugs,
and two flags: `checklist` (keeps tick boxes and shows progress) and `openMessages`.

To add a page: create the file, import it in `registry.ts`, add it to the array. The
sidebar, search, the pager, related links and `generateStaticParams` all follow.

## Framework

`src/components/manual/` holds the pieces pages are written from.

- `ManualShell` is the frame: module rail, header, body, "On this page". It reuses
  `Container`, `PageDisclosure` and `TableOfContents*` rather than copying them.
- `ManualSection` gives a section its colour and icon by kind (`steps`, `opts`, `rules`,
  `example`, `risk`, `info`, `screen`, `fix`, `link`), and its `h2` feeds the right rail.
- `Inline` holds the product's own words: `ButtonName`, `FieldName`, `PlaceName`,
  `TabName`, `KeyName`, `Value`, `Message`, `Tag`.
- Blocks: `Steps`, `Options`, `Rules`, `Note`, `ManualTable` (cards on phones), `Messages`,
  `ManualCards`, `Checklist`, `Term`.
- `Flow` draws a short left-to-right sequence for something no single screen shows, such as
  draft to live page to customer. It stacks on a narrow screen.
- `MessageFinder` is the filterable list of every product message, used by the
  troubleshooting page; readers arrive holding an exact message, so typing beats scrolling.
  Those message texts are also in that page's `keywords`, so the site search finds them.
- `ManualIndex` lists every page by module, for the welcome page.
- `ManualSearch` matches titles, keywords and the synonyms a reader would type. `/` and
  Ctrl+K open it.
- `Checklist` keeps ticks in `localStorage` under `quicktalog:manual:checklist:<slug>`,
  wrapped in try/catch; the page renders fine without storage.

## Screens

`src/components/manual/screens/` draws the product in React rather than using screenshots,
so the drawings never drift from the theme.

- `kit.tsx` holds the shared pieces (navbar, dashboard sidebar, panel, stat card, status
  pill, button, catalogue card, fields, dialog) copied from the real components at their
  real sizes.
- Each screen declares a fixed `width`/`height` in product pixels. `Screen` scales the
  stage down to the column, centres it, and offers an **Enlarge** link in the caption row
  (in the caption rather than floating over the screen, so it never covers a hotspot and
  works without hover).
- `ItemPhoto` draws the sample coffee-shop photographs. They are drawn, not fetched, so a
  screen never waits on a request or shows a broken image.
- Hotspots: put `<SpotMarker n={…} />` inside a `relative` element, and refer to it from the
  text with `<Point n={…} />`, from a legend entry, or from a `<Step spot={…}>` inside
  `FollowAlong`. The highlight shows **only** while the number is hovered or focused;
  selecting it does nothing and nothing stays pinned.
- Place a marker on the control, not on a wrapper whose top left corner is a field label,
  or the marker covers the label.

When a screen in the product changes, update its drawing here. The drawings are the one
part of the manual that cannot be checked by the type checker, so two browser sweeps guard
them: one reports any stage whose content overflows (a clipped screen), the other reports
any hotspot marker whose centre lands on real glyphs (a covered label). Both should report
nothing.

## Conventions

- `product-*` colours everywhere except inside a drawn catalogue, which copies the
  catalogue's own colours on purpose.
- No em dashes or en dashes in the prose.
- Quote product messages letter by letter; describe the stricter rule when the frontend and
  the backend disagree.
