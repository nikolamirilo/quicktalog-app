# Home hero loading

Status: done (awaiting a browser check)

Spec: plain-language version in [OVERVIEW.md](OVERVIEW.md). Measurements in
[verification.md](verification.md).

The public home page (`/`) is the first thing a visitor and every crawler sees, and its
largest element is a 5.6 MB PNG served unoptimized. This plan makes the hero paint from
~40 KB instead, removes the layout shift it causes, and keeps the work that is not
needed for the first screen out of the first screen.

## Why

Measured in this working tree on 2026-11-19 (branch `test`):

| Finding | Evidence |
|---|---|
| The LCP element is a 5.62 MB PNG, 3152x2987 | `public/images/marketing/hero.png`; `src/components/home/Hero.tsx:92` |
| It is a raw `<img>`, so Next does nothing for it | `Hero.tsx:85-95` - no `next/image`, no `srcset`, no `sizes` |
| Image optimization is off in every non-localhost environment | `next.config.ts` -> `images.unoptimized: !process.env.NEXT_PUBLIC_BASE_URL?.includes("localhost")` - so `next/image` alone would change nothing |
| It renders at most 760 CSS px | `Hero.tsx:89` `max-w-[720px] lg:max-w-[760px]`; the file carries ~16x the pixels needed at DPR 2 |
| ~30 % of the file is transparent padding | `trim()` reduces 3152x2987 to 3019x2099 |
| That padding also causes layout shift | declared `width={1100} height={768}` (ratio 1.432) matches the trimmed artwork, but the real file is ratio 1.055; Tailwind preflight sets `img { height: auto }`, so the box grows taller once the image loads |
| A second, unreferenced 19.7 MB `hero.svg` ships in `public/` | `public/images/marketing/hero.svg`; the only references in `src/` are `hero.png` and a missing `hero-mockup.png` |
| Nothing sets a long cache on `/images/*` | `next.config.ts` `headers()` returns only the CSP header |
| The hero's primary CTA pulls two dialogs into the first load | `CreateCatalogueProvider` (`src/components/catalogue/create/CreateCatalogueProvider.tsx`) eagerly imports `InitCatalogueModal` + `LimitsModal`, which pull Radix `alert-dialog`, `select`, `searchable-select`, `CURRENCIES` and `LANGUAGE_OPTIONS` |
| Paddle.js loads during the first paint, for a section far below the fold | `Pricing` (`src/components/home/Pricing.tsx`, `"use client"`) -> `usePricingPlans` -> `usePaddle` -> `initializePaddle` in a mount effect, then a `PricePreview` request |
| A 22 px decorative icon costs a JS chunk and a fetch inside the LCP window | `Hero.tsx:28-34` `LottiePlayer` -> dynamic `lottie-web` + `fetch("/animations/sparkle.json")` |

What is already fine and must not be "fixed": the 21 Google font families in
`src/app/layout.tsx` are declared with `preload: false` except the three the product UI
uses (`src/lib/fonts/index.ts`), so only 3 fonts preload; `framer-motion` is not on this
page; `middleware.ts` does no session or Redis work for `/`; and nothing in the home page
server tree reads `cookies()` or `headers()`, so the route can prerender.

Sizes of the replacement, measured with `sharp` from the trimmed source:

| Width | WebP q80 | AVIF q55 |
|---|---|---|
| 760w | 41 KB | 25 KB |
| 1100w | 74 KB | 43 KB |
| 1520w | 117 KB | 69 KB |

## Decisions to confirm

1. **Pre-generate the hero variants at build time and keep `images.unoptimized` as it
   is.** Turning optimization on would route every marketing image through Vercel's
   image optimizer and its Hobby transformation allowance. Pre-generated static files
   cost nothing per request. Cost: one build step and the variants are committed or
   generated, not computed per request.
2. **Serve AVIF with a WebP fallback via `<picture>`, not `next/image`.** With
   `unoptimized: true`, `next/image` would emit a plain `<img>` with no `srcset`, so it
   buys nothing here. Cost: the hero keeps hand-written markup instead of a component.
3. **Trim the transparent padding from the source file.** This is what fixes the layout
   shift and makes the artwork fill the box as the declared `1100x768` intends. Cost: the
   hero artwork will sit ~30 % taller in its column than it does today - a visible design
   change that needs a look before merge.
4. **Moved, not deleted.** `hero.svg` and the 5.6 MB PNG source both moved to
   `assets/marketing/`, which Next does not deploy, so nothing is lost and neither ships.
   `public/images/marketing/` went from 25.6 MB to 480 KB. Still worth confirming: both
   remain in git, so the repository still carries 25 MB of binaries.
5. **Load the create-catalogue dialogs on demand.** The dialogs are only ever needed
   after a click. Cost: a short delay on the first click of "Start Creating Now" while
   the chunk loads; mitigated by prefetching the chunk on hover/focus.
6. **Defer Paddle.js until the pricing section is near the viewport.** Prices are already
   in the HTML from `getServerPrices`, so Paddle.js only localises the currency. Cost: a
   visitor who scrolls straight to pricing may see USD for a moment before their own
   currency replaces it.
7. **Drop the Lottie sparkle from the hero kicker and keep the static `Zap` icon.** Cost:
   the kicker loses its animation. The other four Lottie animations are below the fold and
   stay as they are.
