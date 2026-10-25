Status: in progress (code done 2026-10-24; pending: @quicktalog/common release + backend job pass for Task 9, TEST deploy and hand check)

# Agent respects every plan limit: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neither the builder agent nor the builder itself can take a catalogue past the user's plan: item and section counts, block types, branding, styles, custom themes and the newsletter. Work the user paid for is not lost when they hit a limit or upgrade.

**Architecture:** One function maps a tier to `OperationLimits`. The agent's applier, the browser's replay of agent edits and the save all enforce those limits, and the save stays the authority. The server sends the browser the limits it used, so all three judge alike. The model is told the limits as whole-catalogue counts, and every refusal says what the limit is.

**Tech Stack:** Next.js 15, React 19 context, AI SDK 7 (`messageMetadata`), Vitest + Testing Library. No database change.

**Spec:** [FINDINGS.md](FINDINGS.md): L1–L7, the plan-flag table, tester reports T1–T6. Plain-language summary: [OVERVIEW.md](OVERVIEW.md).

## Decisions

D1, D3, D4, D6 and D7 were confirmed by the owner on 2026-10-24. D2 is technical. D5 was confirmed on 2026-10-24 too.

| # | Decision | Why / cost |
|---|---|---|
| D1 | Limits are enforced in three places: the **agent** (against the draft it was given), the **browser replay** of agent edits (with the limits the server used), and the **save** (against the stored row; the authority) | The replay gate guarantees the draft on screen never passes the plan, and the save guarantees the stored catalogue never does. Counting the agent against the *stored* draft as well was considered and rejected: after the user deletes items by hand without saving, the agent would refuse room they really have |
| D2 | The browser takes the limits from the agent's message metadata, not from its own copy of the plan | One source; nothing to keep in step; it still works when `userData` has not loaded |
| D3 | **Every block counts** toward `sections_per_catalogue`, `text` included. The catalogue's heading (its title) is not a block and never counts. *(Owner decision 2026-10-24)* | The save already counts this way. The builder's "Add section" check, the agent and the `adding-new-content-block` skill stop exempting `text` |
| D4 | **A downgrade deactivates a catalogue that no longer fits the plan** (too many items or sections, or a block type the plan lacks). It is reactivated only once it fits completely. Until then the owner and the agent can edit, move and delete, but not add; locked blocks can be deleted, not edited. Switching off is done **only by the backend's existing subscription job**, extended and run three times a day; the app only refuses switching on or publishing until the catalogue fits. *(Owner decisions 2026-10-24)* | Keeping premium content live on a cheaper plan is not fair. Draft saves are still allowed while the catalogue shrinks towards the limit, so the owner can trim it step by step |
| D5 | **Locked settings are reset, not kept.** *(Owner decision 2026-10-24)* On a plan without `styles` or `customThemes`, the save resets the style to the default and a custom theme to the default standard theme. The downgrade does the same to stored catalogues, as it already does for branding and newsletter | The builder locks these controls, so the owner could not undo them by hand; the save has to |
| D6 | Upgrading saves first. If the save is refused, `/pricing` opens in a **new tab** and the builder stays open with the draft | Fixes T5 without losing anything, even when the draft is over the current plan's limits |
| D7 | **Keeping the AI's changes saves the catalogue** if it has unsaved changes. This covers both the "Keep" button and the implicit keep when the user sends a new ask. A refused save shows its reason and the draft stays unsaved. *(Owner request 2026-10-24)* | Work the user paid credits for is stored as soon as they accept it |

## Global Constraints

