# Agent and plan limits: the short version

The plain-language summary of [PLAN.md](PLAN.md). The detail and the evidence are in
[FINDINGS.md](FINDINGS.md).

## The problem

Every plan sets limits: how many items and sections a catalogue can have, which block
types it can use, and which settings are unlocked (branding, style controls, custom
themes, the newsletter form). The builder mostly respects these when you edit by hand.
The AI assistant doesn't always, the builder slips in a couple of places, and a
downgrade leaves premium catalogues live on a cheaper plan.

## What goes wrong today

**The AI can add more items than the plan allows.**
When the AI works, it checks the limit against a copy of the catalogue that the browser
sends it. That copy can be out of date, especially when a big request is split into
several rounds. The browser then applies whatever the AI did without checking anything.
That is how a Basic catalogue (30 items) reached 50. Saving still refuses it, so the user
ends up with work they cannot keep.

**The AI misunderstands the limit.**
Nobody tells the AI what the limits are. When it hits one, the message it gets says
"nothing added to *Coffee*", so it concludes the limit is per category. That is the
"15 per category" the tester saw on the free plan. The limit is 15 for the whole
catalogue.

**The AI uses settings the plan doesn't include.**
On Starter and Basic it can build a custom theme and change fonts, corners and shadows,
and those changes save. It can switch on the newsletter form on plans without it (the
save quietly removes it later).

**Sections are counted two ways.**
Every block, text included, should count toward the section limit. Saving counts that
way, but the builder and the AI let text blocks through, so a catalogue that looks fine
can fail to save.

**The builder lets one extra item through.**
"Add another" in the item form doesn't re-check the limit, so Basic allows 31.

**A downgrade leaves premium catalogues live.**
Someone who built a big catalogue on Premium and moves to the free plan keeps it live,
with all its items, sections, custom code blocks, styles and custom theme.

**Work gets lost.**
- Clicking "Upgrade now" from the chat leaves the page without saving, so the AI changes
  the user already paid credits for are gone.
- Keeping the AI's changes doesn't save them, and the builder never warns that you have
  unsaved changes.
- The tester also saw AI changes revert to the default catalogue. There are two likely
  causes; we'll confirm with the tester's steps first.

## The fix in one idea

**Check the plan at three points, using the same rules everywhere:**

1. **When the AI makes a change.** It knows the limits and current counts before it
   starts, and every refusal explains the limit in plain words ("your plan allows 30
   items in the whole catalogue; 17 were left out").
2. **When the change lands on your screen.** The browser applies the AI's changes only
   within the plan, so the catalogue you see can never go over.
3. **When you save or publish.** This is the final word, on the server. Locked settings
   are reset, and a catalogue goes live only if it fits the plan completely.

On top of that, the background job (three times a day) switches off any catalogue that no longer fits
its owner's plan, and it stays off until it's brought within the limits.

## What users will notice

- The AI does what fits and says clearly what it left out and why.
- No more catalogues that look finished but won't save.
- Locked settings stay locked, whether you edit by hand or through the AI.
- Clicking "Keep" on the AI's changes saves them straight away.
- "Upgrade now" saves your work first. If saving isn't possible (for example because you
  are over the limit), pricing opens in a new tab and your work stays open.
- The builder warns before you leave with unsaved changes.
- After a downgrade, a catalogue that's over the new plan goes offline with a clear
  message about what to remove. You can trim it by hand or ask the AI to help, then
  switch it back on.
- A tip in the chat: the more detail you give, the better the result.

## Decisions we made

Confirmed by the owner on 2026-10-24:

- **The save stays the final authority.** The AI doesn't also count against the last
  saved version; if you delete items without saving, it would wrongly refuse room you
  really have.
- **Every block counts toward the section limit**, text included. The catalogue's title
  is not a block and doesn't count.
- **After a downgrade, a catalogue that doesn't fit is switched off.** It can be switched
  on again only once it fits completely. Meanwhile you can edit, move and delete, but not
  add. The existing background job does the switching off, now three times a day; until it runs (at most about 8 hours), the catalogue can't be published or switched back on unless it fits.
- **Upgrade saves first**, and never throws work away.
- **Keeping the AI's changes saves the catalogue**, whether you click Keep or just carry
  on with a new request. If the save is refused, you see why and nothing is lost.

- **Locked settings are reset, not kept.** On a plan without style controls or custom
  themes, saving or downgrading resets them to the defaults, the way branding and the
  newsletter already work. A downgraded owner loses their custom look; they couldn't
  change it anyway, because the controls are locked.

## Order of work

1. Count sections and items the same way everywhere.
2. One place that turns a plan into limits, plus the missing setting checks.
3. Clear limit messages for the AI.
4. Tell the AI the limits up front, and when a catalogue is over them.
5. The server sends its limits to the browser.
6. The browser applies AI changes only within the plan, using the latest catalogue.
7. Fix "Add another".
8. Saving resets locked settings; saving a custom theme checks the plan.
9. The background job, now three times a day, switches off catalogues that don't fit; switching on requires
   a full fit (background job, app and shared package).
10. Keep saves, upgrade and leaving the page keep your work.
11. Find and fix the "reverted to default" report.
12. Prompt tip.
13. Docs and a hands-on check on TEST.

Each step has its own tests and is reviewed before the next one starts. Nothing changes
in the database. Step 9 also touches the backend job and the shared package, which
needs a release.

## Not in this plan

AI credit limits (the AI spending more credits than the plan allows) are a separate plan:
[2026-10-24-ai-credit-hard-cap](../2026-10-24-ai-credit-hard-cap/OVERVIEW.md).
