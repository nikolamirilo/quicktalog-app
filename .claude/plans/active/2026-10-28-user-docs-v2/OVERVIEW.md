# The new user manual: the short version

The detail is in [PLAN.md](PLAN.md). The evidence behind every claim is in [research/](research/).

## The problem

Quicktalog has nine tutorial pages at `/docs` that read start to finish. They are good for
a first read and poor for looking something up, and some of what they say is no longer
true. The biggest gap is that nothing explains the one rule that catches people out:
**Save keeps your work privately, and only Publish changes what customers see.**

## What goes wrong today

**The published docs point people at a button that does not exist.** The Quick AI page
tells readers to look for "Ask AI" in the toolbar on the right. There is no such button.
Quick AI is a floating pill in the bottom left of the builder, and the rail on the right
has no AI control at all.

**Nothing tells a reader that saving is not publishing.** Save writes a private draft.
The toast says "Catalogue saved successfully", which reads like the job is done. A reader
who saves and then checks their public link sees no change and assumes something is broken.

**The rules that lose work are undocumented.** There is no autosave, no undo and no drag
and drop. Deleting a section takes its items with it, and the only way back is to reload
to the last save. None of that is written down anywhere a reader will find it.

**Numbers are scattered or wrong.** A reader cannot find out in one place that Starter
allows 5 sections and 15 items, that a divider counts as a section, or that a blank price
is published to customers as the word "Free".

**There is nowhere to look up a message.** When Quicktalog says "Cannot publish: missing
heading." or "SVG images aren't supported here.", the docs have no entry for it.

## The fix in one idea

**A reference manual at `/docs/new`, written from the code, where every page covers one job.**

1. Twenty-five pages across nine modules, each opening with what it helps you do, what you
   end up with, and the path through the product to the screen.
2. Pictures of the real screens, drawn from the component code at the product's own sizes,
   with numbered points you can hover to light up the matching spot.
3. Every setting, every limit and every message the product can show, with the fix.

Everything in it was taken from the code and checked against it, so it describes Quicktalog
as it behaves today rather than as it was meant to behave.

## What users will notice

- A searchable manual at `/docs/new`, with the module list on the left and `/` to search.
- Search that understands the words people actually type, so "menu" and "price list" find
  the items page.
- A quickstart that remembers which steps you have ticked off when you come back.
- Honest limits: one table with every number, and a plain list of the things Quicktalog
  cannot do.
- A troubleshooting page you can search for the exact message on your screen.
- The existing `/docs` pages are untouched and still work.

## Decisions we made (please confirm)

- **It sits under the normal site navbar, with no marketing footer.** Readers can still
  reach pricing and their dashboard, but they do not scroll into a sales band mid task.
- **It is built to replace `/docs` later, not to sit beside it forever.** The cost is two
  sets of docs until you decide to switch, which is a content decision, not a code one.
- **No reading themes or text-size buttons.** Quicktalog has one look, and a second theme
  system inside it would be a maintenance burden for a small gain.
- **Prices are not written down.** They are read live from the payment provider, so the
  manual points at the pricing page rather than repeating numbers that could go stale.
- **Screens are drawings, not screenshots.** They never go out of date from a screenshot
  being forgotten, but they do have to be updated by hand when a screen changes.
- **The stricter password rule is documented.** The product says eight characters; it also
  requires a capital, a lowercase letter and a digit. The manual says so, because the
  gentler version leaves people stuck.

## Order of work

1. Agree the scope and record it.
2. Read the code, area by area, with evidence for every fact.
3. Build the page framework and the module list.
4. Draw the screens from the component code.
5. Write the twenty-five pages.
6. Check every label and message against the code.
7. Render every page and compare each drawing with the real screen.

Each step was checked before the next began, and the last two were done against a running
copy of the app. Nothing touches the database, and no product behaviour was changed.

## Not in this plan

- Switching `/docs` over to the new manual, and retiring the old pages.
- Fixing the product problems the research turned up. They are listed at the end of this
  file so they can be picked up separately.

## For the product team

Found while reading the code. None of them were changed.

1. **Sign-ups may be switched off.** Both environment configs set `disable_signup: true`.
   If that matches the live project, the Create account form works right up to submit and
   then fails. This needs checking, because the manual tells readers to sign up.
2. **The published Quick AI doc is wrong** about where the assistant lives, and the builder
   architecture doc repeats the error.
3. **A blank price is published as "Free".** There is no way to have an item with no price
   from the builder, which a service list usually wants.
4. **"On sale" can be saved without filling it in**, which shows the same price twice, once
   struck through, with no badge.
5. **The Standard Catalog template says four categories and ships five sections**, which
   uses a Starter plan's whole allowance at once.
6. **The Social Media embed preset cannot work.** It tells people to paste Instagram and
   TikTok code, which needs a script, and scripts are stripped.
7. **"External content" in the picker is labelled "Embed" on the block itself.**
8. **Image limits are stated three ways** (50 MB, 1200 KB, 4 MB). Only 50 MB is visible.
9. **Plan changes are a full new purchase** with the old subscription cancelled at once and
   no proration, and the cancel result is never checked, so a failed cancel could leave
   someone paying twice.
10. **Dashboard totals can read lower than the analytics page**, because each day's row is
    written once, early, and never updated.
11. **The traffic cut-off skips free-plan accounts**, while the FAQ says every plan is
    affected.
12. **Analytics: Basic and Advanced are labels with nothing behind them.** Every plan sees
    the same page.