- Work on TEST (`imhinsgyzzyblghwnedk`). Touch PROD only when the owner asks explicitly.
- No schema change is needed. If one turns out to be, it goes in a new `supabase/migrations/` file (never `drizzle-kit push/generate/migrate`).
- Plan limits come from `users.plan_id` → `tiers` on the server. The browser's gate is only for what the user sees; the save decides.
- Every query runs inside `withUser`, and none is held open across `fetch`, Redis or the stream.
- `@/` imports, Biome formatting, the `code-conventions` and `server-action-and-route` skills.
- Before calling a task done, run `npx tsc --noEmit`, `npm run check` and `npm test`. Say plainly what was not run.
- No commits or branches unless the owner asks. Each task ends at "ready for review".
- Execution order: Tasks 1–13 in order. 1 and 2 come first because later tasks consume their interfaces.
- Task 9 also changes `@quicktalog/common` (release needed) and `../quicktalog-backend` (its daily job is the only place that switches catalogues off).

## Review Focus

The five cases most likely to break for a real user. Each has a test in the task named.

1. **A downgraded owner whose catalogue is already over the new limit** (Pro → Basic with 80 items). Expected: the catalogue is deactivated. The agent can edit, move and delete but adds nothing. Draft saves keep working while the catalogue shrinks, and reactivation is refused until it fits. Tested in Tasks 3 and 9.
2. **The agent adds a section with 20 items when 3 slots are left.** Expected: the section is added with 3 items, and the result says 17 were left out because the plan allows 30 items in the whole catalogue. Tested in Task 3.
3. **The browser replay drops an `add_section` the server allowed** (the real draft was fuller than the one the server saw). Expected: later `add_items` aimed at that section are skipped, never applied elsewhere, and the user sees the limit notice. Tested in Task 6.
4. **The user adds items by hand while the agent is mid-turn.** Expected: the replay refuses agent edits past the limit, and the draft never goes over. Tested in Task 6.
5. **The builder remounts (or the user clicks Upgrade) with unsaved agent edits.** Expected: the edits are still there, or saved before leaving. Tested in Tasks 10 and 11.

---

### Task 1: One section and item count everywhere

**Files:**
- Modify: `src/lib/catalogue/content-blocks.ts`, `src/lib/catalogue/operations.ts`, `src/lib/entitlements/plan.ts`, `src/components/catalogue/modals/AddContentModal.tsx`, `src/components/catalogue/view/CatalogueContent.tsx`, `.claude/skills/adding-new-content-block/SKILL.md`
- Test: `tests/unit/lib/entitlements/content-within-plan.test.ts`, `tests/unit/lib/catalogue/content-blocks.test.ts`

**Interfaces:**
- Produces, in `content-blocks.ts`:
  - `countPlanSections(content: unknown): number`: every block, `text` included (D3).
  - `countPlanItems(content: unknown): number`: items in items blocks.
- These replace `countSections`/`countItems` in `operations.ts`, the hand-written filter and the `selectedOption === "text"` early return in `AddContentModal.checkLimits`, `getTotalItemCount` in `CatalogueContent.checkItemLimits`, and both counts in `contentWithinPlan` (before and after).
- The skill's "The section count" section is rewritten: every block counts; the catalogue heading is not a block.

- [ ] **Step 1: Write the failing tests:**
  - `countPlanSections counts every block`: 3 items blocks, 2 text, 1 divider → 6.
  - `countPlanItems counts only items blocks`: a 3-item items block plus a text block → 3.
  - `the agent refuses a text block past the section limit`: Starter with 5 blocks, `add_section` of type `text` → skipped, `limitReached`.
  - `contentWithinPlan counts text blocks`: Starter, 4 items sections + 2 text → refused.
- [ ] **Step 2: Run** `npx vitest run tests/unit/lib`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement**, and update the skill. Existing tests that assert the text exemption (in `operations.test.ts`) are changed to the new rule, and the review notes say which.
- [ ] **Step 4: Run** `npx vitest run tests/unit/lib tests/unit/components`. Expected: PASS. Ready for review.

---

### Task 2: One mapping from plan to limits, and the flags the applier was missing

**Files:**
- Create: `src/lib/entitlements/operation-limits.ts` (no `server-only`: the browser uses it in Task 6)
- Modify: `src/lib/catalogue/operations.ts`, `src/lib/ai/turn.ts`
- Test: `tests/unit/lib/catalogue/operations.test.ts`, create `tests/unit/lib/entitlements/operation-limits.test.ts`

