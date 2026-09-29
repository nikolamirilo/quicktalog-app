# Quicktalog redesign: implementation spec

Source: `tool-results/artifact-307bf8da-1790628297-ef52.html` (single-file prototype, 7,526 lines, 2.2 MB; about 1.3 MB of that is base64 images and Lottie JSON).
Everything below comes from the prototype's CSS, markup and scripts. Line numbers refer to the original file; they match a copy with data URIs removed.

Prototype mechanics that are **not** part of the product (don't build them):
- Hash router (`#page-name`) and the floating "All pages" switcher (`.qt-pages`, `.qt-pages-btn`, `#qt-review-slot`).
- "Review state" segmented control on the dashboard (Normal / Empty / At limit), the demo-only error triggers in auth forms (`unconfirmed@…`, `wrongpass`, weak-password list), and all "Design preview: …" notes and toasts.
- Sample data: user "Maya Ruiz", `maya@beanthere.example`, "Bean There Café", analytics random generator.

---

## 0. Page inventory and groups

Each page is `<section class="page" data-page data-title data-group data-layout [data-footer="0"]>`. The CSS prefix matches the group.

| Group (data-group) | CSS group | Frame (data-layout) | Pages |
|---|---|---|---|
| Public | base/home + `g1-` (marketing) | public | `home`, `pricing`, `showcases`, `demo` (no footer), `contact` |
| Resources | `g2-` (resources) | public | `articles`, `article-*` (6), `docs`, `doc-*` (8), `help`, `release-notes` |
| Account | `g3-` (account/auth/legal/404) | public | `login`, `signup`, `forgot`, `reset-password`, `confirm`, `privacy`, `terms`, `refund`, `notfound` |
| App | `as-` (g4: dashboard + account pages) | dash | `app-dashboard`, `app-subscription`, `app-usage`, `app-settings`, `app-support` |
| App | `as-` (g4) | bare | `app-checkout-success` |
| App | `g5-`/`g5q-` (g5: catalogue tools) | tool | `app-analytics` (no footer), `app-qr` |

Articles (6): `article-businesses-that-need-digital-catalog`, `article-create-catalog-with-ai`, `article-digital-catalog-alternatives`, `article-digital-menu-for-restaurants`, `article-digital-service-menu-salons-spas`, `article-qr-code-catalog-guide`.
Docs (8, in order): `doc-getting-started`, `doc-create-a-catalogue`, `doc-build-and-edit`, `doc-customize-design`, `doc-share-your-catalogue`, `doc-track-performance`, `doc-responsive-and-accessible`, `doc-plans-and-billing`.

**Frames** (from router + `#app-shell[data-frame]`):
- `public`: navbar (logged out) + page + footer.
- `dash`: navbar (signed in) + sidebar (5 tabs) + translucent content card + FAB + footer.
- `tool`: navbar (signed in) + page, no sidebar; footer unless `data-footer="0"`.
- `bare`: no navbar, no footer (checkout success).
- `full`: page owns the viewport. Defined, but **no page uses it**.
- Body classes the router sets: `signed-in` (any app frame), `qt-nonav` (bare/full), `qt-nofoot` (bare/full/`data-footer="0"`), `qt-f-{frame}`, `in-app`.

**Out of scope, flagged (builder / catalogue screens):** the builder, the public catalogue page, the AI chat and the create-catalogue flow are not pages here. The prototype shows them only as illustrations or stubs:
- Home hero image (builder + phone catalogue screenshot), the "Try AI" button linking to `https://www.quicktalog.app/admin/create/ai`, and the home before/after preview chips.
- Showcases: screenshots of live public catalogues.
- The docs and articles `g2-mock` illustrations: builder, item editor, categories, Add Section, AI chat, settings tabs, themes, style controls, header/footer, publish success, create dialog, limit lock, and the mini catalogue page `.g2-m-cat-page`.
- Dashboard catalogue cards: "Edit" and "Continue Editing" only toast "The builder opens here in the app"; "View Catalogue" links to `#demo`; the "Create a Catalog" dialog ends at a toast instead of opening the builder.

---

## 1. Design tokens

### 1.1 Fonts
```css
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
--f-head: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;  /* h1–h4, prices, numbers, card titles */
--f-body: 'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif;        /* everything else */
```
- Weights loaded: Inter Tight 400/500/600/700; Plus Jakarta Sans 600/700/800.
- Weights used: 400, 500, 600, 650 (×11), 700, 750 (×2 in `font:` shorthands), 800. **650 and 750 aren't loaded**, so the browser rounds them. Use a variable font or snap them to 600/700.
- Monospace (URLs, versions, hex values, code): `ui-monospace, SFMono-Regular, Menlo, monospace`.
- Mock-only serif: `Georgia, 'Times New Roman', serif`, used for sample catalogue branding.
- Icons are an inline SVG sprite (`<symbol id="i-…">`, Feather/Lucide style, 24×24), rendered with `.ico{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}`. Lucide React maps onto these directly.

### 1.2 Custom properties (`:root`)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#FAF8F3` | page background (warm off-white) |
| `--bg-alt` | `#F4F1EA` | subtle fills, hover backgrounds, footer, table header |
| `--card` | `#FFFFFF` | cards |
| `--line` | `#ECE7DC` | default borders |
| `--line-strong` | `#DCD5C6` | input borders, dashed borders |
| `--ink` | `#16140F` | primary text |
| `--ink-2` | `#5E584D` | secondary text |
| `--ink-3` | `#7A7466` | tertiary/meta text |
| `--amber` | `#FFB020` | brand primary (buttons, accents) |
| `--amber-hover` | `#F5A300` | primary hover, toggles "on", range thumbs |
| `--amber-ink` | `#8A5A00` | amber text on light (eyebrows, icons) |
| `--amber-soft` | `#FFF4DC` | amber tint backgrounds, active nav |
| `--amber-tint` | `rgba(255,176,32,.14)` | defined but unused |
| `--navy` | `#010e58` | focus ring, secondary "navy" button, footer link hover |
| `--red` | `#C8322B` | errors, danger |
| `--red-soft` | `#FDECEA` | error backgrounds |
| `--r-card` | `22px` | card radius |
| `--r-lg` | `28px` | large panels, dialogs |
| `--shadow` | `0 1px 2px rgba(22,20,15,.04), 0 4px 12px rgba(22,20,15,.05), 0 16px 32px -12px rgba(22,20,15,.08)` | cards |
| `--shadow-hover` | `0 2px 4px rgba(22,20,15,.05), 0 10px 24px rgba(22,20,15,.08), 0 28px 48px -16px rgba(22,20,15,.14)` | hover, popovers, dialogs |
| `--shadow-amber` | `0 6px 18px -6px rgba(245,163,0,.55)` | primary buttons, amber chips |
| `--gutter` | `20px` | horizontal page padding |
| `--q-ok` / `--q-ok-soft` | `#1E8A4C` / `#E6F4EC` | scoped to `.g5q` (QR editor success) |
| `--ai-a` | `@property` angle | animated conic border of the AI card |
| `--g2p`, `--p`, `--v`, `--i` | runtime | reading-progress scale, range fill %, mock slider %, QR tab index |

`color-scheme: light`.

**Hard-coded colours to turn into tokens** (they repeat across groups):
- Success green: `#1F7A4A`, `#1F9D55`, `#1B7040`, `#2F9E5B`, `#1E7A45`, `#1E8A4C`; backgrounds `#E4F4EA`, `#E7F6EC`, `#E3F6EA`, `#F0FAF3`. Use `#4ADE80` for checks on dark.
- Info blue (status "In preparation"): `#2748A8` on `#E8EEFC`. Navy tints: `#F3F4FA`, `#EEF1FB`, `#F5F6FB`, `#F2F4FB`.
- Dark surfaces: CTA band `#0E0D0A`; AI card `#15130E`, inner `#1F1C16`; light amber on dark `#FFC75A`; muted text on dark `#CFC8BA`, `#D6D1C6`, `#E7E3DA`, `#A79F90`, `#D9D2C4`.
- Amber extras: `#FFFAEE` (popular column), `#FFEBC2`, `#FFE7B3`, `#FFF1D2`, `#FFFBF1`, `#FFF6E2`. Chart line `#D48A00`; QR default eye `#C77F00`.
- Password meter: red, then `#E4801B`, then amber, then `#2F9E5B`. Alert text `#8E1F1A`; red hover `#A9261F`; warning text `#6B4700`; toast error icon `#FF8A80`; placeholder `#A39D90`; input hover border `#C9C1B0`; table row hover `#FFFCF5`.

### 1.3 Radii
Pill `999px` (buttons, chips, nav, inputs in the footer and help). Cards 22 (`--r-card`), large panels 28 (`--r-lg`), CTA band 36. Popovers 20–22, the mobile sheet 26. Inputs 14 (g1, g3, `as-`) or 12 (g5). Small tiles 11–16.

### 1.4 Layout
- `.wrap{max-width:1280px;margin:0 auto;padding:0 var(--gutter)}`. The nav pill max width is 1240.
- Breakpoints used: 380, 420, 480, 520, 560, 600, 640, 700, 768, 860, 880, 900, 1024 (main desktop switch), 1100, 1200, 1240, 1280. Keep to Tailwind `sm 640 / md 768 / lg 1024 / xl 1280`, plus 1100/1240 where layout depends on them.
- Z-index: nav 50, dropdown 52, sheet 51, sheet backdrop 48, FAB 45, reading progress 60, toasts 140, prototype switcher 90/91.
- Safe-area insets are used on the nav, footer, FAB and toasts.

### 1.5 Type scale
Body is 16px/1.6 in `--f-body`. Headings use `--f-head` with `letter-spacing:-.025em;line-height:1.12`.

| Role | Class | Size |
|---|---|---|
| Home hero h1 | `.hero h1` | `clamp(36px,5.4vw,62px)` / 800 / -.035em / 1.06 |
| Page hero h1 (marketing) | `.g1-h1` | `clamp(34px,5.2vw,60px)` / 800 / 1.06 / balance |
| Resources hero h1 | `.g2-h1` | `clamp(34px,5.2vw,58px)` |
| Legal h1 | `.g3-lh1` | `clamp(34px,5vw,58px)`, max 18ch |
| Article h1 | `.g2-art-hero h1` | `clamp(30px,4.6vw,52px)` |
| Doc h1 | `.g2-dochero h1` | `clamp(32px,4.4vw,48px)` |
| 404 heading | `.g3-nf-h` | `clamp(32px,4.6vw,50px)`; big digits `clamp(116px,24vw,232px)` |
| Section title (h2) | `.sec-title` | `clamp(30px,4.2vw,50px)` / 800 / -.03em |
| CTA band h2 | `.cta h2` | `clamp(28px,4.4vw,50px)` |
| Benefit h3 | `.benefit-text h3`, `.bf-top h3` | `clamp(30px,3.6vw,46px)` |
| g1 h2 / h3 | `.g1-h2` / `.g1-h3` | `clamp(26px,3vw,36px)` / `clamp(21px,2.2vw,26px)` |
| Prose h2 (docs/articles) | `.g2-prose h2` | `clamp(24px,2.6vw,30px)`; h3 19px |
| Legal section h2 | `.g3-lsec h2` | `clamp(22px,2.4vw,27px)` |
| Auth title | `.g3-title` | `clamp(26px,3.2vw,32px)` |
| App h1 | `.as-h1` | `clamp(24px,3vw,32px)` / 800 |
| App h2 / h3 | `.as-h2` / `.as-h3` | 20px/750 · 16.5px/700 |
| Tool h1 | `.g5-ph-head h1` / `.g5q-title h1` | `clamp(26px,3.2vw,34px)` / `clamp(28px,3.6vw,40px)` |
| Lead | `.hero-lead` / `.g1-lead` / `.g2-lead` | `clamp(17px,1.6vw,20px)` / `clamp(16.5px,1.5vw,19px)` |
| Section description | `.sec-desc` | `clamp(16.5px,1.4vw,18.5px)`, ink-2, 1.65 |
| Prose body | `.g2-prose`, `.g3-prose` | 17px / 1.75, max 720px / 70ch |
| Card title | various | 17–19px / 700 |
| Eyebrow | `.eyebrow` | 14px / 700 / `font-variant-caps:all-small-caps` / .14em / amber-ink |
| Small caps labels | `.feat-label`, `.g3-toc-h`, `.g2-takeaways-h` | same small-caps treatment, 15px |
| Uppercase micro labels | `.g2-tag`, `.ba-topic`, table heads | 12–12.5px / 700 / .06–.1em / uppercase |
| App base | `#app-shell .page` | 15px / 1.55 |

### 1.6 Dark mode
**There is none.** No `prefers-color-scheme` rules, and `color-scheme: light` is set explicitly. Dark surfaces appear only as components: the `.cta` band, the `.ai-x` card, `.g2-cover--ai`, toasts and tooltips.

### 1.7 Motion
- Reveal-on-scroll: `.rise` elements get `.in` from an IntersectionObserver (rootMargin `-8%` bottom; skipped for anything already in view) and play `rise` (translateY 18px to 0, `.7s cubic-bezier(.2,.7,.2,1)`). This is transform-only; **content is never hidden**.
- Buttons lift `translateY(-2px)` on hover, go to `scale(.98)` when active, and move their arrow icon 3px right (`.btn-arrow`). Cards (`.card.lift`) lift `-4px` with `--shadow-hover` on hover.
- Popover enter animations: dropdown `ddIn .18s`, sheet `sheetIn .22s`, dialog `asDlg .2s` (translateY 10px + scale .98), toasts `asPop .2s` / `g5Up .22s`, menus `.14s`.
- Decorative loops: AI card conic border (`aiSpin 7s linear infinite`), AI caret blink, pulse dots (`aiPulse`, `g2Pulse`, `g1ScxPulse`), 404 bobbing "O" (`g3bob 3.6s`), QR scan line (`g5qScan 3.4s`), and the spinner on "in preparation" catalogues.
- One-shot animations: checkout success draws disc, ring then tick; auth "done" icon pops (`g3pop .45s`).
- Lottie players (`lottie_light` 5.12.2, SVG renderer) play only while in view (threshold .15). With reduced motion they freeze on a rest frame.
- **Reduced motion:** a global rule cuts animation/transition to `.01ms` and one iteration and disables smooth scroll. Individual components also opt out, and the JS (typing effect, Lottie, simulated delays) checks `prefers-reduced-motion` too.
- `html{scroll-behavior:smooth}`.

### 1.8 Focus
- Global: `:focus-visible{outline:3px solid var(--navy);outline-offset:3px;border-radius:12px}`, with `border-radius:999px` on `.btn`.
- Inputs don't show an outline. Focus is a border colour change to amber plus an amber ring: `box-shadow:0 0 0 4px rgba(255,176,32,.2–.25)`. Invalid inputs get a red border and a red ring at `.1–.15`.
- The showcases list and stage use a 3px amber outline, inset (offset -3px). Switches, swatches and ranges use the navy outline with a 2px offset.

---

## 2. Shared primitives

### 2.1 Buttons (`.btn`)
Base: inline-flex, gap .55em, pill, `font-weight:600`, `line-height:1.1`, `border:1.5px solid transparent`, no wrap. Transitions on transform, shadow, background, colour and border (.2s).

| Variant | Styles |
|---|---|
| `.btn-primary` | amber bg, ink text, `--shadow-amber`; hover `--amber-hover`, -2px, `0 10px 24px -8px rgba(245,163,0,.65)` |
| `.btn-outline` | white bg, ink text, amber border; hover `--amber-soft` |
| `.btn-navy` | white bg, navy text, `rgba(1,14,88,.22)` border; hover navy border, `#F5F6FB` |
| `.btn-ghost-light` | transparent, white text, `rgba(255,255,255,.85)` border; hover white bg, ink text (for dark bands) |
| `.as-btn-red` | red bg and border, white text; hover `#A9261F` |
| `:disabled` (app) | opacity .45, not-allowed, no transform or shadow |

Sizes: `.btn-lg` 56h / 0 32px / 17px / min-width 224; `.btn-md` 44h / 0 22px / 15px; `.btn-sm` 36h / 0 16px / 14px. Nav auth buttons are 42h / 14.5px, auth submit (`.g3-submit`) is 50h full width, the footer subscribe button is 46h full width.
Modifiers: `.btn-arrow` (trailing arrow icon that nudges on hover). Buttons go full width below 480px in CTAs.
Busy state (auth): `aria-busy="true"`, label swapped to `data-busy` text ("Signing in…"), and a 17px spinner (`.g3-spin`, 2.5px border, `.7s` rotation).

### 2.2 Cards
- `.card`: white, 1px `--line`, radius 22, `--shadow`. Add `.lift` for the hover lift.
- `.as-card`: the same values inside the app. `.as-cat`: catalogue card with 18px padding.
- `.g5-kpi.card`, `.g5q-prev` (radius 28, `--shadow-hover`).
- Highlight treatment (popular / "after" / featured): `border-color:rgba(255,176,32,.55–.8)` plus a halo `0 0 0 5–6px rgba(255,176,32,.07–.12)`.
- Amber gradient panels: `linear-gradient(160deg,#FFF4DC 0%,#FFFBF2 45%,#fff 100%)` (takeaways, featured doc card, legal contact, benefit panel). Horizontal "mini" CTA: `linear-gradient(100deg,#fff 0%,#FFF6E2 55%,#FFE7B3 100%)`.

### 2.3 Badges, pills, chips, tags
| Class | Look | Where |
|---|---|---|
| `.badge` + `.badge-dot` | white pill, 13.5px/600, amber 22px dot with icon (or Lottie sparkle) | home hero kicker |
| `.g2-kicker` | same as `.badge` | resources heroes |
| `.eyebrow` | small-caps amber-ink text | section/hero kickers |
| `.ai-kicker` | uppercase 12.5px, `#FFC75A` on `rgba(255,176,32,.12)`, amber border | dark CTAs and the AI card |
| `.g2-tag` / `.ba-topic` | uppercase 12–12.5px, amber-ink on amber-soft pill | article/doc category, problem topic |
| `.pop-badge` / `.g1-free-badge` / `.g2-latest` / `.ai-chip` / `.g2-cv-chip` | amber pill with `--shadow-amber` | "Most popular", "Free forever", "Latest" |
| `.ba-pill.bad` / `.good` | red on red-soft / ink on amber | Before/After |
| `.step-chip` | amber-ink on amber-soft, 13px | how-it-works steps |
| `.pv-chip` (`.on` ink, `.ai` amber) | small preview chips | home preview |
| `.g2-chip` (+ `.g2-chip-n` count) | 40h pill, white; pressed = ink bg, white text | filters (help, articles, release chips) |
| `.g2-badge--new` / `--improved` / `--fixed` | amber-soft / navy tint / white-outline, 26h | release notes |
| `.g2-ver` | ink pill, monospace 13px | version tag |
| `.as-badge` + status: `.as-st-active` (green), `.as-st-draft` (amber), `.as-st-inactive` (grey), `.as-st-prep` (blue), `.as-st-error` (red), `.as-b-green` | 24h uppercase 11.5px | catalogue/plan status |
| `.as-chip` (`-amber`, `-red`) | 24h, 12px/700 | "Near limit" |
| `.g5-pro`, `.g5-new` | 20h, 11px; pro = amber, new = navy tint | "New" on QR frame text (`.g5-pro` defined but unused) |
| `.g5-live`, `.g5q-live`, `.pv-live` | green dot with ring + label | "Live" |
| `.g3-num` | amber-soft chip, 12.5px/800 | legal section numbers |

### 2.4 Section header
`.sec-head{text-align:center;max-width:780px;margin:0 auto 48px}` holds an optional `.eyebrow`, then `h2.sec-title`, then `p.sec-desc`. Sections use `.section{padding:64px 0}`, and 96px at 1024 and up.

### 2.5 Heroes
- Home `.hero`: 90vh, grid background (44px lines at `rgba(22,20,15,.045)` masked by a radial gradient), amber blurred blob (520px, blur 120), bottom fade. Two columns at 1024 and up.
- Marketing `.g1-hero` (`--center`, `--short`): top padding 120 (150 at 1024+), same grid, blob and fade.
- Resources `.g2-hero` (`--left` variant for release notes) with `.g2-hero-bg`.
- Legal `.g3-lhero`: amber-soft vertical gradient and a bottom border.

### 2.6 Forms and inputs
Three input families share the same look (white, `--line-strong` border, amber focus ring). Build one.
- Marketing contact `.g1-input`: 52h, radius 14, right-aligned 17px icon inside, textarea min 150, `aria-invalid` gives red border and `#FFFCFB` bg. Label 14.5/600; required mark `.g1-req` (red *); `.g1-opt` "(optional)"; error `.g1-err` 13.5 red (hidden when empty); counter `.g1-count` "0 / 2000".
- Auth `.g3-field`: 48h, radius 14, **1.5px** border, placeholder `#A39D90`, hover `#C9C1B0`. Password wrapper `.g3-pw` has an eye toggle (40px round, `aria-pressed`, swaps eye / eye-off). Strength meter `.g3-meter` is 4 bars × 5px, `data-level` 1–4 (red, orange `#E4801B`, amber, green `#2F9E5B`), labelled "Too weak / Fair / Good / Strong". Form-level alert `.g3-alert` (red-soft, `#8E1F1A` text, icon). Hint `.g3-hint` 13px ink-3.
- App `.as-input`: min 46h, radius 14, 15px/500. `select.as-input` gets a chevron data-URI background. `textarea` min 130. Read-only/disabled uses a monospace 13.5px bg. Field wrapper `.as-field` (label span 13.5/650). Hint `.as-hint` with `.ok` green or `.err` red. Grid `.as-form-grid` is 1 column, 2 at 640+, 3 with `.as-form-3`; `.as-span2` spans full width.
- Tool `.g5-f`: 40h, radius 12, 14px.
- Search `.g2-search input`: 60h pill, left icon, round clear button, `--shadow`.
- Newsletter (footer) `.f-news input`: 48h pill.

### 2.7 Toggles and segmented controls
- Billing toggle `.toggle`: 260px pill, 4px padding, sliding amber thumb (`transform:translateX(100%)` when `data-cycle="yearly"`), buttons use `aria-pressed`.
- App segmented `.as-seg`/`.as-seg-b` and tool `.g5-seg`/`.g5-seg-b` (radius 12; pressed = white bg + shadow; used as `role=radio` with `aria-checked`).
- Auth tabs `.g3-tabs`: 2-column pill, active `aria-current=page` white with shadow. Legal tabs `.g3-ltabs`: active amber-soft.
- Switch `.g5q-sw` (44×26, knob 20, on = `--amber-hover`) and `.g5-sw` (40×24): a visually hidden checkbox with the focus ring on the track.
- Range `.g5q-range`: 6px track filled via `--p`, 22px white thumb with amber border, and an `output.g5q-val` chip.
- Tabs with a sliding indicator `.g5q-tabs` + `.g5q-ind` (moved by `--i`, with a 26×3 amber underline). Simple tabs `.g5-tabs`.
- Option tiles (`role=radio`) `.g5q-opt`: 52px glyph tile; checked = amber border, 3px amber ring, amber-soft glyph bg, and an amber check badge top-right.

### 2.8 Dialogs
- Marketing `dialog.info-dlg`: radius 24, 28px padding, max 440, backdrop `rgba(22,20,15,.35)` + blur 3px. Holds a title, text and a full-width "Got it!". Used for pricing feature explainers (the `.info` "i" buttons). It opens with `showModal`, closes on backdrop click, and returns focus to the button that opened it.
- App `dialog.as-dlg` (max 600) / `.as-dlg-sm` (max 440): inner `.as-dlg-in` has radius 28, 24px padding, gap 14, backdrop `.42` + blur 4, `asDlg` animation. Parts: `.as-dlg-head` (title + 40px close icon button), `.as-dlg-ic` (46px icon tile; `.as-ic-red`, `.as-ic-green`), `.as-dlg-foot` (buttons right-aligned, stacked on mobile). Focus goes to the first field on open and back to the opener on close; backdrop click and `[data-close]` both close it.
- Dialog sub-parts: `.as-url` (dashed box showing the resulting URL), `.as-compare` (Current plan → Required plan, big numbers), `.as-get` (amber-soft box with a `.as-ticks` checklist).

### 2.9 FAQ accordion (`.faqs` > `.faq`)
- Container max 896px, gap 14. Item: white, radius 20, soft shadow; `.open` adds an amber border and `--shadow`.
- The question is an `<h3>` containing `button.faq-q` (17px/600, padding 20/22) with `aria-expanded`/`aria-controls` and a 34px round icon `.faq-ic` (plus, or minus when open; the icon rotates 180° and turns amber).
- The answer is `.faq-a[role=region][hidden]`, 16px ink-2, line-height 1.7.
- Home: 5 visible and 7 `data-extra hidden`. "Load More Questions" reveals the rest with a staggered rise, removes itself and focuses the first new question.
- Help: search highlighting with `<mark>` (amber 35% bg).

### 2.10 Tables
- `.g1-cmp` pricing comparison: min-width 760 in a horizontally scrollable, focusable region. First column is sticky (150px, 260 at 768+). The popular column has `#FFFAEE` bg, and its header is amber-soft with a 3px amber top inset plus a "Most popular" micro label. Group rows are small caps on `--bg-alt`; they read like headings, not table data. Yes = amber 22px circle with a check (sr "Included"); No = "–" in `--line-strong` (sr "Not included"). Footer row holds a CTA per plan. Hint "Swipe the table to see every plan" shows below 1024.
- `.g2-table` (articles/docs): min-width 560, uppercase grey header on `--bg-alt`, `.hl` column amber-soft.
- `.as-table` (app): min-width 460, uppercase 12px header on `--bg`, row hover `#FFFCF5`.
- `.g5-table` (analytics): right-aligned numbers, a bar column (`.g5-bar`, amber fill), and a "Busiest" tag on the best row via `::after`. The last column is hidden below 520.

### 2.11 CTA band (`.cta`)
- Radius 36, padding 72/22 (88/40 at 640+), bg `#0E0D0A`, white centred text. Masked grid (6rem × 4rem) plus an amber radial glow at the bottom.
- Contents: optional `.ai-kicker` or Lottie (home), h2, p (18px `#E7E3DA`), `.cta-checks` (green `#4ADE80` check items), `.cta-trust` (amber icons), and `.cta-btns` (primary lg + ghost-light lg). Resources add `.g2-cta-fine` (three green-check items: "No credit card · Free forever plan · Setup in under 2 minutes").
- Lighter CTAs: `.ba-cta` (white card, row at 880+), `.mini` (amber gradient strip, "Need something custom?"), `.g1-dm-cta` (slim bar), `.g2-midcta` (in-article), `.as-cta` (app "UpgradePlanCTA": amber-soft gradient, amber round icon, text, small primary button), `.g2-docs-help`, `.g3-contact`.

### 2.12 Empty states
- Articles `.g2-empty` "No articles in this category yet."
- Help `.g2-empty.card`: icon tile, `No answers match "<q>"`, "Try a shorter word, browse the docs, or ask us directly.", then "Show all questions" (outline sm) and "Contact us" (primary sm).
- Dashboard `.as-empty-line`: dashed 1.5px border card, "No catalogues created yet."
- Newsletter `.as-news-empty`: mail icon, "No newsletter subscribers yet."
- 404 page.

### 2.13 Toasts
- App `.as-toasts`: fixed bottom centre (88px above the bottom on mobile, 28px from 768 up), max 420 wide. Each `.as-toast` is ink bg, white 14px text, amber check icon (error variant `#FF8A80` alert icon), optional amber action pill ("View"), and auto-hides after 3.4s.
- Tool `.g5-toasts`: 3 at most, 3.2s (6s when there's an action), optional action button.

### 2.14 Popover menus
- Nav dropdown `.dd-panel`: 340 wide, radius 22, 8px padding, centred under the trigger, with a 14px invisible hover bridge. Items `.dd-item` have a 36px amber-soft icon tile (turns amber on hover), a bold title and a 13px description.
- User menu `.qt-um-panel`: 250 wide, radius 20. Holds an identity block, links and an `hr`.
- Catalogue menu `.as-menu`: 220 wide, radius 18, `role=menu`. Items are 40h; there's an inline submenu `.as-submenu` (left border, indented), separators, and `.as-danger` items.

### 2.15 Other shared bits
- Stats: `.as-stat` (label, info button, 28/32px value, icon tile bottom-right), `.g5-kpi`, `.g2-stat`.
- Icon tiles: `.g2-ico-tile` (46px, radius 14, amber-soft; `.sm` is 38), `.as-stat-ic` (36px), `.bullet-ico` (48), `.bf-ico` (52), `.g1-info-ic` (44), `.dd-ico` (36). **Standardise on 3–4 sizes.**
- Links: underline with `text-decoration-color:rgba(255,176,32,.8)`, thickness 2px, offset 3–4px (`.g1-link`, `.g2-link`, `.g3-consent a`, prose links); hover turns amber-ink. App links `.as-link` are amber-ink.
- Stepper: `.g2-steps` (dashed amber vertical line, 36px amber numbered circles with a `--bg` ring, white step cards). Home flow `.steps.flow` (dashed line, horizontal at 900+).
- Callouts: `.g2-callout--tip` (amber), `--note` (navy tint), `--warning` (red); `.g3-callout` (amber) / `.g3-callout-red`.
- Breadcrumbs `.g2-crumbs`, back links `.g2-back` / `.g3-back` / `.g5q-back`.

---

## 3. Shells

### 3.1 Public navbar (`.nav-shell` > `nav.nav#nav`)
- Fixed and floating. `.nav-shell` has 9px top padding (+ safe area) and 12px sides. `.nav` is a **pill**: max 1240, 64h, radius 999, `rgba(255,255,255,.8)`, `backdrop-filter:saturate(1.6) blur(14px)`, 1px `rgba(22,20,15,.08)` border. Once `scrollY > 8` it gets `.scrolled` (stronger shadow, .9 alpha).
- Left: logo (webp, 38px tall) linking home.
- Desktop (1024+) `.nav-links`: nav items are 40h pills, 15px/500, ink-2; hover `--bg-alt`; active amber-soft + 700 + amber border.
  1. **Product ▾** dropdown:
     - Live demo: "Open a real catalogue and click through it" → `#demo` (icon play-circle)
     - Showcases: "Menus, service lists and product catalogues people published" → `#showcases` (layout)
     - How it works: "Sign-up to shared QR code, in four steps" → `#how-it-works` (home anchor; trend icon)
  2. **Resources ▾** dropdown:
     - Docs: "Step-by-step guides, from first catalogue to analytics" (book)
     - Articles: "QR menus, AI catalogues, digital vs. printed" (file)
     - Help Center: "FAQs and quick answers" (help)
     - Release Notes: "What's new, improved and fixed" (bell)
  3. **Pricing** (tag icon) → `#pricing`
  4. Logged out `.nav-auth`: "Log In" (outline, user icon) → login; "Start free" (primary, user-plus) → signup.
  5. Signed in `.nav-auth-in`: "Dashboard" nav link + avatar button `.qt-um-btn` (42px circle, amber-soft, 2px amber border, initials "MR"). Its menu: name + email, Dashboard, Account (→ settings), then after a divider, Sign out.
- Dropdown behaviour: opens on click or hover (hover only on `(hover:hover)` devices, 140ms close delay); ignores a close click within 400ms of opening; Esc closes and refocuses the trigger; outside click closes; the chevron rotates; the trigger shows the active style while open. Uses `aria-expanded`/`aria-controls`/`role=menu`.
- Mobile (<1024) `.nav-mobile`: "Start free" primary (hidden when signed in) and a 44px burger that toggles a menu/x icon and its aria-label.
- **Mobile sheet** `#sheet`: panel below the nav (radius 26, max height `100vh-110px`, scrollable) with a blurred backdrop. Contents: Home (active), a "PRODUCT" heading (Live demo, Showcases, How it works), a "RESOURCES" heading (Docs, Articles, Help Center, Release Notes), a "MORE" heading (Pricing), then a 2-column auth row (Log In / Start free). When signed in: Dashboard, a user card (avatar + name + email), Account, Sign out. Closes on backdrop click, on any link click, or on Esc (focus returns to the burger).
- Hidden for bare/full frames.

### 3.2 Footer (`footer.footer`)
- `--bg-alt`, top border, padding 64 / 32 (+ safe area), margin-top 48.
- Grid: 1 column; 2 columns below 768 (brand and newsletter span full width); `1.2fr 1fr 1fr 1.3fr` at 768+.
  1. **Brand**: logo (44h), "Empowering businesses to go digital with interactive catalogues.", then 44px social tiles: LinkedIn (company page), Email (mailto quicktalog@outlook.com), Website (home).
  2. **Product**: Live demo, Showcases, Pricing, How it works, Create a catalogue.
  3. **Resources**: Docs, Articles, Help Center, FAQ (`#faq`, home anchor), Release Notes.
  4. **Stay Updated** (newsletter): "Subscribe to our newsletter for the latest updates and features." Then an email input (48h pill), "Subscribe" (primary, full width, 46h), a live note line, and a "Contact us" link with an amber underline.
- Column links hover to navy and reveal an external-link icon. That icon is misleading, since these are internal links.
- Bottom bar: "Copyright © {year} Quicktalog. All rights reserved." and legal links (Terms & Conditions, Privacy Policy, Refund Policy, Sitemap → `https://www.quicktalog.app/sitemap.xml`). Stacked centred on mobile, a row from 768 up.
- Newsletter validation: an empty or invalid email shows "Please enter a valid email address."
- Hidden on bare/full frames and on pages with `data-footer="0"` (demo, app-analytics).

### 3.3 App / dashboard shell (`#app-shell`, frame `dash`)
- Uses the public navbar in its signed-in state and the same footer. No separate topbar.
- `.as-wrap`: max 1280, padding `96px 16px 56px` (768+: 112/24/72; 1024+: 120/32/88), flex with gap 24/28. The dash frame adds an amber blurred blob at top right.
- **Sidebar** `.as-side` (768+, sticky top 96): 224px white card, radius 22, 12px padding. Tabs `.as-tab` are 46h, radius 14, with a 19px icon and 15px/500 label; active is amber-soft, amber border, 700, amber-ink icon, and scales 1.03 on hover. Items (`data-route`):
  1. Overview (analytics-doc icon) → `app-dashboard`
  2. Subscription (calendar) → `app-subscription`
  3. Usage (bar chart) → `app-usage`
  4. Settings (gear) → `app-settings`
  5. Support (help) → `app-support`
- **Content card** `.as-panel`: `rgba(255,255,255,.72)`, radius 28, `--shadow`, padding 16 / 28 / 36.
- **Mobile (<768)**: the sidebar is hidden. A horizontally scrollable pill tab bar `.as-mtabs` sits at the top of the panel (40h pills, active amber-soft/amber border) and auto-scrolls to keep the active tab centred.
- **FAB** `.as-fab` (dash frame only): fixed bottom-right, 60px amber circle with a plus icon and amber glow; on hover it rotates 90° and lifts. Label "Create catalogue". It opens the Create dialog, routing to the dashboard first if needed, or the upgrade dialog when at the limit.
- App links like Analytics or QR go to `tool`-frame pages. Those have the signed-in navbar and no sidebar, and give their own back link ("Back to dashboard" on QR; analytics has none).
- **Routes:** the prototype's `#app-*` hashes map to the real `/admin/...` routes (the docs mocks show `quicktalog.app/admin/dashboard`, `/admin/{slug}/builder`, `/admin/{slug}/analytics`).

### 3.4 Auth shell (`.g3-auth`)
- Full-height section (min 100vh at 1024+), padding 120/72 (132/88 at 1024+). Faint masked grid plus a large centred amber radial glow (`.g3-glow`).
- A single centred card `.g3-card`: max 460, radius 22, layered shadow `0 24px 60px -28px`, padding 28/22 (40/40/42 at 480+).
- Login/signup: pill tabs "Sign in | Create account" at the top of the card, and a switch line under the card ("New to Quicktalog? Create a free account").
- Solo variants (`.g3-solo`: forgot, reset, confirm): no tabs; a 52px amber-soft icon badge above the title.
- Each card has two views, `data-g3-view="form"` and `"done"`. Done shows a 68px amber circle icon with a pop animation and an amber-soft ring, gets focus, and is announced.
- The public navbar and footer stay visible on auth pages.

### 3.5 Docs / articles / legal shells
**Doc page** (`.g2-doc`):
- Fixed 3px amber **reading progress** bar at the very top (`.g2-progress`, scaleX by `--g2p`, computed over `.g2-prose`).
- Grid: 1 column; `250px | 1fr` at 1024+; `250px | 1fr | 210px` at 1240+.
- **Left nav** `.g2-docnav` (sticky top 100, scrollable): heading "GUIDE", 8 links (28px icon tile + title; active amber-soft with an inset amber ring and amber icon tile, `aria-current=page`), then "Still stuck? Visit the Help Center".
- Main column, in order:
  1. Breadcrumbs "Docs › {title}".
  2. Mobile disclosures (`<details>`): "Browse all docs · Part N of 8" and "On this page". They close after a link is clicked.
  3. `.g2-dochero`: icon tile + tag, h1, summary, meta "Part N of 8 · X min read", bottom border.
  4. `.g2-prose` content.
  5. "Was this helpful?" widget (Yes/No navy sm buttons with `aria-pressed`; replies "Thanks for letting us know. Glad it helped." or "Sorry about that. Tell us what was missing…" with a contact link).
  6. Prev/Next pager cards.
- **Right TOC** `.g2-toc` (1240+, sticky): "ON THIS PAGE" and a list with a 2px left rail; the active item (scroll-spy at 120px) is ink/700 with an amber rail; then a "Back to top" link.
- After the grid: related docs (eyebrow "Keep going", h2 "More from the docs", 3 `g2-dcard`s), then the dark CTA "Ready to build yours?".

**Article page** (`article.g2-art`):
- Progress bar.
- `.g2-art-hero`: back link "All articles", tag, h1, summary, byline (42px amber "Q" avatar, "The Quicktalog Team", date · read time).
- Cover banner: `.g2-cover` with radius 28, min height 240/360; its illustration is scaled 1.45× at 768+.
- `.g2-prose` body. It spans the full container width per the late override, **not** 720px.
- Author box ("Written by" · "The Quicktalog Team" · blurb · "Try Quicktalog" outline button).
- Related: eyebrow "Keep reading", h2 "More guides for you", 3 article cards.
- Dark CTA "Launch your first interactive catalog today" (kicker "Free forever plan available"; buttons "Create free catalog" and "See demo").
- Articles have **no sidebar or TOC**.

**Prose components** (`.g2-prose`): lead paragraph `.g2-lead-p`, h2 with `scroll-margin-top:104px`, amber-dot bullet lists, `.g2-takeaways` (flag icon, "Key takeaways", amber check bullets), `.g2-stats` (3 columns at 560+; big number + caption), `.g2-steps`, `.g2-callout--tip/note/warning`, `.g2-quote` (4px amber left border, 800-weight head-font quote, "— caption"), `.g2-bars` (horizontal bar comparison; `.hl` row amber with a dot), `.g2-pc-grid` (pros card with amber border / cons card dashed grey), `.g2-table-wrap`, `.g2-midcta`, `.g2-mock` (illustration figure + caption).

**Legal page** (`.g3-legal`):
- `.g3-lhero`: legal tabs (Terms / Privacy / Refund), eyebrow "Legal", h1, meta pills (clock "Last updated {date}", book "{n} min read", list "{n} sections").
- `.g3-lbody` grid: `260px | 1fr` at 1024+ (gap 64).
  - TOC: mobile `<details>` "On this page"; desktop sticky list with a left rail; active item gets an amber rail + amber-soft gradient (IntersectionObserver, rootMargin `-110px 0 -65% 0`, `aria-current=location`).
  - `.g3-prose` (max 70ch) with numbered `.g3-lsec` sections.
- Contact box at the end: "Questions about this policy?" plus Email us and Contact page buttons.

---

## 4. Pages

Unless noted, each marketing/resources page ends with the footer.

### 4.1 `home` (Public)
Purpose: landing page. Sections in order:
1. **Hero** (`.hero`): badge with a sparkle Lottie "Easy. Quick. Affordable. Everywhere."; h1 "Create a Stunning Digital Catalogue in Minutes"; lead "The best free online catalog maker for businesses. Turn your services, menus, or products into an interactive, mobile-friendly digital catalog or price list. No code or design skills required."; props (clock "Go live in under 5 minutes", smartphone "Works on any device", dollar "Free online catalog maker"); CTAs "Start Creating Now" (primary lg → signup) and "Try Demo" (outline lg, play icon → demo); trust ticks "No credit card required", "Start with our free plan". Right: hero image (laptop builder + phone catalogue) with an amber halo and drop shadow, bleeding off the right edge at 1024+.
2. **Benefits** (`#features`, sr-only h2 "Features"):
   - Benefit row "Go from Idea to Live in Minutes" with bullets: No Learning Curve, Instant Updates, AI-Powered Creation. Illustration plus Lottie `idea-live`.
   - Feature panel `.benefit-feature` "Look Professional, Build Trust" with 3 numbered cards: 01 Professional Catalogue Templates, 02 Mobile-First Design (`.hl`), 03 Easy Sharing.
   - Benefit row "Grow Your Business, Not Your Workload" with bullets: Real-Time Analytics, Customer Insights, Scale with Confidence. Illustration plus Lottie `growth`.
3. **Problems** (`#problems`): "Stop Losing Customers to Outdated Catalogs" / "Replace printed catalogs…". Three before/after articles (Before panel dashed grey + X list; amber arrow, rotated 90° on mobile; "With Quicktalog" panel white/amber + check list + mini preview):
   - 01 · Design, "Designing a catalog shouldn't need a designer" (preview chips Template/Coffee/Luxury/✦ AI draft)
   - 02 · Updates, "Printed prices go stale the day you print them" (price row Flat white €4.00→€4.50, "Live · updated just now")
   - 03 · Sharing, "Paper catalogs cost money and tell you nothing" (mini QR + link `quicktalog.app/catalogues/your-shop` + sparkline "Views this week")

   Then `.ba-cta`: "Switch from paper to a catalog that stays up to date." with fine print "Free forever plan · No credit card · Cancel anytime", "Start Creating Now" (primary lg, arrow) and the link "See a live demo".
4. **How it works** (`#how-it-works`): "Go Live in Minutes". Three flow steps with illustrations, number bubbles on a dashed line, and chips: 1 Register ("Free · no credit card"), 2 Build your catalogue ("By hand or with AI"), 3 Publish & share ("Link, QR code or embed"). Then a CTA "Start Creating Now" + ticks. (The nav says "in four steps"; here there are three.)
5. **AI shortcut** (`.ai`): "Or" divider heading, h3 "Let AI do the work", subtitle. Dark card `.ai-x` (spinning conic amber border):
   - Left: media (Lottie `ai-build`, "AI" chip, "Draft ready to edit" toast).
   - Right: kicker "AI catalog builder", h3 "Generate your catalog with AI", prompt box "Describe your business · AI" with **typewriter text** and chips Café / Hair salon / Boutique / Bike repair (`aria-pressed`). It autoplays through the prompts once in view and stops autoplay when a chip is clicked; clicking also replays the Lottie. Then "Try AI" (external link to `/admin/create/ai`, **builder, out of scope**) and a 3-step list: Describe, AI drafts, You edit & publish.
6. **Pricing** (`#pricing`): "Simple, Transparent Pricing". Monthly/Yearly toggle (swaps `data-m`/`data-y` prices and "/month" / "/year"). Starter row card ($0; 1 catalogue; 5 sections & 15 items; 500 views; Email support; "Get Started" navy → login). 4 tier cards: Basic $5/$49, **Pro $12/$119 "Most Popular"**, Growth $30/$299, Premium $60/$599, each with a feature list and info (i) buttons that open the explainer dialog. Then the `.mini` strip "Need something custom? We've got you covered." (Unlimited catalogs, Custom branding, Advanced analytics, Priority support), "Get Started" → contact.
7. **CTA band** (`#cta`): QR-scan Lottie, "Start With Our Free Online Catalogue Maker", checks ("Free online catalog maker", "Cancel anytime"), trust ("Launch in under 5 minutes", "Trusted by 1,000+ businesses"), buttons "Create Your Catalogue Now" / "Try the Demo".
8. **FAQ** (`#faq`): "Got Questions? We've Got Answers". 12 questions (5 shown) + "Load More Questions".

### 4.2 `pricing` (Public)
1. Centred hero: eyebrow "Pricing", h1 "Simple, transparent pricing", lead (10-day money-back), props ("No credit card to start", "Cancel anytime", "10-day money-back guarantee").
2. Monthly/Yearly toggle plus a live note ("Showing monthly prices in USD. Switch to yearly to pay once a year." / "Showing yearly prices in USD, billed once a year.").
3. **Starter card** `.g1-starter` (full width; 3 columns at 1024+: info 260 | features | CTA 220). "Free forever" badge, $0. Features: 1 catalogue, 5 sections & 15 items, 500 views, All 7 standard themes, QR code editor & shareable link, View analytics & email support. "Start free" (primary lg) plus the note "Free catalogues show a small Quicktalog badge."
4. **Tier grid** (1 / 2 / 4 columns): Basic, Pro (popular, primary CTA), Growth, Premium. Each has price, cycle and a yearly note ("Billed yearly · vs $60 paid monthly", etc.), "Get started" → signup, and features:
   - Basic adds Divider sections.
   - Pro adds 10 AI prompts and "Style controls & embed sections".
   - Growth adds 25 AI prompts, Photo & menu import, Newsletter sign-ups, Custom code sections, Email & chat support.
   - Premium adds 50 prompts, custom features on request, and priority support (email, chat, meeting).
5. Assurance line: 10-day money-back · Secure checkout by Paddle (merchant of record) · Prices in USD, local taxes may apply.
6. **Comparison** (`.g1-cmp`): eyebrow "Compare plans", "Every feature, side by side". Groups: Usage limits (Price, Catalogues, Sections, Items, Page views), Design & branding (Standard themes (7), Custom branding, Style controls), Section types (Divider, External content, Custom code), AI assistant (AI prompts/month 0/0/10/25/50, Photo & menu import), Sharing & insights (Shareable link, QR code editor, View analytics, Newsletter sign-ups), Support (Support, Custom features). Footer CTAs per plan. Then the `.mini` "Need more than Premium?" → "Talk to us" (contact).
7. **Pricing FAQ** (7): Is the Starter plan really free? / Which plans include the AI assistant? / What counts as a page view? / What happens when I reach a limit? / Can I change or cancel my plan? / How does the money-back guarantee work? / Who handles payments and taxes?
8. CTA band "Start free. Upgrade when you're ready."

Data source note: plan numbers must come from `tiers` in `@quicktalog/common`, not be hard-coded.

### 4.3 `showcases` (Public)
1. Hero: "Explore Real Catalogue Examples" + lead.
2. Viewer `.g1-scx`:
   - **Desktop (1024+)**: fixed height 660, two panes. Left `.g1-scx-side` (300px card): "CATALOGUES", "7 live examples", a numbered list (01–07, monospace numbers) with an animated amber indicator bar and a pulsing dot on the current item (`aria-current`), and a footer "Visit Catalogue" (primary, external icon). Right: a browser mock (traffic lights, URL pill with globe icon, "Open" button, scrollable stage with the full-height desktop screenshot).
   - **Mobile**: a header row with prev/next round arrows and the centred current title; the stage shows the phone screenshot; dots pager (active dot widens to 26px amber) + "Visit Catalogue" lg.
   - Behaviour: select by click, Arrow keys, Home/End, prev/next, dots, and swipe on the stage (horizontal distance > 50px or velocity > .3). Changing selection updates the URL, links and title (with a small fade/slide), resets the stage scroll, and moves the indicator.
   - Catalogues: Entre Fuego Y Tierra, Topclass Collections, M Motors Taller Y Venta De Sensores, Montre Shop, Electronic Sale, Watches Established Stock Catalog, Gonvitech (`https://www.quicktalog.app/catalogues/{slug}`).
   - Content is catalogue screenshots, so the public catalogue itself is out of scope. The live product should fetch published showcase catalogues rather than hard-coding them.

### 4.4 `demo` (Public, no footer)
1. Hero: "Discover It in Action" + lead.
2. 16:9 frame (4:5 below 600): browser bar (lock + "quicktalog.app"), a blurred ghost of placeholder content, a poster with the title "Quicktalog - Create Stunning Digital Catalogs in Minutes", "Start Tour" (primary, play icon) → Hexus embed `https://app.usehexus.com/embed/254bfe62-…` (**opens in a new tab**), hint "Interactive product tour · opens in a new tab", and a fake progress footer "1 / 30".
3. Slim CTA: "Ready to create your own catalogue?" → Get Started (signup) / Pricing.

In production the Hexus iframe probably loads inline after "Start Tour"; the prototype only links out.

### 4.5 `contact` (Public)
1. Hero: eyebrow "Contact", h1 "Contact Quicktalog", lead ("…usually reply within 1 business day").
2. Grid (`1.65fr | 1fr` at 1024+):
   - **Form card** "Send us a message" (required-fields note). Fields: Full name*, Company (optional), Email*, Subject (select: Custom Plan [default], Pricing Questions, Technical Support, Feature Request, Partnership, General Inquiry, Other), "How can we help?"* (textarea, max 2000, live counter). Footer: "By submitting, you agree to our Privacy Policy." + "Send message" (primary lg, send icon).
     - Validation on blur, then on input once invalid. Name required. Email required + regex ("Enter a valid email address, for example name@company.com."). Message required and at least 10 characters. On submit the first invalid field gets focus.
     - Success replaces the form: green circle check, "Thanks, your message is on its way!", personalised text ("Thanks, {first}. We've received your message about "{subject}" and will reply to {email} within 1 business day."), "Send another message". The success block gets focus.
   - **Aside**: Email card (quicktalog@outlook.com + "Copy" navy sm button → "Copied" green state for 2.5s, with an aria-live note), LinkedIn card (external), Help Center card, Docs card, and an amber "Need a custom plan?" note.

### 4.6 `articles` (Resources)
1. Hero: kicker "The Quicktalog Journal", h1 "Guides for going digital", lead.
2. **Featured card** `.g2-acard.feat` (row at 860+: cover 52% | body): "Editor's pick", the restaurant menu article.
3. Filter chips: All / Use cases / Guides / Comparisons (`aria-pressed`; scroll horizontally below 700). An sr-only live count ("3 articles in Guides").
4. Grid (1 / 2 / 3 columns) of `.g2-acard`s: cover (16:9 illustration + chip), tag, h3, excerpt, meta date · read time, "Read →". Empty state "No articles in this category yet."
5. Dark CTA "Stop reading, start building".

The featured article is not in the grid: the grid holds the other 5, and filtering never hides the featured card.

Article covers (CSS illustrations):

| Modifier | Illustration |
|---|---|
| `--restaurants` | tilted phone showing the mini Bean There menu, chip "Menu" |
| `--salons` | pink service list with durations, chip "Services" |
| `--ai` | dark chat bubbles, chip "Ask AI" |
| `--qr` | styled QR card "Scan for our menu", chip "Scan" |
| `--alternatives` | struck-through PDF/Canva/Flipbook/WordPress pills and an amber "Web catalogue" pill |
| `--businesses` | 4×3 icon grid |

### 4.7 Article pages (Resources)
All six share the shell in §3.5. Author: The Quicktalog Team. Components in reading order:

| Page | Tag · date · read | Sections (h2) and components |
|---|---|---|
| `article-businesses-that-need-digital-catalog`: "12 Businesses That Need a Digital Catalog (and How to Make One Free)" | Use cases · Jun 14 2026 · 7 min | lead, takeaways, stats (12 / 1 link / $0); Food and drink; Beauty and wellness; Retail and makers; quote; Property, events, and stays; midcta; Services and community; What they all have in common; tip callout "How to start free in minutes"; 5-step stepper |
| `article-create-catalog-with-ai`: "Build a Product Catalog in Minutes with AI" | Guides · Jun 17 · 6 min | takeaways, stats; Option one: describe it and let AI draft it (steps, **AI chat mock**); Option two: photograph what you already have (**photo mock**, pros/cons, tip); midcta; How the two routes compare on effort (bars: by hand ~45 min / photos ~5 / describe ~4); What it costs; Editing in the builder; Publish and share (quote); Where AI helps, and where it does not (warning callout) |
| `article-digital-catalog-alternatives`: "The Best Way to Make a Digital Catalog (vs PDF, Canva, Flipbooks, and WordPress)" | Comparisons · Jun 15 · 8 min | takeaways, bars (time to push a price change); The flat PDF; The design tool (Canva); The flipbook tools; The website builder (WordPress); The interactive web catalog (Quicktalog) (quote, pros/cons); Side by side (**comparison table**, Quicktalog column highlighted); note callout; midcta; Which should you pick?; Already have a PDF or a Canva export? |
| `article-digital-menu-for-restaurants`: "How to Create a Digital Menu for Your Restaurant (Free QR Code Menu)" | Use cases · Jun 19 · 7 min | takeaways; What a digital menu actually is (stats, phone mock); Why restaurants are making the switch (bars: yearly cost print vs digital); tip; Build your menu in four steps (steps); midcta; Make the menu sell for you (quote); Where to put the QR code; Keeping it current (note); Common questions |
| `article-digital-service-menu-salons-spas`: "The Digital Service Menu Every Salon and Spa Should Have" | Use cases · Jun 18 · 6 min | takeaways; A service menu is not a food menu (stats); Build your service catalog (steps, pros/cons, tip "The link-in-bio fix", quote, midcta); Update prices and seasonal offers without a designer; Use views to promote your best work |
| `article-qr-code-catalog-guide`: "QR Codes for Menus and Catalogs: The Complete Guide" | Guides · Jun 16 · 7 min | takeaways; A fixed destination versus a live one (pros/cons, quote); Make one in three steps (steps, **QR editor mock**); Designing a code that still scans (stats, warning callout); midcta; Where to place it; Printing tips that keep it readable; Track visits and learn from them |

Articles should be content data (MDX or JSON blocks) rendered with the prose components, not hard-coded JSX.

### 4.8 `docs` (Resources)
1. Hero: kicker "Quicktalog Docs", h1 "Learn Quicktalog, step by step", lead, **learning path** pills 1–8 (Start here, Create, Build, Customize, Share, Measure, Accessibility, Account).
2. Featured doc card (Getting Started) with a tilted mini catalogue illustration (860+).
3. Grid of the other 7 doc cards (icon tile, tag, title, summary, "Part N of 8 · X min read", "Read →"), plus a help card "Looking for a quick answer?" → "Open the Help Center" (spans 2 columns at 1024+ with an amber gradient).
4. Dark CTA "Ready to build yours?".

### 4.9 Doc pages (Resources)
Shell in §3.5. Pager chains 1→8, and "Next" on part 8 goes back to `docs`. Related cards are listed per doc.

| Doc | Tag / icon | Read | Sections and mocks |
|---|---|---|---|
| `doc-getting-started` "Getting Started with Quicktalog" | Start here / flag | 3 min | takeaways; Create your account (**signup mock**); Get to know the dashboard (**dashboard mock**, steps, tip); How the pieces fit together (**flow mock**: Create a draft, Build it, Share link & QR, Track performance) |
| `doc-create-a-catalogue` "Create Your First Catalogue" | Create / plus-circle | 5 min | takeaways; Option one: start from scratch (**create dialog mock**, which also shows "Quick Start / Standard Catalog / Start from Scratch"); Option two: ask the AI assistant (steps, **AI chat mock**, warning); Option three: import from a photo (**photo mock**); Which route to pick; midcta |
| `doc-build-and-edit` "Build and Edit Your Catalogue" | Build / edit | 5 min | **builder mock** first; lead; takeaways; Add and edit items (steps, **item mock**); Group items into categories (**categories mock**); Add content blocks (**Add Section mock**: Category/Container/Text on all plans, Divider Basic+, External content Pro+, Custom code Growth+); Let the AI assistant do the busywork (**empty AI chat mock**); Find your way around the tabs (**tabs mock**: General/Header/Footer/Appearance); note |
| `doc-customize-design` "Customize the Design" | Customize / layout | 4 min | takeaways; Pick a theme (**themes mock**: Custom, Monochrome, Elegant, Organic, Modern, Luxury, Creative, Coffee); Set fonts and colours (steps, **style mock**); Set up the header; Fill in the footer (**header/footer mock**); tip; **phone mock** |
| `doc-share-your-catalogue` "Share Your Catalogue" | Share / share | 4 min | takeaways; Publish your catalogue (**publish-success mock**: "Congratulations!…", Share / QR Code / Embed / Direct Link); Share the link (**share mock**: channels Text message, Email, Social bio, Website, Google profile; steps; **QR mock**; tip); Update any time |
| `doc-track-performance` "Track Performance with Analytics" | Measure / bar | 3 min | takeaways; What the numbers mean (**analytics mock**: Total Views 1,284, Unique 912, Most Popular Day, Avg 42.80, chart); Turn views into decisions (**loop mock**); tip |
| `doc-responsive-and-accessible` "Responsiveness & Accessibility" | Accessibility / smartphone | 3 min | takeaways; Responsive by default (**devices mock**: phone/tablet/desktop); One catalogue, every screen (tip); Accessible out of the box (**a11y mock**: keyboard focus, screen reader string, contrast); What you never have to do (note) |
| `doc-plans-and-billing` "Plans and Billing" | Account / card | 3 min | takeaways; What the free plan covers (**plans mock**, 5 plan tiles); What upgrading adds (**plans table** Plan/Price/Catalogues/Sections-items/Views/AI prompts; steps; **limit lock mock** "Upgrade Required"); note |

Nearly every mock in the docs depicts builder or catalogue UI (flag: out of scope). Build them as static illustrations (a `DocMock` component per variant) or replace them with screenshots.

### 4.10 `help` (Resources)
1. Hero: kicker "Help Center", h1 "Help Center & FAQs", lead, **search** (60h pill; `role=search`; placeholder "Search questions, e.g. QR code"; clear button appears once there's text), "Popular:" hint links (QR code, Free plan, AI assistant, Analytics) that fill the search.
2. FAQ section: h2 "Frequently asked questions" + live count ("Showing all 12 questions" / "Showing n of 12 questions"). Topic chips with counts: All 12, Basics 3, Getting started 2, Editing & sharing 2, Analytics 1, Plans & billing 2, Security & support 2. Then 12 accordion items (`data-cat`).
   - Search filters by question and answer text, highlights matches with `<mark>`, and **auto-opens** items whose match is only in the answer.
   - Chip and search filters combine.
   - Empty state with reset.
3. "Popular guides" + "All docs" link: 4 `.g2-pop` rows (Getting Started 3 min, Create Your First Catalogue 5, Share Your Catalogue 4, Plans and Billing 3).
4. `.sec-head` "Support" / "Still need help?" / "Our team typically responds within 1 business day." Three help cards: Contact us (→ contact), Read the docs, Email support (`mailto:support@quicktalog.com`, see §6).

No CTA band on this page.

### 4.11 `release-notes` (Resources)
1. Left-aligned hero: kicker with a pulsing dot "Release Updates", h1 "Release notes", lead, legend badges New / Improved / Fixed.
2. Grid (`210px | 1fr` at 1024+; main max 860):
   - Sticky left nav "RELEASES" (v2.0 May 2026, v1.0 Nov 2025; scroll-spy active) + "Want to see something in Quicktalog?" "Nominate a feature" (→ contact). On mobile these become horizontal chips at the top and a nominate line at the bottom.
   - Timeline `.g2-rn-line`: dashed amber rail, ring dots (the first is filled). Card per release: version pill, `<time>`, "Latest" badge, h2 title, summary badges (e.g. "4 New · 2 Improved · 1 Fixed"), then a list of entries with a type badge (100px min width at 640+).
     - v2.0 "Builder 2.0" (May 2026): 4 new, 2 improved, 1 fixed.
     - v1.0 "Quicktalog launches" (Nov 2025): 9 new, 2 improved, 1 fixed.
3. Dark CTA "Stop reading, start building".

The JS and CSS support a "subscribe to releases" form (`.g2-sub`, `#release-notes-form`), but **the markup is missing** (§6).

### 4.12 `login` (Account)
Card: tabs (Sign in active); "Welcome back" / "Sign in to your Quicktalog account."; "Continue with Google" (48h pill with the full-colour G logo; busy text "Opening Google…"); "OR" divider; alert slot; Email; Password with a "Forgot password?" link in the label row and an eye toggle; "Sign in" submit (busy "Signing in…"); shield line "Protected by Cloudflare Turnstile against bots."
Done view: "You're signed in" / "Welcome back, {email}. Taking you to your dashboard." / "Go to dashboard".
Switch: "New to Quicktalog? Create a free account".
Server error strings the prototype shows: "Confirm your email address first — the link is in your inbox."; "That email and password do not match an account."
Field errors: "Enter your email address." / "Enter a valid email address, like name@company.com." / "Enter your password.".

### 4.13 `signup` (Account)
Tabs (Create account active); "Create your account" / "Build your first catalogue in minutes."; Google button; OR; Full name (max 100); Email; Password (min 8, strength meter, hint "Use at least 8 characters."); "Create account" (busy "Creating your account…"); consent "By creating an account you agree to the Terms and Privacy Policy."
Done: inbox icon "Check your inbox" / "We sent a confirmation link to {email}. Open it to finish creating your account." / "I've opened the link" (outline → confirm) / "Wrong address? Start again" (resets the form).
Switch: "Already have an account? Sign in".
Server error: "That password is too weak. Use a longer one."
**No Turnstile line** here, unlike login.

### 4.14 `forgot` (Account)
Solo card, key badge: "Reset your password" / "We will email you a link to choose a new one."; Email; "Send reset link" (busy "Sending…"); "Back to sign in".
Done: "Check your inbox" / "If {email} has an account, a reset link is on its way." Tips list (single-use and expires; open in this browser; check spam), "Back to sign in", "Used the wrong address? Try another email".

### 4.15 `reset-password` (Account)
Solo, lock badge: "Choose a new password" / "You will stay signed in here. Every other device is signed out."; New password (meter, hint "Use at least 8 characters. Longer is stronger."); Repeat (must match: "The two passwords do not match."); "Save password".
Done: "Password saved" / "…Every other device has been signed out." / "Go to dashboard" + "Back to sign in".

### 4.16 `confirm` (Account)
Solo, shield badge: "Confirm it was you" / "Press the button to finish what you started by email. The link is used once and only from this browser."; a single button "Confirm and continue" (busy "Confirming…"); "Didn't request this? You can close this page. Nothing happens until you press the button."
Done: "Email confirmed" / "You are now signed in as {email}. Continue only if that is you." / "Continue" → dashboard / "Not you? Back to sign in".
Below the card: "Link not working? Links can be used once and expire. Request a new one".
(This is a click-to-confirm interstitial that guards against email link prefetchers. It fits the Supabase auth migration.)

### 4.17 `notfound` (Account)
Min 88vh. Grid + glow. Giant "4 [amber circle with search icon, bobbing] 4". The digits use a gradient-clipped ink. Eyebrow "Error 404", h1 "Page not found", "Oops! The page you're looking for seems to have wandered off. Let's get you back to creating amazing digital catalogs." An optional line "We looked for `#path` but it isn't here." shows the missing path. Buttons "Return home" (primary, home icon) and "Visit the Help Center" (outline). "Looking for something specific?" quick-link pill row: Pricing, Showcases, Try demo, Docs, Contact.

### 4.18 `privacy`, `terms`, `refund` (Account, legal)
Shell in §3.5.
- **Privacy** "Privacy Policy for Quicktalog": updated Oct 14 2025 · 4 min · 10 sections. 01 Information We Collect, 02 How We Use Your Information, 03 How We Share Your Information, 04 Data Security, 05 Your Data Protection Rights, 06 Cookies and Tracking Technologies, 07 Third-Party Links, 08 Children's Privacy, 09 Changes to This Privacy Policy, 10 Contact Us.
- **Terms** "Terms & Conditions": updated May 3 2026 · 10 min · 28 sections (Definitions … Contact Us). Includes an amber callout (Paddle is Merchant of Record) and a red callout ("Automatic Deletion Policy").
- **Refund** "Refund Policy for Quicktalog": updated Mar 14 2026 · 1 min · 5 sections: Our 10-day Money-Back Guarantee, How to Request a Refund, Refund Processing, Non-Refundable Circumstances, Questions.
- Each page ends with the contact box ("Questions about this policy?", Email us + Contact page, "Also read" links to the other two).

### 4.19 `app-dashboard`, the Overview (App, dash)
1. **Profile card** `.as-profile`: two amber blur blobs, 72/96px avatar (initials, amber ring), "Welcome back, {first}!" and the email.
2. **Stats** (h2 "Dashboard"): 4 stat cards (2×2, 4 columns at 1100+), each with an info button that opens an explainer dialog:
   - Total Views: "…total number of times your catalogues have been viewed…"
   - Total Visitors: "…counted only once per day…"
   - Total Items (see §6)
   - Newsletter: subscribers count
3. **Catalogues** (h2 + the prototype-only review toggle):
   - At limit: two `.as-cta` banners, "You've reached your current catalogue limit" and "You've reached your traffic limit", each with "Upgrade plan" → pricing.
   - Grid (1 / 2 / 3 columns at 640/1200). Card: slug as name, ⋮ menu button, status badge, dates ("Updated:", "Created:" as a `dl`), and actions by status:
     - `active`: "View Catalogue" (primary sm) + "Analytics" (outline sm)
     - `draft` / `inactive`: "Continue Editing" + "Publish Catalogue" (rocket). Publish toasts "Publishing..." / "Updating...", then "Catalogue published successfully" with a "View" action.
     - `error`: red text "Error occured. Please delete the catalogue and retry."
     - `prep`: spinning gear (sr "Catalogue is being prepared")
   - **⋮ menu** (`role=menu`, arrow-key navigation, Esc returns focus):
     - Edit
     - Change Status ▸ (submenu Activate / Deactivate / Save; the current status is omitted; Activate is disabled when the traffic limit is reached)
     - Share (copies the URL; the item shows "Link Copied" for 3s)
     - QR Code (→ app-qr)
     - Embed (downloads the embed file)
     - Duplicate (at the limit, opens the upgrade dialog instead)
     - separator
     - Delete (danger; disabled for 10 minutes after creation, with a title tooltip)

     All items except Delete are disabled for `prep`/`error`.
   - Empty: dashed "No catalogues created yet."
4. **Newsletter Subscribers**: card header "38 subscribers" + "Export CSV" (outline sm, download icon; disabled when empty); table Email / Catalogue (link) / Date; empty state.
5. Dialogs:
   - **Create a Catalog**: Catalogue Name* (max 60, live slug availability "Great! This name is available." / "This name is already in use…"), Language (32 options), Currency (8), Business Type (Food & Beverage, Beauty & Wellness, Retail, Online Sales, Services, Other), read-only "Your URL will be" `https://www.quicktalog.app/catalogues/{slug}`. Cancel / "Create Catalog" (disabled until valid; busy "Creating..."). Flag: it ends in the builder, out of scope.
   - **Delete Catalogue**: red icon, "Are you sure… cannot be undone.", Cancel / Confirm (red; busy "Processing...").
   - **Duplicate Catalogue**: Name + availability + URL preview box; Cancel / Confirm (busy "Loading...").
   - **Info** (stat explainer), "Got it!".
   - **Need More Catalogues?**: lock icon, compare "Current Plan 6 catalogues · Pro → Required Plan 20 catalogues · Growth", "What You'll Get with Growth" ticks, "Upgrade to Growth Now" → pricing.
6. FAB opens Create.

Slugify rules: lowercase, strip diacritics, `&` becomes "and", non-alphanumeric runs become "-", trim dashes, max 60.

### 4.20 `app-subscription` (App, dash)
h1 "Subscription Overview" (calendar icon). Upgrade `.as-cta` ("Upgrade your plan" / "Get more features, higher limits, and premium support." → pricing). Plan card: amber star tile, plan name "Pro", description, "Active" green badge; `dl` grid (2 columns, 4 at 768+): Price $12.00, Subscription Cycle monthly, Started, Last Updated; inset row "Manage your subscription" / "Update billing details, check transactions or cancel subscription." + "Manage subscription" (outline sm, gear) → Paddle customer portal. "Plan Features" card: 2-column list of 17 features, included ones with an amber border and check, excluded ones grey with an X (Support, Catalogues, Traffic Limit, Branding, Analytics, AI Prompts, Sections, Items, Style, Standard Themes, Custom Themes, Content Divider, External Content, Newsletter, OCR AI Import, Custom Features, Custom Code).

### 4.21 `app-usage` (App, dash)
h1 "Usage Overview", lead "Monitor your resource consumption and track usage across all features". Three gauge cards (3 columns at 900+): Traffic, Catalogues, AI Prompts. Each has an icon tile, h3, and a semicircle arc SVG (`viewBox 0 0 120 66`, stroke 11, round caps, `pathLength=100`, `stroke-dasharray:{pct} 100`; ink fill, amber when warning) with a centred "%" and "of limit", then "**4,210** / 5,000 views". `role=meter` with `aria-valuetext`. Warning state (`.as-g-warn`, ≥ about 80%): amber border, amber-soft gradient, "Near limit" chip.

### 4.22 `app-settings` (App, dash)
h1 "Settings". Top buttons "Manage Cookie Preferences" (outline, cookie icon) and "Sign Out" (red). Then cards in order:
1. **Profile**: Name → "Save name" (toast "Your name was updated.").
2. **Email address**: explains the double confirmation; "Current address: …"; New email → "Send confirmation links" (inline ok/err hint).
3. **Password**: Current / New / Repeat (3 columns) → "Change password". Errors: "That password is not correct." / "…too weak. Use at least 8 characters with letters and digits." / "The new password has to be different from the current one." / "The new passwords do not match."; success toast "Password changed. Other devices were signed out."
4. **Connected accounts**: Google row ("G" tile, status "not connected" / "connected as …", Connect/Disconnect).
5. **Sessions**: "Sign out" / "Sign out everywhere" (red).
6. **Delete account** (danger zone, red border and title) → dialog "Delete your account?" with "Type DELETE to confirm"; "Keep my account" / "Delete permanently" (disabled until the text matches).

### 4.23 `app-support` (App, dash)
h1 "Support" + lead. Two cards (`1.35fr | 1fr` at 1100+):
1. **Email Support**: prefilled name/company/email, Subject select (default Technical Support), message. "By submitting, you agree to our Privacy Policy." + "Send message". Success view (green icon, "Thank you for submitting your request.", "Send another message").
2. **Schedule a Meeting**: a Calendly placeholder (month grid with available days highlighted amber-soft, "Customer support · 30 min"). The live app embeds Calendly inline; there's also an "Open Calendly" link to `calendly.com/quicktalog/customer-support`.

### 4.24 `app-checkout-success` (App, bare)
Full-screen: fixed grid + glow background; logo at the top linking home; centred card (max 440, radius 28): 84px animated mark (amber-soft disc scales in, amber ring draws, ink tick draws at 0.5s delay; plays once on each visit, skipped with reduced motion), h1 "Payment Successful!", "Thank you for your purchase.", "Return to Dashboard" (primary lg, full width), "Have questions? Contact us at: quicktalog@outlook.com".

### 4.25 `app-analytics` (App, tool, no footer)
1. Header `.g5-ph-head` (a row at 900+): eyebrow "Catalogue analytics", h1 "Analytics for {catalogue}", "Track your catalogue performance and visitor insights." Controls: catalogue select, and a segmented date range 7 / **30** / 90 days (`role=radiogroup`, arrow keys).
2. Sample-data pill (prototype only).
3. 4 KPI cards (2 columns, 4 at 1100+): Total views, Unique visitors, Most popular day ("Sat, Sep 20" + "n views"), Avg. views / day (2 decimals). Each shows a delta vs the previous period ("+12.3% vs previous 30 days", green, or red `.dn` when down).
4. **Traffic overview** chart card (legend "Page views"): 280/330px tall responsive SVG line chart. 4 horizontal grid lines with a "nice max", 4–6 date ticks, amber gradient area, line `#D48A00`, "Today · n" end marker. Hover/pointer crosshair with an ink tooltip ("n views · date · n visitors"). The chart is focusable and ArrowLeft/Right step through points, Esc hides. It redraws on resize. sr-only description.
5. **By day** table: the last 10 days (newest first): Date, Page views, Unique visitors, and a share bar; the busiest day is tagged.

A charting library (ApexCharts is already in the stack) can replace the hand-rolled SVG, but it must keep keyboard access and the table fallback.

### 4.26 `app-qr`, the QR code editor (App, tool)
1. Header: "Back to dashboard" pill; h1 "QR code editor", sub "Create beautiful, customized QR codes for your brand with our easy-to-use editor."; catalogue chip (avatar "BT", name, slug, green "Live").
2. Grid: 1 column; at 1024+ `1fr | 360–420px`, with the preview on the right, sticky at top 104. Preview comes first in DOM and on mobile.
   - **Preview card**: "Preview" + status pill ("Scannable" green / "May be hard to scan" amber). Stage (dotted amber-lit backdrop) with ink corner brackets, an animated scan line, and a printed card (QR SVG + optional frame text bar coloured dots-on-bg). Meta line "Version v · n×n modules · error correction Q" plus a warning tip when relevant. Downloads: "Download PNG" (primary) · SVG · JPEG. "Save design" button (navy outline, dirty dot + "Unsaved changes" / "All changes saved").
   - **URL bar**: globe icon, monospace link, "Copy" (→ green "Copied" 1.8s). Hint "This QR code links to your catalog. The URL cannot be changed."
   - **Controls card** with 4 tabs (sliding indicator; arrow keys):
     - **Colors**: 5 presets (Ink & amber, Coffee, Navy, Organic, Classic) drawn as mini QR glyphs. 4 colour rows (QR Dots / Background / Corner Frames / Corner Dots): swatch + name + hex input (validated `#RRGGBB`). Contrast pill "Contrast x:1 · Good/Low". "Low Contrast Warning" box when ratio < 3, or corner-dot contrast < 1.6, or dots are lighter than the background.
     - **Style**: Dots pattern (Square, Dots, **Rounded**, Extra, Classy, Classy+; 3 columns, 6 at 640+), Corner frames (Square, Dot, **Rounded**), Corner dots (Square, **Dot**). All are radio tiles with SVG glyphs.
     - **Logo**: drop zone "Choose a file or drag & drop · PNG or JPG · max 512 px and 200 KB" (errors toast "Please choose a PNG or JPG image." / "File is too large. Please select a smaller image"). Uploaded row (thumbnail, "Logo uploaded successfully", file meta, "Remove"). Toggles "Show logo" and "Hide dots behind logo"; Logo size slider 0.1×–1.0× (default 0.6).
     - **Settings**: Error correction L 7% / M 15% / **Q 25%** / H 30%; Margin slider 0–50px (16); "Frame text" with a **New** badge: "Show frame text" toggle + text input (max 28, default "Scan for our menu").
   - Scan-risk rules: warn when the logo area exceeds 35% of ECL capacity, when a logo is used at level L, or when corner-dot contrast is < 3.
3. Toasts for downloads and save ("QR code configuration saved successfully.").

The prototype renders QR with `qrcode-generator` 1.4.4 plus custom SVG paths. The stack already has `qr-code-styling`, which should handle these styles; match its option names to the dot/corner styles above.

---

## 5. Assets

| Asset | Type | Depicts / use |
|---|---|---|
| Logo | webp data URI (400×118, 14.7 KB), used in nav, footer and checkout | Amber magnifier ring around a QR glyph + "Quicktalog" wordmark in dark ink (Plus Jakarta-like) |
| Hero image | webp (1100×768, 63 KB) | MacBook showing the builder (dark "Breakfast" catalogue, settings panel with General/Header/Footer/Appearance tabs, Save as Draft / Templates / Preview / Publish) + iPhone showing the public catalogue. **Builder screenshot** |
| "Go from Idea to Live" | SVG illustration (384×318) | Person standing next to a giant amber/indigo wristwatch (unDraw style, amber `#FFB020` + indigo accents); covered by the Lottie `idea-live` |
| "Grow Your Business" | SVG (384×260) | Person in a suit beside a whiteboard with a rising amber line chart; covered by the Lottie `growth` |
| Step 1 "Register" | SVG | Woman in amber top holding a cord to a profile/form card |
| Step 2 "Build your catalogue" | SVG | Woman carrying an image card toward a browser window with an upload box |
| Step 3 "Publish & share" | SVG (57 KB) | Desktop monitor with an amber rocket tile and fireworks |
| AI card image | SVG | Woman with phone and chat bubble in front of a large document and a brain/AI node diagram; covered by the Lottie `ai-build` |
| Showcase screenshots | 14 webp (desktop 860×1048, phone 440×952) | Real public catalogues (e.g. "LAVA & FLOR" wine and drinks catalogue for Entre Fuego Y Tierra). **Public catalogue UI** |
| Lottie `lj-sp` "sparkle" | 24×24, 120f @60fps | Twinkling sparkle in the hero badge dot |
| Lottie `lj-idea` "idea-live" | 480×340, 270f | Window with rows, cursor clicks "publish", paper plane trail to a phone that shows items, then a "live" pulse |
| Lottie `lj-gr` "growth" | 480×340, 270f | Dashboard card with header, tiles, 7 rising bars, trend line and an "up" arrow |
| Lottie `lj-ai` "ai-build" | 480×300, 252f | Prompt bubble with typing label, arrow to a phone where header and 4 items appear, stars, check |
| Lottie `lj-qr` "qr-scan" | 200×200, 192f | Card with QR dots and 3 finder patterns, scan line, "ok" tick (CTA band, 124px) |
| Inline SVG icon sprite | ~110 `<symbol>`s (`i-*`, `i-g1-*` … `i-g5q-*`) | Feather/Lucide icons; several duplicates across groups (copy, send, lock, qr, calendar, eye, download, alert) |
| Google "G" | inline multi-colour SVG | Auth buttons |
| QR style glyphs | inline SVG | QR editor option tiles |
| CSS data-URI SVGs | `as-ticks` check, select chevrons, `g5q-opt` check badge | small UI glyphs |
| CSS-drawn illustrations | `g2-m-*` (mini catalogue "Bean There Café", builder, chat, themes, devices, plans…), `g2-cover--*`, `pv-qr`, `g2-m-qr` | article covers and doc mocks (see §4.6 and §4.9) |

**External URLs and scripts:**
- Google Fonts (above).
- cdnjs: `lottie-web/5.12.2/lottie_light.min.js`, `qrcode-generator/1.4.4/qrcode.min.js`.
- Hexus tour `app.usehexus.com/embed/254bfe62-3496-414e-93e8-5447b8fa54a9`.
- Calendly `calendly.com/quicktalog/customer-support`.
- LinkedIn `linkedin.com/company/quicktalog/`.
- `paddle.net` (buyer support).
- `quicktalog.app/catalogues/*`, `/admin/create/ai`, `/sitemap.xml`.

---

## 6. Ambiguities and inconsistencies

**Content and data**
1. **Plan feature wording differs by location.** Home says "Custom Branding" and "10 OCR AI imports per month" (Growth) / "20" (Premium). The pricing page and the comparison table say "Photo & menu import" (Growth+, no count) plus extra rows (Divider, Style controls & embed sections, Custom code). The dashboard limit dialog says "10 OCR AI imports". The subscription page lists "OCR AI Import", "Analytics: Basic" and "Custom Themes". Pick one source: `tiers` in `@quicktalog/common`.
2. **Home tier CTAs go to `#login`**; the pricing page CTAs go to `#signup`. Home uses "Most Popular", pricing uses "Most popular".
3. **Support email.** quicktalog@outlook.com is used everywhere except the Help "Email support" card, which uses `support@quicktalog.com` (a different domain from quicktalog.app).
4. **Timing claims.** "Setup in under 2 minutes" (resources CTAs) vs "under 5 minutes" (home). "How it works … in four steps" (nav) vs 3 steps on home (the docs flow has 4).
5. **Dashboard stat "Total Items"** shows the catalogue count, and its explainer says "total number of catalogues you have created". Rename it "Catalogues" or show items.
6. **Home FAQ** promises "popular items, customer engagement, and feedback" analytics. Help and the analytics page only offer views, visitors, busiest day and average per day.
7. **AI entry point.** Home "Try AI" links to `/admin/create/ai`. Docs and articles say AI lives in the builder's "Ask AI" pill and that there's no separate create route. The create-catalogue mock in the docs shows "Quick Start / Standard Catalog / Start from Scratch", which the dashboard's Create dialog doesn't have.
8. **Legal copy.** Terms has placeholders **[JURISDICTION] / [CITY / COUNTRY]** and an internal-sounding sentence about configuring the Paddle dashboard (§26). Refund section headings have no `g3-num` numbers while Privacy and Terms do. Last-updated dates differ across the three.
9. Spelling mixes "catalog" and "catalogue" (and "color" and "colour") across all pages; the currency sample mixes € (home) and $.
10. The article midcta in "12 Businesses…" says "Publish your own digital menu in minutes" (menu-specific copy on a general article).
11. Confirm page sample email `jane@beantherecafe.com` doesn't match the signed-in user `maya@beanthere.example`.

**Structure and behaviour**
12. **`#pricing` means two things.** Home has a pricing section with `id="pricing"`, and there's also a `pricing` page. The router prefers the page, so the nav goes to the page and the home section is never linked. Decide whether home keeps a full pricing block. It duplicates the pricing page with different copy.
13. Footer "FAQ" → `#faq` and nav "How it works" → `#how-it-works` are home anchors, so in the real app they become `/#faq` and `/#how-it-works`.
14. **Release notes subscribe form**: the JS (`#release-notes-form`) and CSS (`.g2-sub`) exist but there's no markup. Is it intended?
15. `data-footer`: `app-analytics` hides the footer; `app-qr` (same `tool` frame) shows it. `demo` hides the footer.
16. The `full` frame is defined but unused. The `<!-- FOOTER -->` comment sits above `#app-shell` (misplaced). The app shell is nested inside `#public-shell`.
17. Signed-in state only shows on app pages. Public pages always show the logged-out nav, even mid-session. The real app should show the signed-in nav everywhere once authenticated. Public/ISR pages can't read cookies, so this needs a client-side check.
18. Login shows "Protected by Cloudflare Turnstile"; signup, forgot and reset don't. Is Turnstile wanted on every auth form?
19. The featured article/doc card sits outside the filter/grid, so the "Use cases" filter shows 2 grid cards while the featured Use-case card stays visible above.
20. **The article body is full width** (a late override removes the 720px measure), so long lines reach about 1240px. Doc prose keeps 720px. That looks accidental; consider keeping a 70ch measure for articles.
21. Footer column links show an external-link icon on hover for internal links.
22. Dashboard catalogue card uses the slug as its title rather than the catalogue name.
23. The "error" state copy has a typo: "Error occured".
24. The `g2-cover--businesses` and `g2-cover--restaurants` modifiers have no CSS; they fall back to the default amber cover.
25. `--amber-tint` and `.g5-pro` are defined but unused. Several icon symbols are duplicated per group (`i-g1-copy`, `i-g2-copy`, `i-g4-copy`, `i-g5q-copy`, …).
26. Font weights 650/750 aren't in the loaded font files.
27. Three parallel input systems (`g1-input`, `g3-field`, `as-input`, plus `g5-f`) and three toast systems (`as-toast`, `g5-toast`, contact inline). Consolidate them into shared components.
28. Hard-coded greens and blues (§1.2) have no tokens. No dark mode exists (§1.6).
29. The contact subject list defaults to "Custom Plan"; the app support form defaults to "Technical Support".
30. Prototype-only UI to drop: the "All pages" switcher, the dashboard "Review state" toggle, the analytics "Sample data" pill, "Design preview" notes, "Downloads work in the real app" notes, and the demo-only auth error triggers.
