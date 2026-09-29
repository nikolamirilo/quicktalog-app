# QR codes

The page `/admin/[name]/qr-editor` designs the QR code for one catalogue, saves the design, and downloads it as PNG, JPEG or SVG. Drawing is done in the browser by [`qr-code-styling`](https://qr-code-styling.com).

## Where things live

| Module | Purpose |
|---|---|
| `src/app/admin/[name]/qr-editor/page.tsx` | Server page: ownership, status and saved design in one `withUser` block |
| `src/lib/catalogue/ownership.ts` | `getOwnedCatalogue` (id + status) |
| `src/lib/qr/configs.ts` | `getOwnedQrConfig`, `upsertOwnedQrConfig` (server only) |
| `src/actions/qr-configs.ts` | `upsertQrConfig`, the save action |
| `src/constants/schemas.ts` | `qrConfigSchema` and `QR_CONFIG_MAX_BYTES` |
| `src/lib/qr/design.ts` | The config type, defaults, presets, load/normalise, logo URL rule, merge, `designKey` |
| `src/lib/qr/scan-risk.ts` | The "Scannable / May be hard to scan" check |
| `src/lib/qr/version.ts` | QR version and module count for the preview caption |
| `src/lib/qr/export.ts` | Frame-text layout and download composition |
| `src/context/QRContext.tsx` | Editor state: the design, dirty flag, the live qr-code-styling instance |
| `src/hooks/useQrActions.ts` | Save and download |
| `src/hooks/useBeforeUnload.tsx` | `useNavigationGuard` + `NavigationGuard` (unsaved changes) |
| `src/components/qr-editor/*` | Editor UI |

## The stored design

`qr_configs.config` (jsonb, one row per catalogue, unique on `catalogue_id`) holds qr-code-styling's own `Options` plus two app fields:

| Field | Meaning |
|---|---|
| `frameText` | `{ show, text }`: a label printed under the code, at most 28 characters |
| `showLogo` | `false` hides the uploaded logo without forgetting it; missing means shown |

Both are optional, so designs saved before they existed still load: such a design starts with frame text off.

**The URL is pinned.** `data` is always the catalogue's own `NEXT_PUBLIC_BASE_URL/catalogues/<name>`. The page overwrites it on load (`loadQrConfig`) and the action overwrites it on save (`normalizeQrConfig`), whatever the client sent.

## Validation and size limits

The save action:

1. checks identity first (`getVerifiedIdentity`);
2. parses the design with `qrConfigSchema`:
   - only known option groups survive, and unknown keys are stripped at every level (gradients and node-only options included);
   - colours must be `#RRGGBB`;
   - `width`/`height` 100–2000, `margin` 0–100, logo `imageSize` 0.1–1, logo margin 0–50;
   - dot, corner and error-correction values must be qr-code-styling's enums;
   - `image` must be `""` or an UploadThing file URL: `https://<app>.ufs.sh/f/…` or the legacy `https://utfs.io/f/…`, at most 512 characters. `data:` URLs, other hosts and plain http are refused;
   - a design that fails is refused as "Invalid QR design";
3. pins the URL, then refuses anything over `QR_CONFIG_MAX_BYTES` (16 KB of JSON) with "Design too large";
4. upserts in one `withUser` block after `ownsCatalogue`;
5. maps errors: `42501` (policy) is "Catalogue not found", and `23514` on `qr_configs_config_size` (the database's own 64 KB check) is "Design too large". Neither goes to Sentry.

A saved logo that breaks the URL rule (from before it existed) is dropped when the design loads, so the design can be saved again.

## Editing state

`QRContext.updateOptions` shallow-merges only the option groups a change mentions (`mergeQrConfig`); groups it does not mention are left exactly as they were. So undoing a change on an older design brings `designKey` back to the saved value and the dirty flag clears. The provider value is memoised.

The preview caption ("Version 5 · 37×37 modules") is computed by `qrVersion` from the data length and error correction level, using byte-mode capacities generated from `qrcode-generator` (the encoder qr-code-styling bundles). It does not read qr-code-styling's private `_qr`. For Numeric/Alphanumeric data or data beyond version 40 it falls back to "Error correction Q".

## Export composition

Without frame text a download is qr-code-styling's own file. With frame text a bar is composed under the code, and the preview uses the same rule (`frameLayout`):

- the bar is 15% of the code's width, in the dots colour; the text is the background colour;
- the text is a single line in the heading font at 5.8% of the width, shrunk until it fits 90% of the width (never below 8px);
- the preview draws the bar as an SVG with those numbers, so it matches the download.

**PNG/JPEG** are drawn on a canvas with the page's heading font, as measured.

**SVG** files are opened elsewhere, where next/font's renamed family does not exist. The file declares `'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif` and pins the text to the measured width with `textLength` + `lengthAdjust="spacingAndGlyphs"`, so whichever font renders, the text keeps its size and fits the bar. The font is not embedded. Every user value in the SVG (text, colours) is XML-escaped.

**Non-Latin text.** The heading font covers Latin scripts. For other scripts the browser falls back per glyph to a system font, both in the preview and in PNG/JPEG, and the measurement uses that fallback too. In an SVG the viewer's fallback font is used and `textLength` keeps the width.

## Unsaved-changes guard

`NavigationGuard` (`useNavigationGuard`) runs while the design is dirty:

- **Reload, tab close, links to other sites:** the browser's own `beforeunload` prompt.
- **In-app links:** a click is held and the "Unsaved Changes" dialog opens. "Leave" continues with the Next router, so there is no full reload. Clicks with Ctrl/Cmd/Shift/Alt, a middle click, `target` other than `_self`, `download` links and same-page `#fragment` links are left alone.
- **Back button:** while dirty, one extra history entry for the same URL sits on top, tagged in `history.state` (Next's own state is kept). Back steps off it and the page stays; the guard puts the entry back and opens the dialog. "Leave" goes back two entries, past both copies of the page. If the tab opened on the editor, there is nothing to go back to, so it goes to the dashboard. The tag means turning dirty again never stacks a second entry. After a save, the entry stays: one Back press then lands on the same page before a second one leaves.