**Interfaces:**
- Produces:
  - `operationLimitsFor(features: (typeof tiers)[number]["features"]): OperationLimits`. This is the only place a tier becomes limits. `openAiTurn` uses it instead of building the object inline.
  - `OperationLimits` gains `styles?: boolean`, `customThemes?: boolean` and `newsletter?: boolean`, with the same meaning as `branding`: only `false` locks, and leaving a field out locks nothing.
- Applier rules, each refusing the whole operation with `limitReached`, as `update_catalogue` does for branding:
  - `update_appearance` with `customColors` when `customThemes === false` → "Custom themes are not part of your plan."
  - `update_appearance` with any of `fontFamily`, `contentFontSize`, `borderRadius`, `shadow` when `styles === false` → "Font, text size, corner and shadow settings are not part of your plan." A `theme` on its own is always allowed.
  - `update_footer` with `newsletter: true` when `newsletter === false` → "The newsletter form is not part of your plan." Turning it off is always allowed.
  - `update_section` that sets `code` on a block whose type `isSectionTypeLocked` → "Embed / Custom visual sections are not part of your plan, so this one cannot be edited. It can be deleted." `delete_section` stays allowed.

- [ ] **Step 1: Write the failing tests:**
  - `operation-limits.test.ts`, `maps every tier the way the builder locks it`. Starter → `{ items: 15, sections: 5, branding: false, styles: false, customThemes: false, newsletter: false }`, divider/embedding/customVisual all false. Pro → styles and customThemes true, newsletter false. Growth → newsletter true.
  - `operations.test.ts`:
    - `refuses a custom palette without custom themes`
    - `refuses style changes without style controls`
    - `still switches to a standard theme without style controls`
    - `refuses turning the newsletter on without it`
    - `allows turning the newsletter off on any plan`
    - `refuses editing the code of a block type the plan no longer includes`
    - `still deletes such a block`
    - `gates nothing when no limits are given`
    - Each refusal asserts `applied` is empty, `limitReached` is true, and the catalogue is unchanged.
