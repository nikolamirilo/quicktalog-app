# Glass effect, search, navbar, footer and background: the short version

Detail: [PLAN.md](PLAN.md).

## The problem

The published catalogue looked plainer than the Quicktalog site: a flat header bar, a footer laid out differently from ours, and a search box that only appeared once a catalogue had more than 20 items, whether the owner wanted it or not. The new design proposal gives catalogues a premium look and puts the owner in charge.

## What goes wrong today

**Owners can't choose whether visitors get search.**
A café with 12 items never gets a search box; a shop with 25 always does. There is no setting.

**The header and footer don't match the site.**
The header is a full-width bar; the footer columns are generic ("Company Information", "Trusted Partners") and have no room for a short tagline.

**There is no way to make the page feel lighter.**
Every surface is solid, so there is no "frosted glass" option that lets the page show through. And the page background always comes from the theme: an owner can't put their own photo or colour behind the menu.

## The fix in one idea

**The catalogue gets the site's floating navbar and footer, an opt-in search bar, an optional glass effect and an optional own background.**

1. Search is a switch in the builder's General tab, with its own placeholder text.
2. Glass has four levels (Off, Clear, Semi-frosted, Frosted), a choice of surfaces and fine-tuning.
3. The navbar floats and stays at the top while scrolling; the footer follows the site's layout.
4. The background can be a photo, one of 16 gradients or a single colour, replacing the theme's.

Existing catalogues keep looking the same apart from the new navbar and footer shape: search, glass and the custom background start off.

## What users will notice

- A rounded navbar that floats near the top and gets a soft shadow when you scroll. On phones the contact icons fold into a small menu.
- A search bar under the heading, when the owner turns it on, with "/" to jump to it and a line saying how many items match.
- A footer with Contact, Visit us and Stay updated columns, partners shown as small pills, and an optional tagline under the logo.
- Behind the menu, an owner's photo (with a fade so text stays readable), a soft gradient or a plain colour. The builder warns when it clashes with the theme's text, for example a dark gradient under a light theme.
- In the builder: a "Search" card (General), a "Background" card (Appearance), a "Glass effect" slider (Appearance › Style), a "Floating navbar" note (Header) and a "Footer tagline" field (Footer), each marked New.

## Decisions we made (please confirm)

- **Glass is part of the Style controls**, so it follows the same plan rule as fonts and shadows. Plans without Style can't use it.
- **Search is free on every plan** and starts off. Owners with long catalogues who relied on the automatic box must switch it on.
- **No item-count rule for search any more.** Simpler, but a big catalogue no longer gets search by default.
- **Social links show simple line icons** instead of brand logos fetched from a logo service. Cleaner and always in the catalogue's colours, but less colourful.
- **The background is part of the Style controls too**, so the same plans get it. Cards and text keep the theme's colours, so a background that fights the theme is possible; we warn rather than block.
- **The phone menu drops down under the navbar** instead of sliding in from the side.
- **No database change.** The new settings are stored with the existing appearance and footer settings.

## Order of work

1. Add the new settings to the shared package and publish it.
2. Write the rules that turn the settings into the look (glass levels, search text, tagline).
3. Style the navbar, search bar, footer and glass.
4. Rebuild the navbar, search bar and footer on the catalogue page.
5. Add the controls to the builder.
6. Enforce plans on save and on downgrade.
7. Update the docs and the help article.
8. Add the background setting (photo, gradient or colour) from the updated design.

Each step is checked by the type check, lint and unit tests; a look in a browser on TEST is still to do. The database does not change.

## Not in this plan

- Letting Quick AI turn search or glass on. Listed as a follow-up in [PLAN.md](PLAN.md).
