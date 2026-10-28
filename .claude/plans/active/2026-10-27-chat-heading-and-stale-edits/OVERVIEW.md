# Chat formatting, the heading and overwritten sections: the short version

Built on 27 October; the engineering detail is in [PLAN.md](PLAN.md). Everything
below is done in the code and checked by automated tests - what is left is trying it
in the browser on the test site.

## The problem

Three things reported on 27 October, all in the builder. The AI's replies show their
formatting marks instead of formatting (`**Added 6 items**` instead of **Added 6 items**).
Asking the AI to change the catalogue heading looks like it does nothing. And a section
edit can land on the wrong section: after editing one section, clicking **Add Section**
replaces that section instead of adding a new one. The third is the serious one - it
destroys work the owner has already done.

## What goes wrong today

**The AI's replies print their formatting marks.**
The AI writes its answers in the usual chat formatting - bold, bullets, the odd small
table - and the bubble showed the marks instead of the formatting, so a reply read
like `**Added 6 items**` with the asterisks still in.

**The heading box ignores anything it did not type itself.**
The heading box reads the catalogue's heading once, when the page opens, and never looks
again. When the AI changes the heading, the catalogue really does change - but the box on
screen still shows the old words, so the tool looks broken. The change is only visible
after leaving the builder and coming back. On a brand-new catalogue with no heading yet
the first change does show, which is why the bug seems to come and go.

**Then typing one character throws the AI's heading away.**
Because the box still holds the old heading, the moment the owner types in it the old
words are written back over the AI's. The owner's own edit is what undoes the change.

**An AI heading is also stored in the wrong shape, so the published page draws it small.**
The builder stores a heading with its size and styling attached. The AI stores bare text
or a bare title tag, so the published page renders it at body size in the body font - a
heading that is technically there but does not look like one. The size dropdown also
always reads "Large" for those headings, whatever they are.

**"Add Section" re-opens the last section you edited, and saving overwrites it.**
Saving a section closes the dialog but does not forget which section was being edited.
Clicking **Add Section** then re-opens that same edit: the dialog says "Edit section", is
pre-filled with the old section, and saving writes over it. Nothing is added, and any
items added to that section since are dropped. Templates make it likely because a template
is what puts sections on screen to edit in the first place.

**Behind that: the builder finds a section by its position, not by which section it is.**
Every dialog remembers "the third section" rather than "this section". The AI's changes
land on the catalogue live while it works, which is the supported way to use the chat - so
a section added, deleted or moved while a dialog is open shifts the positions, and the
save then writes over a different section, puts an item in a different section, or quietly
does nothing. The AI's own edits were given real identities for exactly this reason; the
builder's edits were not.

## The fix in one idea

**Stop using position as identity, and give the heading and the chat a single owner each.**

1. The chat renders what the AI writes: bold, italics, strikethrough, inline code,
   links, bullet and numbered lists (including sub-bullets), short headings, code
   blocks, quotes, dividers and small tables. The AI is told it can use all of it,
   and to keep tables narrow because the panel is. Typing `-` in the message box and
   pressing Shift+Enter also carries the list on, so writing one by hand is easy.
2. The heading has one stored shape, produced in one place, so the AI's wording keeps the
   size and styling the owner chose - and the heading box re-reads the heading whenever it
   changes, waiting politely if the owner is typing in it.
3. Every builder edit says which section and which item it means, resolved at the moment
   it is saved. A target that no longer exists is simply not written.
4. Applying a template hands the catalogue its own fresh copy.

The guarantee: an edit can only ever change the thing it was opened on, and never a
different section, and never nothing.

## What users will notice

- AI replies read the way they were written: bold, bullets, numbered steps, a small
  table, code where the AI shows code. Your own messages render the same way.
- Asking the AI to change the heading changes the heading on screen, immediately.
- A heading the AI writes looks like a heading on the published page, in the size that was
  already chosen.
- Typing in the heading no longer reverts what the AI just wrote.
- **Add Section** always opens an empty "Add section" dialog and always adds a section.
- Editing a section or an item while the AI is working lands on the right one.
- Nothing silently disappears when the AI and the owner edit at the same time.

## Decisions we made (please confirm)

- **The chat renders its own formatting rather than pulling in a formatting library.**
  A few hundred lines to maintain, against roughly 35 KB of extra download in the
  builder. It covers everything a reply realistically uses; if replies outgrow it, the
  library is the fallback.
- **Your own messages render their formatting too**, so a `-` you type comes back as a
  bullet. The message box itself stays a plain text field - typing a list is helped
  along, not turned into a rich-text editor.
- **A heading inside a reply shows as a bold line**, not as a page heading, so a reply
  never competes with the panel's own headings.
- **The AI cannot pick the heading size.** Its words land in the size already chosen, so
  an AI heading can never reset a deliberate choice. Asking for "a bigger title" still
  means using the dropdown.
- **An AI heading is cut to 100 characters**, the same limit the heading box enforces,
  rather than refused.
- **While the owner is typing in the heading, an AI heading change waits** and lands when
  they click away, so the cursor never jumps.
- **The builder's internal edit calls all change shape**, about eight screens' worth, to
  end this class of bug rather than patch each dialog. More code touched now, far less
  chance of the same bug returning.
- **Saving onto a section the AI has deleted does nothing and closes quietly.** Say if you
  would rather it showed a message such as "that section is no longer there".
- **Each template application gets its own fresh ids.** Building two catalogues from the
  same template in one sitting no longer gives them the same internal identities.
- **No database change, no new library, no package release.**

## Order of work

1. Render the AI's reply, and tell it what format to write in.
2. One heading format, and a heading box that keeps up.
3. "Add Section" never re-opens the last edit (the reported overwrite).
4. Builder edits say which section and item they mean.
5. One writer for the draft, so simultaneous edits compose.
6. A template gets its own copy.
7. Update the documentation.

The overwrite work (steps 3-6) is covered by automated tests; the chat formatting and
the heading were checked by rendering them and by hand, which is what we agreed. The
whole lot still needs one pass in the browser on the test site: a heading change from
the chat, typing in the heading while a change lands, an edit-then-add, an item saved
while the AI is adding sections, and a reply containing bold, a list and a table. The
database does not change.

## Not in this plan

- Tidying the builder so each kind of edit is defined once - that is part of
  [2026-10-25-codebase-cleanup](../2026-10-25-codebase-cleanup/PLAN.md).
- Rebuilding the heading box on the same editor the text sections use.
- The AI's plan limits and section types, covered by
  [2026-10-24-agent-plan-limits](../2026-10-24-agent-plan-limits/PLAN.md).