- [ ] **Step 2: Run** `npx vitest run tests/unit/lib`. Expected: FAIL.
- [ ] **Step 3: Implement**, and switch `openAiTurn` to `operationLimitsFor`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/lib tests/unit/agent`. Expected: PASS. Ready for review.

---

### Task 3: Every limit refusal says what the limit is

**Files:**
- Modify: `src/lib/catalogue/operations.ts`
- Test: `tests/unit/lib/catalogue/operations.test.ts`

**Interfaces:**
- Consumes: `countPlanItems`, `countPlanSections` (Task 1).
- Produces exact copy (`{n}` is the plan's number, `{used}` the current count):
  - Items fully refused: `Your plan allows {n} items in the whole catalogue and it already has {used}, so nothing was added to {section}.`
  - Items partly accepted, on both `add_items` and `add_section`: the `applied` line names the count added, and a `skipped` line says `{dropped} item(s) were left out: your plan allows {n} items in the whole catalogue.`
  - Section refused: `Your plan allows {n} sections in the whole catalogue and it already has {used}, so the section was not added.`

- [ ] **Step 1: Write the failing tests:**
  - `says the item limit is for the whole catalogue`: Starter, 15 items across 3 sections → `add_items` skipped message matches `/15 items in the whole catalogue/`.
  - `reports items left out of a new section` (Review Focus 2): Basic at 27 items, `add_section` with 20 → section added with 3; `skipped` matches `/17 item\(s\) were left out/`; `limitReached` true.
  - `says the section limit and its count`.
  - `a catalogue already over its limit can still be edited, moved and trimmed` (Review Focus 1): Basic limits on an 80-item catalogue → `update_item`, `move_item` and `delete_item` apply; `add_items` refused.
- [ ] **Step 2: Run** `npx vitest run tests/unit/lib/catalogue`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** it again. Expected: PASS. Ready for review.

---

### Task 4: The model knows the plan before it starts

**Files:**
- Modify: `src/agent/instructions.ts`, `src/agent/tools/index.ts`
- Test: `tests/unit/agent/instructions.test.ts`, `tests/unit/agent/free-plan-guards.test.ts`

**Interfaces:**
- Consumes: `session.limits` with the Task 2 fields, and the Task 1 counts.
- Context block (per-catalogue values stay there, as the existing test requires):
  `PLAN LIMITS: {usedItems}/{items} items and {usedSections}/{sections} sections in the whole catalogue. Not included: {locked settings}.` Leave out a part when it is unlimited or nothing is locked. When the catalogue is over a limit (after a downgrade), add: `This catalogue is over its plan and inactive until it fits: remove {k} item(s) / {s} section(s) / the {type} blocks. Offer to help trim it; never add.`
- Rules block, one fixed line: limits apply to the whole catalogue, never per section; when an ask does not fit, do what fits, say how much was left out and why, and do not retry.
- `buildTools`: when `session.limits.customThemes === false`, delete `setCustomTheme` (the same pattern as `fetchUrl`; the key stays in `AgentTools`).

- [ ] **Step 1: Write the failing tests:**
  - `states the item and section limits for the whole catalogue`: Starter, 12 items and 3 sections → the context contains `12/15 items` and `3/5 sections in the whole catalogue`.
  - `names the settings the plan locks`: Starter mentions custom themes, style controls and the newsletter; Premium mentions none of them.
  - `tells the model a catalogue over its plan must be trimmed`: Basic limits on an 80-item catalogue → the context contains `remove 50 item(s)` and `never add`.
  - `drops setCustomTheme on plans without custom themes`: Starter and Basic → absent; Pro → present.
- [ ] **Step 2: Run** `npx vitest run tests/unit/agent`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** it again. Expected: PASS. Ready for review.

---

### Task 5: The server sends the limits it used with every agent message

**Files:**
- Modify: `src/app/api/agent/route.ts`, `src/types/ai.ts`
- Test: `tests/unit/lib/entitlements/operation-limits.test.ts`

**Interfaces:**
- Produces: `export type AgentMessageMetadata = { turnId: string | null; limits: OperationLimits }` in `src/types/ai.ts`. The route's `messageMetadata` returns `{ turnId: rootTurnId, limits: turn.limits }`. `turn.limits` already comes from `operationLimitsFor` (Task 2), so it is plain JSON.

- [ ] **Step 1: Write the failing test** `limits survive a JSON round trip`: `JSON.parse(JSON.stringify(operationLimitsFor(f)))` deep-equals the original for every tier. This proves the metadata the browser receives is exactly what the server enforced.
- [ ] **Step 2: Run** it. Expected: PASS, or a FAIL that shows a non-JSON value to fix in Task 2's mapping.
- [ ] **Step 3: Implement** the metadata.
- [ ] **Step 4: Run** `npx tsc --noEmit && npm test`. Expected: PASS. Ready for review.

---

### Task 6: The browser replays agent edits within the plan, against the latest draft

**Files:**
- Modify: `src/context/CatalogueContext.tsx`, `src/hooks/useCatalogueChat.ts`
- Test: `tests/unit/context/CatalogueContext.test.tsx`, create `tests/unit/hooks/useCatalogueChat.limits.test.tsx` if the hook's resume path cannot be reached from the context test

**Interfaces:**
- Consumes: `AgentMessageMetadata.limits` (Task 5).
- Produces:
  - `applyAiOperations(operations: CatalogueOperation[], limits: OperationLimits): OperationOutcome`. `limits` is now required, so no call site can replay ungated.
  - `getCatalogue(): Omit<Catalogue, "id">` on the context, reading `catalogueRef.current`, which is updated synchronously.
- `useCatalogueChat`:
  - The apply effect passes the limits from that assistant message's metadata. If a message has no limits, its edits are **not applied**, and the user sees the existing error state.
  - An outcome with `limitReached` calls `setContentLimitHit(true)`.
  - The resume effect sends `context.getCatalogue()` instead of `context.catalogue`.

- [ ] **Step 1: Write the failing tests:**
  - `refuses the 31st item on Basic during replay`: seed 30 items, `applyAiOperations([add_items ×5], basicLimits)` → `applied` empty, draft still 30.
  - `skips later edits aimed at a section the replay refused` (Review Focus 3): Basic, 8 sections, replay `[add_section id S, add_items to S]` → neither applies, and no other section changes.
  - `a hand edit mid-turn cannot push the replay over` (Review Focus 4): seed 29, hand-add 1, replay `add_items ×3` → still 30.
  - `getCatalogue returns the draft including edits applied in this pass`: apply, then read in the same act → includes them.
- [ ] **Step 2: Run** `npx vitest run tests/unit/context tests/unit/hooks`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** it again. Expected: PASS. Ready for review.

---

### Task 7: The builder's own "Add another" respects the item limit

**Files:**
- Modify: `src/components/catalogue/view/CatalogueContent.tsx`
- Test: `tests/unit/lib/entitlements/required-plan.test.ts`, or a new `tests/unit/lib/entitlements/can-add.test.ts`

**Interfaces:**
- Produces: `canAddItem(content: unknown, items: number | "unlimited" | undefined): boolean` in `src/lib/entitlements/operation-limits.ts`, using `countPlanItems` (Task 1). Both `openAddItemModal` and the add branch of `handleSaveItem` call it. When it is false, the item is not added, the modal closes, and `setShowLimitsModal(true)` runs.

- [ ] **Step 1: Write the failing tests** `canAddItem stops at the limit`: Basic at 29 → true; at 30 → false; `"unlimited"` → true.
- [ ] **Step 2: Run** it. Expected: FAIL. **Step 3:** implement. **Step 4:** PASS. Ready for review.

---

### Task 8: The save enforces the appearance flags, and the theme library is gated

**Files:**
- Modify: `src/lib/entitlements/catalogue.ts`, `src/actions/catalogue.ts`, `src/lib/themes/upsert.ts`
- Test: `tests/unit/entitlements/plan-limits.test.ts`, create `tests/unit/server_actions/themes.test.ts` (copy the mocking pattern of `qr-configs.test.ts`)

**Interfaces:**
- Produces: `applyAppearancePlan<T extends Partial<Catalogue>>(next: T, tier: Tier): T` (D5: reset, never keep)
  - Without `styles`: `appearance.style` and `appearance.overlay` become `defaultCatalogueData`'s.
  - Without `customThemes`: a `custom` theme becomes `defaultCatalogueData`'s theme.
- It is folded into `applyPlanToCatalogue`, so every path that already calls that function (create, update, publish, duplicate) gets it with no new call sites.
- `applyPlanDowngrade` resets the same fields on the user's stored catalogues, the way it already resets branding and newsletter.
- `saveOwnTheme` and `updateOwnTheme` read the plan with `getPlanForUpdate` in their `withUser` and return `{ success: false, error: "Custom themes are not part of your plan" }` when `customThemes` is false. Deleting a theme stays allowed.

- [ ] **Step 1: Write the failing tests:**
  - `resets style and overlay to the defaults on a plan without style controls`
  - `resets a custom theme to the default theme on Basic`
  - `leaves appearance alone on Pro`
  - `applyPlanDowngrade resets style and custom theme on stored catalogues` (extend the existing downgrade test)
  - `refuses to save a theme on Starter`
  - `saves a theme on Pro`
  - Also pin the save as the hard limit: `contentWithinPlan refuses a Basic draft that grows from 30 to 50 items`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/entitlements tests/unit/server_actions tests/unit/lib/entitlements`. Expected: FAIL.
