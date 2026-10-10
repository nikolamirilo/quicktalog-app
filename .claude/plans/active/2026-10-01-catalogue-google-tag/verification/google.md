# Verification: Google tag, GA4, Consent Mode, Next.js claims (G1-G7)

Date: 2026-10-01. Verifier: adversarial check against official docs only.

## Method

- Pages fetched live today with curl (raw HTML, converted to text). For Next.js pages that returned 504, the request was retried later or sent through FireCrawl. Nothing comes from search snippets except where marked "(snippet)".
- Official sources used:
  - support.google.com
  - developers.google.com
  - nextjs.org (v15 docs)
  - installed library source under `quicktalog-app/node_modules`:
    - `next` 15.5.26 (`node -p require('next/package.json').version`)
    - `@next/third-parties` 15.5.26
- Each claim gets a verdict, verbatim quotes, and a correction where one is needed. **Inference** marks anything not stated by a source.

| Claim | Verdict | One-line reason |
|---|---|---|
| G1 | confirmed | Container-ID article and 2026-07-09 release note say exactly this |
| G2 | partially | Variable classes confirmed verbatim; "since 2026-08-20" is the date of an announcement written in the future tense, with no rollout confirmation |
| G3 | confirmed | Both quotes are verbatim; "nothing before consent" holds only if Quicktalog's loader really withholds gtag.js |
| G4 | confirmed (with caveat) | `l=` is the documented rename. "Only when" is an inference from "default name is dataLayer". The same page says "use only one data layer per page" |
| G5 | confirmed | Override rule quoted verbatim; installed matcher rejects `/catalogues/x/preview`. The override works only with the same header key |
| G6 | confirmed (with exceptions) | v15 caching guide + installed `patch-fetch.js`; exceptions: `unstable_cache`/`use cache` scope, `dynamic='force-static'`, `fetchCache` overrides |
| G7 | partially | The doc statements exist. Its sample code is malformed. "Regardless of property settings" is documented only against GA UI property settings, not against the tag owner's own container config. Consent denial is the stronger documented control |

---

## G1: G-/AW- containers are limited to Google tags; GTM- allows everything, even via /gtag/js

**Verdict: confirmed.**

