# Assets

Source artwork that is **not** served. Next.js publishes `public/`, not this
folder, so a multi-megabyte original can live here without being sent to
visitors.

| File | Used by |
|---|---|
| `marketing/hero-source.png` | `npm run images:hero`, which writes the trimmed AVIF/WebP the home hero actually serves into `public/images/marketing/`, and `npm run images:social`, which puts the same artwork on the social cards |
| `marketing/social-text.png` | `npm run images:social`: the wordmark-and-headline block of the Open Graph and Twitter cards. The wordmark is lifted from the hand-drawn originals; the three lines under it are set in Poppins (SemiBold 27 px for the headline, Regular 23 px below), centred, with the "Catalogue" spelling. To change the wording, reset those lines in the same fonts and sizes |
| `marketing/hero.svg` | The editable original of the **previous** hero artwork, kept only as history. Nothing in the app references it. |