- [ ] **Step 3: Implement.** Then audit every write of catalogue content: `grep -rn "writeOwnedDraft\|\.update(c)\|insert(c)" src/actions src/lib`. Confirm each one passes `contentWithinPlan` and `applyAppearancePlan`, and list any that does not in the review notes.
- [ ] **Step 4: Run** the same command. Expected: PASS. Ready for review.

---

### Task 9: The daily backend job switches off catalogues that no longer fit, and switching on needs a full fit (D4)

**Files:**
- `../quicktalog-packages`: add `catalogueFitsPlan` next to the tiers in `@quicktalog/common`, with its tests in that repo, then release.
- `../quicktalog-backend`: modify `src/handlers/subscriptionProcessingJob.ts`, `src/index.ts` and `wrangler.jsonc`, and bump `@quicktalog/common` from 1.51.0 to the new release. The bump also brings the job's tiers up to date with the app's 1.69.0.
- App: modify `src/lib/entitlements/plan.ts` (`canActivate`), `src/actions/catalogue.ts` (`updateItemStatus`, `publishCatalogue`), and the dashboard's catalogue card (the inactive reason). Bump `@quicktalog/common`.
- Test: `tests/unit/lib/entitlements/content-within-plan.test.ts` in the app; the package's own tests for the rule.

