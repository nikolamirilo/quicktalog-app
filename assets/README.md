# Assets

Source artwork that is **not** served. Next.js publishes `public/`, not this
folder, so a multi-megabyte original can live here without being sent to
visitors.

| File | Used by |
|---|---|
| `marketing/hero-source.png` | `npm run images:hero`, which writes the trimmed AVIF/WebP the home hero actually serves into `public/images/marketing/`, and `npm run images:social`, which puts the same artwork on the social cards |
| `marketing/social-text.png` | `npm run images:social`: the wordmark-and-headline block of the Open Graph and Twitter cards, lifted from the hand-drawn originals so the typography survives a rebuild |
| `marketing/hero.svg` | The editable original of the **previous** hero artwork, kept only as history. Nothing in the app references it. |
