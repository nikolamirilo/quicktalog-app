# Fast navigation: the short version

The detail is in [PLAN.md](PLAN.md); the evidence is in [FINDINGS.md](FINDINGS.md).

## The problem

When you click Dashboard, Log In, Start free or another link, the screen does nothing until the next page is ready. Opening the dashboard typically takes 1.3-1.7 seconds of server time. One visit in twenty takes 3.5-4.5 seconds. Because nothing moves in the meantime, people click again or think the app is broken.

## What goes wrong today

**Nothing shows that the click worked.**
The app has no progress bar and no "loading" state on buttons. The old page stays frozen until the new one arrives. The one loading screen that exists for public pages is a full-screen spinner that also hides the menu.

**The server and the database are on different continents.**
The app's server runs in Washington, USA. The test database is in Ireland. To build the dashboard, the server asks the database about 11 questions in a row, and each one crosses the Atlantic and back: roughly 0.8 seconds of pure travel time. The servers also restart often ("cold starts"), which adds up to a second on some visits.

**The live site checks your login with an extra phone call.**
On the live site, every visit to an account page asks Supabase "is this login real?" over the network: 0.3-0.85 seconds each time. The test site checks this locally, in about a millisecond, because it uses newer security keys.

**The dashboard is built two or three times per visit.**
Every time a signed-in user opens a page, the app:

- builds the page,
- then rebuilds it right away because it wrongly thinks the login changed,
- and also fetches the account details again in the background.

If you click a link while that background fetch is still running, the app rebuilds the next page once more after it opens.

**The Dashboard button appears late.**
The menu waits for a network check before it shows Dashboard (or Log In / Start free). Until then that corner is empty, and the app can't start loading the dashboard ahead of the click.

## The fix in one idea

**Show progress instantly, and make the server do less work, closer to the data.**

1. A thin bar at the top of the window and a small spinner inside the clicked button appear the moment you click.
2. The server moves to Dublin, next to the database, and stays warm between visits.
3. The live site checks logins locally, like the test site.
4. Each page is built once, not two or three times.

Every click then gets visible feedback within a fraction of a second, and the dashboard should open in about half a second when the server is warm. That figure is an estimate; we'll measure it after each step.

## What users will notice

- A thin amber bar at the top of the window as soon as they click any link.
- The clicked button (Dashboard, Log In, Start free, Account) shows a small spinner until the page changes.
- The Dashboard / Log In buttons appear in the menu straight away.
- The dashboard and other account pages open noticeably faster, on the live site most of all.
- No more blank screen with a spinner between pages; the current page stays visible until the next one is ready.

## Decisions we made (please confirm)

- **Move the server from Washington to Dublin.** Visitors in the Americas wait slightly longer (under a tenth of a second) on uncached pages, but every account page saves far more than that. Published catalogues are served from cache and don't change. *This needs the live database's region confirmed first.*
- **Turn on Vercel's "Fluid compute".** Fewer cold starts; Vercel bills a little differently. The 60-second limit we design for stays.
- **Switch the live site to the newer login keys (you, in the Supabase dashboard).** It needs a check of the live edge functions and the background worker first. The old key is kept, not deleted, so nobody gets signed out.
- **Build the progress bar ourselves** instead of adding a library: about 80 lines.
- **Remove the full-screen spinner.** A slow public page shows the old page with the bar instead of a blank screen.
- **Show the signed-in menu from the saved login right away**, and double-check it in the background. If a login was revoked, the menu can show "Dashboard" for a moment, but the page itself still refuses access.
- **Fetch account details in a simpler way**, so a click no longer triggers an extra rebuild.

## Order of work

1. Make database time visible in our monitoring, so we have a "before" number.
2. Move the server to Dublin and turn on Fluid compute (after checking where the live database and the cache live).
3. Add the top progress bar.
4. Add the spinner inside clicked buttons.
5. Replace the full-screen spinner; give Analytics and the QR editor loading screens that keep the menu.
6. Stop the extra rebuild on every page load, and show the menu's account buttons at once.
7. Fetch account details without the extra rebuild.
8. Skip the welcome-email check for people who already got it.
9. (You, on the live site) switch to the newer login keys.
10. Write it up in the docs.

Each step is checked against the monitoring numbers on the test site, plus a click-through on desktop and phone on a slow connection. Testing on a developer's laptop doesn't count, because it is always slow there. Nothing in the database changes.

## Not in this plan

- Making the public website download less code: [codebase cleanup](../2026-10-25-codebase-cleanup/OVERVIEW.md).