**Interfaces:**
- Produces, in `@quicktalog/common`, so the job and the app judge alike:
  ```ts
  type PlanMisfit = { items?: { used: number; limit: number }; sections?: { used: number; limit: number }; lockedTypes?: string[] };
  catalogueFitsPlan(content: unknown, features: Tier["features"]): { ok: true } | { ok: false; misfit: PlanMisfit };
  ```
  It counts the same way as Task 1: every block is a section, and items are counted in items blocks. `countPlanSections` and `countPlanItems` move into the package with it, and the app re-exports them.
- **Schedule: three runs a day** *(owner decision 2026-10-24)*.
  - `triggers.crons` becomes `["0 3 * * *", "0 11,19 * * *"]`.
  - `scheduled()` in `src/index.ts` runs `AnalyticsProcessingJob` only when `event.cron === "0 3 * * *"`; the subscription job runs on every trigger. Analytics stays daily: its upsert on `catalogue_id,day` makes a repeat harmless, but each run is a PostHog query for nothing new.
  - Name the two cron strings as constants, so the dispatch and `wrangler.jsonc` can't drift apart unnoticed.
- **Backend job (the only place that switches catalogues off):** extend the subscription job with a second pass after the traffic pass.
  - The pass covers **all** users, free plan included, because the current query skips free users and a downgrade lands there.
  - It reads each user's active catalogues (`id, name, content`) a page at a time, and sets `status = 'inactive'` on each one that fails `catalogueFitsPlan` for the user's tier.
  - It adds those names to the existing revalidation batches.
  - It logs one line per user: the misfit and the names switched off.
- **App (gate only):** `canActivate(tx, tier, content)` keeps the traffic check and adds `catalogueFitsPlan`. The refusal names what to remove: "Remove 50 items and 2 Embed sections to fit the Basic plan." `updateItemStatus` (switching on) and `publishCatalogue` use it. Without this gate, the owner could switch a catalogue straight back on after the job switched it off.
- Draft saves (`updateCatalogue`) are unchanged: the non-growth rule still lets an over-limit catalogue be trimmed step by step.
- Known trade-off: between the downgrade and the next run, up to 8 hours, an over-limit catalogue stays live. Publishing and switching on are already refused in that window, because the gate uses the new plan straight away.

- [ ] **Step 1: Write the failing tests:**
  - Package: `catalogueFitsPlan names every misfit` (Basic with 80 items, 9 blocks and an embedding → `items {80,30}`, `sections {9,8}`, `lockedTypes ["embedding"]`) and `catalogueFitsPlan passes a catalogue exactly at the limits`.
  - App: `reactivation is refused until the catalogue fits` (Review Focus 1). Over → `canActivate` not ok, with a reason naming the counts; trimmed to fit → ok. Also `publish is refused for a catalogue over its plan`.
