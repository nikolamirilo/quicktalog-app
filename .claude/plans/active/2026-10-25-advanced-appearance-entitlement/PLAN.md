Status: done (awaiting a browser check on TEST) — code complete and `@quicktalog/common` 1.74.0 published 2026-10-25

# One "Advanced styling" entitlement instead of standard themes / style controls / custom themes

**Spec:** owner request 2026-10-25 — "instead of splitting style, custom themes and so on, that should be like advanced appearance options which should be from Pro onward". Plain-language version: [OVERVIEW.md](OVERVIEW.md). Lasting knowledge on what the flag gates: [docs/architecture/catalogue-chrome.md](../../../../docs/architecture/catalogue-chrome.md).

## Why this is safe: the split is already inert

`features.apperance` has three booleans. Across all six tiers they take exactly two shapes:

| Tier | standardThemes | styles | customThemes |
|---|---|---|---|
| Starter | true | false | false |
| Basic | true | false | false |
| Pro | true | true | true |
| Growth | true | true | true |
| Premium | true | true | true |
| German Silva Custom | true | true | true |

`styles === customThemes` on every tier, and `standardThemes` is `true` everywhere. The three-way split carries **no information** today — it is three names for one boundary at Pro. Merging them changes no customer's entitlements. This is a naming and presentation change, not a pricing change.

Two presentation bugs fall out of the same split:

