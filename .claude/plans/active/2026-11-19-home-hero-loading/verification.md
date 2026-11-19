# Verification

Measured on 2026-11-19, branch `test`, from `npm run build` (webpack, production)
on this machine. The dev server was stopped first, and `.next` cleared, so the
numbers are not a dev build's.

## The hero image

| | Before | After |
|---|---|---|
| File(s) | `hero.png`, one size | `hero-{760,1100,1520}.{avif,webp}` |
| Intrinsic size | 3152x2987 | 3019x2099 (padding trimmed) |
| Bytes a phone fetches | 5.62 MB | 25 KB (avif 760w) |
| Bytes a desktop at DPR 2 fetches | 5.62 MB | 69 KB (avif 1520w) |
| Bytes with no AVIF support | 5.62 MB | 41-117 KB (webp) |
| Declared ratio vs real ratio | 1.432 vs 1.055 | 1.438 vs 1.438 |

Produced by `npm run images:hero`:

```
trimmed  3019x2099 (ratio 1.438)
760w   avif 25 KB  webp 41 KB
1100w  avif 43 KB  webp 74 KB
1520w  avif 69 KB  webp 117 KB
```

The worst case after the change - a browser with no AVIF on a 2x desktop - is
117 KB, **48x smaller** than what every visitor fetched before. The common case
(AVIF, phone) is 25 KB, **230x smaller**.

`public/images/marketing/` went from 25.6 MB to 480 KB, because the 5.6 MB PNG
source and the unreferenced 19.7 MB SVG moved to `assets/marketing/`, which Next
does not deploy.

## Layout shift

The `<img>` now declares `width={3019} height={2099}`, the trimmed file's own
size, so the box the browser reserves is the shape of the image that arrives.
Before, it declared `1100x768` (ratio 1.432) for a file of ratio 1.055, and
Tailwind preflight's `img { height: auto }` meant the box grew once the image
loaded. Confirmed in the built HTML: `height="2099" width="3019"`, ratio 1.438.

## First Load JS for `/`

Both figures from the same build command, the only difference being whether the
two dialogs are statically imported:

| | First Load JS |
|---|---|
| Before (dialogs in the initial bundle) | 430 kB |
| After (dialogs loaded on demand) | **405 kB** |

The dialog code now sits in its own 36 KB chunk
(`.next/static/chunks/2564.*.js`), fetched on the hover or the click, not on
page load.

## The preload

Confirmed in `.next/server/app/index.html`: React hoists the `<link>` into
`<head>` (character 7937, before `</head>` at 8438), while the `<picture>` is far
down the body at 32499. The preload carries the same `imageSizes` as the
`<picture>`'s `sizes`, so it matches the candidate the browser would pick:

```html
<link as="image" fetchPriority="high" href="/images/marketing/hero-1100.avif"
      imageSizes="(min-width: 1024px) 760px, calc(100vw - 40px)"
      imageSrcSet="/images/marketing/hero-760.avif 760w, /images/marketing/hero-1100.avif 1100w, /images/marketing/hero-1520.avif 1520w"
      rel="preload" type="image/avif"/>
```

No reference to `hero.png` remains in the built HTML.

## Task 8: `/` does prerender

The current `.next` reports 49 prerendered routes and `/` is one of them:

```
┌ ○ /    9.97 kB    405 kB    Revalidate 1h    Expire 1y
```

The earlier reading, that `/` was missing from `prerender-manifest.json`, came
from a `.next` left by a dev server - a dev build writes an empty manifest. The
route is static.

**This also corrects a caveat in `PLAN.md` task 8.** The plan said the hourly
`revalidate` inside `getServerPrices`' `unstable_cache` would never re-run on a
statically prerendered page. It does: Next hoists it to the route, which is why
the build prints `Revalidate 1h` against `/`. Home-page prices refresh hourly on
their own; no on-demand revalidation is needed for them.

## Checks run

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run check` (Biome) | 1 warning, pre-existing, in `src/context/MainContext.tsx:33` (`setIsLoading` unused) - not a file this plan touches |
| `npm test` | 100 files, 906 tests, all passing |
| `npm run build` | compiled, 60 static pages generated |

`tests/unit/components/createCatalogue.test.tsx` needed updating: the dialogs now
arrive a tick after the click, so the three tests that asserted on them
synchronously now await their appearance (`findByText` / `findByRole`). The
assertions themselves are unchanged.

## Not verified here

- **Real LCP and CLS from a browser.** These are build-time and byte-level
  measurements. A Lighthouse or WebPageTest run against a Vercel preview is still
  worth doing, and is the only way to confirm the Paddle.js request is absent
  from the initial load and that the deferred load fires on scroll.
- **How the trimmed hero looks.** The artwork now fills its column instead of
  sitting above a band of empty space, which is a visible change to the home page
  that wants an eye on it before merge.
