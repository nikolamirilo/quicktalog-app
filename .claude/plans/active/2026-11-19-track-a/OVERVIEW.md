# Track A: the short version

The detail is in [PLAN.md](PLAN.md).

## The problem

Quicktalog promises that a new owner can go from signing up to a published catalogue in
minutes. Only 28% of real signups (610 of 2,200) ever create one, 159 of 628 catalogues
are still drafts, and 160 have no content at all. Price is not the blocker — Basic is $5
a month. Track A is the engineering half of the fix: the things that lose people's work
or hide the product from them.

## What goes wrong today

**Pressing Save does not store the catalogue anywhere permanent.** The Save button says
"Catalogue saved successfully", but the work goes into a temporary cache that expires
after 30 days of not being opened and can be lost outright. The catalogue's own record
stays empty until the owner presses Publish. That is why 160 catalogues on the live site
have no content.

**Nothing saves by itself, and nothing warns you.** A new owner who builds a menu with
Quick AI and then goes back to the dashboard has no idea whether anything was kept. There
is no "saving" or "saved" indicator anywhere in the builder.

**Creating a catalogue looks like it did nothing.** After "Create Catalog" the dialog
closes and the home page sits there for about four seconds — we wait for the account
data to refresh before opening the builder — with only a small toast as a sign that
anything happened.

**A new catalogue opens empty and does not say what to do.** You get "+ Add Heading" and
an empty "Add Section" box. Quick AI, the thing that actually builds the menu in about
25 seconds, is a small pill in the corner, and its four suggestions ("Raise every price
by 10%") all assume you already have content.

**The dashboard does not tell you a catalogue is unfinished.** A draft card shows the
name, the status and two dates — no item count, no "last saved", no nudge to publish,
even when the builder is holding 25 items.

**Search engines, link previews and AI assistants see an empty site.** Prices on the
pricing page arrive only after the browser runs JavaScript, so a crawler sees a dash.
The demo page is an embedded tour that shows "Loading tour…". FAQ answers sit in
collapsed panels that most fetchers drop. And we have no idea where any of our 2,200
signups came from: the source is blank for 2,180 of them.

**The product calls itself two different things.** "Catalog" in the hero, the create
dialog and the page title; "catalogue" in the plans, the dashboard and every toast.

## The fix in one idea

**Drafts become real, saved automatically, and Publish stays the only thing customers
see.**

1. Every edit is written to a durable draft in the database about a second and a half
   after you stop typing, with a status in the builder that says "Saving…", "All changes
   saved" or "Offline – retrying". The Save button goes.
2. Quick AI's suggestions are a proposal, not a save: nothing is stored until you press
   Keep, and nothing you Keep is lost — closing the tab flushes it first.
3. Publish copies the draft onto the live catalogue. Until then, diners keep seeing the
   old prices, and the builder and the dashboard both say "Unpublished changes".

The guarantee: you can close the browser at any moment and find your work where you left
it, on any device, and nobody ever sees a half-edited price.

Around that, the rest of Track A removes the dead time after Create, puts Quick AI in
front of an empty catalogue, makes the dashboard honest about unfinished work, and puts
the prices, the demo and the FAQ answers into the page itself so crawlers and link
previews can read them — plus, finally, records where each signup came from.

## What users will notice

- No Save button. A status in the builder instead, which also opens the last 10
  autosaves if you want to go back to one.
- Closing the tab, losing Wi-Fi or switching device no longer loses edits.
- "Unpublished changes" on the Publish button and the dashboard card.
- The builder opens within a second of pressing "Create Catalog".
- A new catalogue opens with Quick AI ready and suggestions that build something — from
  a description, from a photo of a printed menu, or from a template — and the heading is
  already filled in with the catalogue's name.
- Draft cards show how many items are in them and when they were last saved, with
  Publish as the main button; a banner appears if you have no published catalogue yet.
- Prices ($5, $12, $30, $60) appear in the pricing page itself, in Slack and WhatsApp
  link previews and in Google results, with FAQ answers alongside them.
- The demo page shows real product content before the interactive tour loads.
- One spelling: catalogue.

## Decisions we made (please confirm)

- **Drafts move into the database and out of the temporary cache.** Costs one new table
  and a migration; makes a draft as safe as a published catalogue and actually makes the
  builder load slightly faster.
- **A draft keeps the whole catalogue, not just the sections.** Style, header and footer
  edits are drafts too; keeping only the content would lose them.
- **"Unpublished changes" is based on when you last saved versus last published**, not a
  comparison of the two. If you make a change and undo it by hand, it still says
  unpublished until you publish or reload.
- **No database type regeneration or package release in this change.** The new tables are
  read with direct queries for now, the same way the existing acquisition answer is. A
  follow-up tidies this up.
- **The migrations are written but not applied.** Applying them to TEST and then the live
  site stays an operator step.
- **Where a visitor came from is recorded by the browser, not the server.** Recording it
  server-side would stop the home page being cached for everyone. The record is still
  first-party, so ad blockers do not hide it.
- **The source is written when the account is created**, through the Google and email
  sign-up paths. A sign-up that somehow skips both keeps a blank source.
- **The last 10 autosaves are kept per catalogue** so there is something to go back to
  now that there is no manual save point. Costs up to 10 copies of each catalogue's data.
- **"Catalogue" everywhere in the product, but the blog articles keep "catalog".** They
  are written to be found by people searching the US spelling, and their web addresses
  are already shared; renaming them would undo the SEO work in this same plan. The
  hidden list of search terms also keeps both spellings, since that is the word most
  people type. A test now fails if "catalog" appears anywhere else.
- **Prices are fetched on our server once an hour.** A visitor outside the US may briefly
  see USD before their local price loads.
- **The "you have unsaved changes" warning now only appears when a save is actually
  failing.** Everything else is saved on the way out, and warning on every edit would
  leave a stray step in the browser's Back history.

## Order of work

1. Autosave, the durable draft, the status, Publish and version history (QT-01).
2. Open the builder straight after Create Catalog (QT-03).
3. Quick AI first in an empty catalogue, with content-creating suggestions (QT-04).
4. Prices in the page itself, with pricing structured data (QT-05).
5. Real product content on the demo page without JavaScript (QT-06).
6. Draft state and the publish nudge on the dashboard (QT-08).
7. Record where each signup came from, plus the funnel report (QT-09).
8. FAQ answers in the page, with FAQ structured data (QT-10).
9. One spelling: catalogue (QT-11).

Each step is checked with the type checker, the linter and the unit tests. All nine are
done, and the result was also built for production and the pages read back: the pricing
page's HTML now carries $5, $12, $30 and $60 with no "Price loading", the FAQ answers
are in the page, the demo page shows a real sample catalogue, and the only "catalog" left
in the home page is the hidden list of search terms.

Two steps change the database: step 1 adds the draft tables, step 7 adds the acquisition
columns and the funnel report. Both are written as migration files and applied by an
operator — to TEST first, then live. Still to do by hand after that: moving the drafts
currently sitting in the temporary cache into the new table, filling in older accounts'
sources from what our analytics already knows, and renaming the plans in Paddle (those
names live in Paddle, not in our code).

## Not in this plan

Track B, the product and growth bets (PB-01 to PB-05: the free-to-paid upgrade trigger,
multi-language catalogues, agency workspaces, per-item action buttons and homepage social
proof). Those are decisions to make before building, and the action plan says to validate
each with 5–10 real users first.
