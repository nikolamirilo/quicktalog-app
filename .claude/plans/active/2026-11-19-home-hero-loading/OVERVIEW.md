# Home hero loading: the short version

The detail is in [PLAN.md](PLAN.md), the measurements in
[verification.md](verification.md).

**Built on 2026-11-19 and awaiting a look in the browser.** The hero picture went from
5.6 MB to between 25 KB and 117 KB depending on the screen, the home page carries 25 kB
less JavaScript, and nothing shifts as the picture loads.

## The problem

The home page is the first thing a visitor sees, and the picture of a catalogue beside
"Create a Stunning Digital Catalogue in Minutes" is the biggest thing on it. That picture
is a 5.6 MB file. It is shown at about 760 pixels wide, but the file is 3152 pixels wide,
so we send roughly sixteen times the picture anyone can see. On a phone on mobile data
that is several seconds of staring at an empty space. The same page then loads a payment
script and two pop-up dialogs that nobody has asked for yet.

## What goes wrong today

**The hero picture is about 140 times larger than it needs to be.**
At the size it is actually shown, the same picture is 41 KB as a modern image file, or
25 KB in the newest format. We send 5.6 MB. This is the single biggest thing on the page
and it is also the thing Google measures when it judges how fast the page feels.

**We switched off the automatic image handling, so nothing shrinks it for us.**
The app is set to leave images untouched everywhere except a developer's own machine.
That was a sensible choice to avoid per-image hosting costs, but it means the picture has
to be prepared in advance instead - and nobody prepared it.

**About a third of the picture file is empty space, and it makes the page jump.**
The file has a wide band of nothing along the bottom. The page reserves a space the right
shape for the artwork, then the picture arrives a different shape and pushes everything
below it. The artwork also ends up smaller than intended, with dead space under it.

**A second copy of the hero, 19.7 MB, is shipped with every deploy and never used.**
It sits beside the one we use. Nothing on the site points at it. Separately, one article
points at a picture that does not exist, so that article shows a broken image today.

**Pictures are re-checked with the server on every visit.**
Nothing tells the browser it may keep them. A returning visitor asks about that 5.6 MB
file again instead of using the copy it already has.

**The page loads things the first screen does not need.**
The "Start Creating Now" button brings the whole "Create a Catalogue" dialog and the
plan-limits dialog with it, before anyone clicks. The pricing section, far down the page,
starts loading the Paddle payment script immediately - even though the prices are already
written into the page. A small animated sparkle in the pill above the headline costs its
own download, for a 22-pixel decoration.

## The fix in one idea

**Prepare the hero picture properly, and let the first screen load only the first screen.**

1. Cut the empty space off the picture and save it in three sizes and two modern formats,
   once, as files in the project. The browser picks the smallest one that suits its
   screen - between 25 KB and 117 KB instead of 5.6 MB.
2. Tell the browser the right shape up front, and start fetching the picture as early as
   possible, so nothing jumps and the picture is the first thing to arrive.
3. Hold back what the first screen does not use: the two dialogs load on the click that
   needs them, and the payment script loads as the pricing section comes into view.
4. Delete the unused 19.7 MB copy, fix the broken article image, and let browsers keep
   pictures for a year.

The result: the home page's main picture arrives in well under a tenth of a second on a
normal connection, nothing moves on the page while it loads, and a visitor who never
scrolls to pricing never downloads a payment script.

## What users will notice

- The home page shows its picture almost immediately instead of after a pause.
- Nothing shifts or jumps while the page settles.
- The hero artwork looks bigger and better placed, with no empty gap beneath it.
- Returning visitors see the home page appear instantly.
- Pricing still shows real prices straight away, as it does now.
- The small sparkle animation in the pill above the headline becomes a static icon.
- The first click of "Start Creating Now" may take a moment longer than it does now.
- The digital-menu article no longer shows a broken image.

## Decisions we made (please confirm)

- **Prepare the images ourselves instead of switching on automatic image hosting.** Keeps
  us off per-image hosting charges on the current plan; the cost is one command to re-run
  whenever the hero artwork changes.
- **Hand-written picture markup rather than the framework's image component.** With
  automatic handling switched off, that component would give us nothing here; the cost is
  slightly more markup in the hero.
- **Trim the empty space off the artwork.** This is what stops the page jumping, but it
  makes the hero artwork sit about 30 % taller in its column - a visible design change
  that needs your eye on it before it ships.
- **Moved the unused 19.7 MB copy instead of deleting it**, along with the 5.6 MB
  original, to a folder that is not published with the site - so nothing is lost and
  neither is sent to visitors. Both are still stored in the project's history, so the
  project itself still carries them; tell us if you would rather they lived elsewhere.
- **Load the two dialogs on the click that needs them.** Saves everyone who never clicks;
  the cost is a brief delay on the first click, which we soften by starting the download
  when the pointer reaches the button.
- **Delay the payment script until pricing is nearly on screen.** Prices are already in
  the page, so this only affects which currency is shown; someone who jumps straight to
  pricing may see US dollars for a moment before their own currency replaces them.
- **Replace the animated sparkle with a static icon.** The four animations further down
  the page are untouched.
- **Let browsers keep pictures for a year.** A changed picture then needs a new filename;
  this plan renames the hero files anyway.

## Order of work

1. Produce the trimmed hero in three sizes and two formats.
2. Use them in the hero, with the right shape reserved and an early fetch.
3. Delete the unused 19.7 MB copy and fix the broken article image.
4. Let browsers keep pictures and animations for a year.
5. Load the create-catalogue dialogs on the click that needs them.
6. Delay the payment script until pricing is nearly on screen.
7. Make the kicker icon static.
8. Confirm the home page is still built ahead of time rather than per visit.
9. Measure before and after, and write the numbers down.

Each step is checked by the type check, the lint check and the test suite, then by opening
the home page at a phone width and a desktop width and watching the picture load. Step 9
records the real measurements from a preview deploy. **The database does not change, and
no shared-package release is needed.**

## Not in this plan

- Why signed-in pages (the dashboard, the builder) are slow:
  [2026-10-31-fast-navigation](../2026-10-31-fast-navigation/OVERVIEW.md).
- Unused packages and dead files across the whole project:
  [2026-10-25-codebase-cleanup](../2026-10-25-codebase-cleanup/OVERVIEW.md).
- The other marketing pages' hero sections and the small illustrations, which are all
  already under 60 KB.
