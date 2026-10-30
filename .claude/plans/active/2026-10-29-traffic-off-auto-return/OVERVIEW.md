# Catalogues that come back on their own: the short version

The detail is in [PLAN.md](PLAN.md). It follows
[the change that made allowances reset 30 days after signup](../2026-10-29-usage-period-from-signup/OVERVIEW.md).

## The problem

Every plan includes a number of page views - 500 on the free plan, up to 40,000 on
Premium - counted across all of someone's catalogues. When an account goes over, the
nightly job takes its catalogues offline. Nothing ever puts them back: the owner has to
find the dashboard and switch each one on again. That was just about workable when every
account reset on the 1st of the month, because "wait for the 1st" was one date everybody
knew. Now each account resets on its own date, 30 days after it signed up, and there is
nothing in the product that puts a catalogue back when that day comes.

## What goes wrong today

**A popular catalogue goes offline and stays offline.** The owner's page views run out, the
job switches the catalogue off that night, and it is still off a week after the allowance
came back - until somebody notices and switches it on by hand.

**The free plan's limit is not really a limit.** The job skips every free account, so a
free catalogue serves well past its 500 page views. The only place the limit bites is when
the owner next tries to publish or re-activate something, which is a confusing way to
learn about it.

**Nobody is told.** No email, and the dashboard only says "Inactive" - the same word it
uses for a catalogue the owner switched off themselves.

## The fix in one idea

**The job remembers which catalogues it switched off for traffic, and switches those back
on at the next reset.**

1. When the job takes a catalogue offline for the traffic limit, it records that it was the
   one that did it.
2. In the first run after the owner's 30-day period rolls over, it puts those catalogues
   back online - one attempt, there and then.
3. If the owner touches that catalogue's status themselves in the meantime, the automatic
   return is cancelled: their decision wins.
4. Free accounts are now checked like every other plan.

The guarantee: being popular takes your catalogue offline for the rest of the period, not
indefinitely - and nothing comes back online that you switched off yourself.

## What users will notice

- A catalogue taken offline for traffic comes back by itself on the day the allowance
  resets, within a few hours.
- The dashboard says so: an automatically switched-off catalogue shows `Back online:
  27 November 2026` next to its other details.
- Switching a catalogue off yourself is final - the job will not undo it.
- **Free accounts over 500 page views will go offline where they did not before.** The
  first run after this ships switches off any free catalogue already over the allowance,
  with no email first. That is the intended behaviour, and it is the one visible change
  that takes something away.

## Decisions we made (please confirm)

- **The free plan is enforced in the nightly job**, as asked. The cost is the paragraph
  above: real free catalogues go offline the first night, and the product sends no warning
  email, so the first many owners hear of it is a dead link.
- **One automatic attempt, at the reset.** If a catalogue cannot come back that day -
  because it also grew past what its plan allows - it stays off until the owner acts.
  Keeps the promise bounded: nothing reappears weeks later unexplained.
- **An owner's own switch-off always wins** and cancels the automatic return. Enforced in
  the database, so no future change to the app can forget it.
- **Catalogues switched off for being over their plan are not included.** Those need
  content changes or an upgrade; coming back silently would hide the real problem.
- **Still no email.** Going offline with no notice is the real gap here, and it deserves
  its own decision rather than being smuggled into this one.

## Order of work

1. The database records which catalogues the job switched off for traffic, and forgets it
   the moment the owner changes that catalogue's status.
2. The job: free accounts included, page views counted for everyone in one pass, and the
   switch-back at the reset.
3. The dashboard names the date a catalogue is coming back.
4. The written documentation of how the traffic limit behaves.

Each step is checked with the project's database and app test suites plus a check on TEST.
The database changes: one new nullable column on catalogues and one trigger. No data is
moved, and switching back is a matter of leaving the column unused.

## Not in this plan

- Warning anyone by email before or after their catalogues go offline.
- Bringing back catalogues that were switched off for being over their plan, after an
  upgrade.
- Any change to the allowance sizes.