- [ ] **Step 2: Run** the package's tests and `npx vitest run tests/unit/lib/entitlements`. Expected: FAIL.
- [ ] **Step 3: Implement.** Order: package (release), app (bump, gate), backend (bump, job pass).
- [ ] **Step 4: Verify.** In the app: `npx tsc --noEmit && npm run check && npm test`. In the backend: `npx tsc --noEmit` (it has no test runner). Then run the jobs against **TEST** with `npm run dev` (`wrangler dev --test-scheduled`). Trigger `/__scheduled?cron=0+11,19+*+*+*` and check from the logs that only the subscription job ran, then `cron=0+3+*+*+*` and check that both ran. Use with a TEST account moved to Starter that owns one catalogue over the limit and one within it. Expected: only the first becomes `inactive` and its page is revalidated. Confirm with a read-only `select name, status from catalogues where user_id = …` on TEST. Ready for review.

---

### Task 10: Keeping AI changes saves them, upgrading never loses the draft, and the builder warns before leaving

**Files:**
- Modify: `src/context/CatalogueContext.tsx`, `src/components/catalogue/builder/CatalogueBuilder.tsx`, `src/components/catalogue/builder/CatalogueInitializer.tsx`, `src/components/catalogue/builder/useBuilderActions.ts`, `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx`, `src/components/modals/limits/LimitUpgradeComparison.tsx`
- Modify also: `src/components/catalogue/chat/CatalogueChat.tsx`, `src/hooks/useCatalogueChat.ts`
- Create: `src/hooks/useUpgrade.ts`, `src/hooks/useSaveDraft.ts`
- Test: `tests/unit/context/CatalogueContext.test.tsx`, create `tests/unit/hooks/useUpgrade.test.tsx`

**Interfaces:**
- Produces on the context:
  - `seedCatalogue(c: Catalogue): void`: sets the catalogue and marks it saved. It replaces `updateCatalogue(item)` in `CatalogueBuilder` and `CatalogueInitializer`.
  - `markSaved(): void`: the current catalogue becomes the saved one.
  - `isDirty: boolean`: true when the catalogue is not the object last seeded or saved.
- `useUpgrade(): () => Promise<void>`:
  - Not dirty → `router.push("/pricing")`.
  - Dirty → `updateCatalogue` action. On success, `markSaved()` then push. On failure, toast the action's error plus "Your changes are still here", then `window.open("/pricing", "_blank", "noopener")` and stay.
  - Used by `LimitsOverlay` (replacing its `finally` navigation) and by `LimitUpgradeComparison` (a button instead of the `<Link>`; the `contactInstead` link is unchanged).
- `useBuilderActions` calls `markSaved()` after a successful save or publish.
- The builder page renders `<NavigationGuard isDirty={isDirty} />` (`src/hooks/useBeforeUnload.tsx`).
- Autosave on keep (D7): `useSaveDraft(): () => Promise<{ ok: boolean; error?: string }>` in `src/hooks/useSaveDraft.ts` is the one save path. It is a no-op when not dirty; otherwise it runs the `updateCatalogue` action and calls `markSaved()` on success. `useUpgrade` and `useBuilderActions` use it too.
  - `CatalogueChat.acceptChanges` (the Keep button) calls it after `acceptAiChanges()`. It announces "Kept and saved", or on refusal shows the action's reason and leaves the draft dirty.
  - `useCatalogueChat.send` calls it after its implicit `acceptAiChanges()`, without waiting on it before sending the new ask.

