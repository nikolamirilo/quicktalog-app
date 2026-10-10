# How a customer's Google tag / GA4 gets onto a Quicktalog catalogue: official-docs research

Research date: 2026-10-01. Author: research subagent for the founder question "How the google tag and analytics will be added".

Scope: Google's official tag, consent and Analytics documentation, the Next.js docs, and Meta's Pixel docs, applied to Quicktalog's architecture. Public catalogues are ISR pages on the same origin as the signed-in builder.

## 0. Method, conventions, evidence quality

- **Fetching.** Google support and developer pages were fetched on 2026-10-01 with `curl` and reduced to text. Firecrawl's `onlyMainContent` mode silently drops Google's "Important" asides; the data-layer warning in section 3 was missing from the Firecrawl copy. Where a page shows "Last updated", the date is given.
- **Labels.**
  - **Fact**: stated by the cited page or file.
  - **Probe**: observed in my own headless-Chromium test (below).
  - **Inference**: my reasoning; never presented as a fact.
  - **(snippet)**: taken only from a search-result snippet.
- **Probes.** Throwaway scripts under the session scratchpad (`.../scratchpad/probe/consent-probe.mjs`, `consent-probe2.mjs`, `cookie-probe.mjs`, `array-probe.mjs`, `history-probe.mjs`).
  - Setup: Playwright 1.62.1 with chromium-1234 (headless), using the repo's `node_modules`. Google's real `gtag.js` came from `www.googletagmanager.com`. Pages were served at `https://catalogue.test` or `https://www.catalogue.test` through route interception.
  - IDs were fake (`G-QTPROBEA1`, `G-QTPROBEB2`), so no real property received data.
  - Limits: fake IDs carry no data-stream settings, so enhanced-measurement behaviour (history page views, scrolls, outbound clicks) could not be observed. A GTM container and the August 2026 "upgraded" Google-tag containers could not be tested without a real account.
- **Code citations.** Repo-relative to `quicktalog-app` unless prefixed `../quicktalog-packages/`. `node_modules` paths refer to the installed versions: `@next/third-parties` 15.5.26 and `next` 15.5.26.

## 1. Bottom line: the mechanism I would recommend

All of section 1 is **Inference**, built on the facts in sections 2 to 9.

### 1.1 What the owner does

1. **Where.** A new **Integrations** settings tab (or a section of General) in the builder sidebar, whose tab list is `src/components/catalogue/inputs/sidebar/index.tsx:52-82`. It is plan-gated; the plan ships no integrations flag today (`../quicktalog-packages/src/constants/pricing.ts`, features at lines 14-21, 46-58 and onward).
2. **One input: "Google tag ID".**
   - This is Google's own recommendation for CMS and website builders: "Your customers should be able to supply multiple forms of their Google tag ID through one interface... framed as a deployment for the Google tag" ([CMS integration guide](https://developers.google.com/tag-platform/devguides/gtag-integration)).
   - v1 accepts `G-` (GA4). `AW-` (Google Ads) and `GT-` are optional later.
   - The server normalises the input (trim, upper-case) and validates it with **strict, anchored** regexes. It **rejects** `GTM-`, and everything else, with a message.
   - Google's own published pattern `[A-Z]{1,3}\\w{5,}[\w]*` is malformed and contains no hyphen. Anchored, it rejects every real ID; unanchored, it matches inside `GTM-…`. It must not be used as a validator (section 2.2).
3. **Storage.**
   - A dedicated server action saves the ID: identity check, plan read from the database, validation, owner filter, row-count check, then `revalidateCatalogue`.
   - It goes into a new column, not into `metadata` and not into `CATALOGUE_EDITABLE_FIELDS`.
   - It stays out of every AI tool schema.
   - These points re-confirm PLAN.md §3.2. That plan's file paths predate the `src/` restructure.
4. **Help copy.**
   - Where to find the measurement ID.
   - That the business is the controller.
   - That a cookie banner naming the business and Google will appear.
   - That GA numbers will differ from Quicktalog's built-in stats.
   - How to test: published page, private window, signed out, accept cookies, then Tag Assistant or GA4 Realtime/DebugView.

### 1.2 What Quicktalog renders

1. The **published page only** (`src/app/catalogues/[name]/page.tsx`) passes the re-validated ID to a small client component. It is not rendered by `preview/page.tsx`, a layout, or `/admin`. Nothing per-visitor is decided on the server, so ISR is untouched (`page.tsx:11`, `revalidate = 86400`).
2. The ID travels as a prop or JSON data. It is never string-concatenated into inline script source.

### 1.3 What the visitor experiences (client side, after hydration)

