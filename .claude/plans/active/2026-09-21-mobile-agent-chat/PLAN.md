# Mobile: stop the builder bar covering the AI chat input

Status: done

## The bug

On a phone the builder stacks four fixed, bottom-anchored layers:

| Layer | Classes |
|---|---|
| `BuilderSidebar` `<aside>` | `fixed bottom-0 w-full z-[1000]` |
| ↳ `ActionButtons` mobile bar | `fixed bottom-0 z-50` (Save / Templates / Preview / Publish) |
| ↳ sidebar chevron toggle | `absolute -top-6 z-[200]` |
| `CatalogueChat` sheet (open) | `fixed inset-x-0 bottom-0 z-[60] h-[92dvh]` |
| `CatalogueChat` pill (closed) | `fixed bottom-[calc(5rem+safe-area)] left-3 z-[49]` |

The aside is `z-[1000]`; the chat sheet is `z-[60]`. The aside creates a stacking
context, so everything inside it - the action bar and the chevron - paints above
the sheet and lands exactly on the chat's input row and send button. That is the
reported bug, and it is a plain z-index inversion, not a layout overflow.

The closed-state pill has the same problem in milder form: it floats at a hardcoded
`5rem` above the bottom purely to dodge a bar whose height it does not actually know.

## Why not just raise the chat above the bar

That fixes the overlap and leaves a worse UI: a bar of catalogue actions (Publish,
Preview) sitting under a sheet that covers 92% of the screen, acting on a catalogue
the user cannot see. On a phone the editor panel and the AI chat are mutually
exclusive tools competing for one thumb zone. They should switch, not stack.

## Design: one bottom bar, two modes

- The bottom bar stays the single persistent control and gains an **Ask AI** entry.
  On mobile that replaces the floating pill, so the entry point sits where the thumb
  already is instead of hovering over content at a guessed offset.
- Opening the chat hides the bar **on mobile only**. The sheet owns the whole bottom
  edge and nothing can cover its input.
- Closing the chat brings the bar straight back (the sheet's existing minimise button).
- Desktop is untouched: sidebar docked right, chat floating bottom-left, both open at
  once exactly as today.

Exclusivity then falls out of CSS, with no JS breakpoint and no `useMediaQuery` hook:

- chat open → bar hidden on mobile → chevron unreachable → editor panel cannot open
- editor panel open → full-screen `h-[100dvh]` `z-[1000]` aside → pill is behind it

## Z-index

The repo's scale is sidebar `1000`, Dialog `1100`, AlertDialog `1200`. The chat sheet
moves from `z-[60]` to `z-[1050]`: above the sidebar, and still below the `LimitsModal`
dialogs the chat itself opens. Putting it at `1100+` would make the chat cover its own
upgrade modal.

## Steps

1. `CatalogueContext` gains `isChatOpen` / `setIsChatOpen`, beside the `isSidebarOpen`
   it already owns, so the bar and the chat share one source of truth.
2. `CatalogueChat` reads that instead of local `useState`; pill becomes desktop-only;
   sheet moves to `z-[1050]`.
3. `BuilderSidebar` hides its aside with `max-md:hidden` while the chat is open.
4. `ActionButtons` gains an Ask AI button in the mobile bar only - not in the shared
   `QUICK_ACTIONS`, which also feeds the desktop row where the pill already exists.

## Out of scope

Save and Publish are unreachable while the chat is open on mobile, which is the normal
full-sheet trade-off: the sheet is 92dvh, so the catalogue is not visible to act on
anyway, and the chat footer already tells the user to save when they are happy.

## Found while implementing: `max-*` variants do not compile in this project

The first cut hid the bar with `max-md:hidden`. A browser check said the bar was
still visible, and the cause was not the markup: `@material-tailwind/react`'s
`withMT` replaces Tailwind's `screens` wholesale with

    sm 540px · md 720px · lg 960px · lg-max {max: 960px} · xl 1140px · 2xl 1320px

Mixing a `{max: ...}` object screen in stops Tailwind generating the automatic
`max-*` variants. Compiling the real app produces **zero** `max-md` rules, so:

- `md` in this codebase is **720px**, not Tailwind's default 768px;
- every `max-md:` class already in the tree is dead. `components/ui/dialog.tsx`
  and `components/ui/alert-dialog.tsx` both use `max-md:` for mobile dialog
  positioning and scrolling, and none of it has ever applied. Not fixed here -
  it changes modal layout app-wide and deserves its own change - but it is a real
  bug worth picking up.

The fix therefore expresses "phone only" as `hidden md:flex`, using min-width
variants only. A test guards against it being "tidied" back into a `max-*` form.

## Verified

Class strings were lifted from the source into a harness, compiled with the
project's own `tailwind.config.ts`, and hit-tested in Chromium at 390x844 and
1280x800. `document.elementFromPoint` over the send button reports:

| viewport | chat | bar visible | owner of send button |
|---|---|---|---|
| 390x844 | closed | yes | - |
| 390x844 | open | **no** | SHEET |
| 1280x800 | closed | yes | - |
| 1280x800 | open | yes | SHEET |

Screenshots also caught a regression the plan had not anticipated: the bar's
raised chevron sits at `-top-6`, centred. With four items the centre line fell in
the gap between two labels; the fifth item moved a label under it. The chevron
moves to `-top-12`, clear above the bar, checked in both the closed and the
sidebar-open states.

`npx tsc --noEmit` clean, `biome check` clean on every touched file, 335 tests
pass (4 new).
