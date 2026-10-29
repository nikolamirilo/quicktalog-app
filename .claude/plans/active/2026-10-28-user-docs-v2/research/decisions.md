# Scope decisions

Settled with the owner on 2026-10-28, before research started.

| Question | Decision |
|---|---|
| Audience | People running the business who use Quicktalog. Not developers. |
| Product name | Quicktalog |
| Coverage | How to use Quicktalog: everything a signed-in user can see and do. |
| Delivery | Next.js route `/docs`, real React components and a content registry. Not a generated HTML file. Built at `/docs/new` first, moved onto `/docs` on 2026-10-29. |
| Shell | Site `Navbar` on top, then a docs frame (left module sidebar, search, breadcrumb, "On this page"). No marketing `Footer`. Route lives outside `(with-footer)` - restored 2026-10-29, after the move onto `/docs` had put it back inside. |
| Intent | The next version of `/docs`. Generic, reusable component and content names so `/docs` can be switched over later. |
| Feature flags | None exist in the codebase (no flag client, no env toggles). Nothing to decide. |
| Deprecated, hidden, internal | Left out. |
| Existing `/docs` | Replaced on 2026-10-29: the manual took over `/docs`, and the old pages, components (`components/docs/`), content (`content/docs/`) and data layer (`lib/content/docs.ts`) were deleted. The Help Center and the sitemap now read the manual's registry. |

## Facts that apply everywhere

- Brand color `#FFB020` (`--product-primary-rgb: 255 176 32`), `src/styles/product.css:43`.
- Product theme tokens are `--product-*`, exposed to Tailwind as `product-*` colors, `tailwind.config.ts:6-45`.
- Fonts: `--product-font-heading`, `--product-font-body` (Plus Jakarta Sans, Inter Tight), `src/app/layout.tsx`.
- Shared types, pricing tiers and the Drizzle schema come from `@quicktalog/common` (`../quicktalog-packages/src`).