1. **Guard.** If a Quicktalog session cookie is present, the customer's tag is not loaded at all. Supabase's `sb-<ref>-auth-token*` cookie is deliberately not `httpOnly` (`src/lib/auth/cookie-options.ts:8-21`); Clerk's `__session` is likewise readable. The reason is in section 2.5. Owners test in a private window.
2. **Banner.** An identity-free consent banner (the current `CookieBanner` calls `useUserContext()` at `src/components/general/CookieBanner.tsx:22`, so it cannot be reused).
   - It names the business and Google, with "Accept all", "Reject all" and "Customize" (Analytics, Advertising).
   - The choice is stored per catalogue (per controller) in `localStorage`. A footer "Cookie settings" link reopens it.
   - The Advertising category is always offered, even for a `G-` ID: the tag owner can remotely add Google Ads destinations to the same tag ([tag management](https://support.google.com/tagmanager/answer/12329709); section 2.3).
3. **Consent-mode flavour.** Basic is the conservative default for a platform hosting many EU SMBs; advanced is a deliberate legal decision. Google itself recommends advanced: its CMS guide asks platforms to unblock tags.
   - **Basic:** `gtag.js` is not loaded until the visitor grants a category. "Reject" means zero Google requests.
   - **Advanced:** the tag loads at once with `denied` defaults and sends cookieless pings (section 4).
4. **Init sequence, one script, in this order:**
   1. Define `dataLayer` and the `gtag()` function.
   2. `gtag('consent','default',{ad_storage, ad_user_data, ad_personalization, analytics_storage: 'denied'})`.
   3. `gtag('consent','update', <stored or just-given choice>)`.
   4. `gtag('set','developer_id.<Quicktalog's Google-issued ID>', true)`.
   5. `gtag('set','ads_data_redaction', true)`.
   6. `gtag('set', {cookie_domain:'none', cookie_prefix:'qt_<short hash of slug>', cookie_path:'/catalogues/<slug>', cookie_flags:'SameSite=Lax;Secure'})`.
   7. `gtag('js', new Date())`.
   8. `gtag('config', ID, {groups:'qt_tenant'})`.
   9. Inject `https://www.googletagmanager.com/gtag/js?id=ID`.

   Use `gtag()` (an Arguments object), never `dataLayer.push([...])`: an array push is ignored (Probe, section 4.6).
5. **Platform events.** A helper always adds `send_to:'qt_tenant'` and `'developer_id.<id>': true`. The events are listed in section 7.3; they cover item opens, debounced search, and taps on call, WhatsApp, Viber, email, directions and book.
6. **Fix first.**
   - **Search URL writes.** The search box writes `?q=` to the URL on every keystroke with `router.replace` (`src/components/catalogue/view/CatalogueContent.tsx:88-95`). GA4's history listener reacts to `replaceState` and treats `q` as a site-search parameter (section 7.1). Debounce it.
   - **Soft navigation.** The catalogue's internal links use `next/link`. Without a fix, the customer's tag keeps running after a visitor clicks to `/auth`, the legal pages or `/` (section 5.4). Make links that leave the catalogue full page loads, and set `window['ga-disable-<ID>']=true` on unmount.
7. **Quicktalog's own tags.** Quicktalog's own GTM container and Clarity are injected on every catalogue page from the root layout (`src/app/layout.tsx:46-49`). Either remove them from catalogue pages, or gate them behind the same banner and move GTM to its own data layer (`dataLayerName`). Otherwise events leak between the two (Probe P1c), and consent defaults pushed into one layer can arrive too late for the other (Probe P1).
8. **CSP.** Add `https://*.analytics.google.com` to `connect-src`, as Google requires for EU collection, and `https://www.googletagmanager.com` to `frame-src`. Add the Ads and Meta hosts only when those integrations ship (section 6). The CSP is not the security boundary here; ID validation is.
9. **Google-side platform setup.** Request a Google tag Developer ID (form linked from the CMS guide). Optionally submit Quicktalog's user docs to Google's "CMS Integration Setup Documentation review" form.

## 2. Q1: Google tag vs Google Tag Manager, IDs, remote configuration, arbitrary code

### 2.1 Definitions (Facts)

- **Google tag.**
  - "The Google tag is a single tag you can add to your website to use Google measurement and advertising products like Google Ads, Google Analytics, Campaign Manager, Display & Video 360, and Search Ads 360... connect the tag to multiple destinations." ([gtag.js install, updated 2026-07-30](https://developers.google.com/tag-platform/gtagjs/install))
  - "The global site tag (gtag.js) is now the Google tag." ([About the Google tag](https://support.google.com/tagmanager/answer/11994839))
  - "The Google tag is currently only accessible and configurable from Google Ads, Google Analytics, and Campaign Manager 360." "Changing settings in your Google tag will affect all associated destinations." (same page)
- **Destination.** "A destination is a Google measurement product account that shares configuration with, and receives data from, a Google tag... Currently, there are 4 destination types: Google Analytics 4 web data stream; Google Ads account; Floodlight configuration...; Merchant Center conversion source." ([Destination definition](https://support.google.com/tagmanager/answer/12324388)) A GTM container is not a destination type.
- **Tag ID.** "A tag ID is an identifier that you put on your page to load a given Google tag. Examples of tag IDs include GT-XXXXXXXXX, G-XXXXXXXXX, and AW-XXXXXXXXX. A single Google tag can have multiple tag IDs... The first ID is the 'main' ID, but the IDs can be used interchangeably." ([Tag ID definition](https://support.google.com/tagmanager/answer/12326985))
- **Prefix table** ([Configure, updated 2026-07-30](https://developers.google.com/tag-platform/gtagjs/configure)):
  - `GT-XXXXXX`: "Each newly created Google tag gets a GT prefix and unique ID."
  - `G-`: "Google tag (legacy prefix)", Google Analytics.
  - `AW-`: "(legacy prefix)", Google Ads.
  - `DC-`: "(legacy prefix)", Floodlight.
  - "Universal Analytics (UA) tags are not compatible with the Google tag (GT)."
  - "if you use Google Ads, your tag now has two IDs: One legacy ID (AW) and one Google tag ID (GT). The tag IDs are interchangeable."
- **Merged IDs.** "A single Google tag can have multiple Tag IDs associated with it, often due to tag merging. Any of these associated IDs can be used in the script src." ([API reference, updated 2026-04-17](https://developers.google.com/tag-platform/gtagjs/reference))
- **GA4 measurement ID.** "The format of a measurement ID in Google Analytics 4 is 'G-' followed by a combination of numbers and letters, such as 'G-PSW1MY7HB4.'" "...the measurement ID is the same ID as the destination ID." ([GA4 Measurement ID](https://support.google.com/analytics/answer/12270356))

### 2.2 ID validation (Facts, then Inference)

- **Fact.** Google's CMS guide says "The tag ID input should accept multiple ID variants using the regular expression pattern `[A-Z]{1,3}\\w{5,}[\w]*`." The raw page source literally contains `\\w` followed by `[\w]`. ([CMS integration guide, updated 2026-07-30](https://developers.google.com/tag-platform/devguides/gtag-integration))
- **Inference.** Google's pattern has no hyphen. Anchored, it rejects every real ID (`G-…` contains `-`); unanchored, it matches a substring of `GTM-ABC1234`. It is not a security control.
- **Recommended anchored patterns** (my choice of length bounds; Google specifies no lengths):
  - GA4: `^G-[A-Z0-9]{4,15}$`
  - Google tag: `^GT-[A-Z0-9]{4,15}$`
  - Google Ads conversion ID: `^AW-[0-9]{6,12}$`. Google's examples are numeric, e.g. `AW-123456789` ([conversions](https://developers.google.com/tag-platform/devguides/conversions)).
  - Ads conversion label, the part after `/`: `^[A-Za-z0-9_-]{1,64}$`, from Google's example label `AbC-D_efG-h12_34-567`.
  - Floodlight `^DC-[0-9]{5,12}$`: not for SMBs; leave out.
  - **Reject** `^GTM-` explicitly, with a message ("Google Tag Manager containers aren't supported; paste the ID that starts with G-").
  - Meta Pixel: digits only, e.g. `^[0-9]{8,20}$`. No official length was found; prior notes used 15-16.

### 2.3 What the tag owner can change remotely without touching Quicktalog (Facts)

From [Configure your Google tag settings](https://support.google.com/tagmanager/answer/12131703):

| Setting | What it does |
|---|---|
| Manage automatic event detection | "Page views (can't disable); Page views on browser history change; Scrolls; Outbound clicks; Form interactions; Video engagement; File downloads" |
| Configure your domains | Cross-domain linker; appends `_gl`. "The changes you make here could affect other Google tags loaded on the same page." |
| Allow user-provided data capabilities | "Automatic detection: Automatically inspect the page for strings that match a pattern for email addresses." "CSS and variable selectors: Specify CSS selectors or JavaScript variables on your page." "User-provided data will be hashed." |
| Define internal traffic | IP rules; adds `traffic_type` |
| List unwanted referrals | Adds `ignore_referrer` |
| Adjust session timeout | Session and engaged-session timers |
| Override cookie settings | **Expiration and update only.** Domain, path and prefix are on-page only. |
| Set consent mode override | "overrides any default consent settings in your website code and instead sets the default to 'denied' for all the regions you choose... useful... in cases where your website builder or content management platform don't allow you to specify the order in which plugins are loaded"; "This setting applies only to the tag for which it's configured" (added 2024-08-28 per [release notes](https://support.google.com/tagmanager/answer/4620708)) |
| Manage default consent settings | "Yes. Automatically mark this data as consented", for tags blocked until consent |

Further facts from [Google tag management](https://support.google.com/tagmanager/answer/12329709):

- The tag owner can **add destinations** ("Add destinations to your Google tag to avoid additional retagging on your site") and **combine tags**.
- "You can't combine a Google tag with a GTM container or legacy tags."
- "your Google tag also processes on-page gtag() commands... If the same Google tag is configured two or more times on the same page, it may cause duplicate data or mixed settings." There is an "Ignore duplicate instances of on-page configuration" option.

**Inference.** A `G-` ID the owner typed for "Analytics" can later also feed a Google Ads destination with remarketing, entirely from Google's UI. The banner therefore always needs the advertising categories, defaulting to denied.

### 2.4 Can a G-/AW-/GT- tag run arbitrary customer JavaScript? (Facts)

- **Container-ID rule** ([Manage tagging behavior using the container ID](https://support.google.com/tagmanager/answer/17070049)):
  - "While Google provides a single, unified Google tag snippet, you can manage your website's data collection and functionality based on the container ID prefix you deploy... The prefix specifies the functionality that the container can execute."
  - `GTM-`: "your container allows all tag types... Third-party scripts; Custom HTML and JavaScript tags you've configured; Data transmission to Google services".
  - "If your container ID starts with product-specific prefixes like G- or AW-, your container is limited to Google tags. In this case, the tag can send data exclusively to Google services. It prevents loading or executing other tag types, offering a more controlled, secure environment."
- **Release note, July 9, 2026** ([release notes](https://support.google.com/tagmanager/answer/4620708)): "This release fixes how Google Tag Manager handles containers loaded using unsupported paths such as /gtag/js or /gtag/destination. Previously, these containers degraded to a restricted state where only Google-provided tags and variables were permitted to run. Moving forward, the ID used to load the container will control this behavior, regardless of the path used. Containers loaded with a GTM-XXXX ID won't be restricted, while product-specific ID types like G-XXXX or AW-XXXX will only permit tags and variables provided by Google."
- **Unification, August 20, 2026** ([Updates to Google tag and Google Tag Manager](https://support.google.com/tagmanager/answer/17079602)):
  - "Your Google tags will be upgraded to fully capable Google Tag Manager containers. Websites that only use Google tag will have the ability to use Tag Manager's interface-driven tagging features, debugging, and version control. This upgrade will not change the in-page behavior of the Google tags."
  - "all new deployment snippets will be the same. Additionally, they will not have the gtag config command. It's recommended that you configure initialization behavior using the `gtm init` trigger."
  - Visual tagging is in beta. Third-party coverage: [Search Engine Land, 2026-08-24](https://searchengineland.com/google-unifies-google-tag-and-tag-manager-adds-no-code-event-tracking-485688).
- **What "Google-provided" includes** ([Restrict tag deployment, updated 2026-07-30](https://developers.google.com/tag-platform/tag-manager/restrict)):
  - Class `google` = "Only capable of running Google hosted scripts and sending pixels to Google."
  - Variables in class `google` include **First Party Cookie**, **DOM Element**, **JavaScript Variable**, Data Layer Variable, URL, HTTP Referrer, Lookup Table, and **RegEx Table**.
  - Triggers in class `google` include Click, Element Visibility, History, JavaScript Error, Scroll, Timer and YouTube.
  - Custom JavaScript Variable is `customScripts`.

**Answer.**
- **No arbitrary JS.** Per Google's current rules, a `G-` or `AW-` ID cannot run Custom HTML, custom JavaScript, or non-Google scripts. `GT-` is not named explicitly; it falls under the article's "other prefixes" heading (Inference: restricted).
- **The bigger exposure is `GTM-` through any path.** A GTM container loaded through `/gtag/js?id=GTM-…` is now **unrestricted**. An unvalidated ID field would therefore let a customer load arbitrary first-party JavaScript just by pasting a `GTM-` ID.

### 2.5 Security implication: Google-provided variables on a shared origin (Inference)

- **Chain of evidence.**
  1. Since 2026-08-20 a `G-` tag is a GTM container that its owner can edit in Tag Manager's UI (2.4).
  2. A `G-` container may run Google-provided tags and variables (2.4), which include **First Party Cookie**, **DOM Element** and **JavaScript Variable** (Restrict doc).
  3. Catalogue pages are first-party on `www.quicktalog.app`, the same origin as the builder.
  4. Supabase's session cookie is "Deliberately NOT `httpOnly`" with path `/` and a 400-day max age (`src/lib/auth/cookie-options.ts:3-21`). It holds the refresh token, per that file's comment.
  5. Clerk's `__session` is "HttpOnly: No" but lives "60 seconds" ([Clerk: how Clerk works](https://clerk.com/docs/guides/how-clerk-works/overview)). Clerk is the current provider by default (`src/lib/auth/provider.ts:6-7`).
- **Consequence.** A malicious or compromised tenant could configure their `G-` container to read a signed-in visitor's non-httpOnly cookies and send them to the tenant's own GA4 property, with no custom code at all. GA4 caps parameter values at 100 characters, but `page_location` allows 1,000, and 25 parameters are allowed ([GA4 limits](https://support.google.com/analytics/answer/9267744)). RegEx Table variables could split a token across parameters. Visitors at risk: other owners, or the catalogue's own owner while signed in.
- **Severity.** Moderate under Clerk (60-second token). High after the Supabase Auth cutover (refresh token).
- **Not verified.** This was not tested: it needs a real GA4 property and Tag Manager UI access. Treat it as a hypothesis to confirm before launch.
- **Mitigations, cheapest first:**
  1. Do not load tenant tags when a Quicktalog session cookie is present (client-side presence check, ISR-safe).
  2. Make every exit from a catalogue page a full navigation (5.4).
  3. Never render tenant tags on `/preview` or `/admin`.
  4. Long term, serve published catalogues from a separate registrable domain. That is the isolation the prior strategy report required only for GTM; this finding extends it to Google tags.
  5. Alternatively, make session cookies httpOnly (a larger auth change).

### 2.6 Other 2024-2026 changes linking the Google tag and GTM (Facts, [release notes](https://support.google.com/tagmanager/answer/4620708))

- **2025-03-10:** "Starting April 10, 2025 containers with Google Ads and Floodlight tags will automatically load a Google tag first... Your Google tag's settings, like user-provided data, will apply to events sent by Tag Manager the same way they apply to events sent by in-page code."
- **2025-03-04:** the Google tag uses service workers to send to server-side GTM. **2024-09-19:** "Google Tag Manager may use a service worker... consult the Content Security Policy guidelines."
- **2025-05-08:** "First-party mode is now Google tag gateway for advertisers... available for everyone." CDN integrations followed: Cloudflare (2024-10 onward), Akamai (2026-01-29), GCP general availability (2026-06-01), Akamai/Fastly in-UI (2026-05-14), and CloudFront (2026-06-03).
- **2026-02-04:** "Google Ads will... automatically collecting a broader range of event data from their websites. Advertisers may notice additional network requests to Google domains."
- **2025-12-11:** new built-in variables for Client ID, Session ID and Session Number, plus an "Analytics Storage" variable "with a custom cookie prefix".

### 2.7 Google tag gateway for advertisers (Facts, then Inference)

- **Facts.**
  - "lets you deploy a Google tag using your own first-party infrastructure, hosted on your website's domain... using your existing CDN, load balancer, or web server." ([Gateway](https://developers.google.com/tag-platform/tag-manager/gateway))
  - "your website loads the Google tag from your first-party domain. When the tag fires, some measurement requests will be sent to Google using your first-party domain." The prerequisite is "A CDN or load balancer that can forward requests to external endpoints." ([Setup guide, updated 2026-09-03](https://developers.google.com/tag-platform/tag-manager/gateway/setup-guide))
  - Duda, a multi-tenant builder, enables the gateway for every tenant's tag: "The Duda infrastructure acts as a proxy and forwards your measurement data to Google." "Google tag gateway for advertisers is not currently compatible with custom code implementations." ([Duda: Set up your Google tag](https://support.google.com/tagmanager/answer/14855153))
- **Inference.** Not for v1. It would route every tenant's measurement through `www.quicktalog.app` (Vercel rewrites), which raises processor-role and abuse questions. It is a possible later upgrade, as Duda shows.

## 3. Q2: Installing gtag.js, config parameters, cookies, data layers, multiple tags

### 3.1 Official snippet and placement (Facts)

- The official snippet ([install](https://developers.google.com/tag-platform/gtagjs/install)):

  ```html
  <script async src="https://www.googletagmanager.com/gtag/js?id=TAG_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'TAG_ID');
  </script>
  ```

- "Place the Google tag snippet immediately after the opening `<head>` HTML tag on every page you want to measure."
- "Google Analytics automatically sends a page_view event when the config command is called, unless you set send_page_view to false." (same page)
- "Important: You should call the config command only once per Google tag. Every subsequent call should use the set command." ([configure](https://developers.google.com/tag-platform/gtagjs/configure))
- The CMS variant adds `gtag('set', 'developer_id.<developer ID>', true);` and "Ideally, the Google tag snippet should appear only once per page. The snippet can accommodate multiple tag IDs. If there's an existing instance of gtag.js, you should add new tag IDs to the existing tag." ([CMS guide](https://developers.google.com/tag-platform/devguides/gtag-integration))
- **Probe.** `developer_id.dQtProbe` goes on the wire as `gdid=dQtProbe`.

### 3.2 Config parameters (Facts, [GA4 config reference, updated 2026-05-14](https://developers.google.com/analytics/devguides/collection/ga4/reference/config) and [customize cookies, updated 2024-11-14](https://developers.google.com/tag-platform/security/guides/customize-cookies))

| Parameter | Behaviour |
|---|---|
| `send_page_view` | "Set to false to prevent the default snippet from sending a page_view." |
| `page_location` | "full URL of the page. Defaults to the user's document.location value." (`page_referrer` defaults to `document.referrer`; `page_title` to `document.title`) |
| `cookie_domain` | "'none' to set the cookie without specifying a domain. Set to 'auto' (the default value) to set the cookie to the top level domain plus one subdomain (eTLD +1)." "The cookie_domain value must be an ancestor of the current domain, otherwise the cookie will not be set... may result in no data being sent." |
| `cookie_path` | "Specifies the subpath used to store the analytics cookie." |
| `cookie_prefix` | "adds example to the beginning of the cookie that it sets (for example _ga becomes example_ga, or _gcl_au becomes example_gcl_au)"; "If the cookie name settings change after users have first visited your site, those visitors will appear as new visitors." |
| `cookie_expires` | Default "two years (63072000 seconds)"; renewed on each hit; 0 makes a session cookie; "Caution: If you set the cookie to expire too quickly, you will inflate your user count." |
| `cookie_flags` | "Appends additional flags to the cookie when set. Flags must be separated by semicolons", e.g. `'SameSite=None;Secure'` |
| `cookie_update` | `true` (default): "update cookies on each page load... effectively never expire"; `false`: "relative to the first time a user visited" |
| set vs config | "If you use the Google tag and have multiple products on a page that share cookies, use gtag('set') commands instead of gtag('config') for your cookie configuration settings." |

**Probe** (cookie names and scopes):

- **Default config:** `_ga` (client ID) and `_ga_QTPROBEB2` (per-property session state). Domain `.catalogue.test` (eTLD+1), path `/`, **Secure=false even on https**, SameSite=Lax.
- **With `cookie_domain:'none', cookie_prefix:'qt_ab12', cookie_path:'/catalogues/p7', cookie_flags:'SameSite=Lax;Secure'`:** `qt_ab12_ga` and `qt_ab12_ga_QTPROBEB2`. Host-only `www.catalogue.test`, path `/catalogues/p7`, Secure. Identical when passed through `gtag('set', {...})` before `config`.
- **Shared client ID:** when two GA4 tags ran on one page they shared one `_ga` (Probe P4).

**Inference (Quicktalog).**
- Without these parameters every tenant's tag, and any Quicktalog GA, would share one `_ga` client ID on `.quicktalog.app`. That is a cross-tenant and cross-controller join key on every subdomain.
- Use a per-catalogue prefix **and** path; the prefix matters because path-scoped cookies with the same name as Quicktalog's `_ga` would collide.
- Add host-only scope and `Secure`.
- Google Ads' `_gcl_*` cookies honour the same prefix.

### 3.3 Custom data-layer name (Facts)

- "Add a query parameter named "l" to the URL to set the new data layer name, for example, `l=myNewName`. Update all instances of dataLayer in the Google tag snippet to the new name." ([data layer, updated 2026-07-22](https://developers.google.com/tag-platform/devguides/datalayer))
- **The same page carries this aside** (fetched with curl):

  > Important: Use only one data layer per page. Only one dataLayer object is supported per page. Google Tag Manager and gtag.js rely on a single, global JavaScript array named window.dataLayer to receive, queue, and process all events and variables in the order they are added... Attempting to use more than one data layer instance, or incorrectly re-initializing the data layer..., can cause significant problems: Tags may not fire... Inconsistent data collection... Data loss... Debugging challenges.

### 3.4 Several Google tags or gtag + GTM on one page (Facts and Probes)

- **Default routing.** "If a send_to parameter is not set, events are routed to the default target group. The default group includes all products and accounts from config commands on the page that have executed prior to the event." "Group names can't contain a dash." ([routing, updated 2026-07-30](https://developers.google.com/tag-platform/gtagjs/routing))
- **Probe P1c.** Two `gtag.js` scripts shared `window.dataLayer`. `gtag('event','no_send_to_event')` was sent to **both** properties.
- **GTM auto-loads a Google tag.** GTM containers with Ads or Floodlight tags auto-load a Google tag (since 2025-04-10, 2.6). If Quicktalog's GTM shares `window.dataLayer` with a tenant tag, tenant events without `send_to` can reach Quicktalog's destinations, and vice versa (Inference).
- **Market warnings** (from prior notes, not re-fetched): Wix warns "Avoid installing Google Tag and Google Tag Manager together, as they may conflict"; Softr warns that combining methods "will cause your tags to trigger twice".
- **Inference (choice):**
  - **Preferred:** the tenant's tag is the **only** Google tag on catalogue pages and uses `window.dataLayer`. Quicktalog's GTM is removed from `/catalogues/<slug>`.
  - **Fallback:** keep Quicktalog's GTM but give it its own layer. The installed component appends `&l=` correctly for GTM (`node_modules/@next/third-parties/dist/google/gtm.js:17`). Push consent defaults into **both** layers before either script runs, and give every platform event an explicit `send_to`. This conflicts with Google's "one data layer per page" aside, so the preferred option is cleaner.

## 4. Q3: Consent Mode v2

### 4.1 Parameters (Facts, [consent overview, updated 2026-07-30](https://developers.google.com/tag-platform/security/concepts/consent-mode))

- `ad_storage`: "storage, such as cookies... related to advertising".
- `ad_user_data`: "consent for sending user data to Google for online advertising purposes".
- `ad_personalization`: "consent for personalized advertising".
- `analytics_storage`: "storage... related to analytics, for example, visit duration".
- `functionality_storage`, `personalization_storage`, `security_storage`.
- The gtag API reference lists the first four plus `wait_for_update` ("any positive integer", milliseconds) ([reference](https://developers.google.com/tag-platform/gtagjs/reference)).
- Google Ads: "The ad_user_data consent type is required for measurement use cases, such as enhanced conversions and tag-based conversion tracking." "Both ad_user_data and ad_personalization need to be granted to enable personalized advertising." ([Ads consent reference](https://support.google.com/google-ads/answer/13802165))

### 4.2 Commands and ordering (Facts, [set up consent mode, updated 2026-07-30](https://developers.google.com/tag-platform/security/guides/consent))

- "call the gtag('consent', 'default', ...) command on every page of your site before any commands that send measurement data (such as config or event)."
- "By default, no consent mode values are set."
- "The order of the code here is vital. If your consent code is called out of order, consent defaults won't work."
- "Since consent mode doesn't save consent choices, update the consent status as soon as a user interacts with your consent management solution. After a user grants consent, persist their choice and call the update command accordingly on subsequent pages."
- `wait_for_update`: "If your banner loads asynchronously, it might not always run before your Google tags... specify wait_for_update along with a millisecond value."
- Common issue: "When a page loads with consent denied and then reloads with consent granted... in Google Analytics, many sessions with consent could be missing a session_start event. To avoid this issue, call the update command whenever a user's consent state changes."

### 4.3 Region-specific defaults (Facts, same page)

- Regions use ISO 3166-2. "A gtag consent default command without a region parameter sets the default for all visitors not covered by another region-specific command."
- "Most specific parameter takes precedence."
- "It is best practice to scope the default consent settings to the regions where you are surfacing consent banners."
- **Inference.** With basic mode, `gtag.js` is not loaded before consent, so Google-evaluated `region` defaults never apply. The banner then shows to everyone, unless Quicktalog adds its own geo hint (a decision).

### 4.4 Basic vs advanced, and what is sent when denied (Facts, plus Probe)

- **Basic.** "prevent Google tags from loading until a user interacts with a consent banner... when the user doesn't consent, no data is transferred to Google at all – not even the consent status... conversion modeling in Ads is then based on a general model." ([overview](https://developers.google.com/tag-platform/security/concepts/consent-mode))
- **Advanced.** "Google tags load when a user opens the website... While consent is denied, the Google tags send measurements without cookies"; "advertiser-specific model".
- **Ping contents.** "Pings can include: Timestamp, User Agent, Referrer... An indication for whether or not the current page or a prior page in the user's navigation on the site included ad-click information... Boolean information about the consent state; Random number generated on each page load." GA4 adds "Information about the consent platform used by the site owner (e.g., Developer ID)".
  - "cookieless pings, as part of regular HTTP/browser communication, may include... user agent, screen resolution, IP address. Note that Google Analytics does not store or log IP addresses."
  - "If an advertiser sets other fields, such as user_id and custom dimensions, they will be sent normally." ([GA consent](https://support.google.com/analytics/answer/9976101))
- **Denied-state behaviour per type** (overview table):
  - `analytics_storage` denied: "Won't read or write first-party analytics cookies... Measurements without 3rd-party cookies... will be sent to Google Analytics."
  - `ad_storage` denied: no ad cookies; requests via "a different domain (e.g. pagead2.googlesyndication.com)"; "Google signals features won't accumulate data"; "Ads products truncate IP addresses"; "Full page URLs are collected".
  - `ad_user_data` denied: no `user_id` and no enhanced-conversion data for ads.
  - `ad_personalization` denied: no remarketing.
- **Wire parameters.** "consent mode parameters are translated into HTTP request parameters such as dma, gcd, and gcs. Consent to Google services is encoded using dma_cps... The gcs parameter is used to transmit the ad_storage and analytics_storage parameters... The gcd parameter is always sent to Google services, regardless of whether consent mode is activated or not." Google adds that these "may be subject to change".
- **Probe values** (`/g/collect`, POST to `www.google-analytics.com`):

  | State | `gcs` | `gcd` | `npa` | Cookies |
  |---|---|---|---|---|
  | No consent mode | absent | `13l3l3l3l1l1` | 0 | set |
  | All denied (advanced) | `G100` | `13p3p3p3p5l1` | 1 | none; `page_view` still sent with full URL and a per-page random `cid` |
  | Analytics granted only | `G101` | `13p3r3p3p5l1` | 1 | analytics cookies set |
  | All granted | `G111` | `13r3r3r3r5l1` | 0 | set |

- **Google's platform guidance favours advanced.** "The expected outcome is that customers get at least the gtag('consent', 'update' {...}) call integrated with no action required by the customer... include the state in network requests to Google (via the parameter &gcs). Additional implementation steps would be to deploy or to assist advertisers in deploying (e.g., via a UI) the gtag('consent', default' {...}) state and unblocking Google tags (i.e., no consent-based conditional firing)." ([CMS guide](https://developers.google.com/tag-platform/devguides/gtag-integration)) Also: "Load Google tags in all cases, not only if the user consents." ([GA consent](https://support.google.com/analytics/answer/9976101))
- **Inference (legal tension).** The prior notes cite EDPB Guidelines 2/2023: JavaScript-constructed tracking requests fall under ePrivacy Art. 5(3). Advanced-mode pings before consent are therefore a legal risk in the EU even without cookies. For a platform carrying many EU SMBs, basic mode is the conservative default, with advanced as a possible owner opt-in after legal review.

### 4.5 `url_passthrough` and `ads_data_redaction` (Facts, [consent guide](https://developers.google.com/tag-platform/security/guides/consent))

- **`url_passthrough`.** Conditions: "Your Google tag is consent-aware and present on the page. The advertiser has enabled the URL passthrough feature. Consent mode is implemented on the page. The outgoing link refers to the same domain as the current page's domain. A GCLID or DCLID is present in the URL (Google Ads and Floodlight tags only)." Set with `gtag('set', 'url_passthrough', true)` "before any config commands". It appends `gclid`, `dclid`, `gclsrc`, `_gl` and `wbraid` to same-domain links.
  - **Inference.** Leave it off: same-domain links from a catalogue go to other Quicktalog pages.
- **`ads_data_redaction`.** "When ads_data_redaction is true and ad_storage is denied, ad click identifiers sent in network requests by Google Ads and Floodlight tags will be redacted. Network requests will also be sent through a domain without third-party cookies, such as pagead2.googlesyndication.com."
  - **Inference.** Turn it on by default.

### 4.6 Is consent state shared across Google tags with different data layers? (Probes; Google documents nothing explicit)

- **P2.** A `denied` default pushed **only** into `custLayer` (tag B, `&l=custLayer`) also governed tag A on `window.dataLayer`: both sent `gcs=G100` and no cookies were set.
- **P4.** An `update` to granted pushed **only** into `dataLayer` led tag B to write its `_ga_QTPROBEB2` cookie.
- **P1 (ordering leak).** The denied default lived only in `dataLayer`, and tag B's script happened to execute first. Tag B sent an unconsented `page_view` (no `gcs`) and set `_ga` cookies.
- **P1b.** Same as P1, but with tag A's script fully loaded before tag B was injected. Tag B honoured the global denied state.
- **Conclusion.** State is page-global, but it only exists once the script that owns that layer has processed the command. The design rule: push `consent default` (and later `update`) into every Google data layer, before any `config` and before any `gtag.js`/`gtm.js` executes.
- **Array form is ignored.** `dataLayer.push(['consent','default',{...}])` (an array, not an Arguments object) was **ignored**: no `gcs`, cookies set. This corrects the example form in PLAN.md §3.2 (line 138). Use the `gtag()` function.
- **Quicktalog's current push does nothing for gtag.** `{event:'consent_default', consent:{...}}` (`src/utils/cookies.ts:52-71`) was **ignored** by `gtag.js`: no `gcs`, cookies set. Confirmed: it is not consent mode for a Google tag.

### 4.7 EEA, UK and Switzerland requirements and dates (Facts)

- **EU user consent policy.** "you must ensure that certain disclosures are given to, and consents obtained from, end users in the European Economic Area, the UK and Switzerland. If you fail to comply with this policy, we may limit or suspend your use of the Google product."
  - Duties: consent to "the use of cookies or other local storage where legally required; and the collection, sharing, and use of personal data for personalization of ads"; "retain records of consent given by end users"; "provide end users with clear instructions for revocation of consent"; "clearly identify each party that may collect, receive, or use end users' personal data."
  - Source: [EU user consent policy](https://www.google.com/about/company/user-consent-policy/).
- **Switzerland.** "From July 31, 2024, partners using Google advertising products will be required to obtain Swiss users' consent..." ([AdSense announcement, 2024-05-03](https://support.google.com/adsense/answer/14893312))
- **Advertisers.** "Advertisers must adhere to the EU UCP to use ad personalization and for measurement when using: Tags that send data to Google (websites)... To keep using applicable tags/SDKs for measurement, and for ad personalization, and remarketing features, you must collect consent... from end users based in the EEA and share consent signals with Google." "If you maintain your own banner, implement consent mode v2." ([EEA consent updates](https://support.google.com/tagmanager/answer/13695607))
- **GA4 consequence.** "If you are using Analytics data with a Google service, such as Google Ads, Play, Display & Video 360 or others, and you take no action, only end users outside the EEA will be included in audiences used by your linked advertising products starting early March, 2024." "For ads measurement consent, Analytics expects the ad_user_data consent mode parameter." ([GA4 verify consent](https://support.google.com/analytics/answer/14275483))
- **Google Ads consequences.**
  - Customer Match audiences degrade "from March 2024" without updated APIs ([Ads EEA resources](https://support.google.com/google-ads/answer/14625550)).
  - With `ad_user_data` denied, "Click-ID keyed conversion data export to Ads platform is limited" ([Ads consent reference](https://support.google.com/google-ads/answer/13802165)).
  - For App ads: "The ad_user_data parameter is required for regions that require end-user consent: the European Economic Area (EEA), the United Kingdom, and Switzerland." ([Ads: verify consent signals](https://support.google.com/google-ads/answer/16147066))
- **Inference.** Serbia is outside the EEA, UK and Switzerland, so Google's EU UCP does not cover Serbian visitors. Serbian law (ZZPL) is a separate legal question.

### 4.8 Certified CMP: publishers only (Facts)

- **Publishers.** "partners using our publisher products—Google AdSense, Ad Manager, or AdMob—are required to use a consent management platform (CMP) that has been certified by Google and integrates with the IAB's TCF when serving personalized ads... EEA and UK: As of 16 January 2024... Switzerland: As of 31 July 2024." ([AdSense CMP requirement](https://support.google.com/adsense/answer/13554116))
- **Advertisers.** "Please note: Nothing prevents advertisers from using a CMP that is not a partner (yet) to adopt Consent Mode and meet our EU UCP requirements." ([CMP Partner Program](https://cmppartnerprogram.withgoogle.com/)) Google's EEA pages give custom-banner owners the instruction "implement consent mode v2".
- **Conclusion.** Quicktalog may build its own banner for GA4 and Ads measurement. Certification would only matter if catalogues ever served AdSense or Ad Manager ads.
- **TCF caveat.** "When your users deny consent with a consent solution that uses the TCF, Google Analytics properties aren't able to model data." ([GA consent](https://support.google.com/analytics/answer/9976101))

## 5. Q4: Next.js

### 5.1 `@next/third-parties` (Facts)

- **Docs** ([third-party libraries, updated June 1, 2026, Next 16.3.8](https://nextjs.org/docs/app/guides/third-party-libraries)):
  - "@next/third-parties is currently an experimental library under active development."
  - GTM and GA components each fetch their scripts "after hydration occurs on the page".
  - GA props: `gaId`, `dataLayerName`, `debugMode`, `nonce`.
  - GTM props: `gtmId`, `gtmScriptUrl`, `dataLayer`, `dataLayerName`, `auth`, `preview`. "gtmId can be omitted when gtmScriptUrl is provided to support Google tag gateway."
  - `sendGAEvent(...)` and `sendGTMEvent(...)` push to the data layer.
  - "Google Analytics automatically tracks pageviews when the browser history state changes"; "If you decide to manually send pageview events, make sure to disable the default pageview measurement."
  - **No mention of consent mode** anywhere on the page.
- **Installed source, version 15.5.26** (`node_modules/@next/third-parties/package.json`):
  - `GoogleAnalytics` renders one inline `next/script` with `id="_next-ga-init"` that runs `gtag('js')` and `gtag('config', gaId[, {debug_mode:true}])` immediately, plus `id="_next-ga"` with `src=https://www.googletagmanager.com/gtag/js?id=${gaId}`. **The URL has no `&l=`** (`node_modules/@next/third-parties/dist/google/ga.js:30-37`).
  - **Probe P5.** A replica with `dataLayerName='custLayer'` sent zero hits. The component's custom data-layer name is broken, because `gtag.js` keeps reading `window.dataLayer`.
  - No consent default is emitted, so on its own the component fires `config` with no consent state.
  - `next/script` de-duplicates by `id || src` (`node_modules/next/dist/client/script.js:71-75`), so a second `<GoogleAnalytics>` on the same page would be skipped (Inference: one GA ID per page with this component).
  - `GoogleTagManager` adds `&l=` correctly (`node_modules/@next/third-parties/dist/google/gtm.js:17`).
- **Inference.** Do not use `<GoogleAnalytics>` for tenant tags. Use a small dedicated component that controls the consent-first order, a unique `id`, `send_to` groups and the cookie parameters.

### 5.2 `next/script` strategies (Facts)

- **v16 docs** ([Script](https://nextjs.org/docs/app/api-reference/components/script)):
  - "Scripts with the beforeInteractive strategy must be placed inside a root layout, such as app/layout.tsx or app/[locale]/layout.tsx".
  - These scripts are "injected inside the head" and "run once per document load".
  - The examples include "Cookie consent managers".
- **v15 docs** ([Script, v15](https://nextjs.org/docs/15/app/api-reference/components/script)): "beforeInteractive scripts must be placed inside the root layout (app/layout.tsx)".
- `afterInteractive` (the default) "can be placed inside of any page or layout and will only load and execute when that page... is opened". The listed candidates are "Tag managers, Analytics".
- `worker` "is not yet stable and does not yet work with the App Router".
- **Inference.** A per-catalogue init script must be `afterInteractive`, or a client component that injects it. All consent and config commands live in one script, so the order is guaranteed regardless of timing.

### 5.3 CSP nonces vs ISR (Facts, [Next.js CSP guide, v16.3.7, lastUpdated 2026-03-20](https://nextjs.org/docs/app/guides/content-security-policy))

- "you must use dynamic rendering to add nonces."
- "When you use nonces in your CSP, all pages must be dynamically rendered... Static optimization and Incremental Static Regeneration (ISR) are disabled; Pages cannot be cached by CDNs without additional configuration; Partial Prerendering (PPR) is incompatible."
- Subresource Integrity is "experimental" and "allows you to maintain static generation while still having a strict CSP". Its limitation: "Build-time only: Cannot handle dynamically generated scripts".
- The "Without Nonces" example uses `script-src 'self' 'unsafe-inline'`.
- **Inference.** On the ISR catalogue page Quicktalog keeps `'unsafe-inline'` for Next.js's own inline scripts. A nonce or hash for per-catalogue inline code is not available, and tenant-tag security cannot rely on the CSP.

### 5.4 App Router soft navigation keeps a tenant tag alive (Inference from code)

- **Same-origin links on the public catalogue use `next/link`:**
  - "Create Your Digital Catalog" to `/auth?mode=signup` (`src/components/catalogue/view/components/DefaultActions.tsx:27-30`).
  - `/privacy-policy`, `/terms-and-conditions` and `/refund-policy` (`src/components/catalogue/view/components/LegalLinks.tsx:19-39`).
  - Any internal `SmartLink`, including the header logo, which falls back to `/` (`src/components/general/SmartLink.tsx:54-57`; `src/components/catalogue/view/CatalogueHeader.tsx:157-161`).
- **Consequence.** A client-side navigation keeps the JavaScript context, so a loaded `gtag.js` keeps running. With enhanced measurement's history listener (7.1) it records `/auth?mode=signup` and similar pages in the **tenant's** property, and it stays active on Quicktalog's own pages, which compounds 2.5.
- **Fix.** Make these links full navigations (plain `<a>`) on pages with tenant tags. On unmount, set `window['ga-disable-<ID>']=true`, which Google documents as stopping GA from setting cookies or sending data ([privacy controls](https://developers.google.com/tag-platform/security/guides/privacy)).

## 6. Q5: Content Security Policy

### 6.1 Google's official per-product tables (Facts, [CSP guide, updated 2026-09-18](https://developers.google.com/tag-platform/security/guides/csp))

- **Inline code.**
  - Recommended: a nonce in `script-src-elem`; "Tag Manager will then propagate the nonce to any scripts that it adds to the page." Hashes are also accepted.
  - If neither is feasible, `'unsafe-inline'` in `script-src-elem` is the documented fallback. That fallback also needs `img-src https://www.googletagmanager.com` and `connect-src https://www.googletagmanager.com https://www.google.com`.
- **`'unsafe-eval'`** is needed only because GTM "Custom JavaScript variables... will evaluate to undefined in the presence of a CSP unless the 'unsafe-eval' directive is given". `gtag.js` itself is not listed as needing it.
- **Google Analytics:**
  - `script-src-elem https://www.googletagmanager.com`
  - `img-src https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://*.google.<TLD> https://*.g.doubleclick.net`
  - `connect-src https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://*.google.<TLD> https://*.g.doubleclick.net https://pagead2.googlesyndication.com`
  - `frame-src https://www.googletagmanager.com`
- **GA without Ads features:**
  - `script-src-elem https://www.googletagmanager.com`
  - `img-src https://www.googletagmanager.com https://*.google-analytics.com`
  - `connect-src https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com`
- **Google Ads:**
  - `script-src-elem https://www.googletagmanager.com https://www.googleadservices.com https://www.google.com`
  - `img-src ... https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://www.google.<TLD>`
  - `connect-src ... https://www.googleadservices.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://www.google.com https://www.google.<TLD> https://ad.doubleclick.net`
  - `frame-src https://www.googletagmanager.com`
- **Ads user data:** `connect-src https://www.google.com`; `frame-src https://www.googletagmanager.com`.
- **Service worker** ("enhanced match, user data beacons, and Ads conversions"): `frame-src https://www.googletagmanager.com`.
- **EU collection** ([EU, Switzerland or UK-focused data](https://support.google.com/analytics/answer/12017362)): "If you currently use a Content Security Policy (CSP), update your configurations (img-src and connection-src directives) to allow... *.google-analytics.com *.analytics.google.com."
- **Debugging.** Tag Assistant lists CSP-blocked resources under "Page issues".
- **Meta Pixel** ([advanced](https://developers.facebook.com/documentation/meta-pixel/advanced.md)): "allow JavaScript to load from https://connect.facebook.net... The Pixel load scripts from two paths: /en_US/fbevents.js and /signals/config/{pixelID}?v={version}." Beacons go to `https://www.facebook.com/tr` (base code `noscript`).

### 6.2 Quicktalog's current policy, compared (Facts from `next.config.ts`)

- The header is `Content-Security-Policy-Report-Only` on `/:path*` (`next.config.ts:64-69`), with no reporting endpoint in the directive list (`next.config.ts:48-62`).
- `script-src` has `'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://www.google-analytics.com ...` (`next.config.ts:50`).
- `connect-src` has `https://*.google-analytics.com https://*.googletagmanager.com` but **not** `https://*.analytics.google.com` (`next.config.ts:55`).
- `frame-src` lacks `https://www.googletagmanager.com` (`next.config.ts:56`).
- `img-src` is `'self' data: blob: https:` (`next.config.ts:53`).
- **Inference.**
  - For GA4: add `https://*.analytics.google.com` to `connect-src` and `https://www.googletagmanager.com` to `frame-src`.
  - For Ads: add `https://www.googleadservices.com https://www.google.com` to `script-src`, and the Ads `connect-src` hosts.
  - The `*.google.<TLD>` entries cannot be expressed as a CSP wildcard over TLDs. Country domains would need listing, or acceptance of report-only noise.
  - For Meta: add `https://connect.facebook.net` (`script-src`) and `https://www.facebook.com` (`connect-src`).

## 7. Q6: GA4 specifics for a hosted, mostly single-page catalogue

### 7.1 Enhanced measurement (Facts, [enhanced measurement events](https://support.google.com/analytics/answer/9216061))

- **`page_view`.** "each time the page loads or the browser history state is changed by the active site... An advanced setting on this option controls whether the event is sent based on browser-history events. This measurement option listens for pushState, popState, and replaceState."
- **`scroll`.** At 90% depth.
- **Outbound `click`.** "each time a user clicks a link that leads away from the current domain"; parameters `link_classes, link_domain, link_id, link_url, outbound`.
- **`view_search_results`.** "presence of one of the following 5 query parameters in the URL: q, s, search, query, keyword".
- **Others.** `video_*` (YouTube with JS API), `file_download` (pdf and others), `form_start`/`form_submit`.
- **PII.** "You're required to ensure that no personally identifiable information is collected."
- **Facts (code).** Search writes `?q=` through `router.replace` on every change (`src/components/catalogue/view/CatalogueContent.tsx:88-95`; sync at `:97-103`).
- **Inference.**
  - With history-based page views on (the default), each keystroke can create a `page_view`, plus `view_search_results` because `q` is a default key, in the tenant's property. Debounce URL writes, for example on pause or submit, and send one `search` event.
  - The modal and section toggles do not change the URL, and no hash anchors exist on the public catalogue (grep).
  - `tel:` and `mailto:` links (`CatalogueHeader.tsx:89,101`; `Contact.tsx:22,40`) are not "another website", so outbound-click detection is unlikely to capture them. Send explicit events.
- **Probe.** Not observable with fake IDs (no stream settings).
- **Google's SPA guidance.** "Browser history changes (recommended): If your SPA uses the History API, specifically the pushState() and replaceState() method..." ([GA4 SPA](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications))

### 7.2 Recommended events relevant to SMB catalogues (Facts)

- **All properties:** `generate_lead` ("submits a form or a request for information"), `search`, `select_content`, `share`, `sign_up`, `login`, `purchase`.
- **Online sales:** `select_item` ("selects an item from a list of items or offerings"), `view_item`, `view_item_list`, `select_promotion`, `view_promotion`.
- **Lead generation:** `generate_lead`, `qualify_lead`, `working_lead` ("contacts or is contacted by a representative"), `close_convert_lead`, and others.
- **Source:** [GA4 recommended events](https://support.google.com/analytics/answer/9267735).
- **Parameters** ([events reference, updated 2026-09-16](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag)):
  - `search{search_term}` (required).
  - `select_content{content_type, content_id}`; `content_id` "must include at least one non-numeric character".
  - `generate_lead{currency, value, lead_source}`; it "measures when a lead has been generated (for example, through a form)".
  - `select_item{item_list_id, item_list_name, items[]}`.
  - `view_item{currency, value, items}`.
- **Google's CMS guide asks platforms to send events by default:**
  - "You should send rich event data from the customer's website to their Google account with no action required by the customer."
  - "Set up at least 8 core events": `view_item_list`, `add_to_cart`, `begin_checkout`, `purchase`, `sign_up`, `generate_lead`, `subscribe`, `book_appointment`.
  - "Attach the ID to every event": `'developer_id.<developer ID>': true`.
- **Limits** ([GA4 limits](https://support.google.com/analytics/answer/9267744)): 25 parameters per event; parameter values up to 100 characters; event names up to 40 characters.

### 7.3 How the platform sends events into the customer's property (Inference, grounded in 3.4 and 7.2)

- **Helper:** `track(name, params) => gtag('event', name, {...params, send_to: 'qt_tenant', 'developer_id.<id>': true})`. It is a no-op unless the tenant tag loaded.
- **Proposed mapping:**

| Catalogue moment | Event | Parameters |
|---|---|---|
| Section rendered or expanded | `view_item_list` | `item_list_id/name` = section, `items[]` |
| Item tapped, modal opened (`CatalogueContent.tsx:152,200`) | `select_item`, then `view_item` | item id/name/price, currency |
| Search, debounced | `search` | `search_term` |
| Tap call, WhatsApp, Viber, email or directions | `generate_lead` | `lead_source: 'phone'\|'whatsapp'\|'viber'\|'email'\|'directions'` |
| Book button | `book_appointment` | Named in Google's CMS list |
| Social or share links | `select_content` or `share` | |

- **Alternative for contact taps.** Custom names such as `contact_phone` are clearer in reports but lose the "recommended" status. This is the founder's call.
- **Key events.** Owners mark key events in GA4 and can import them into Google Ads. Native Ads conversions need `send_to: 'AW-ID/LABEL'` per action ([conversions](https://developers.google.com/tag-platform/devguides/conversions)), so they belong in a later version.

### 7.4 UTMs (Facts, [URL builders](https://support.google.com/analytics/answer/10917952))

- Parameters: `utm_id, utm_source, utm_medium, utm_campaign, utm_source_platform, utm_term, utm_content, utm_creative_format, utm_marketing_tactic`. "you should always use utm_source, utm_medium, and utm_campaign."
- UTMs are omitted from "Page path + query string" and land in Page location.
- **Inference.** The search handler preserves the other query parameters, because it copies the existing `searchParams` (`CatalogueContent.tsx:90`). QR codes could carry `utm_source=qr&utm_medium=table`. Under basic mode the first `page_view`, sent right after consent, still carries the landing URL with UTMs.

### 7.5 Debugging (Facts)

- **Tag Assistant.** "check if your Google tag ID appears in the Google tags found header." ([install](https://developers.google.com/tag-platform/gtagjs/install))
- **DebugView.** "use the Google Tag Assistant... Tag Assistant adds a parameter to your website address to enable debug mode"; `gtag('config','G-…',{'debug_mode':true})`; "To disable debug mode, exclude the 'debug_mode' parameter; setting the parameter to false doesn't disable debug mode." ([DebugView](https://support.google.com/analytics/answer/7201382))
- **Consent and DebugView.** "Events are not visible in debug mode... if you've implemented consent mode and users have not given consent for Analytics cookies." (same page)
- **Inference.** The owner's test instructions must say "accept analytics cookies in the banner", plus "signed out" because of the guard in 1.3.

### 7.6 IP handling, EU processing and Google signals (Facts)

- **IP.** "In Google Analytics 4, IP masking is not necessary since IP addresses are not logged or stored." ([IP masking](https://support.google.com/analytics/answer/2763052))
- **EU, Switzerland and UK users** ([EU-focused data](https://support.google.com/analytics/answer/12017362)):
  - "Google Analytics does not log or store IP addresses from EU, Switzerland, or UK users."
  - "Google Analytics collects all data from EU, Switzerland, or UK-based devices (based on IP-geo lookup) through domains and on servers based in the EU, Switzerland, or UK."
  - Per-region switches exist for Google signals and for granular location and device data. Disabling the latter means "modeled-conversion volume is significantly reduced".
- **Google signals.** "reporting data is enriched for users who have turned on Ads Personalization and signed into their Google accounts"; "By default, Google signed-in data expires after 26 months." ([Google signals](https://support.google.com/analytics/answer/9445345))
- **On-page overrides** ([privacy controls](https://developers.google.com/tag-platform/security/guides/privacy)):
  - `allow_google_signals: false`: "events... will not be used for ads personalization and demographics and interests reports".
  - `allow_ad_personalization_signals: false`: adds `npa=1`.
  - `window['ga-disable-<ID>'] = true` stops GA.

## 8. Q7: Meta Pixel (brief, Facts)

- **ID.** A numeric Pixel ID inserted twice in the base code: `fbq('init', '{your-pixel-id-goes-here}')` and the `noscript` image. The script is `https://connect.facebook.net/en_US/fbevents.js`; the beacon is `https://www.facebook.com/tr?id=…&ev=PageView&noscript=1`. ([get started](https://developers.facebook.com/documentation/meta-pixel/get-started.md)) No official length found.
- **Consent.** "Use the following API to pause sending Pixel fires to Facebook, and once cookie consent is granted, send Pixel fires to Facebook. You need to call revoke on every page." `fbq('consent','revoke')` goes before `init`; `fbq('consent','grant')` follows affirmative consent. ([GDPR, updated Jul 14, 2023](https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr))
- **Data received:** HTTP headers (IP, page location, referrer), the Pixel ID and Facebook cookie, button-click data, optional values, and form field names.
- **Automatic configuration** "will send button click and page metadata (such as... Opengraph or Schema.org)". It can be disabled with `fbq('set','autoConfig',false,'ID')`. With multiple pixels, use `trackSingle` and `trackSingleCustom`. ([advanced](https://developers.facebook.com/documentation/meta-pixel/advanced.md))
- **CSP.** `connect.facebook.net`, using the paths above.

## 9. Quicktalog code facts used above (verified 2026-10-01)

- **Root layout.** `src/app/layout.tsx:46-49` puts `<ClarityScript />` and `<GoogleTagManager gtmId={process.env.GTM_ID} />` in the root `<head>`, with no `dataLayerName`, so it uses `window.dataLayer`.
- **Published page.** `src/app/catalogues/[name]/page.tsx:11` sets `revalidate = 86400`; `:114-123` fetches with tag `catalogue-${name}`; `:143-144` renders `<Catalogue item={item} type="view" />`.
- **Preview.** `src/app/catalogues/[name]/preview/page.tsx:10` is `force-dynamic`; `:26-28` redirects unauthenticated users; `:36` renders the **same** `<Catalogue>` component. Tracking must therefore be mounted by the published page, not inside `Catalogue`.
- **Cookie banner.** `src/components/general/CookieBanner.tsx:22` calls `useUserContext()`; `:28-37` returns early when the path includes `/catalogues/`.
- **Consent utilities.** `src/utils/cookies.ts:36-50` and `:52-71` push the custom events `consent_update` and `consent_default`. Probe 4 shows `gtag.js` ignores them.
- **CSP.** `next.config.ts:37-46` (comment), `:48-62` (directives), `:64-69` (Report-Only header).
- **Search.** `src/components/catalogue/view/CatalogueContent.tsx:76-103` writes and syncs `?q=`.
- **Soft-navigation links.** `src/components/catalogue/view/components/DefaultActions.tsx:27-30`, `.../LegalLinks.tsx:19-39`, `src/components/general/SmartLink.tsx:40-57`, `src/components/catalogue/view/CatalogueHeader.tsx:157-161,196-205`.
- **Auth.** `src/lib/auth/cookie-options.ts:3-21` (Supabase cookies not httpOnly, path `/`, 400 days, host-only). `src/lib/auth/provider.ts:6-7` (Clerk by default). `package.json:25` (`@clerk/nextjs`), `:51` (`@supabase/ssr`).
- **Builder.** `src/components/catalogue/inputs/sidebar/index.tsx:52-82` holds the tab registry (General, Header, Footer, Appearance).
- **Plans.** `../quicktalog-packages/src/constants/pricing.ts`: Starter, Basic, Pro, Growth, Premium (names at lines 6, 39, 71, 103, 135). `analytics` is "Basic" or "Advanced" for the built-in stats; there is no integrations flag (package version 1.66.0).
- **Third-party scripts.** `node_modules/@next/third-parties/dist/google/ga.js:13-18,30-49`, `.../gtm.js:13-38`, and `node_modules/next/dist/client/script.js:71-75`.
- **Prior plan.** PLAN.md §3.2 (`.claude/plans/active/2026-09-25-content-blocks-expansion/PLAN.md:99-147`) is consistent with this research, except the array-form consent example (line 138) and its silence on the August 2026 container change.

## 10. Open questions and gaps

1. **Exfiltration hypothesis (2.5).** Can an August-2026-upgraded `G-` container actually publish a GA4 event tag whose parameter uses a First Party Cookie variable, and does it run when loaded through `gtag/js?id=G-…`? This needs a real GA4 property and Tag Manager UI. It decides between "session-cookie guard is enough" and "separate domain needed before any tenant tag".
2. **Init-trigger interaction.** How do upgraded containers that fire on the `gtm init` trigger (no `config` needed) interact with on-page `gtag('set', cookie_*)` and `config` parameters? Google's `url_passthrough` example ("set... before the GTM install snippet") suggests pre-snippet `set` commands are honoured. Unverified.
3. **What Quicktalog's own GTM container fires on catalogue pages** (GA4 or Ads tags?) is not visible in code. It decides whether the shared-data-layer leakage in 3.4 is live today.
4. **Legal.** Basic vs advanced consent mode for EU SMB tenants. How to meet the EU UCP duty to "retain records of consent" (an anonymous consent log API?). Serbian-law requirements for Serbian visitors. Processor vs joint-controller role. Banner wording naming the business and Google.
5. **Developer ID.** Whether Google will issue Quicktalog a Google tag Developer ID, and its turnaround; the form is linked from the CMS guide.
6. **`GT-` IDs.** Not explicitly named in the container-ID article. Confirm that they are restricted like `G-` and `AW-` before accepting them.
7. **Region-scoped defaults** need `gtag.js` loaded, so they don't apply in basic mode. Whether to show the banner worldwide or only in some regions (geo hint) is a product decision.
8. **Contact-tap events.** `generate_lead` with `lead_source`, or custom event names (founder's call).
9. **No upstream report** of the missing `&l=` in `@next/third-parties` `GoogleAnalytics` was found in a brief search. It was verified only from local source and Probe P5.
10. **Browser coverage.** Safari and Firefox were not tested. All probes used Chromium and the `gtag.js` served on 2026-10-01; Google can change `gtag.js` at any time.

## 11. Sources (fetched 2026-10-01)

Google Tag Platform (developers.google.com):
- https://developers.google.com/tag-platform/gtagjs/install (updated 2026-07-30)
- https://developers.google.com/tag-platform/gtagjs/reference (updated 2026-04-17)
- https://developers.google.com/tag-platform/gtagjs/configure (updated 2026-07-30)
- https://developers.google.com/tag-platform/gtagjs/routing (updated 2026-07-30)
- https://developers.google.com/tag-platform/devguides/datalayer (updated 2026-07-22)
- https://developers.google.com/tag-platform/devguides/gtag-integration (updated 2026-07-30)
- https://developers.google.com/tag-platform/devguides/conversions
- https://developers.google.com/tag-platform/security/guides/consent (updated 2026-07-30)
- https://developers.google.com/tag-platform/security/concepts/consent-mode (updated 2026-07-30)
- https://developers.google.com/tag-platform/tag-manager/templates/consent-apis (updated 2026-07-30)
- https://developers.google.com/tag-platform/security/guides/csp (updated 2026-09-18)
- https://developers.google.com/tag-platform/security/guides/customize-cookies (updated 2024-11-14)
- https://developers.google.com/tag-platform/security/guides/privacy
- https://developers.google.com/tag-platform/tag-manager/restrict (updated 2026-07-30)
- https://developers.google.com/tag-platform/tag-manager/gateway and /gateway/setup-guide (updated 2026-09-03)
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config (updated 2026-05-14)
- https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag (updated 2026-09-16)
- https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications

Google Help (support.google.com and google.com):
- Tag Manager: 11994839, 12326985, 12324388, 12329709, 12131703, 4620708 (release notes), 17070049 (container ID), 17079602 (Aug 20 2026 update), 13695607 (EEA), 14855153 (Duda)
- Analytics: 9216061, 9267735, 7201382, 2763052, 12017362, 9445345, 10917952, 12270356, 9976101, 14275483, 9267744
- Google Ads: 13802165, 14625550, 16147066
- AdSense: 13554116, 14893312
- https://www.google.com/about/company/user-consent-policy/
- https://cmppartnerprogram.withgoogle.com/

Next.js:
- https://nextjs.org/docs/app/guides/third-party-libraries (updated June 1 2026)
- https://nextjs.org/docs/app/api-reference/components/script and https://nextjs.org/docs/15/app/api-reference/components/script
- https://nextjs.org/docs/app/guides/content-security-policy (lastUpdated 2026-03-20)

Meta:
- https://developers.facebook.com/documentation/meta-pixel/get-started.md
- https://developers.facebook.com/documentation/meta-pixel/advanced.md
- https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr

Other:
- Clerk: https://clerk.com/docs/guides/how-clerk-works/overview
- Search Engine Land (third-party news), 2026-08-24: https://searchengineland.com/google-unifies-google-tag-and-tag-manager-adds-no-code-event-tracking-485688
