# Agent tool structure: group tools by builder tab

Status: done

## Problem

All 17 agent tools live in one 515-line object literal in `agent/tools.ts`. Adding a
tool means editing that file plus a second registry (`RUNNING_LABELS` in
`ChatMessageBubble.tsx`), and there is no rule saying where a new tool belongs.

The tools were never "methods on a class" - `CatalogueSession` is per-request state,
not a tool container - but the single file does force every unrelated concern
(planning, web reads, sections, appearance) to share one scope.

Coverage gaps fall out of the same problem: the builder has four sidebar tabs and
the agent only covers two of them. Header, footer, logo, socials, terms and privacy
policy have no tools at all.

## Grouping rule

One file per builder sidebar tab, plus one per agent mechanic. The question
"which tab does the user change this in?" decides where a new tool goes.

| File | Tools |
|---|---|
| `planning.ts` | createPlan, completeTask, skipTask |
| `skills.ts` | loadSkill (kept apart: the one tool `gateCalls` exempts) |
| `research.ts` | fetchUrl |
| `sections.ts` | readSection, addSection, updateSection, deleteSection, moveSection |
| `items.ts` | addItems, updateItem, deleteItem, moveItem |
| `appearance.ts` | updateAppearance, setCustomTheme |
| `general.ts` | updateCatalogue |
| `navigation.ts` | updateHeader, updateFooter, updateLegal |

`general.ts` stays out of `navigation.ts`: general is the catalogue's own identity
(logo, heading, SEO, contact), consumed by header, footer and the meta tags alike.
Navigation is the two chrome widgets. `updateLegal` sits in navigation because terms
and privacy render in the footer and are edited in the Footer tab.

## Shape

Each group file is a factory taking context and returning an object literal:

```ts
export const sectionTools = (ctx: ToolContext) => ({
  addSection: tool({ ... }),
});
```

`index.ts` spreads them. Object-literal spread preserves literal keys in TypeScript,
so `AgentToolName` stays an exact union of the tools that exist. A
`DEFINITIONS.map()` / `Object.fromEntries` registry would collapse it to
`Record<string, Tool>` and silently lose that - do not use one.

Measured, not assumed: `AgentToolName` is a 20-member literal union after the
change. Note that `part.input` on a narrowed UI message part is `any` both before
and after this refactor - `InferAgentUIMessage` does not carry per-tool input
types in this SDK version, so the literal keys buy the exhaustive `display.ts`
check, not typed tool inputs in the browser.

Building schemas inside the factory also keeps the per-request input schema working:
`sectionTypeSchema(ctx.session.access)` leaves a plan-locked section type absent from
the enum rather than merely rejected.

## Types

Split by audience, three tiers:

1. `types/ai.ts` - the wire contract (`CatalogueOperation`, `AgentToolResult`).
   Server applier writes it, browser replays it. Stays put.
2. `agent/tools/types.ts` - the tool-authoring contract (`ToolContext`). Only the
   tools folder imports it. Mirrors the existing `agent/skills/types.ts`.
3. Zod schemas - used by more than one group stays in `agent/schemas.ts`; used by
   one group moves into that group's file.

## Plan-limit gap found on the way

`plan.features.branding` gates the logo, contact and SEO blocks in `GeneralTab`, and
the whole Header and Footer tabs. The agent's `updateCatalogue` changes contact and
metadata with no such check, so the assistant can write fields the UI locks. Per
CLAUDE.md ("plan limits are enforced on the server ... never only in the UI") this is
fixed here rather than carried into the new tools: `OperationLimits.branding` gates
logo, contact, metadata and legal in `update_catalogue`, and gates `update_header`
and `update_footer` entirely. Refusals set `limitReached` so the client offers the
upgrade.

## Steps

1. Regroup `agent/tools.ts` into `agent/tools/*`. No behaviour change; tests untouched.
2. Move labels to `agent/tools/display.ts`, typed `Record<ToolName, ...>` so the
   compiler forces a label for every new tool. Client-safe: no imports from the tool
   files, which would drag `node:dns` and server actions into the browser bundle.
3. Add `update_header` / `update_footer` operations to `types/ai.ts` and
   `helpers/catalogueOperations.ts`, plus the branding gate.
4. Add `navigation.ts` tools, extend `general.ts` with logo / socials / metadata icon
   and `legal` with terms and privacy.
5. Instructions + tests.

## Deliberately out of scope

`partners` (footer) is a repeated list needing add/update/delete operations of its
own, like items. `footer.showPartners` toggles visibility; managing the list is a
separate change.

## Outcome

Implemented on `refactor/agent-tool-structure`. `agent/tools.ts` (515 lines) became
twelve files under `agent/tools/`, largest 151 lines.

Verified: `npx tsc --noEmit` clean, `npx biome check` clean on every touched file,
331 tests pass (24 files). The 320 tests that existed before pass unchanged, which is
what shows step 1 changed no behaviour.

Also landed, found while implementing:

- `MAX_SOCIALS` was private to `SocialLinksSection.tsx` at 5. Moved to
  `constants/index.ts` so the tool schema and the builder cap agree.
- `update_catalogue` treated `{}` on `metadata` / `contact` / `legal` as a change and
  reported success having touched nothing. Now `hasKeys` gates all three, and the
  navigation tools return "No header/footer settings to change."