[Manage tagging behavior using the container ID](https://support.google.com/tagmanager/answer/17070049?hl=en), fetched 2026-10-01:

> "The prefix specifies the functionality that the container can execute. By configuring the prefix of your ID, you can decide whether your tag is allowed to execute custom third-party scripts or if it should be restricted to sending data strictly to Google services."

> "If your container ID begins with GTM- (for example, GTM-ABCDEFG), it indicates that your container allows all tag types. This means that it can load and execute all features and a wide range of scripts, including: Third-party scripts; Custom HTML and JavaScript tags you've configured; Data transmission to Google services"

> "If your container ID starts with product-specific prefixes like G- or AW-, your container is limited to Google tags. In this case, the tag can send data exclusively to Google services. It prevents loading or executing other tag types, offering a more controlled, secure environment focused purely on Google measurement and advertising."

[Tag Manager release notes](https://support.google.com/tagmanager/answer/4620708?hl=en), entry "July 9, 2026: Updates to container behavior for unsupported installation paths":

> "This release fixes how Google Tag Manager handles containers loaded using unsupported paths such as /gtag/js or /gtag/destination. Previously, these containers degraded to a restricted state where only Google-provided tags and variables were permitted to run. Moving forward, the ID used to load the container will control this behavior, regardless of the path used. Containers loaded with a GTM-XXXX ID won't be restricted, while product-specific ID types like G-XXXX or AW-XXXX will only permit tags and variables provided by Google. Installations using Google-provided snippets are unaffected..."

**Nuances (not corrections):**
- The restriction is "tags **and variables** provided by Google". It is not "Google tags only, nothing else": Google-provided variables still run, and G2 depends on exactly that.
- `GT-` is not named. It sits under the heading "When your container ID starts with other prefixes", but the text names only G- and AW-. **Inference:** probably restricted. Keep refusing `GT-` until the probe confirms it (synthesis.md:77, :344).
- Before 2026-07-09, a GTM- ID loaded through `/gtag/js` was restricted. It no longer is, so the date matters. Any validation that accepts a `GTM-` value in any field, whatever the script path, now allows arbitrary first-party JavaScript.

---

## G2: Since 2026-08-20 a G- tag is manageable as a Tag Manager container; First Party Cookie, JavaScript Variable, DOM Element are class `google`

**Verdict: partially.** The class assignments are confirmed verbatim. The "since 2026-08-20" timing is not confirmed.

[Updates to Google tag and Google Tag Manager](https://support.google.com/tagmanager/answer/17079602?hl=en), dated "August 20, 2026":

> "Your Google tags will be upgraded to fully capable Google Tag Manager containers. Websites that only use Google tag will have the ability to use Tag Manager's interface-driven tagging features, debugging, and version control."

> "This upgrade will not change the in-page behavior of the Google tags. Rather, advertisers who use Google tag will gain the option to use Google Tag Manager features."

> "Note: With this change, all new deployment snippets will be the same. Additionally, they will not have the gtag config command. It's recommended that you configure initialization behavior using the `gtm init` trigger. This `init` trigger can also configure the tag to wait for the config command if you want to preserve legacy setup."

> "It's recommended for advertisers to upgrade and optimize their Google Tag Manager containers. However, no changes will be made automatically, and you can choose whether to adopt the new configuration."

[Restrict tag deployment](https://developers.google.com/tag-platform/tag-manager/restrict) ("Last updated 2026-07-30 UTC"), Variable table (Variable / ID / Classes):

> "First Party Cookie | k | google" ... "Custom JavaScript Variable | jsm | customScripts" ... "DOM Element | d | google" ... "JavaScript Variable | j | google" ... "RegEx Table | remm | google" ... "URL | u | google"

and the class table:

> "google: Only capable of running Google hosted scripts and sending pixels to Google."

**Correction:**
- 2026-08-20 is the date of an announcement written in the future tense ("will be upgraded", "will gain the option"). Google does not say when each account gets the upgrade.
- The release-notes page (4620708) has no 2026-08-20 entry. Its newest entries are 2026-09-17 ("Suggested version summary") and 2026-07-09.
- A search for other official confirmation found only the same article. Search results: [4620708 (snippet)](https://support.google.com/tagmanager/answer/4620708?hl=en) and [17079602 (snippet)](https://support.google.com/tagmanager/answer/17079602?hl=en).
- Suggested wording: "Google announced on 2026-08-20 that Google tags will be upgraded to full Tag Manager containers; rollout timing per account is not stated."
- This does not weaken the design. The design must assume the capability exists, because a tenant might already have it. But the launch-gate probe (synthesis.md:1547) should also record whether a real `G-` tag opens as an editable container in the Tag Manager UI.

**Inference, not stated by Google:**
- G- containers "only permit tags and variables provided by Google" (G1). The restrict doc's `google` class lists First Party Cookie, JavaScript Variable and DOM Element.
- So nothing documented stops a tenant's upgraded G- container from reading non-httpOnly first-party cookies, page globals or DOM text, and sending them to Google in event parameters.
- Google never states this cookie-exfiltration use. The T2 hypothesis therefore stays a hypothesis until it is probed.

---

## G3: consent default before config/event; basic mode sends nothing before consent

**Verdict: confirmed.**

[Set up consent mode on websites](https://developers.google.com/tag-platform/security/guides/consent) ("Last updated 2026-07-30 UTC"):

> "To adjust the default measurement capabilities, call the gtag('consent', 'default', ...) command on every page of your site before any commands that send measurement data (such as config or event)."

> "The order of the code here is vital. If your consent code is called out of order, consent defaults won't work."

[Consent mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode) ("Last updated 2026-07-30 UTC"):

> "When you implement consent mode in its basic version, you prevent Google tags from loading until a user interacts with a consent banner. This setup transmits no data to Google prior to user interaction with the consent banner. When the user grants consent, Google tags load and execute the consent mode APIs."

> "However, when the user doesn't consent, no data is transferred to Google at all – not even the consent status. Google tags are completely blocked from firing."

> Overview table, "Data transmission", Basic: "No data is sent before a user consents - not even the default consent status."

**Nuances:**
- "Basic" is something the implementer does ("you prevent Google tags from loading"), not something gtag.js does. The zero-requests promise rests entirely on Quicktalog's loader not injecting `gtag/js` before Accept. The E2E check B3 (synthesis.md:1810) is the right proof.
- The design queues `default` (all denied), then `update` (analytics granted), then `set`, `js` and `config`, all before gtag.js is injected (synthesis.md:1009). That fits both rules.
- **Inference:** since 2026-08-20, upgraded tags may initialise from a container `gtm init` trigger without the page's `config` (G2 quote). The order still holds, because `default` is in the queue before the script exists at all.

---

## G4: gtag.js reads a renamed data layer only when the script URL includes `l=<name>`

**Verdict: confirmed (mechanism). "Only when" is an inference.**

[The data layer](https://developers.google.com/tag-platform/devguides/datalayer) ("Last updated 2026-07-22 UTC"), section "Rename the data layer":

> "The default name of the data layer object initiated by the Google tag or Tag Manager is dataLayer. If you'd prefer to use a different name for your data layer, you may do so by editing the data layer parameter value in your Google tag or Tag Manager container snippet with the name of your choice."

> gtag.js: "Add a query parameter named "l" to the URL to set the new data layer name, for example, l=myNewName. Update all instances of dataLayer in the Google tag snippet to the new name."
> `<script async src="https://www.googletagmanager.com/gtag/js?id=TAG_ID&l=myNewName"></script>` ... `window.myNewName = window.myNewName || []; function gtag(){myNewName.push(arguments);}`

**Caveats:**
- Google documents `l=` as *the* way to rename and says the default is `dataLayer`. It does not literally say "only". The "only when" reading is an inference, supported by the prior research's probe P5 (zero hits when `&l=` was dropped, `../research/google-tag-docs.md`). The design's use is correct.
- The same page carries this warning:
  > "Important: Use only one data layer per page. Only one dataLayer object is supported per page. Google Tag Manager and gtag.js rely on a single, global JavaScript array named window.dataLayer ... Attempting to use more than one data layer instance ... can cause significant problems: Tags may not fire ..."
- `qtDataLayer` is consistent with that warning only if it is the *only* data layer in the document. The design removes Quicktalog's GTM from published catalogues (synthesis.md:1107, `QuicktalogSiteTags` at :1115-1133). See other issue 2 for the soft-navigation hole.
- Installed library: `@next/third-parties` already does the same thing for GTM. It appends `&l=${dataLayerName}` when the name is not `dataLayer` (`node_modules/@next/third-parties/dist/google/gtm.js:17`, `:38`).

---

## G5: Next.js 15 `headers()`: later rule wins for the same key; `/catalogues/:name` does not match `/catalogues/:name/preview`

**Verdict: confirmed.**

[next.config.js: headers (v15)](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers) ("Last updated June 16, 2025"):

> "Header Overriding Behavior: If two headers match the same path and set the same header key, the last header key will override the first. Using the below headers, the path /hello will result in the header x-hello being world due to the last header value set being world." (example: `source: '/:path*'` x-hello=there, then `source: '/hello'` x-hello=world)

> "Path Matching: Path matches are allowed, for example /blog/:slug will match /blog/hello-world (no nested paths)"

Installed-source check: Next's own matcher, `getPathMatch` from `node_modules/next/dist/shared/lib/router/utils/path-match.js`, tested with `{strict: true}` (scratchpad script):
- `/catalogues/x` gives `{"name":"x"}`
- `/catalogues/x/` gives `false`
- `/catalogues/x/preview` gives `false`
- `/catalogues` gives `false`
- `/:path*` matches `/catalogues/x/preview`

**Caveats (inference unless cited):**
- The override is per header key. Today's global rule sets `Content-Security-Policy-Report-Only` on `source: "/:path*"` (`next.config.ts:66-67`). The catalogue rule overrides it only if it uses the same key and comes later in the array.
- If the catalogue rule instead sets `Content-Security-Policy` (enforced), both headers are sent and both policies apply. Nothing is overridden.
- A route-scoped CSP governs only full document loads of `/catalogues/<slug>`. A client-side (soft) navigation keeps the CSP of the document that was first loaded (inference about browser CSP semantics; no nextjs.org source). See other issue 3.

---

## G6: a `cache: 'no-store'` fetch during server rendering makes an App Router route dynamic

**Verdict: confirmed for this page's configuration, with documented exceptions.**

[Guides: Caching (v15)](https://nextjs.org/docs/15/app/guides/caching) ("Last updated July 3, 2025"):

> "You can opt out of the Full Route Cache, or in other words, dynamically render components for every incoming request, by: ... Opting out of the Data Cache: If a route has a fetch request that is not cached, this will opt the route out of the Full Route Cache. The data for the specific fetch request will be fetched for every incoming request."

[fetch (v15)](https://nextjs.org/docs/15/app/api-reference/functions/fetch) ("Last updated September 23, 2025"):

> "auto no cache (default): Next.js fetches the resource from the remote server on every request in development, but will fetch once during next build because the route will be statically prerendered. If Dynamic APIs are detected on the route, Next.js will fetch the resource on every request."
> "no-store: Next.js fetches the resource from the remote server on every request, even if Dynamic APIs are not detected on the route."

Installed source (next 15.5.26):
- `node_modules/next/dist/server/lib/patch-fetch.js:761-784`: during static generation, `if (cache === 'no-store')` calls `markCurrentScopeAsDynamic(..., \`no-store fetch ${input} ${workStore.route}\`)`.
- `:494`: the comment "we don't consider autoNoCache to switch to dynamic for ISR". So an *explicit* `no-store` behaves differently from the default.
- `node_modules/next/dist/server/app-render/dynamic-rendering.js:215-219`: in a `prerender-legacy` build, `markCurrentScopeAsDynamic` sets `revalidate = 0` and throws `DynamicServerError("Route ... couldn't be rendered statically because it used ...")`. The route becomes dynamic.

The published page exports only `revalidate = 86400` (`src/app/catalogues/[name]/page.tsx:11`), so none of the exceptions below apply. A `no-store` read in its render would end ISR for every catalogue.

**Exceptions (installed source):**
- `dynamic-rendering.js:183` returns early inside `'cache'` / `'unstable-cache'` scopes.
- `:203` returns if `forceStatic` (`dynamic = 'force-static'`) or `forceDynamic`.
- `:204` throws a build error if `dynamic = 'error'`.
- `patch-fetch.js` `fetchCache = 'only-cache'` throws on `no-store`.
- `patch-fetch.js` `fetchCache = 'force-cache'` coerces an uncached fetch to cached.

**Doc inconsistency to ignore:** the same caching guide says "The default caching behavior of fetch (e.g., when the cache option is not specified) is equal to setting the cache option to no-store". That conflicts with the fetch reference and with `patch-fetch.js:494`. The installed source is authoritative.

**Inference for C14:**
- A flags read wrapped in `unstable_cache(..., { revalidate: N })` would not make the route dynamic (`dynamic-rendering.js:183`).
- But the page's HTML would then still refresh only on the page's ISR cycle or a purge. A server-side kill switch therefore cannot beat the ISR window without a purge, and "env var + redeploy + purge" (C14) is no worse.
- A client-side flag read is the only no-purge option.

---

## G7: `allow_google_signals` / `allow_ad_personalization_signals` = false override property settings; `ga-disable-<ID>` stops GA

**Verdict: partially.** The doc says this. But the published samples are broken, the "regardless" wording is narrower than claimed, and the robust control is consent denial.

[Manage privacy settings](https://developers.google.com/tag-platform/security/guides/privacy) ("Last updated 2026-07-30 UTC"):

> `allow_google_signals` (Google Analytics): "No effect when not set or set to true. When set to false, events sent from the tag will not be used for ads personalization and demographics and interests reports." / "When set to false, all join beacons are suppressed."

> `allow_ad_personalization_signals`: "When set to false, events sent from the tag will not be used for ads personalization, but they can still be used for demographics and interests reporting. Note: If your website uses the parameter allow_ad_personalization_signals, ad personalization only happens when allow_ad_personalization_signals is set to true and the end-user grants consent to ad_personalization." / "When set to false, include an &npa=1 parameter on all beacons."

> "Turn off all advertising features: These configurations give you the ability to turn off advertising, reporting, and remarketing features, and overrides any property settings established in the Google Analytics user interface."

> "The gtag.js library includes a window['ga-disable-MEASUREMENT_ID'] property that, when set to true, turns off the Google tag from sending data. When a product attempts to set a cookie or send data back to the Google Analytics servers, it will first check if this property is set, and will take no action if the value is set to true."

**Corrections and caveats:**

1. **The doc's gtag.js samples are invalid JavaScript.**
   - `gtag ( 'set' , { 'allow_google_signals' , false });` and `gtag ( 'set' , { 'allow_ad_personalization_signals' , false });` are object literals with a comma instead of a colon.
   - `gtag ( 'config' , { 'allow_ad_personalization_signals' : false });` omits the tag ID.
   - Use the forms in the [GA4 config reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config) ("Last updated 2026-05-14 UTC"): "Set globally `gtag('set', 'allow_google_signals', true);`", "Set for a single stream `gtag('config', 'STREAM_ID', { 'allow_google_signals': true });`", and the same for `allow_ad_personalization_signals`.
   - The design's `qtag("set", "allow_google_signals", false)` (synthesis.md:771) uses the valid 3-argument form.
2. **"Regardless of property settings" means GA UI property settings, not the tag owner's configuration.**
   - Google says the page setting "overrides any property settings established in the Google Analytics user interface".
   - It does not say a page-level `set` beats the tag's own configuration. The [gtag API reference](https://developers.google.com/tag-platform/gtagjs/reference) ("Last updated 2026-04-17 UTC") says: "Parameter values scoped to event will take precedence over parameters scoped to config, and config parameters take precedence over parameters that are globally scoped using set."
   - The same privacy page shows the owner can add `allow_google_signals` as a "Configuration settings" parameter on the Google tag in Tag Manager.
   - **Inference:** a tenant who sets `true` in their (upgraded) container's tag configuration might win over Quicktalog's page-level `set`. Google does not document the precedence between page `set` and container configuration.
   - Mitigation: also pass both keys as `false` in Quicktalog's own `config` call.
3. **The documented, owner-independent control is consent mode.** [Consent mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode) behaviour table:
   - `ad_storage` denied: "Google Analytics won't read or write Google Ads cookies, and Google signals features won't accumulate data for this traffic."
   - `ad_personalization` denied: "Personalized advertising is disabled ... Remarketing in Google Ads, Display & Video 360, Search Ads 360".
   - `ad_user_data` denied: "Personal data collection for online advertising is disabled, including: user_id; Enhanced conversions".
   - Together with the privacy-page note that ad personalization "only happens when ... the end-user grants consent to ad_personalization", this supports v1 offering only an analytics purpose. The design keeps `ad_storage`, `ad_user_data` and `ad_personalization` at `denied` (default all denied, update grants only `analytics_storage`, synthesis.md:1009).
   - The `allow_*` flags should be described as defence in depth, not as the guarantee.
4. **`ga-disable-<ID>` is keyed to one measurement ID**, and Google frames it as turning off Google Analytics.
   - **Inference:** if a tenant's tag also has a Google Ads destination, `ga-disable-G-…` may not stop those hits. Google says an owner can add destinations to a tag; that claim is in prior notes and was not re-fetched here.
   - The design's withdrawal path (deny, `ga-disable`, delete cookies, **reload**; synthesis.md:120, :1013) does not depend on it.
   - The doc's statement that the product checks the flag "When a product attempts to set a cookie or send data" supports setting it at runtime, not only before load.

---

## Other issues found (not in the claim list)

1. **Privacy-guide samples are syntactically invalid** (G7 item 1). Anyone copying them breaks the loader. Pin the 3-argument form in code review.
2. **Two data layers after a soft navigation (inference).**
   - Quicktalog's GTM is mounted through `next/script` (`node_modules/@next/third-parties/dist/google/gtm.js:31-38`) and pushes to `window.dataLayer`.
   - `QuicktalogSiteTags` returning `null` on `/catalogues/x` (synthesis.md:1115-1133) stops *rendering*. It does not unload a GTM runtime that already ran.
   - If a visitor reaches a published catalogue through a client-side `<Link>` from `/`, `/admin` or a showcase page, Quicktalog's GTM is still live when the tenant's `qtDataLayer` tag loads. That breaks Google's "use only one data layer per page" rule and the design's "No Quicktalog Google tag in the document" (synthesis.md:1084).
   - Fix: every entry into a published catalogue must be a full document navigation, not only every exit. Alternatively, the tenant loader can refuse to run when `window.google_tag_manager` or `window.dataLayer` already exists, and force a reload.
3. **Route-scoped CSP applies only to full document loads (inference).**
   - Soft navigation from a widened `/catalogues/x` document into `/admin` keeps the widened policy, and the reverse is also true.
   - It is harmless while the CSP is Report-Only, but the claim "/admin and the preview are not widened" (synthesis.md:1187) holds only for hard loads. Item 2's full-navigation rule fixes this too.
   - The catalogue rule must reuse the key `Content-Security-Policy-Report-Only` (`next.config.ts:66-67`), or both policies apply.
4. **`gtm.blocklist` in a renamed data layer is undocumented.**
   - The restrict doc's example uses `window.dataLayer` and says lists "should be pushed to the data layer before any tags fire".
   - Google does not say the keys are honoured in a layer renamed with `l=`. C18 and B7 correctly gate this on a probe; keep it gated.
   - The same doc: "Sandboxed JavaScript used as part of custom templates is implicitly blocked on any page that blocklists any class of tag or variable".
   - **Inference:** blocking `k`, `j` and `d` by ID leaves other class-`google` readers, such as Auto-Event Variable (`v`), URL (`u`) and HTTP Referrer (`f`). They do not read cookies, but `v` reads attributes of clicked elements.
   - Note also that Data Layer Variable and Auto-Event Variable share the ID `v` in Google's table.
5. **Ads-destination traffic hosts (CSP).**
   - With `ad_storage` denied, "Requests are sent through a different domain (e.g. pagead2.googlesyndication.com)" ([consent overview](https://developers.google.com/tag-platform/security/concepts/consent-mode)).
   - If a tenant adds an Ads destination to their `G-` tag, the catalogue CSP will report those hosts. That is noise under Report-Only and breakage if enforced. Decide whether to allow them or treat the reports as an alert.
6. **G2 timing should be re-worded** in synthesis.md:843 and :1791 to "announced 2026-08-20; rollout timing not stated". Add "is the G- tag editable as a container in the GTM UI?" to the Phase 0 probe.
7. **Next.js caching guide contradicts itself** about default `fetch` vs `no-store` (G6). Cite the fetch reference and the installed `patch-fetch.js:494` and `:761-784`, not the guide's "default ... is equal to ... no-store" line.

## Raw captures

The fetched pages (HTML and extracted text) are in the scratchpad: `/private/tmp/claude-501/-Users-nikola-Desktop-Quicktalog/b64d7aca-2aef-4bfb-96c9-9b9e1c127e6e/scratchpad/g/`. The path-match test is `.../scratchpad/pm.js`.
