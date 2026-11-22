# Assets

Source artwork that is **not** served. Next.js publishes `public/`, not this
folder, so a multi-megabyte original can live here without being sent to
visitors.

| File | Used by |
|---|---|
| `marketing/hero-source.png` | `npm run images:hero`, which writes the trimmed AVIF/WebP the home hero actually serves into `public/images/marketing/` |
| `marketing/hero.svg` | The hero artwork's editable original. Nothing in the app references it. |
