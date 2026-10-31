Status: done (awaiting a browser check on TEST)

# Chat formatting, the heading tool and stale builder edits Implementation Plan

> **For agentic workers:** implement task by task, in order. Steps use checkbox (`- [ ]`)
> syntax for tracking. Follow the `code-conventions` skill for every new file.

**Goal:** Fix the three reported bugs: the agent's chat replies print raw Markdown; the
agent's heading change does not reach the heading box and loses its styling; and a
section or item edit can land on the wrong block, so "Add section" overwrites an
existing one.

**Architecture:** Bugs 1 and 2 are each one wrong assumption in one file. Bug 3 is a
class of bugs with one shape: **the builder addresses content by array index captured
when a dialog opened, while the agent addresses it by id** — so anything that reorders
or replaces `content` between the click and the save sends the write to the wrong place.
The fix moves the builder onto ids (what `applyCatalogueOperations` already does) and
gives the draft a single writer, instead of patching each dialog.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, Vitest + Testing Library (happy-dom),
Vercel AI SDK with DeepSeek.

**Spec:** the three bug reports of 2026-10-27. Plain-language version:
[OVERVIEW.md](OVERVIEW.md).

**Two decisions the owner made while this was implemented, which the tasks below
reflect:**

1. **The agent keeps its rich text.** The reply is Markdown and the chat renders it -
   the first draft of Task 1 told the model to write plain sentences instead, which
   was the wrong way round. The renderer covers the practical GFM subset: emphasis,
   strikethrough, inline code, links, nested bullet and numbered lists, headings,
   fenced code, quotes, rules and small tables. Typing `-` in the composer carries a
   list on, which is the nearest thing to that without turning the composer into a
   rich-text field.
2. **Tests cover the stale-edit work only** (Tasks 3-6). Tasks 1 and 2 were verified
   by rendering and by hand, with no tests committed.

## Global Constraints

- No schema, RLS or data changes: every fix is in the browser or in the agent's prompt
  and tool schema. No migration, no `@quicktalog/common` release.
- TEST (`imhinsgyzzyblghwnedk`) only; nothing touches PROD.
- No commits, pushes or branches unless the user asks (CLAUDE.md).
- Before finishing: `npx tsc --noEmit`, `npm run check`, `npm test`.
- Routes stay within the 60s Vercel Hobby ceiling; nothing here changes the agent loop.

## The three bugs, and how sure I am of the cause

| # | Report | Root cause | Confidence |
|---|---|---|---|
| 1 | Markdown in the agent's chat does not render | The bubble prints the model's text verbatim; nothing renders Markdown and nothing tells the model not to write it | Certain (read the renderer) |
| 2 | The update-heading tool does not work properly | Three separate defects: the heading box is filled from the draft **once** and never re-synced; the agent's heading is stored without the canonical `<h1>` classes, so the published page draws it at body size; the next keystroke in the heading box overwrites the agent's heading from the stale DOM | Certain for the first and third; certain-by-reading for the second |
| 3 | A stale items-section reference makes "Add section" overwrite an existing section | The edit target (`editingBlock`) is never cleared after "Save section", and "Add Section" opens the dialog without clearing it, so the dialog re-opens in edit mode and writes over that section. Behind it sits the general defect: every builder edit is addressed by array index, and `AddContentModal` rebuilds the whole `content` array from a render snapshot | Certain for the edit-target leak; the index/snapshot defects are real by reading, each needing a concurrent writer (the chat, a template, a move) to bite |

---

## Bug 1 - Markdown in the chat does not render

