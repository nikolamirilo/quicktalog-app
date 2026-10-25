# Advanced styling: the short version

The detail for whoever builds it: [PLAN.md](PLAN.md).

**Where this stands:** built, tested and ready on 2026-10-25. What is left is a look through the real pages on our test site — the pricing page, the plan view and the builder on a free and a paid account — before it goes out. Remember that no customer gains or loses anything when it does.

## The problem

Our plans describe the design features as three separate things: "Standard themes", "Custom themes" and "Style controls". A customer reading the pricing page is meant to work out which of the three they get. In reality there is only one boundary: Starter and Basic get the standard themes and nothing else, and Pro, Growth and Premium get everything. Every plan has had it this way since the plans were written — the three names have never once split apart.

So we are asking customers to understand three doors when there is one, and we are maintaining three switches that are always flipped together.

## What goes wrong today

**The three names describe one thing.** "Custom themes" and "Style controls" are on for exactly the same plans — Pro upward — and have been on every plan we have ever sold. "Standard themes" is on for everyone, including the free Starter plan, so it is not a plan feature at all; it is a selling point we list as if it were one.

**The pricing page and the dashboard disagree about what Pro includes.** The plan view inside the dashboard lists custom themes. The public pricing comparison table does not mention them anywhere. Someone comparing plans before they buy cannot see that custom themes are part of Pro.

**The description of "Style controls" is out of date.** It reads "Font, size, radius, shadow, overlay". Since the last design release it also covers the glass effect and the custom background — photo, gradient or colour. Those are two of the most visible things Pro buys, and nothing a customer can read mentions them.

**The builder shows two locks that always lock together.** On Starter and Basic, the Appearance tab locks the custom colours and then locks the background, style and overlay separately, as though they were different purchases. Upgrading unlocks all of them at once.

## The fix in one idea

**Replace the three switches with one, called Advanced styling, available from Pro onward.** It covers custom colour themes and saved themes, fonts, text size, corners, shadows, overlays, the glass effect and the custom background. "Standard themes" stops being a switch and becomes what it already is in practice — a line of copy on every plan.

The guarantee: **no customer gains or loses a single feature.** Because the switches were already identical on every plan, the new one lands in exactly the same place. Nobody is upgraded, nobody is downgraded, no price changes, and no one needs to be told anything.

## What users will notice

- The pricing page and the dashboard both show one row, **Advanced styling**, instead of two or three that partly contradict each other.
- That row finally says what is in it, including the glass effect and the custom background, which are invisible in today's copy.
- Custom themes become visible on the public pricing page for the first time.
- In the builder, Starter and Basic see one lock over the design options instead of two.
- When the assistant declines a design change on a free plan, it gives one reason instead of two differently worded ones.

## Decisions we made (please confirm)

- **Merge "Style controls" and "Custom themes" into one feature.** Cost: we could no longer sell them apart without another release. They have never been apart, so we are treating that as theoretical.
- **Remove "Standard themes" as a plan feature.** It stays on the page as copy. Cost: none — it is on for every plan, including free.
- **Keep the boundary exactly at Pro.** Nobody moves. This is deliberate: it keeps the change risk-free.
- **Do not move the boundary in this piece of work.** Giving Basic some design options is a real pricing decision with real consequences, and it should be made on its own once the current boundary is legible. Cost: if we want that change, it is a second piece of work.
- **Fix the typo in the internal feature name** (`apperance`) while we are renaming. Cost: it touches a few more lines, but the compiler catches every one of them, so a mistake cannot reach customers.
- **Write one combined description** covering themes, fonts, sizes, corners, shadows, overlay, glass and background, replacing the two older ones.

## Order of work

1. Release the shared package with the single new feature flag.
2. Update the server so the one flag decides what gets saved and what is reset.
3. Update the assistant so it reads one flag and gives one explanation.
4. Update the builder so the Appearance tab shows one lock.
5. Update the pricing page, the dashboard plan view and the feature descriptions.
6. Update the tests.
7. Update the documentation and the help pages.

Each step is checked by the type checker, the linter and the test suite; the whole change is checked by hand on TEST with one free account and one Pro account, comparing the pricing page against the dashboard. **The database does not change** — these settings have never been stored in it, so there is nothing to migrate and nothing to undo.

One sequencing note: the shared package and the app have to go out together. If they do not, the build fails loudly, which is the behaviour we want — it cannot slip into production half-done.

## Not in this plan

- **Moving which plans get advanced appearance.** A separate decision, deliberately kept out — see the decisions above.
- The larger question of whether the pricing page should list every individual style control or just describe the group. We are fixing the wording here, not redesigning the page.
