# The failing release tests: the short version

The detail, task by task, is in [PLAN.md](PLAN.md).

## The problem

Release testing on 2026-10-27 ran 19 cases against test.quicktalog.app and two came back
FAIL: the logo upload case and the new search bar on published catalogues. Two cases that
passed also carry a note worth acting on. The logo case is really four separate problems
that happened to be found under one test, and one of them is a real bug a paying customer
would meet on the day they cancel.

## What goes wrong today

**After cancelling, the Quicktalog logo sends visitors to the owner's old website.**
The tester's words: "the navbar went back to the default one but the Quicktalog logo then
took me to my previous custom link instead of quicktalog.app". When a plan no longer
includes branding, the header goes back to the Quicktalog one — but its link is still
whatever website the owner typed in. So the page shows our logo pointing at someone
else's site. The footer logo has the same fault.

**The logo size slider works even when there is no logo.**
Nothing is uploaded, yet the owner can sit and drag "Logo width" with nothing to show for
it. The builder already has the opposite hint — it tells you when an uploaded logo will
not show — but not this one.

**The logo stops growing a third of the way along the slider.**
The slider ran to 300 px wide; in the floating navbar the logo stopped at 44 px tall, so
most of the range did nothing. The hint under the slider did say so, and the tester still
hit it and reported it, which is the real signal: a control that visibly does nothing
reads as broken. The deeper problem is that the setting was a width while the limit is a
height.

**People want to round the logo.** The new navbar is a rounded pill and a square logo
sits oddly in it. This one is a request, not a defect.

**The search bar "does not show unless you change the placeholder text".**
We could not reproduce this one. The setting is stored correctly on TEST — two catalogues
have the bar switched on with an empty placeholder — and the published page is written to
show the bar whenever it is switched on, filling in "Search items…" when the owner left
the placeholder empty. So either the page was still the pre-publish version when the
tester reloaded, or the glass search bar is hard to see until there is text in it. Both
are worth knowing, and both are separate from the setting itself. The tester's own
suggestion — never leave the placeholder empty — is cheap and we are doing it either way.

**The free plan strands one AI credit.** Starter gets 15 credits a month and a request in
the builder costs 2, so the eighth request is refused with 1 credit still showing. Every
paid plan's allowance is already an even number.

## The fix in one idea

**Whatever decides which logo to draw should also decide where it links and how big it
gets.** Today those three answers come from three unrelated places, which is why
cancelling a subscription changes the logo but not its link.

1. A default header or footer links to the Quicktalog site; only a custom one links to the
   owner's website.
2. The logo size control is inactive until a logo exists, with an "Upload a logo →"
   shortcut that jumps straight to the upload — the same shortcut we already have for
   glass settings.
3. Logo size is one slider per place, 10% to 100% of what that place allows, so the
   whole range does something and 100% means "as big as it goes".
4. The search placeholder is never stored empty, so the bar always shows readable text.

The guarantee: a catalogue can never show the Quicktalog logo pointing at a customer's
site, and no logo or search control is adjustable while it has no effect.

## What users will notice

- Cancel a subscription and the Quicktalog logo in the header and footer goes to
  quicktalog.app, not your old website link.
- With no logo uploaded, "Logo size" is greyed out and offers an "Upload a logo →" link.
- "Logo size" reads 10%-100% instead of a pixel width: 100% fills the navbar (56 px tall,
  less on phones) or the footer (72 px), and every step in between changes what you see.
- "Corner rounding" reads 0%-100%, where 100% is a full circle on a square logo.
- The search bar on a published catalogue always shows "Search items…" unless the owner
  typed something else, and the builder shows that same text in the field.
- Free accounts get a round number of AI credits, so none is left stranded.
- A "Corner rounding" slider under the logo width, in both the Header and Footer tabs.

## Decisions we made (please confirm)

- **A default header or footer always links to the Quicktalog site.** A free-plan owner
  loses the logo as a link to their own site; their website is still on the footer icon
  and in the contact row.
- **Logo size became a percentage of what each place allows.** 100% is 56 px tall in the
  navbar - the most a fixed 64 px pill carries without pushing the page down - and 72 px
  in the footer; phones still cap at 44 px. The cost: the old pixel width is no longer
  read, so a catalogue that had one now draws at 100% and its logo may look larger than
  before.
- **Corner rounding became a percentage of fully round.** 100% is a circle on a square
  logo, so the whole slider is useful. Anything set during testing now draws half as
  round as it did.
- **An empty search placeholder is saved as "Search items…".** An owner who wants a bar
  with no placeholder at all cannot have one.
- **Starter moves to 16 AI credits, not 14.** That is one extra request a month per free
  account; 14 would take one away. It needs a shared-package release.
- **Logo rounding ships as a "Corner rounding" slider**, starting at square so no
  existing catalogue changes. Its first version is released; the 0-100% range and the new
  size setting need one more shared-package release.

## Where this stands

Steps 1, 2, 3 and 7 - the whole logo row - are done and tested (846 unit tests pass).
The rounding setting went out in shared package 1.78.0; the new percentage size setting
and the wider rounding range need the next release. They still need a look in a browser
on TEST. Steps 4, 5 and 6 (the search bar and the AI credits) are not started.

## Order of work

1. Default header and footer logos link to Quicktalog; custom ones link to the owner.
2. Logo size is inactive without a logo, with the upload shortcut.
3. The navbar logo grows with the chosen width.
4. The search placeholder is never empty.
5. Reproduce the search-bar report on TEST and close it as a pass or a narrower fault.
6. Starter's AI credits move to an even number.
7. Logo rounding, if the release carries a package release.

Steps 1 and 4 get unit tests; steps 2, 3 and 7 are checked in the builder and on a
published page, desktop and phone; step 5 is the check itself. Nothing changes the
database. Steps 6 and 7 need a `@quicktalog/common` release; steps 1-5 do not.

## Not in this plan

- The page row asking to delete the "version 4 33x33" text is Confluence cleanup.
- The plan-limit and AI credit cap behaviour itself passed testing and is covered by
  [2026-10-24-agent-plan-limits](../2026-10-24-agent-plan-limits/PLAN.md) and
  [2026-10-24-ai-credit-hard-cap](../2026-10-24-ai-credit-hard-cap/PLAN.md).
