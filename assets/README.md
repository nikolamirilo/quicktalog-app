# Assets

Source artwork that is **not** served. Next.js publishes `public/`, not this
folder, so a multi-megabyte original can live here without being sent to
visitors.

| File | Used by |
|---|---|
| `marketing/hero-source.png` | `npm run images:hero`, which writes the trimmed AVIF/WebP the home hero actually serves into `public/images/marketing/`, and `npm run images:social`, which puts the same artwork on the social cards |
| `marketing/social-text.png` | `npm run images:social`: the wordmark-and-headline block of the Open Graph and Twitter cards. The wordmark is lifted from the hand-drawn originals; the three lines under it are set in Poppins (SemiBold 27 px for the headline, Regular 23 px below), centred, with the "Catalogue" spelling. To change the wording, reset those lines in the same fonts and sizes |
| `marketing/hero.svg` | The editable original of the **previous** hero artwork, kept only as history. Nothing in the app references it. |
| `brand/mark.svg` | `npm run images:logos`. A true vector of the magnifier mark, measured off `public/images/brand/icon-512.png`. Every other brand SVG in the repo is a Figma export with a bitmap inside, so this is the only one that stays sharp at any size |
| `brand/logo-square-1200*.png` | Written by `npm run images:logos`: the 1:1 logo directories ask for (1200x1200, mark at 75%, centred), on white and on transparent |
| `brand/logo-landscape-1200x300*.png` | Written by `npm run images:logos`: the 4:1 logo directories ask for, the full lockup from `public/images/brand/logo.svg`, on white and on transparent |

The `brand/` logos are upload-by-hand artwork for app directories, marketplaces
and press kits. Nothing in the app links to them, which is why they live here
and not in `public/`.