8. **Add a one-year immutable cache header for `/images/*` and `/animations/*`.** Cost:
   a changed image needs a new filename; the plan renames the hero files anyway, so this
   is the moment to adopt it.

## Tasks

### 1. Generate the hero variants

- Add `scripts/images/build-hero.ts`: read `public/images/marketing/hero-source.png`,
  `trim({ threshold: 1 })`, then write `hero-760.avif/.webp`, `hero-1100.avif/.webp`,
  `hero-1520.avif/.webp` to `public/images/marketing/`.
- Add `sharp` as a `devDependency` (it is currently only transitive through `next`).
- Add an `npm run images:hero` script. Do not put it in `build`: the output is committed,
  so Vercel does not re-encode on every deploy.
- Record the produced byte sizes in `verification.md` in this folder.

### 2. Replace the hero `<img>`

In `src/components/home/Hero.tsx` (`Hero.tsx:85-95`):

- Swap the `<img>` for a `<picture>` with an AVIF `<source>`, a WebP `<source>`, each
  carrying `srcset` at 760w/1100w/1520w and
  `sizes="(min-width: 1024px) 760px, calc(100vw - 40px)"`, and a WebP `<img>` fallback.
- Keep `fetchPriority="high"` and add `decoding="async"`.
- Set `width={3019} height={2099}` (the trimmed intrinsic size) so the reserved box
  matches what loads. Keep the CSS `max-w-[720px] lg:max-w-[760px]`.
- Add `<link rel="preload" as="image" imageSrcSet=... imageSizes=...>` for the hero in
  the home page only, so the browser starts the fetch before it has parsed the hero.

### 3. Remove the dead hero source

- Delete `public/images/marketing/hero.svg` (19.7 MB, unreferenced), or move it to a
  non-deployed location per decision 4.
- Fix or remove `src/content/articles/digital-menu-for-restaurants.tsx:96`, which points
  at `/images/marketing/hero-mockup.png` - that file does not exist, so the article
  renders a broken image today.
- Delete `public/images/marketing/.DS_Store`.

### 4. Cache headers for static media

In `next.config.ts` `headers()`, add an entry alongside the CSP one:

- `source: "/(images|animations)/:path*"` with
  `Cache-Control: public, max-age=31536000, immutable`.
- Leave the CSP entry unchanged.

### 5. Load the create-catalogue dialogs on demand

In `src/components/catalogue/create/CreateCatalogueProvider.tsx`:

- Import `InitCatalogueModal` and `LimitsModal` through `next/dynamic` with
  `ssr: false`, and render each only when its `isOpen` is true.
- Keep `useCreateCatalogue` where it is - it is small, and `openCreateCatalogue` must stay
  synchronous for the click.
- In `CreateCatalogueButton`, prefetch the dialog chunk on `onPointerEnter`/`onFocus` so
  the click is not the first time it is fetched.
- Check the fallback path in `CreateCatalogueButton:35-41` (a button outside a provider
  wraps itself in one) still works.

### 6. Defer Paddle.js below the fold

- Add a `useNearViewport(ref)` hook (IntersectionObserver, `rootMargin: "400px"`) in
  `src/hooks/`.
- `usePaddle` takes an `enabled` flag and skips `initializePaddle` until it is true.
- `Pricing` passes `enabled` from the hook on its own wrapper, so the server-rendered USD
  prices show immediately and Paddle.js loads only as the section approaches.
- `src/components/dashboard/Subscription.tsx` also calls `usePaddle`; keep its behaviour
  by passing `enabled: true` there.

### 7. Static kicker icon

- In `Hero.tsx`, replace the `LottiePlayer` kicker icon with the plain `Zap` icon.
- Leave `LottiePlayer` and the other four animations alone.

### 8. Confirm the route prerenders

Done. `/` prerenders: the build prints `○ /` with `Revalidate 1h`, and the manifest
holds 49 routes including `/`. The earlier empty manifest was a dev server's `.next`.

This also **disproved the caveat this task carried**: the plan said the hourly
`revalidate` inside `getServerPrices`' `unstable_cache` would never re-run on a static
page. Next hoists it to the route - hence `Revalidate 1h` against `/` - so home-page
prices do refresh hourly by themselves.

### 9. Measure

- Record in `verification.md`, before and after: hero transfer bytes, LCP, CLS and the
  first-load JS for `/`, from a production build served locally and from a Vercel preview.
- Target: hero under 120 KB on desktop at DPR 2, CLS 0 from the hero, and the Paddle.js
  request absent from the initial load.

## Verification

- `npx tsc --noEmit`, `npm run check`, `npm test`.
- A browser check of `/` on a phone width and a desktop width: the hero artwork fills its
  column with no dead space below it, nothing jumps as the image loads, "Start Creating
  Now" opens the dialog on the first click, and the pricing cards show real prices before
  Paddle.js has run.
- The article at `/articles/digital-menu-for-restaurants` no longer has a broken image.

No migration. No `@quicktalog/common` change, so no package release.

## Not in this plan

- Signed-in page speed, the database region and the progress indicator:
  [2026-10-31-fast-navigation](../2026-10-31-fast-navigation/PLAN.md).
- Unused packages and dead files across the whole tree:
  [2026-10-25-codebase-cleanup](../2026-10-25-codebase-cleanup/PLAN.md).
- The other marketing pages' heroes and the five SVG illustrations in
  `public/images/marketing/`, which are all under 60 KB.
