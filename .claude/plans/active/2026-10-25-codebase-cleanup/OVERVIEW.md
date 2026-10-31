# Codebase cleanup: the short version

This is the plain-language summary of [PLAN.md](PLAN.md). The detail and the evidence are in
[FINDINGS.md](FINDINGS.md).

## The problem

The app works: it type-checks and all 772 tests pass. But at about 60,000 lines it carries
leftovers from the move off Clerk, the old AI editor and the old test setup. Visitors
download code they never use, some rules live in up to seven places, and the review found a
few quiet bugs.

## What goes wrong today

**Catalogue visitors download the builder.**
Someone scanning a QR code to see a menu also loads the template picker, the chat and the
editor, plus about 70 KB of animation and carousel code for one open/close effect and one
swipe row.

**Unused things are still around.**
These include a "demo mode" that nothing switches on, six unused packages, and a 19.7 MB
image that no page shows. Some guides still describe the old AI editor, and the plans index
has 21 broken links.

**The same rule is written in many places.**
Which section types each plan unlocks is listed in seven places, and the labels already
disagree ("External content" vs "Embed"). Adding one section type takes 13 edits in six
files.

**Some screens do five jobs.**
The chat panel is 500 lines. The builder's shared state holds 30 things. The controls for
editing an item are passed down six layers. 29 files copy the card style by hand.

**The tooling slows you down without protecting you.**
Every commit runs a minutes-long build, yet GitHub never checks types.

**A few things are quietly broken.**
- Failed welcome emails are logged as "sent".
- "Add section" after an edit seems to overwrite the edited section (seen in the code, not
  yet reproduced).
- A discounted price can differ between the card and the popup.
- Search engines get a dead address for the sign-in page.
- HubSpot no longer receives new subscribers; Brevo marks everyone as not subscribed.
- On TEST, cancelling a subscription probably fails silently (unconfirmed).
- The saved sign-in settings would switch sign-ups off if re-applied.

## The fix in one idea

**Delete what nothing uses, keep one copy of every rule, and give each file one job, in
small steps that each leave the app working.**

1. Fix the broken things first, each on its own.
2. Delete dead code and packages, and fix the tooling and docs.
3. Move files so each feature's code sits together, and add stricter type checks.
4. Refactor the biggest pieces: the published catalogue, section types, the builder and the
   shared screens.

Each step leaves every check green before the next starts.

## What users will notice

- Published catalogues load faster, especially on phones. We'll measure the saving.
- On a computer, the carousel scrolls with the trackpad or the scrollbar, not click-and-drag.
- The bugs above get fixed.
- Everything else looks and works the same.
- For the team: commits take seconds, and a new section type is one entry, not 13 edits.

## Decisions we made (please confirm)

- **Bugs first, as separate changes.** Each is checked on TEST before and after. Only billing, plan or data changes get a test, and the plan adds three in total.
- **Move misplaced files rather than regrouping every folder.** About 20 top-level folders
  stay.
- **Hooks used by one feature live with it.** This changes a written rule; about 15 files
  move.
- **Plain CSS instead of the animation and carousel libraries.** Desktop users lose
  click-and-drag in the carousel.
- **Remove Material Tailwind by copying its four settings.** This needs a before/after style
  comparison.
- **One icon library, plus about 10 brand logos added by hand.** We maintain those logos.
- **Delete demo mode.** A live demo would need rebuilding; the demo page uses the guided tour.
- **Block stray console logs at commit time instead of silencing the console.** Warnings
  then show in visitors' consoles, as intended.
- **The commit check lints only changed files; GitHub runs everything else.** A broken build
  shows up after pushing.
- **Strict type checks.** About half a day to fix 75 errors.
- **Published pages read data directly, and two internal endpoints go.** An unknown outside
  caller would break; we'll check two weeks of logs first.
- **Keep the chart and homepage animation libraries.** They load only where needed.
- **Fix both CRM connections; delete two unused background functions after you confirm.**
  This means two deploys, TEST first.

## Order of work

1. Fix the bugs found in the review
2. Delete dead code, files and unused packages
3. Fix the tooling: commit check, GitHub checks, editor settings
4. Bring docs, guides and the plans index up to date
5. Move files so folders match features
6. Turn on strict type checks
7. Make published catalogues load only visitor code
8. Replace barely-used libraries
9. One definition per section type
10. Split the builder's large components
11. Shared building blocks for the rest of the app
12. Tidy the server-side code

**Checks:** type checks, lint and tests at every step; a production build and a TEST check
where pages change; a side-by-side catalogue comparison for steps 7 and 8.

**Database:** no schema changes. With your approval, two background functions are
redeployed, two unused ones deleted, and two settings files corrected.

## Not in this plan

- Upgrading to Tailwind 4.
- Choosing between Brevo and HubSpot.
- Enforcing the delete lock on the server.
- Narrowing the cache refresh after dashboard changes.
- The Terms page placeholders, which need wording from you.
- The four plans in progress, which should be finished first:
  - [agent plan limits](../2026-10-24-agent-plan-limits/OVERVIEW.md)
  - [AI credit hard cap](../2026-10-24-ai-credit-hard-cap/OVERVIEW.md)
  - [catalogue chrome](../2026-10-24-catalogue-chrome-glass-search/OVERVIEW.md)
  - [phase II bugs](../2026-10-24-phase2-open-bugs/OVERVIEW.md)