**What happens today.** Every assistant text part is printed verbatim:
[ChatMessageBubble.tsx:109-111](../../../../src/components/catalogue/chat/ChatMessageBubble.tsx#L109-L111)
renders `<p className="whitespace-pre-wrap">{part.text}</p>`. The project has no Markdown
renderer at all (no `react-markdown`, `marked` or `remark` in `package.json`), and the
instructions never say what format the reply should be in - the only guidance is "write
one or two short sentences"
([instructions.ts:27](../../../../src/agent/core/instructions.ts#L27)). The model is
`deepseek-v4-pro` ([model.ts:6](../../../../src/agent/core/model.ts#L6)), which writes
Markdown by default, so the user reads `**Added 6 items**` and `- Coffee` with the marks
still in.

**Root cause.** Nobody on either side owns the reply format: the model is not told to
write plain text, and the bubble does not render the Markdown it gets.

**Proposal.** Fix both ends, so neither has to be perfect:

1. Render the small Markdown subset a chat reply actually uses, in the bubble, as React
   nodes (never `dangerouslySetInnerHTML`, so there is no new HTML sink to sanitize -
   see `docs/architecture/catalogue-html-safety.md`). Emphasis, inline code, links and
   short lists. Anything we do not parse stays literal text, which is also what makes it
   safe while the reply is still streaming: a half-written `**` reads as `**`.
2. Tell the model the reply is one short chat message: no headings, no tables, no code
   fences.

Not using `react-markdown`: it is ~60 KB into the builder bundle for emphasis and
bullets, and the open `2026-10-25-codebase-cleanup` plan is removing barely-used
libraries, not adding them.

---

## Bug 2 - The heading the agent writes does not land

Three defects stack up here. All three are on the heading path only.

**2a. The heading box is filled once and never again.**
[useHeadingEditor.ts:28-51](../../../../src/components/catalogue/inputs/heading/useHeadingEditor.ts#L28-L51)
writes `catalogue.heading` into the `contentEditable` only while
`!isInitialized.current`, and sets that flag on the first non-empty heading - and also on
focus ([line 234](../../../../src/components/catalogue/inputs/heading/useHeadingEditor.ts#L234)).
In edit mode the heading box is the only thing drawn
([Heading.tsx:12](../../../../src/components/catalogue/view/components/Heading.tsx#L12)),
so when the agent's `update_catalogue` lands on the draft the stored heading changes and
the screen does not. It looks like the tool did nothing. It is worst on exactly the
catalogue the user is most likely to test with: one that already has a heading, where the
box initialised at mount. On a brand-new catalogue with an empty heading the first agent
change does show, which is why the bug reads as intermittent.

**2b. The next keystroke silently reverts the agent's heading.**
`handleInput` rebuilds the stored heading out of the DOM
([line 144-163](../../../../src/components/catalogue/inputs/heading/useHeadingEditor.ts#L144-L163)).
After 2a the DOM still holds the old heading, so typing one character writes the old
words back over the agent's. The user's own edit is what destroys the change.

**2c. An agent heading is stored without the builder's heading markup.** The tool takes
a free string ([general.ts:9](../../../../src/agent/tools/general.ts#L9):
`heading: z.string().max(2000)`) and the applier stores it as given
([operations.ts:554-557](../../../../src/lib/catalogue/operations.ts#L554-L557)). The
builder always stores
`<h1 class="<size classes> font-heading text-heading drop-shadow-sm ..." data-size="large">`
([line 161](../../../../src/components/catalogue/inputs/heading/useHeadingEditor.ts#L161)).
The instructions invite the model to write an HTML fragment with `<h1>`
([instructions.ts:55](../../../../src/agent/core/instructions.ts#L55)), and the published
page then renders that fragment as-is, because `isHtml` is true as soon as the string
contains `<h1`
([Heading.tsx:14-17](../../../../src/components/catalogue/view/components/Heading.tsx#L14-L17)).
With no size classes, `.rich-text-content` draws it at body size
([other.css:89-101](../../../../src/styles/other.css#L89-L101)) - a heading that is
there but looks like a sentence. The heading-size dropdown also reads `data-size`, so it
falls back to "large" whatever the heading actually is, and the agent's 2000-character
allowance is 20× the builder's own 100-character limit.

**Root cause.** The heading has two owners with two formats and no handover: the
`contentEditable` treats itself as the source of truth for the whole session, and the
agent writes a different shape of value into the same field.

**Proposal.**

1. One canonical heading format in one module (`src/lib/catalogue/heading.ts`): wrap text
   into the `<h1 ... data-size>` the builder already uses, read the inner HTML and the
   size back out, and clamp the text to the builder's 100-character limit. The heading
   editor, the published view and the applier all use it.
2. Normalize `fields.heading` in `applyCatalogueOperations`, so the server session and
   the browser replay agree by construction (both already run that one function), and the
   agent's new words keep the size the owner chose.
3. Sync the heading box whenever the stored heading changes from outside it: track what
   the editor itself last wrote, and re-render the box when the draft differs from that.
   While the box has focus, hold the sync until blur, so an edit in progress is never
   clobbered mid-caret.
4. Tell the agent the heading is plain text with a 100-character limit and that the
   builder owns the styling.

---

## Bug 3 - An edit lands on the wrong section

### 3a. "Add section" re-opens the last edit (this is the reported overwrite)

**What happens today.** The edit target lives in `Catalogue`
([Catalogue.tsx:54-58](../../../../src/components/catalogue/view/Catalogue.tsx#L54-L58))
and is cleared in exactly one place: the dialog's `onClose`
([line 326-329](../../../../src/components/catalogue/view/Catalogue.tsx#L326-L329)).
Saving a section does not go through it - `handleAdd` ends with `setIsOpen(false)`
([AddContentModal.tsx:204](../../../../src/components/catalogue/modals/AddContentModal.tsx#L204)),
and a Radix dialog does not fire `onOpenChange` when the `open` prop is changed in code.
So after **Save section** the dialog is shut but `editingBlock` still points at that
section. The "Add Section" tile then opens the dialog without clearing it
([line 287-299](../../../../src/components/catalogue/view/Catalogue.tsx#L287-L299)), so
the dialog comes up titled "Edit section", pre-filled with the previous section, and its
button writes `updateBlock(blockIndex, newBlock)`
([AddContentModal.tsx:197-198](../../../../src/components/catalogue/modals/AddContentModal.tsx#L197-L198))
- the existing section is overwritten and no section is added. Its items come from the
snapshot too
([line 165-168](../../../../src/components/catalogue/modals/AddContentModal.tsx#L165-L168)),
so items added since the snapshot are dropped.

**Repro:** open a catalogue that has sections (a template gives you one immediately) →
edit any section → **Save section** → click **Add Section** → save. The edited section is
replaced; nothing is added.

This is why the report starts with templates: a template is what puts content on screen
to edit first, so the leaked edit target is primed before the first "Add section".

### 3b. Every builder edit is addressed by array index

`CatalogueContent` passes the index from its render
([CatalogueContent.tsx:289-335](../../../../src/components/catalogue/view/CatalogueContent.tsx#L289-L335)),
the item dialog keeps `activeCategoryIndex` and `itemIndex` from when it opened
([line 186-214](../../../../src/components/catalogue/view/CatalogueContent.tsx#L186-L214)),
and the context writes straight to that index
([CatalogueContext.tsx:179-187](../../../../src/context/CatalogueContext.tsx#L179-L187)).
An index is only valid for the array it was read from. The agent's edits land on the draft
live, while the chat streams
([useCatalogueChat.ts:96-127](../../../../src/hooks/useCatalogueChat.ts#L96-L127)) - and
that is the supported way to work, the review bar exists for it. So a section inserted,
deleted or moved while a dialog is open shifts every index after it, and the save then
writes over a different section, or into a different section's items, or silently does
nothing when the index is now past the end. The agent path was given id addressing for
exactly this reason; the comment above `applyOperations` says so
([CatalogueContext.tsx:326-330](../../../../src/context/CatalogueContext.tsx#L326-L330)).

### 3c. The draft has two writers that cannot see each other

`AddContentModal` adds a section by rebuilding the whole array from its render snapshot:
`updateCatalogue({ content: [...catalogue.content, newBlock] })`
([line 200-202](../../../../src/components/catalogue/modals/AddContentModal.tsx#L200-L202)).
`updateCatalogue` sets state from `prev`
([CatalogueContext.tsx:151-156](../../../../src/context/CatalogueContext.tsx#L151-L156))
but never updates `catalogueRef`, which is refreshed only while the provider renders
([line 122-123](../../../../src/context/CatalogueContext.tsx#L122-L123)). `applyOperations`
reads that ref ([line 331-345](../../../../src/context/CatalogueContext.tsx#L331-L345)).
So between a hand edit and the next render, the ref is a draft older than the state: an
agent edit applied in that window is computed against the older draft and written back
with `setCatalogue(outcome.catalogue)`, dropping the hand edit. The same stale ref is
what `getCatalogue()` hands to the autosave and to the plan continuation
([useSaveDraft.ts:14](../../../../src/hooks/useSaveDraft.ts#L14),
[useCatalogueChat.ts:176-186](../../../../src/hooks/useCatalogueChat.ts#L176-L186)).

Two smaller things in the same area, both worth fixing while here:

- The new section's `order` is `catalogue.content.length`
  ([AddContentModal.tsx:154](../../../../src/components/catalogue/modals/AddContentModal.tsx#L154))
  and this path does not re-index, so after a template (whose blocks are numbered from 1,
  not 0) the added section carries the same `order` as an existing one.
- `constants/catalogueTemplates.ts` generates its ids once, at module load, and
  `executeSelect` puts that very object graph into the draft
  ([TemplatesInput.tsx:81-88](../../../../src/components/catalogue/inputs/TemplatesInput.tsx#L81-L88)).
  Two catalogues built from the same template in one browser session get identical
  section and item ids, and the shared constant is one accidental in-place edit away from
  leaking between catalogues.

**Root cause (all of 3).** Position is used as identity. Nothing holds a position stable
across the gap between opening a dialog and saving it, and the draft has two writers
(functional state updates, and a ref snapshot) that do not compose.

**Proposal.** In order of how much they buy:

1. Clear the edit target when the Add dialog opens and when a save closes it (fixes the
   reported overwrite on its own).
2. Address builder edits by id, resolved inside the state updater, so a position captured
   when a dialog opened can no longer address anything.
3. Give the draft one writer, so a hand edit and an agent edit in the same tick compose
   instead of overwriting.
4. Give each applied template its own copy with fresh ids and 0-based order.

---

## Review Focus

1. **Edit a section, then add one.** The dialog must open empty, in Add mode, and append.
   Pinned by a test in Task 3.
2. **A dialog open while the chat edits.** Save an item while the agent inserts a section
   above it: the item must land in the section it was opened from. Pinned by a context
   test in Task 4.
3. **A target that disappears.** The agent deletes the section whose dialog is open: the
   save must do nothing and close, never create or overwrite.
4. **Typing in the heading while the agent writes one.** The caret must not jump and the
   user's characters must not be lost; the agent's heading lands on blur.
5. **A streaming reply.** A half-written `**bold` must read as text, and must not make the
   bubble flicker between formats as the rest arrives.
6. **Heading size.** An agent heading change must keep the size the owner picked, and the
   published page must draw it at heading size.

---

### Task 1: Render the agent's Markdown reply [done]

**Files:**
- Created: `src/lib/format/markdown.ts` (the grammar, pure, no React),
  `src/components/catalogue/chat/MarkdownText.tsx` (the renderer),
  `src/lib/format/list-input.ts` (`continueList`)
- Modified: `src/components/catalogue/chat/ChatMessageBubble.tsx` (both roles render
  through `MarkdownText`, with the dark bubble's palette for the user's own),
  `src/components/catalogue/chat/CatalogueChat.tsx` (list continuation and the caret
  restore after it), `src/agent/core/instructions.ts` (the reply is Markdown; keep
  tables narrow)

**Interfaces:**
- `parseMarkdownBlocks(text: string): MdBlock[]`, `parseInline(text: string): MdInline[]`
- `MarkdownText({ text, tone }: { text: string; tone?: "default" | "onDark" })`
- `continueList(value: string, caret: number): { value: string; caret: number } | null`

**What it covers:** paragraphs keeping their line breaks, `**bold**`, `*italic*`,
`***both***`, `~~strike~~`, `` `code` ``, `[text](url)` (http and mailto only -
anything else renders as its text), `#`-`######` as bold lines (never real heading
tags, which would join the panel's outline), nested bullet and numbered lists with
wrapped items, fenced code, blockquotes, `---` rules and GFM pipe tables (scrolled
sideways in the narrow bubble). `\*` escapes. Everything else stays the text it was.

**Two properties it is built around:** an unfinished marker reads as literal text,
because the reply is re-parsed on every stream chunk, and every marker closes on the
line it opened, so a stray asterisk or a fence cannot swallow the rest of the reply.
Output is React elements, never an HTML string, so the chat adds no author-HTML sink.

- [x] The renderer and the grammar, checked against 21 cases by rendering them
  (emphasis, nesting, lists, tables, quotes, rules, escapes, `snake_case`,
  `2 * 3 * 4`, code holding its own asterisks, a half-streamed `**`, an unterminated
  fence, an empty reply).
- [x] Composer list continuation: Enter on `- Coffee` inserts `- `, on `1. First`
  inserts `2. `, and on a marker with nothing after it ends the list. The value stays
  a plain string, so what the agent receives is unchanged, and the caret is restored
  once the new value has rendered.
- [x] The instruction line now invites Markdown instead of forbidding it.
- [x] `npx tsc --noEmit`, `npm run check`, `npm test`.

### Task 2: One heading format, and a heading box that keeps up [done]

**Files:**
- Create: `src/lib/catalogue/heading.ts`
- Modify: `src/components/catalogue/inputs/heading/useHeadingEditor.ts`
- Modify: `src/components/catalogue/view/components/Heading.tsx`
- Modify: `src/lib/catalogue/operations.ts` (`update_catalogue`, heading branch)
- Modify: `src/agent/tools/general.ts` (the `heading` field), `src/agent/core/instructions.ts` (line 55)
- Also modified: `src/components/catalogue/inputs/heading/index.ts` (the limit is
  re-exported from the lib), `src/components/catalogue/builder/useBuilderActions.ts`
  (the publish guard uses `isHeadingEmpty` instead of its own copy of the strip)
- No tests (owner's decision)

**Interfaces:**
- Produces: `wrapHeading(innerHtml: string, size: HeadingSize): string`
- Produces: `parseHeading(stored: string | undefined): { inner: string; size: HeadingSize }`
- Produces: `headingText`, `isHeadingEmpty`, `DEFAULT_HEADING_SIZE`, and
  `HEADING_CHAR_LIMIT` (moved here from the hook, still re-exported from
  `heading/index.ts` so `HeadingInput` keeps its import)

- [x] **One heading format.** `wrapHeading`/`parseHeading` in
  `lib/catalogue/heading.ts`, with the class list kept byte-identical so existing
  headings render exactly as before. `headingText` and `isHeadingEmpty` for the
  callers that were stripping tags themselves.
- [x] **Normalized in the applier**, so the server session and the browser replay
  cannot diverge: `update_catalogue` parses the incoming value and the current
  heading, and stores `wrapHeading(inner, incoming.size ?? current.size ?? large)`.
  An empty value clears the heading. Text over 100 characters is cut (formatting
  dropped rather than cut mid-tag).
- [x] **The heading box syncs from the draft.** The once-only `isInitialized` guard
  is gone, along with the one in `handleFocus`. A `lastWrittenHtml` ref tells the
  box's own echo from an outside change; an outside change renders immediately when
  the box is not focused, and when it is, the effect re-runs on blur and lands it
  then - so the caret is never moved mid-word and the user's characters are never
  lost.
- [x] **The published page repairs an unwrapped heading**: a stored heading with no
  `data-size` (an older row, or an assistant edit from before this) is re-wrapped
  rather than drawn at body size.
- [x] **The agent side**: the `heading` field is described as plain text with the
  100-character limit and "the builder owns the styling", and the content rule no
  longer invites `<h1>` for the heading (text sections keep their HTML wording).
- [x] `npx tsc --noEmit`, `npm run check`, `npm test`.

### Task 3: "Add section" never re-opens the last edit [done]

**Files:**
- Created: `src/components/catalogue/view/useSectionDialog.ts`
- Modified: `src/components/catalogue/view/Catalogue.tsx`,
  `src/components/catalogue/modals/AddContentModal.tsx` (the `setIsOpen` and
  `blockIndex` props are gone)
- Test: `tests/unit/components/addSection.test.tsx`

- [x] **One way in, one way out.** The dialog's target moved into
  `useSectionDialog`: `openAdd` clears it, `openEdit` sets it, `close` clears it.
  The "Add Section" tile calls `openAdd`, a section's Edit calls `openEdit`.
- [x] **`AddContentModal` closes through `onClose`**, so a save cannot bypass the
  clear. It now decides add-vs-edit from `editingBlock` alone, calls
  `updateBlock(editingBlock.id, …)` or `addBlock(…)`, and no longer rebuilds
  `content` from its own render snapshot.
- [x] **An edit is a patch**: no `id`, no `order` (the live row keeps them), and no
  `items` for a section that is already an items section - the items in the form are
  a snapshot from when the dialog opened, and the section may have gained some
  since. This also ends the duplicate `order` after a template.
- [x] Tests: the target is cleared on close and on open-to-add; adding leaves the
  existing sections untouched and appends; editing changes the section it was opened
  on; a section keeps items it gained while the dialog was open.
- [x] `npx tsc --noEmit`, `npm run check`, `npm test`.

### Task 4: Builder edits address sections and items by id [done]

**Files:**
- Modify: `src/context/CatalogueContext.tsx` (the nine content mutators)
- Modify: `src/components/catalogue/view/CatalogueContent.tsx`,
  `src/components/catalogue/view/Catalogue.tsx`,
  `src/components/catalogue/modals/AddContentModal.tsx`,
  `src/components/catalogue/sections/ItemsSection.tsx`,
  `src/components/catalogue/sections/common/Items.tsx`,
  `src/components/catalogue/sections/TextBlock.tsx`,
  `src/components/catalogue/sections/DividerBlock.tsx`, and the card controls that pass
  an index up
- Test: `tests/unit/context/CatalogueContext.test.tsx` (rewrite to the id API, add the
  shifting cases), `tests/unit/components/blockMenu.test.tsx` if it asserts arguments

**Interfaces** (new context API; the array work inside each one is unchanged, only how the
target is found):
- `addBlock(block: ContentBlock, position?: number)` - appending needs no id
- `updateBlock(blockId: string, data: Partial<ContentBlock>)`
- `removeBlock(blockId: string)`
- `moveBlock(blockId: string, direction: "up" | "down")`
- `addItem(blockId: string, item: Item)`
- `updateItem(blockId: string, itemId: string, item: Item)`
- `removeItem(blockId: string, itemId: string)`
- `moveItem(blockId: string, itemId: string, direction: "up" | "down")`
- `moveItemToBlock(fromBlockId: string, itemId: string, toBlockId: string)`

Every one resolves its id **inside** the state updater, against the draft React is
holding, and returns `prev` unchanged when the id is gone.

- [x] **The context takes ids**, resolving each one inside the state updater and
  returning the draft untouched when it is gone.
- [x] **The call sites pass ids.** `CatalogueContent` had `block.id` and each
  `item.id` in its map already, so the index arguments went away rather than being
  translated; the item dialog keeps `{ blockId, itemId }`; a card's control resolves
  its item from the block it is rendered in, at click time.
- [x] **The card tree carries `blockId`.** `CardProps` gained it, so it flows
  through every card's `{...props}`; `BaseCard` passes `blockId` and `record.id` to
  `CardControls`, whose "move to section" list is now filtered and dispatched by id.
- [x] **The add goes through `addBlock`**, which assigns and re-indexes `order`.
- [x] Tests (`tests/unit/context/CatalogueContext.test.tsx`): the existing 21 ported
  to ids, plus the reported cases - a rename, an item save, an item add, a move, a
  reparent and a delete all landing on the right target after a section was inserted
  above; every mutator a no-op when its id is gone (asserted by draft identity); an
  item refused on a section that cannot hold items.
- [x] `npx tsc --noEmit`, `npm run check`, `npm test`.

### Task 5: One writer for the draft [done]

**Files:**
- Modify: `src/context/CatalogueContext.tsx`
- Test: `tests/unit/context/CatalogueContext.test.tsx`

**Interfaces:**
- Internal: `commit(next: (prev: Draft) => Draft): Draft` - the only place the draft is
  written. It computes from `catalogueRef.current`, stores the result in the ref, sets
  state and returns the new draft.

- [x] **`commit` is the only writer.** The render-time `catalogueRef.current =
  catalogue` assignment is gone; the ref is the draft, and `commit` computes from it,
  stores the result and sets state. `updateCatalogue`, `updateAppearance`,
  `updateThemeColors`, all nine content methods, `applyOperations`, `seedCatalogue`,
  `patchSaved`, `resetCatalogue` and `rejectAiChanges` go through it;
  `applyOperations` still returns its outcome synchronously. A write that changes
  nothing returns the same object and does not re-render, so `isDirty` and the AI
  review's identity checks behave as before.
- [x] Tests: a hand edit and an agent edit applied in the same tick both survive
  (the hand edit used to be dropped); `getCatalogue()` sees a hand edit immediately,
  without waiting for a render. The existing AI-review and `isDirty` tests still
  pass.
- [x] `npx tsc --noEmit`, `npm run check`, `npm test`.

### Task 6: A template gets its own copy [done]

**Files:**
- Modify: `src/constants/catalogueTemplates.ts`
- Modify: `src/components/catalogue/inputs/TemplatesInput.tsx`
- Test: `tests/unit/constants/catalogueTemplates.test.ts`

- [x] `standardTemplate` and `placeholderTemplate` are now factories over private
  block constants, through one `instantiate` that deep-copies, mints fresh ids and
  re-indexes `order` from 0. The ids inside the data are blanked, so nothing reads
  as if it were a real id.
- [x] `TemplatesInput` calls the factory (and its two `any`s are typed).
- [x] No test (owner's decision); covered indirectly by the add-section tests, which
  assert 0-based `order` after an add.
- [x] `npx tsc --noEmit`, `npm run check`, `npm test`.

### Task 7: Documentation [done]

**Files:**
- Modify: `docs/architecture/builder.md` (a short "How an edit finds its target" note: ids,
  one writer, a gone target is a no-op)
- Modify: `docs/architecture/ai-chat-flow.md` (the reply is rendered Markdown, and the
  heading is normalized in the applier)
- Modify: `.claude/plans/README.md` (add this plan's row)
- Modify: `.claude/skills/code-conventions/SKILL.md` if it states the context's API

- [x] `docs/architecture/builder.md`: a new "How an edit finds its target" section -
  ids resolved in the updater, a dialog keeping ids, an edit as a patch, one writer,
  templates instantiated.
- [x] `docs/architecture/ai-chat-flow.md`: the reply is Markdown and how it is
  rendered (and why it is not an author-HTML sink), the heading normalization, and
  four new file-map rows.
- [x] `.claude/plans/README.md`: this plan's row.
- [x] `npm run check`.

**Known drift, not touched:** `ai-chat-flow.md` §1 and §8 still describe the
pre-agent single-shot translator (`lib/ai/catalogueEditor.ts`, "no tool calling, no
streaming"). That predates this plan and is a doc-refresh of its own.

## Decisions we made (please confirm)

1. **The chat renders Markdown itself rather than pulling in a Markdown library.**
   About 250 lines of grammar and renderer to maintain, against ~35 KB gzipped of
   `react-markdown` + `remark-gfm` in the builder bundle. It is a bounded subset over
   short, model-written text we control the instructions for; if the replies outgrow
   it, the library is the fallback.
2. **The agent cannot choose the heading size.** Its words land in the size the owner
   picked, which keeps an agent heading from resetting a deliberate choice. Cost: asking
   for "a bigger title" needs the dropdown. A `headingSize` field can be added later.
3. **The heading is clamped to 100 characters**, the builder's own limit, instead of the
   tool's current 2000. A longer heading is cut rather than refused.
4. **An agent heading change waits while the heading box has focus**, and lands on blur -
   the user's typing is never interrupted mid-caret.
5. **The context's edit API becomes id-based.** One internal breaking change across about
   eight components, in exchange for ending this class of bug. The alternative - keeping
   indices and translating at each call site - leaves every new call site free to get it
   wrong again.
6. **A save whose target is gone closes quietly**, with no message. Add a toast ("that
   section is no longer there") if you would rather it be explicit.
9. **Markdown renders in the user's own bubble too**, so a `-` they typed comes back
   as a bullet. The composer stays a plain textarea; typing a list there is helped by
   list continuation, not by a rich-text field.
10. **Headings in a reply render as bold lines, not real heading tags**, so a reply
   never joins the chat panel's own document outline.
7. **A template is copied with fresh ids each time it is applied.** Applying the same
   template to two catalogues gives two unrelated sets of ids, which is what every other
   path assumes.
8. **No new dependency, no migration, no package release.**

## Verification

- `npx tsc --noEmit` clean, `npm run check` clean (3 pre-existing warnings in an
  unrelated demo component), `npm test` 802 passed / 89 files, as of 2026-10-27.
- Still to do, in the browser on TEST: ask the agent for a heading change and watch
  the heading box change; type in the heading while a change lands; edit a section,
  save, then add a section; keep an item dialog open while the agent adds a section,
  then save the item; move an item to another section; read a reply containing bold,
  a list and a table; type `- ` in the composer and press Shift+Enter.

## Not in this plan

- Collapsing the context's array logic into `applyCatalogueOperations` so there is one
  definition of each edit - that belongs to
  [2026-10-25-codebase-cleanup](../2026-10-25-codebase-cleanup/PLAN.md) (the "SOLID splits
  of the builder" task).
- Replacing the heading's hand-rolled `contentEditable` with the rich-text editor the text
  sections use.
- The agent's own section-type and plan-limit behaviour, which
  [2026-10-24-agent-plan-limits](../2026-10-24-agent-plan-limits/PLAN.md) covers.
