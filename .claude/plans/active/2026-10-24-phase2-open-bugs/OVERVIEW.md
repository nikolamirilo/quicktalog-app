# Phase II open bugs: the short version

The detail is in [PLAN.md](PLAN.md).

## The problem

The Confluence tracker "[Phase II] Bugs and Adjustments" has 17 rows still open. This plan covers the 11 outside the "AI builder and plan limits" group, plus one reopened row: billing emails, Google sign-in settings, a few screens that look wrong on phones, and help articles that describe features we have since replaced.

## What goes wrong today

**Upgrading can tell the user their subscription ended.**
Two tester reports, including "my subscription was not canceled. I changed my plan." A plan change buys a new subscription and closes the old one. When the old one closes, the app sometimes treats it as the user leaving and sends the "you're on the free Starter plan now" email. If that happens, it also moves the user to the free plan and can take catalogues offline. We haven't confirmed exactly why it happened for the tester; the logs weren't available to us.

**Google can't be connected or disconnected in Settings.**
Both buttons fail, and the error says "Connecting accounts is not available yet" even when you click Disconnect. The setting that allows linking Google to an account is most likely off on TEST. Separately, a user who signed up with Google sees a greyed-out Disconnect button with no explanation.

**Plan details read differently in different places.**
The pricing cards, the subscription page and the comparison table each list plan features in their own words. For example, the cards say "Up to 8 sections & 30 items per catalogue" while the subscription page has "Sections per catalogue: 8" and "Items per catalogue: 30".

**Some screens are hard to read.**
- Prices in catalogues use the thinnest font weight, so they're hard to see.
- On tablets and small laptops the dashboard sidebar leaves little room, and several screens didn't account for it. The two Sessions buttons in Settings squeeze side by side, big numbers on the overview and subscription pages overflow or run under icons, and the "Growth & support" list is cramped.
- Uploading a logo while the custom header and footer are off shows nothing, with no hint why. While checking this we found that a custom footer showed the Quicktalog logo instead of the user's.

**Help articles describe the old AI tools.**
Several articles still talk about a separate "AI generator" and "OCR import". Today both happen in Quick AI inside the builder: you describe your business, or attach up to 10 photos of a menu (no PDFs).

## The fix in one idea

**Make each screen and email match what actually happened and what the plan includes.**

1. The free-plan downgrade happens only when the subscription behind the user's current plan ends and nothing else is paying. Any unclear case keeps the plan and alerts us instead of guessing.
2. Turn on account linking on TEST and make the Google messages say what's really going on.
3. Every place that lists plan features uses the same list and wording.

The guarantee: a paying customer is never moved to the free plan because they upgraded.

## What users will notice

- Changing plan no longer sends the "subscription ended" email or drops the user to Starter.
- Pricing cards use the same wording as the subscription page (limits first, then features).
- Connecting and disconnecting Google works. Google-only users see why they can't disconnect.
- Prices in catalogues are bolder.
- Settings, the overview and the subscription page stack neatly on phones and tablets; the Sessions buttons sit in a column.
- A hint under the logo upload explains how to make the logo show. A custom footer shows your own logo, and keeps your business name even without one.
- Help articles describe Quick AI and photo import correctly.

## Decisions we made (please confirm)

- **Pricing cards show the limits plus the main included features, not every row.** Shorter cards; small extras such as section types appear only on the subscription page and in the comparison table.
- **No "your plan changed" email.** Plan changes are now silent. Adding that email is a small separate task.
- **When a cancellation can't be explained, keep the plan and alert us.** A rare case, such as a price changed directly in Paddle and then canceled, could leave someone on a paid plan until support checks. We judged that better than wrongly downgrading paying customers.
- **We only change the help articles' wording, not their structure.** The "two ways to start" framing stays, now pointing at Quick AI.

## Order of work

1. Stop plan changes from sending the cancellation email or downgrading
2. Make the pricing cards match the subscription page
3. Fix Google connect/disconnect (TEST setting + messages)
4. Retest the sign-in spinner (likely already fixed)
5. Bolder prices in catalogues
6. Logo hint, and footer logo follows the footer setting
7. Subscription page layout on small screens
8. Stack the Settings buttons and fix the same squeeze on other dashboard screens ("Move the icon" still needs its screen named)
9. Update help articles about AI and photo import

Each step has automated tests where it has logic. Layout changes need a visual check on phone and desktop widths, and billing needs a run-through in the Paddle sandbox. No database changes; step 3 changes one Supabase Auth setting on TEST.

**Status:** code for every step except "Move the icon" is done; account linking is on in TEST. Still to do: the Paddle sandbox run-through, visual checks, the step 4 retest, and naming the icon screen.

## Not in this plan

- AI going over plan limits, the per-category limit confusion and custom themes on Basic: [2026-10-24-ai-credit-hard-cap](../2026-10-24-ai-credit-hard-cap/PLAN.md).