- The **two plan tables disagree**. The dashboard overview (`planFeatureGroups`) lists Standard themes, Custom themes, Style controls, Custom branding. The public comparison table lists Standard themes, Custom branding, Style controls — **no custom-themes row at all**. A Pro buyer cannot see custom themes on the pricing page.
- The **Style controls hint is stale**: "Font, size, radius, shadow, overlay" ([constants/pricing.ts:257](../../../../src/constants/pricing.ts#L257)). Glass and background are also gated by `apperance.styles` and are named nowhere a customer can read.

## Decisions

1. **Merge `apperance.styles` + `apperance.customThemes` into one flag.** The Pro boundary stays exactly where it is. No customer gains or loses a feature; no Paddle price id changes. Cost: the two can no longer be priced apart without another package release. Both have been identical since inception, so this is accepted.
2. **Drop `apperance.standardThemes` from the type.** It is `true` on every tier, so it is marketing copy, not an entitlement. The rows that show it become `value: () => true`, matching how the "Items section" / "Text section" rows already work.
3. **Shape: a flat `features.advancedAppearance: boolean`,** replacing the whole `apperance` object. With `standardThemes` gone the object would hold a single key, and flattening also disposes of the long-standing `apperance` typo in one move. The typo is confined to this TS constant — catalogue data uses the correctly spelled `appearance` JSONB column — so nothing persisted is touched. *Alternative, if the object is preferred for future growth: keep `appearance: { advanced: boolean }`; `integrations: { tracking }` is the precedent for a single-key group.*
4. **The boundary does not move.** Pro, Growth, Premium and the custom plan get advanced appearance; Starter and Basic do not. Moving it (e.g. giving Basic fonts) is a real pricing change with downgrade consequences and is explicitly **not** part of this plan — see *Not in this plan*.
5. **One explanation key `advanced_styling`** replaces `custom_themes` and `style_controls`, with copy that names everything inside: custom colour themes and saved themes, fonts, text size, corners, shadows, overlay, glass and background.
6. **Both plan tables get the same single row,** which removes the existing disagreement rather than preserving it on one side.
7. **One lock, one upgrade message.** The builder currently shows two separately locked groups that always lock together; they become one gate, and the agent's two skip messages become one.

## Tasks

1. **`@quicktalog/common`** (minor release): in [types/general.ts:54-58](../../../../../quicktalog-packages/src/types/general.ts), replace the `apperance` object on `Features` with `advancedAppearance: boolean`; in [constants/pricing.ts](../../../../../quicktalog-packages/src/constants/pricing.ts), set it per tier — `false` for Starter and Basic, `true` for Pro, Growth, Premium and the custom plan. Push to `main`, publish via CI, bump the app.
2. **Server entitlements.** [lib/entitlements/catalogue.ts](../../../../src/lib/entitlements/catalogue.ts): `applyPlanToCatalogue` reads one flag for `style`, `overlay`, `glass`, `background` and the custom-theme reset (lines 49-70); `applyPlanDowngrade` likewise merges its two `if` blocks into one `update` (lines 135-152). [lib/entitlements/operation-limits.ts:22-23](../../../../src/lib/entitlements/operation-limits.ts#L22-L23): one `advancedAppearance` key. [lib/themes/upsert.ts:66](../../../../src/lib/themes/upsert.ts#L66): `planHasCustomThemes` reads the merged flag (rename to `planHasAdvancedAppearance`).
3. **Agent paths.** [lib/catalogue/operations.ts](../../../../src/lib/catalogue/operations.ts): `OperationLimits.styles` + `.customThemes` → `advancedAppearance` (lines 36-40); the two guards in `update_appearance` (lines 570-589) become one with a single message naming themes, font, text size, corners and shadow. [agent/core/instructions.ts:144](../../../../src/agent/core/instructions.ts#L144): one `LOCKED_SETTINGS` entry. [agent/tools/index.ts:40](../../../../src/agent/tools/index.ts#L40): `setCustomTheme` is removed on the same flag.
4. **Builder UI.** [AppearanceTab.tsx](../../../../src/components/catalogue/inputs/sidebar/AppearanceTab.tsx): one `hasAdvancedAppearance` constant replaces `hasStyles`/`hasCustomThemes` at lines 44-45 and the four `LockedGroup`/`allowCustom` sites (Custom colors, Background, Style, Overlay).
5. **Pricing and display copy.** [constants/pricing.ts](../../../../src/constants/pricing.ts): `planFeatureGroups` (lines 88-101) and the comparison table (lines 243-260) each get one **Advanced styling** row, hint "Your own colour themes, fonts, shapes, glass & background"; the Standard themes rows become `() => true`; `starterExtraFeatures` (line 339) drops its conditional; `explanations` (lines 188-191) gains `advanced_styling` and loses the two old keys.
6. **Tests.** `tests/unit/lib/entitlements/operation-limits.test.ts` (lines 22, 30) and `tests/unit/lib/catalogue/operations.test.ts` (lines 511, 530) use the merged key. Add one case asserting a locked plan resets `style`, `overlay`, `glass`, `background` **and** a custom theme in a single `applyPlanToCatalogue` call.
7. **Docs and copy.** [docs/architecture/catalogue-chrome.md:12-13](../../../../docs/architecture/catalogue-chrome.md#L12-L13) (both rows say `apperance.styles`); the prose in [content/docs/customize-design.tsx:92,99](../../../../src/content/docs/customize-design.tsx#L92) and [content/docs/plans-and-billing.tsx:83](../../../../src/content/docs/plans-and-billing.tsx#L83).

## Verification

Run 2026-10-25, all green: `npx tsc --noEmit` (exit 0), `npm test` (771 passed, 87 files), `npm run check` (2 warnings, both pre-existing in `DocHero.tsx` and `MainContext.tsx`, neither touched here). Four test files needed the new labels: `plan-limits` (new combined-reset case), `operation-limits`, `operations`, `agent/instructions` and `lib/pricing`.

Not yet done — **manual check on TEST**: a Starter account sees one lock covering Custom colors, Background, Style and Overlay; a Pro account sees none; the dashboard plan view and the public pricing page show the same single "Advanced styling" row; the pricing card bullet reads "Advanced styling" on Pro and up and is absent below.

**Release done.** `@quicktalog/common` 1.74.0 was published 2026-10-25 and installed from the registry; the app requires `^1.74.0` and `package-lock.json` pins the published tarball. The hand-copied `dist` used during development is gone, replaced by the real artifact, and the published package was re-checked (`advancedAppearance` in the types, 4 tiers true / 2 false, no `apperance` left). All three checks were then re-run against it, green.

Local state at hand-off: `../quicktalog-packages` was fast-forwarded 4 commits to `origin/main` first — the working copy was stale at 1.69.0 and missing the glass/search/background types, so editing it as found would have regressed the published package.

## Risks

- **No database change and no data migration.** The flags live only in the TS constant; `tiers` is matched to a user by Paddle price id in [lib/entitlements/plan.ts](../../../../src/lib/entitlements/plan.ts), and the only SQL mention of `tiers` is a comment in `20260921181105_private_entry_points.sql`. Nothing stored is keyed on these names.
- **Pricing-page wording changes** even though entitlements do not. Worth an owner read-through before deploy; no customer notification is needed because nothing a customer has access to changes.
- **Losing separate pricing levers** for themes vs. style controls. Accepted under decision 1.

## Not in this plan

- **Moving the boundary** (for example, giving Basic style controls, or splitting a cheaper "fonts and colours" tier out of advanced appearance). That changes real entitlements: existing Basic catalogues would gain features, and `applyPlanDowngrade` would need a re-check against anyone moving the other way. It should be decided on its own once this merge has made the current boundary legible.
- The **missing background/glass mentions** are fixed here as copy, but the broader question of whether the pricing page should enumerate every style control at all is left alone.