- [ ] **Step 1: Write the failing tests:**
  - `isDirty follows seeds, edits and saves`: false after `seedCatalogue`; true after `applyAiOperations`; false after `markSaved`; false again after `rejectAiChanges` back to the seed.
  - `useUpgrade saves before leaving`: dirty, the action resolves `{ success: true }` → called once, then `push("/pricing")`.
  - `useUpgrade keeps the builder when the save is refused` (Review Focus 5): the action resolves `{ success: false }` → no `push`; `window.open` called with `/pricing` and `_blank`.
  - `useUpgrade goes straight to pricing when nothing is unsaved`.
  - `useSaveDraft does nothing when nothing is unsaved`; `useSaveDraft saves and marks saved`; `useSaveDraft leaves the draft dirty and returns the reason when the save is refused`.
  - `Keep saves the AI changes`: render the chat review bar with a dirty draft, click Keep → the action is called once, and `isDirty` becomes false.
- [ ] **Step 2: Run** `npx vitest run tests/unit/context tests/unit/hooks`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** it again. Expected: PASS. Ready for review.

---

### Task 11: AI edits survive a builder remount (T4)

**Files:**
- Modify: `src/components/catalogue/builder/CatalogueBuilder.tsx`, `src/components/catalogue/builder/CatalogueInitializer.tsx`, possibly `src/components/catalogue/chat/CatalogueChat.tsx`
- Test: create `tests/unit/components/builderRemount.test.tsx`

**Interfaces:**
- Consumes: `seedCatalogue` and `isDirty` (Task 10).
- Fix for candidate (a):
  - Seed in one place only (`CatalogueInitializer` goes; `CatalogueBuilder` seeds).
  - Seed only when the incoming `id` differs from the context's current id.
  - Remove `resetCatalogue` from `CatalogueBuilder`'s unmount; `Overview` already resets before a new catalogue is created.

- [ ] **Step 1: Reproduce** on TEST with the tester's steps (use the superpowers:systematic-debugging skill). Record whether the revert followed (a) a remount, a refresh or a page change, or (b) the Undo button. If it was (b), this task becomes a copy change: label the bar's button "Undo this ask" with a line saying it returns to how the catalogue was before the ask. Then go to Step 4.
- [ ] **Step 2: Write the failing test** `keeps unsaved AI edits across a remount of the same catalogue`: render the builder with item X, `applyAiOperations` one edit, unmount and remount with X → the edit is still there. Plus `loads a different catalogue on a new id`: remount with Y → Y's content.
- [ ] **Step 3: Run** it (FAIL), implement, then run it again (PASS).
- [ ] **Step 4: Run** `npx tsc --noEmit && npm run check && npm test`. Expected: PASS. Ready for review.

---

### Task 12: Prompt tip in the chat (T6)

**Files:**
- Modify: `src/components/catalogue/chat/CatalogueChat.tsx`

- [ ] **Step 1:** In the empty state, under the existing paragraph, add exactly: `Tip: the more detail you give - item names, prices, sizes and the order you want them in - the better the result.`
- [ ] **Step 2: Run** `npx tsc --noEmit && npm run check`. There is no chat render test to extend; say so in the review notes. Ready for review.

---

### Task 13: Docs, index, TEST check

**Files:**
- Modify: `docs/architecture/builder.md`, `docs/architecture/ai-chat-flow.md`, `.claude/plans/README.md`

- [ ] **Step 1: Docs.**
  - `builder.md`: a "Plan limits" section covering the three enforcement points (D1), the text-block rule (D3), downgrade behaviour (D4, D5) and upgrade (D6).
  - `ai-chat-flow.md`: the replay is gated with the limits in message metadata, and continuations read `getCatalogue()`.
- [ ] **Step 2: Verify:** `npx tsc --noEmit && npm run check && npm test`, all pass.
- [ ] **Step 3: TEST check**, deployed to TEST, by hand:
  - Basic test account at 27 items: ask the agent for 20 more. Expect 3 added and a message saying 17 were left out for the whole catalogue.
  - A 4-part build that adds items in batches: the draft never passes 30.
  - "Add another" at 30: the limits modal opens.
  - The custom theme ask on Basic: refused, with the reason.
  - Upgrade with unsaved AI edits: saved first, or kept open with pricing in a new tab.
- [ ] **Step 4:** When everything has shipped, set the status to `done`, move the plan to `archive/`, and update the index.
