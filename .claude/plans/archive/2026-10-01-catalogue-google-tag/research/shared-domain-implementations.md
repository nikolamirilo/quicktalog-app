# How shared-domain platforms add a customer's Google tag / GA4 (and Meta Pixel)

Research notes for the founder question "How the google tag and analytics will be added". Retrieved 2026-10-01 unless a cache date is noted. Some FireCrawl results came from FireCrawl's cache (dated 2026-09-29 or 2026-09-30); those are marked "cached".

Labels used below:
- **Fact**: verified on the cited page, live HTML or JS bundle.
- **(snippet)**: taken only from a search-result summary, not from the page itself.
- **Inference**: my interpretation; not stated by the source.

Method, so the reader knows what "inspected" means:
- Live pages and JS bundles were fetched with FireCrawl (`rawHtml`), saved under the scratchpad (`/private/tmp/claude-501/-Users-nikola-Desktop-Quicktalog/b64d7aca-2aef-4bfb-96c9-9b9e1c127e6e/scratchpad/shared-domain/`), and searched with a small Python script for `gtag`, `googletagmanager`, `cookie_*`, `consent`, `fbq`, `dataLayer` and so on.
- I did not read every bundle end to end. I searched them for those patterns and quote the matches.
- EU behaviour was checked by scraping with FireCrawl's `location: DE`. US behaviour used `location: US`.
- No tracking was triggered on purpose beyond loading pages.
- The Hacktron PDF was text-extracted with a minimal zlib parser that loses word spacing. I re-spaced the quote.

---

## 0. Short answer

**Facts:**
- Every platform where public pages share the builder's origin uses the same mechanism:
  - The owner pastes a **validated ID** (GA4 `G-…`, Meta Pixel number, sometimes TikTok) into a settings field.
  - The platform renders the vendor's standard snippet with that ID.
  - Examples: Linktree, Calendly, Eventbrite, Ko-fi, Lnk.bio, and Tally on `tally.so` (Tally's builder origin not verified this session).
- None of them accepts a Google Tag Manager container or free-form head code on the shared origin:
  - Tally allows code injection **only on a customer custom domain**.
  - Gumroad runs free-form "snippets" **on a separate registrable domain, `gumroad-analytics.com`**. A 2025 pentest downgraded a stored-XSS finding in those snippets to "Info" because they run there.
  - Calendly states it "doesn't support direct integration with Google Tag Manager".
- Platforms that do allow GTM serve tenant pages from a different origin than the builder:
  - Typeform: `form.typeform.com` vs `admin.typeform.com`. GTM also requires the form's cookie-consent toggle and is blocked on forms with a payment field.
  - Substack: `<pub>.substack.com`.
  - Carrd, Notion Sites, Shopify: tenant domains are on the Public Suffix List.
- **No inspected implementation isolates the customer's GA cookies.** Linktree, Calendly, Tally and Gumroad all leave `cookie_domain` at `auto` and set no `cookie_prefix` or `cookie_path`. So one `_ga` client-ID cookie is shared across all tenants on the domain.
  - Calendly, Tally and Gumroad only add `cookie_flags: SameSite=None; Secure`.
  - Calendly and Gumroad also override `page_location` to strip query parameters.
- **Consent handling varies a lot.**
  - Linktree (DataGrail), Calendly (OneTrust), Eventbrite (Transcend plus Consent Mode defaults), Substack (own banner) and Stan (own banner) show a **platform-run** banner on tenant pages, and customer tags wait for consent.
  - Tally and Typeform leave the banner to a **per-form owner toggle**.
  - When the Tally owner leaves the banner off, Tally actively sets all four Google consent types to `granted`.

**Inference:** Quicktalog's planned design matches the shared-origin consensus:
- an ID-only setting, rendered first-party on the published page only;
- consent-gated;
- no GTM or custom code until catalogues move off the builder's origin.

Two things Quicktalog could do better than the analogues:
- per-catalogue cookie isolation (`cookie_prefix`);
- keeping Quicktalog's own GTM container away from tenant pages, or at least out of the tenant's dataLayer.

Section 6 covers both.

---

## 1. Comparison table

| Platform | Public URL vs builder | Tracking offered (tier) | GTM or custom code? | How the tag is rendered (observed) | EU consent on public page | Events sent automatically |
|---|---|---|---|---|---|---|
| **Linktree** | `linktr.ee/<name>`; builder `linktr.ee/admin` (same origin) | GA4 ID, Meta Pixel ID plus optional CAPI token (Pro/Premium). The profile data model also has `tiktokPixelId` | No GTM or custom code documented | Next.js `<Script type="text/plain" data-consent-id=…>` per vendor. Plain `gtag('config','<id>')`, no cookie options, default `dataLayer` | Platform CMP (DataGrail) on profiles. Per-vendor consent IDs. "Cookie Preferences" link in profile footer | GA: page views. Meta: `PageView`, `linkClick` |
| **Calendly** | `calendly.com/<user>/<event>`; builder `calendly.com/event_types/...` (same origin) | One GA4 ID per organization; Meta Pixel ID (paid plans only) | "doesn't support direct integration with Google Tag Manager" | gtag.js loaded only after OneTrust consent and never in preview embeds. `cookie_domain:"auto"`, `cookie_flags:"SameSite=None; Secure"`, `send_page_view:false`, sanitized `page_location` | Platform OneTrust banner on booking pages | 7 funnel events, `invitee_*` |
| **Eventbrite** | `eventbrite.com/e/<slug>-<id>`; builder `eventbrite.com/organizations/...` (same origin) | GA4, Meta (plus CAPI), Google Ads, X, TikTok, "simple image pixel" (organizer feature, per event or all events) | No GTM or JS. Image pixel takes a URL only | Not observed for an organizer (the sampled event had none). Page sets Consent Mode defaults denied for EU, `url_passthrough`, Eventbrite `developer_id` | Platform Transcend CMP (airgap) | GA: page views, `event_listing`, `event_register`, `Purchase`. Meta: `PageView`, `Purchase` plus mappable standard events |
| **Tally** | `tally.so/r/<id>`; custom domains (Pro) | GA4 ID, Meta Pixel ID (Pro) | Code injection **only on custom domains** | Inline gtag, `page_path`, `cookie_flags:'secure;samesite=none'`. If the owner enables the banner: iubenda autoblocking with `type="text/plain"`. If not: consent default set to `granted` | **Owner toggle per form** (iubenda, Consent Mode v2) | `Tally.FormPageView`, `Tally.FormSubmitted` |
| **Typeform** | `form.typeform.com/to/<id>` or `<sub>.typeform.com` (Plus+); builder `admin.typeform.com` | GA4 ID, Meta Pixel, **GTM container ID** (Business+) | GTM yes, but needs the cookie-consent toggle and is blocked with a payment field | Not inspected live | Owner toggle per form; blocks all tracking cookies until accept | `TypeformQuestionPassed`, `TypeformSubmit` (GA); `TypeformFirstInteraction`, `TypeformSubmit` (GTM) |
| **Beacons** | `beacons.ai/<name>` | GA ID, Meta, TikTok, Pinterest pixels (paid; tier placement unclear) | None found | Not observed (sampled page had none) | No CMP script found in DE render | Not documented |
| **Stan Store** | `stan.store/<name>` (served from `v2.stan.store` in DE); builder `admin.stan.store` | GA ID, Meta, TikTok, Pinterest Claim Tag (Creator Pro) | None found | Not observed | Platform banner (own script) for EU/EEA/UK/unknown visitors; categories functional/performance/targeting | Not documented |
| **Taplink** | `taplink.cc/<name>` | GA "add-on" that takes **"Google Analytics HTML code"**; FB Pixel add-on | Possibly (GA HTML code); not verified | Not observed | Not verified | Goals on link and messenger blocks |
| **Lnk.bio** | `lnk.bio/<name>`; builder `lnk.bio/manage` (same origin) | GA, Facebook, TikTok pixels (MINI plan+) | None found | Not observed | Platform cookie consent gates profile pixels ("not accepted the Lnk.Bio cookies … pixel cannot be shown") | Not documented |
| **Later Link in Bio** | `linkin.bio/<name>` | **No customer tag.** GA tracking via UTM parameters on outbound links | No | n/a | n/a | n/a |
| **Gumroad** | `<user>.gumroad.com`; receipts and builder on `gumroad.com` | GA4 ID, Meta Pixel, TikTok Pixel; free-form **Snippets** | Snippets yes, but run on **`gumroad-analytics.com`** | Open source. `gtag('config', id, {groups:'seller<id>', cookie_flags, send_page_view:false, page_location: sanitized})`, events with `send_to` | Seller toggle "Enable third-party analytics services"; EU banner not checked | GA4 ecommerce: `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase` |
| **Ko-fi** | `ko-fi.com/<name>`; settings `ko-fi.com/settings` (same origin) | GA4 Measurement ID (requires "Contributor" status) | None found | Not observed | Not checked | Not documented |
| **Carrd** (contrast) | `<site>.carrd.co` (on PSL); builder `carrd.com` | GA and 7 other analytics providers, Meta/TikTok/LinkedIn (Pro Standard) | Embed code incl. head, so GTM possible | Not inspected | None documented (prior notes) | n/a |
| **Notion Sites** (contrast) | `<x>.notion.site` (on PSL) | GA measurement ID (paid plans) | None documented | Not inspected | Not checked | n/a |
| **Substack** (contrast) | `<pub>.substack.com` (not on PSL) or custom domain | GA4, **GTM container**, Meta, X, Parse.ly | GTM yes; no custom-domain requirement stated | Publisher trackers listed as disabled before consent | Platform banner names **both** Substack and the publication | GA: page views, sign ups, paid subscriptions |
| **Shopify** (contrast, from prior notes) | `<store>.myshopify.com` (on PSL) or custom domain | Google app; custom pixels | GTM only inside sandboxed custom pixel | n/a | Platform banner plus Customer Privacy API | n/a |

---

## 2. Shared-path platforms in detail

### 2.1 Linktree (`linktr.ee/<name>`)

**(a) Integrations and tier. Facts:**
- GA4 integration page: "Available on Pro and Premium plans". "All you need to do is add your Google Analytics Measurement ID … and we'll do the rest." The ID is pasted into the **Google field** in Settings → Analytics Integrations. - [Linktree Help: GA](https://help.linktr.ee/en/articles/5434201-google-analytics-integration)
- Meta Pixel is also "Available on Pro and Premium plans". The owner pastes the Pixel ID, plus an optional "Facebook Conversions API Access Token". - [Linktree Help: Meta Pixel](https://help.linktr.ee/en/articles/5434194-facebook-meta-pixel-integration) (cached 2026-09-30)
- The public profile payload has three ID fields: `"googleAnalyticsId":null,"facebookPixelId":"558811507626827","tiktokPixelId":"BU378EQHT2A1QT375IM0"`. This is from Linktree's own profile `https://linktr.ee/linktr.ee`, scraped from DE and US. A TikTok field therefore exists in the data model, even though the help center documents only GA and Meta.
- No GTM or custom-code field was found in the profile payload or the tracking component (see (c)).

**(b) URL structure. Fact:** profiles are at `linktr.ee/<name>`. The admin is `https://linktr.ee/admin` (linked from the GA help article above). So profile and builder share one origin.

**(c) How the tag is rendered.** Fact: from the `_app` bundle, webpack module `94462` ([bundle URL](https://assets.production.linktr.ee/profiles/_next/static/chunks/pages/_app-e8fd61b812495fe8.js)). Excerpt, minified and shortened:
```js
function u(e){let{googleAnalyticsId:t,facebookPixelId:n,tiktokPixelId:o,dataGrailContainerConfig:a}=e,
 u=null==t?void 0:t.replace(/[^a-zA-Z0-9-]+/g,""), c=null==n?void 0:n.replace(/[^a-zA-Z0-9]+/g,""), ...
 ... (0,r.jsx)(i(),{id:"google-analytics-config","data-consent-id":a.googleAnalyticsConsentId,type:"text/plain",
   dangerouslySetInnerHTML:{__html:"window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '".concat(u,"');")}}),
 (0,r.jsx)(i(),{id:"google-analytics-script","data-consent-id":a.googleAnalyticsConsentId,type:"text/plain",async:!0,
   src:"https://www.googletagmanager.com/gtag/js?id=".concat(u)})
```
- IDs are sanitized by character stripping. GA keeps `[A-Za-z0-9-]`; Meta and TikTok keep `[A-Za-z0-9]`.
- `gtag('config', id)` has **no options**: no `cookie_prefix`, `cookie_path`, `cookie_domain` or `send_page_view` override. It uses the default `dataLayer` name. There is no `gtag('consent', …)` default.
- Scripts are emitted with `type="text/plain"` and `data-consent-id`. That is the CMP script-blocking pattern: the scripts stay inert until the CMP activates them. Next.js `<Script>` renders them `afterInteractive`.

Live render from US, `https://linktr.ee/linktr.ee`, waitFor 4 s. Fact:
```html
<script id="facebook-pixel" data-consent-id="6StlrDkNFNcBNFbPe7JJRF" type="text/plain" data-nscript="afterInteractive">!function (f, b, e, v, n, t, s) {...}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');fbq('init', '558811507626827');</script>
<script id="tiktok-pixel" data-consent-id="1h9aMwwDHM0koRqcj6Qj83" type="text/plain" ...> ... ttq.load('BU378EQHT2A1QT375IM0');ttq.page();}(window, document, 'ttq');</script>
```
- The same pattern appeared on `linktr.ee/redbull` and `linktr.ee/garyvee`, which both have a Meta Pixel set.
- None of the eight profiles sampled had `googleAnalyticsId` set: linktr.ee, tonyrobbins, glossier, redbull, hubspot, hootsuite, garyvee, neilpatel. A ninth (semrush) failed on a rate limit. So the GA output was seen only in code, not live.
- The DE render (no waitFor) contained none of these `afterInteractive` scripts. Its consent state in the page data was `"datagrailConsentPreferences":{"dg-category-essential":"1","dg-category-performance":"0","dg-category-functional":"0","dg-category-marketing":"0"}`. The US render had `"datagrailConsentPreferences":{}`.

**(d) Consent for EU visitors. Facts:**
- Profile pages load `https://assets.production.linktr.ee/consent-scripts/geo-consent.js` and DataGrail's `consent-loader.js`. The page data contains `"isCookieBannerEnabled":true` and a `dataGrailContainerConfig` with `googleAnalyticsConsentId`, `metaPixelConsentId`, `tiktokPixelConsentId` and `snapchatCreativeKitConsentId`.
- The profile footer has a `data-testid="cookie-preferences-button">Cookie Preferences</button>`.
- `geo-consent.js` writes `lt_geo_consent=… ; Domain=.linktr.ee` based on `DG_BANNER_API.categoryEnabled("functional")` ([file](https://assets.production.linktr.ee/consent-scripts/geo-consent.js)).
- Linktree's Cookie Notice (last updated 20 Dec 2021, cached 2026-09-29) covers both Linktree's site and visits to "a Linktree member's profile ('User Profile')". Quotes:
  - "Linktree Users can adjust their settings to set first and third party cookies on their Linktree User Profile for their own independent purposes of a similar nature."
  - The consent tool "also describes the third party cookies that Linktree members may decide to use on their User Profile".
  - "You can separately control whether to accept or reject cookies set by Linktree Users on their User Profiles."
  - Source: [Linktree Cookie Notice](https://linktr.ee/s/about/cookie-notice)
- Privacy Notice: when a visitor shares information with a Linktree User, "we facilitate this processing ('Processor Services'). This Privacy Notice does not address our Processor Services." - [Linktree Privacy Notice](https://linktr.ee/s/privacy) (cached 2026-09-29)

Inference on (d):
- The banner is **platform-wide**, run by Linktree and shown on every profile.
- Customer pixels are controlled per vendor by consent IDs, i.e. Basic consent mode (scripts blocked, not loaded with consent defaults).
- Linktree frames the user's pixels as the user's "independent purposes".

**(e) Events, differences, limits. Facts:**
- GA: data appears in Realtime "Top Active Pages". No custom GA events are documented. - [GA help](https://help.linktr.ee/en/articles/5434201-google-analytics-integration)
- Meta: "Every Linktree profile visit triggers a `PageView` event" and "Every link click triggers a `linkClick` event". The article mentions deduplication (browser plus CAPI).
- Meta setup: users may need to put `linktr.ee` on the pixel's traffic-permission allow list. "You don't need to verify your Linktree page as your domain in Facebook Business Manager." - [Meta help](https://help.linktr.ee/en/articles/5434194-facebook-meta-pixel-integration)
- No security rationale for the lack of GTM was found.

### 2.2 Calendly (`calendly.com/<user>/<event>`)

**(a) Integrations and tier. Facts:**
- GA4 is available on "Professional, Standard, Standard Plus, Teams, Teams Plus, and Enterprise", i.e. not Free. Quotes from the GA article:
  - "You can connect **one** GA4 Measurement ID per Calendly organization."
  - "You can't set up different GA tracking codes per user or team."
  - "Calendly doesn't support direct integration with Google Tag Manager at this time." (stated twice)
  - Source: [Calendly + Google Analytics](https://calendly.com/help/calendly-google-analytics) (updated 20 Aug 2026; cached 2026-09-30)
- Meta Pixel ID is available on the same plans. - [Calendly + Meta Pixel](https://calendly.com/help/calendly-meta-pixel) (updated 24 Aug 2026)

**(b) URL structure. Fact:** booking pages are on `calendly.com/<user>`. The help header's "My Account" link is `https://calendly.com/event_types/user/me`, so builder and booking pages share an origin.

**(c) How the tag is rendered.** Facts are from the booking bundle `https://assets.calendly.com/assets/booking/js/booking-2762c0bf1.js` (6.3 MB, searched not read).

The booking app fetches organization settings and configures GA4 and the Meta Pixel:
```js
Q_=({ga4MeasurementId:t,facebookPixelTrackingCode:r})=>(...t&&n8.configureGA4(t)...r&&(n7(r),oe())...)
... ga4MeasurementId:r.google_analytics_4_measurement_id, facebookPixelTrackingCode:r.facebook_pixel_tracking_code
n4=t=>window.gtag("config",t,{cookie_domain:"auto",cookie_flags:"SameSite=None; Secure",send_page_view:!1})
```

`page_location` and `page_referrer` are rebuilt from the path plus an allow-list of query parameters:
```js
n2=["back","month","date","utm_campaign","utm_source","utm_medium","utm_content","utm_term"]
n5=(t,r)=>{let n=n3(r);window.gtag("set","page_location",n)}
n9=(t,r,n,o,i)=>{window.gtag("event",n,{event_category:r,event_label:o,value:i})}
```
Inference: this strips invitee data such as prefilled name or email parameters before anything reaches GA.

gtag.js is loaded without an ID and only when a consent selector passes. It is never loaded in preview embeds:
```js
_2=()=>{let{embed_type:t}=(0,nF.useQueryParams)(),r="preview"===t;return(0,rX.useSelector)(ow("targeting"))&&!r}
QM=()=>{let t=_2();...if(t){...t.src="https://www.googletagmanager.com/gtag/js",document.head.appendChild(t)}window.dataLayer=window.dataLayer||[],window.gtag=function(){window.dataLayer.push(arguments)},window.gtag("js",new Date)...}
```
- The command queue is created on every load, but the library loads only after consent. The default `dataLayer` name is used.
- Meta: `fbq("init",t)`, `fbq("track","PageView")`, `fbq("trackCustom",t,r)`.
- An in-bundle tracker registry says GA4 is "Gated on the "performance" consent group" (OneTrust `C0002`) and Meta on "targeting" (`C0004`). However, `_2()` checks `"targeting"` for both. Inference: either the registry or the gate is out of date. Both statements are as observed.

Live booking page `https://calendly.com/acmesales` (DE). Fact:
- It loads `https://cdn.cookielaw.org/scripttemplates/otSDKStub.js` with `data-domain-script="a838c8e4-e3ce-442e-8f96-c88d0af98990"`, plus `otBannerSdk.js`.
- No `googletagmanager` script was present before consent. That organization may simply not have GA configured.

**(d) Consent. Facts:**
- Invitees see a banner on booking pages. Quoted text: "We use cookies and similar technologies to improve and personalize your experience, to understand website interactions (including clicks, cursor movement and screen recordings), and for marketing. Click "Decline" … or "Cookie Settings"…".
- Invitees can reopen "Cookie settings" at the bottom of the booking page.
- For embeds, the host can add `hide_gdpr_banner=1`. Calendly then warns: "Calendly uses cookies even if the banner is hidden. To stay compliant, wait to load Calendly until users accept performance cookies."
- Source: [Calendly cookie management and banner](https://calendly.com/help/calendly-cookie-management-and-banner) (updated 24 Sep 2026)
- "You cannot hide or change the cookie banner on your booking page" - (snippet) from the search result for [help.calendly.com/…/4418236309399](https://help.calendly.com/hc/en-us/articles/4418236309399-Calendly-cookie-management-and-banner). The current page text does not contain this sentence.

Inference: the banner is platform-run and names only Calendly's privacy notice. The customer's GA and Meta wait for OneTrust consent.

**(e) Events and limits. Facts:**
- GA4 and Meta both receive: `invitee_visits_routing_form`, `invitee_submits_routing_form`, `invitee_scheduling_page`, `invitee_event_type_page`, `invitee_select_day`, `invitee_select_time`, `invitee_meeting_scheduled`.
- The GA label is the event or form name and the category is `calendly`.
- Data appears in Realtime or in standard reports "(may take up to 24 hours)".
- Calendly recommends UTM parameters, because without them the source shows as "(direct)".
- Meta article: "Firefox may block Pixels by default."
- Sources: [GA](https://calendly.com/help/calendly-google-analytics), [Meta](https://calendly.com/help/calendly-meta-pixel)

### 2.3 Eventbrite (`eventbrite.com/e/...`)

**(a) Integrations and tier. Facts:**
- Supported: Meta Pixel, Google Analytics, Google Ads ("Adwords"), X, "simple image tracking pixel" and TikTok.
- "To add your pixel to Eventbrite, you don't need the entire pixel code. Eventbrite will automatically add the code to your event. You just need to enter in your pixel ID."
- "Due to international regulations, tracking pixels are disabled when using Eventbrite's embedded checkout feature in certain regions, such as Europe and the United Kingdom."
- Source: [Getting started with tracking pixels](https://www.eventbrite.com/help/en-us/articles/598933/getting-started-with-tracking-pixels/) (redirects to support.eventbrite.com)
- GA4: go to "Tracking pixels" under "Marketing", choose "This event" or "All events", and paste the measurement ID. "Eventbrite automatically adds in the rest of the tracking pixel code to your checkout." - [Set up a tracking pixel with Google Analytics](https://www.eventbrite.com/help/en-us/articles/475328/how-to-set-up-a-tracking-pixel-with-google-analytics/)
- Meta: optional server-side tracking with a "Conversions API Access Token". "you won't be able to verify the domain of your Eventbrite event because Eventbrite is a third-party website". - [Add a Meta Pixel to your event](https://www.eventbrite.com/help/en-us/articles/558547/how-to-create-a-tracking-pixel-with-meta/)
- Simple image pixel: the organizer pastes an image URL and picks where it fires (listing, register, order confirmation, seat pick). - (snippet) [Eventbrite: simple image tracking pixel](https://www.eventbrite.com/support/articles/en_US/How_To/how-to-set-up-a-simple-image-tracking-pixel?lg=en_US)
- Inference: this is a URL-only, no-JavaScript escape hatch for vendors without a native integration.

**(b) URL. Fact:** event pages are under `eventbrite.com/e/…`. The organizer dashboard is `https://www.eventbrite.com/organizations/events` (linked from the GA article). Same origin.

**(c) Rendering.** Live event page `https://www.eventbrite.com/e/view-conference-2026-tickets-1977137010020` (DE). Facts:
```html
<script src="https://cdntranscend.eventbrite.com/cm/f2747157-.../airgap.js" ... data-tracker-overrides="[...] GoogleConsentMode:security_storage=Essential" data-protect-realms="self" ... data-nscript="beforeInteractive"></script>
<script id="gtag-inline"> ... gtag('set', 'developer_id.dOGRkZj', true);
 // Europe is opt-in consent, so ad storage is denied by default.
 gtag('consent', 'default', { 'ad_storage': 'denied', 'analytics_storage': 'denied',
   'region': ['AT','BE','BG','CZ','DE','DK','ES','FI','FR','GB','GR','HU','IE','IT','LU','NL','PL','PT','RO','SE','BR','TH','TR'], 'wait_for_update': 500 });
 gtag('set', 'url_passthrough', true);</script>
```
- Eventbrite's own GTM container `GTM-5P8FXJ` loads on the page.
- A `transcend-consent-banner` script shows the banner (`transcend.autoShowConsentManager()`) unless the page is embedded content, an external checkout or inside an iframe.
- The sampled event had no organizer pixel detectable in its server data or the chunk I searched, so the organizer-tag rendering (cookie options etc.) was **not observed**.
- Inference: the region-scoped defaults cover `ad_storage` and `analytics_storage` only. No `ad_user_data` or `ad_personalization` defaults appear in this inline script; Transcend may add them.

**(d) Consent. Facts:**
- Cookie Statement: "Organizer cookies: Organizers selling tickets to events may use a variety of cookies on our Online Properties, including analytics and customization cookies, advertising cookies, and social media cookies … Please note that Eventbrite does not have access to or control the cookies that organizers chose to use." - [Eventbrite Cookie Statement](https://www.eventbrite.com/help/en-us/articles/666792/eventbrite-cookie-policy/) (cached 2026-09-29)
- For EU attendee data, the organizer is controller and Eventbrite is processor. - (snippet) [Eventbrite DPA for Organizers](https://www.eventbrite.com/help/en-us/articles/429030/data-processing-addendum-for-organizers/)
- Inference: the CMP is platform-wide (Transcend airgap regulates requests by purpose), and the Cookie Statement disclaims control of organizer cookies.

**(e) Events, differences, limits. Facts:**
- GA: "In addition to page views, your Google pixel will collect … event_listing … event_register … Purchase."
- On differences: "this data doesn't account for refunds, transfers, or manual transactions. Attendees' privacy settings may also block your pixel from firing. For the most accurate information about your event sales, view your event reports." - [GA article](https://www.eventbrite.com/help/en-us/articles/475328/how-to-set-up-a-tracking-pixel-with-google-analytics/)
- Meta: by default `PageView` on the listing and `Purchase` on completion. Extra standard events can be mapped to "Event listing / Event register / Event order confirmation / Reserved seating pick a seat".
- "Eventbrite uses tracking pixels as well, but they won't interfere with your data." - [Meta article](https://www.eventbrite.com/help/en-us/articles/558547/how-to-create-a-tracking-pixel-with-meta/)

### 2.4 Tally (`tally.so/r/<id>`): the closest analogue

**(a) Integrations and tier. Facts:**
- "The Google Analytics integration is part of **Tally Pro**."
- "If you use an existing Stream, make sure to add tally.so as an additional domain."
- The integration offers "a transparent, user-friendly consent banner on your forms (supports Google Consent Mode v2)".
- Source: [Tally: GA4 integration](https://tally.so/help/google-analytics-integration)
- Meta Pixel has its own integration, or can be injected via code injection. - [Tally: Code injection](https://tally.so/help/code-injection)

**(b) URL structure and the GTM/custom-code rule. Facts:**
- "Forms hosted on a custom domain have access to a code injection block." It is a Tally Pro feature that "requires coding skills". - [Code injection](https://tally.so/help/code-injection)
- For GTM or Meta Pixel event tracking, the guidance is "✅ Recommended: use a custom domain … Install your GTM container snippet or Meta Pixel code on both your website (company.com) and the custom domain with code injection".
- Without a custom domain, the "Track form events" embed option sends events to the host site's own GTM or Pixel. - [Tracking Tally form events with GTM or Meta Pixel](https://tally.so/help/track-form-events-with-google-tag-manager-or-meta-pixel)
- Inference: on the shared `tally.so` origin, owners get only the ID integrations. Arbitrary code, GTM included, needs a customer-owned domain.
- Not verified this session: that Tally's builder/dashboard is also served from `tally.so`, i.e. that forms share the builder's origin. The help center is at `tally.so/help` and forms at `tally.so/r/<id>`.

**(c) Rendering.** Live form `https://tally.so/r/3qDpEY` (DE) has `pageProps.integrations: []` and `metaData: {"isCustomDomain": false, … "codeInjection": ""}`. Code is in chunk [`64387-28d7d8d78624c386.js`](https://tally.so/_next/static/chunks/64387-28d7d8d78624c386.js). Fact, shortened:
```js
!a.doNotTrack&&w&&( w.askForCookieConsent && /* iubenda */ _iub.csConfiguration = {"perPurposeConsent":true,"purposes":"1,4,5","siteId":3514643,
   "cookiePolicyUrl":"https://tally.so/help/cookie-policy", "banner":{"acceptButtonDisplay":true,"rejectButtonDisplay":true,"customizeButtonDisplay":true,"explicitWithdrawal":true,...}}
   + <script src="https://cs.iubenda.com/autoblocking/3514643.js">,
 <script type={askForCookieConsent?"text/plain":"text/javascript"} className="_iub_cs_activate" data-iub-purposes="4"
         data-suppressedsrc|src="https://www.googletagmanager.com/gtag/js?id=<trackingId>">,
 <script> window.dataLayer=...; gtag('js', new Date());
   [if !askForCookieConsent] gtag('consent','default',{'ad_storage':'granted','ad_user_data':'granted','ad_personalization':'granted','analytics_storage':'granted'});
   window.tallyGaConfigured[...]; gtag('config','<trackingId>',{ page_path: window.location.pathname, cookie_flags: 'secure;samesite=none' }) </script>)
!a.doNotTrack&&h&& <script type={w?.askForCookieConsent?"text/plain":"text/javascript"} ...> fbq('init','<pixelId>'); fbq('track','PageView'); </script>
```
- No `cookie_prefix`, `cookie_path` or `cookie_domain`. Default `dataLayer`.
- With the banner on, gtag.js stays blocked until iubenda purpose 4 (measurement) is accepted. That is Basic consent mode.
- With the banner off, Tally explicitly sets all four consent types to `granted`.
- The Meta Pixel is blocked only if the **GA** integration's consent flag is on. Inference: a form with only a Meta Pixel loads it ungated.

**(d) Consent. Facts:**
- The banner is an **owner-controlled per-form option**. It uses a single iubenda site (`siteId 3514643`) and links to **Tally's** cookie policy.
- Tally's GDPR guide is about consent checkboxes for respondent data and has no banner details. - [Tally: GDPR-compliant form](https://tally.so/help/how-to-create-a-gdpr-compliant-form)

**(e) Events, differences, limits. Facts:**
- Events: `Tally.FormPageView` (category is the page URL, label "Page [X]") and `Tally.FormSubmitted` (label is the form title).
- "some users may have ad-blocking extensions … tracking might not work for all users".
- "If you have activated Google Signals, Google might hide data for any step that has fewer than 37 users".
- Consent Mode v2 note: "businesses that don't integrate with Google Consent Mode v2 could experience measurement loss of tracked data from EEA/EU/UK visitors."
- Source: [GA4 integration](https://tally.so/help/google-analytics-integration)

### 2.5 Typeform (shared host `form.typeform.com`, separate from the builder)

**(a) Integrations and tier. Facts:**
- GA4: "This integration is only available on a Business or above Typeform plan."
- "You can't track Payment questions due to legal reasons, so it is currently not possible to use Google Analytics if you have a Payment field in your typeform."
- "If you add your Google Analytics tracking code to a typeform, you are responsible for the data collected by Google Analytics." It warns about PII in URL parameters. - [Typeform: GA](https://help.typeform.com/hc/en-us/articles/360029251312-Integrate-your-typeform-with-Google-Analytics)
- GTM needs "A Business Typeform account". The guide says "make sure cookie consent is enabled on your form … Respondents … will need to accept Typeform cookies … for event tracking to work in Google Tag Manager".
- "it is currently not possible to use Google Tag Manager if you have a Payment field in your form."
- "We block insecure domains that are not 'https'."
- Source: [Typeform: Add GTM to a form](https://help.typeform.com/hc/en-us/articles/360029583611-Add-Google-Tag-Manager-to-a-form)

**(b) URL. Facts and snippets:**
- Default form URLs are `form.typeform.com/to/<id>`. A custom subdomain `<name>.typeform.com` is available on Plus and above. - (snippet) [Typeform: customize your form URL](https://help.typeform.com/hc/en-us/articles/360029251372-How-to-customize-your-form-URL)
- Custom domains are on "Enterprise plus and Growth Custom". - (snippet) [Typeform: custom domains](https://help.typeform.com/hc/en-us/articles/4404606584852-Custom-domains-for-Enterprise-plus-and-Growth-Custom-accounts)
- The builder login is `admin.typeform.com`. - (snippet) [admin.typeform.com/login](https://admin.typeform.com/login)
- The Public Suffix List contains `pro.typeform.com`, "Submitted by Typeform <ops@typeform.com>". This is from a local copy of the PSL downloaded 2026-09-30 during prior research; [PSL](https://publicsuffix.org/list/public_suffix_list.dat).
- Inference: GTM runs on a form origin distinct from the admin origin. It is the same site, so cookies can still be shared at `typeform.com` level.

**(d) Consent. Fact:** with cookie consent on, "all tracking cookies-including third-party cookies used by integrations-will be blocked **until** respondents choose to accept". It covers Facebook Pixel, HubSpot and Google Analytics. - [Typeform: Activate cookie consent](https://help.typeform.com/hc/en-us/articles/6389226218132-Activate-cookie-consent)

**(e) Events. Fact:** GA gets `TypeformQuestionPassed` and `TypeformSubmit`; GTM gets `TypeformFirstInteraction` and `TypeformSubmit`. Sources: the two articles above.

### 2.6 Beacons (`beacons.ai/<name>`)

**Facts:**
- The pricing page (cached 2026-09-30) lists Free $0, Creator $10/mo ($8.33 billed annually, "Free custom domain", "Advanced SEO and marketing features"), Creator Plus $30/mo ($25 annually) and Creator Max $100/mo.
- It also lists "Advanced Marketing: Use your own Facebook, TikTok, and Pinterest pixels". The extracted text does not show which plan that belongs to; prior notes placed it at Creator Plus. - [Beacons pricing](https://beacons.ai/i/pricing)
- Help article "Google Analytics Tracking Id" exists but is thin. - [Beacons Help](https://help.beacons.ai/en/articles/4698625)
- Live `https://beacons.ai/beacons` (DE, waitFor 3 s): no CMP script and no `gtag`, `googletagmanager` or `fbq` in the captured DOM. YouTube embed scripts were present. This profile may simply have no pixels.
- Rendering and consent are **not verified**.

### 2.7 Stan Store (`stan.store/<name>`)

**Facts:**
- "This feature is only available on the Creator Pro plan."
- Fields: Google Analytics ID, TikTok Pixel ID, Meta Pixel ID, Pinterest Claim Tag ID, under Settings → Profile → Analytics.
- Source: [Stan: Add Pixel IDs](https://help.stan.store/article/153-how-do-i-add-pixel-ids-for-analytics) (updated 12 Feb 2026)
- `https://stan.store/stanley` redirected (DE) to `https://v2.stan.store/stanley`, a 404 "under construction" page. It loads `<script id="stan-cookie-banner" src="https://assets.stanwith.me/js/cookie-banner.js">` and a `StorefrontConsentBridge` component. Its Login link points to `https://admin.stan.store/`.
- `cookie-banner.js` ([file](https://assets.stanwith.me/js/cookie-banner.js)):
  - It shows the banner when the visitor's country is in an EU/EEA list, `GB`, or "unknown".
  - Categories: functional, performance, and targeting ("These show you relevant Stan ads around the web").
  - Banner text: "Cookies help us improve performance and make your experience more personal. Use of this site means you agree to our Terms and Privacy Policy", with Manage, Reject and Accept buttons.
  - Choices are stored on `domain=stan.store` and `domain=stanwith.me`. Rejecting reloads the page.
- Inference: a platform-run banner names only Stan. Whether creator pixels wait on the "targeting" or "performance" category was **not verified**.

### 2.8 Taplink (`taplink.cc/<name>`)

**Facts:**
- "Starting today, you can integrate Google Analytics on your Taplink page. To connect them, simply add Google Analytics HTML code to the new add-on … Add-ons → Analytics → Google Analytics." Goals can be set on Link, Messaging apps and Social media blocks. Originally released 29 Jun 2018, updated 5 Mar 2024. - [Taplink blog](https://taplink.at/en/blog/google-analytics-integration.html) (cached 2026-09-30)
- Not verified on a live profile: `taplink.cc/taplink` redirected to the marketing site.
- Inference: this may be the one shared-path product that accepts pasted GA HTML. Whether it parses out the ID or injects raw HTML is unknown.

### 2.9 Lnk.bio (`lnk.bio/<name>`)

**Facts:**
- "This guide only applies to subscribers of the MINI plan or above."
- The ID goes into Stats ⇒ Settings ⇒ External Tracking Pixels (`lnk.bio/manage/stats/settings`).
- "If Google Analytics doesn't recognize your pixel, it might be because you have not accepted the Lnk.Bio cookies and thus the pixel cannot be shown."
- Source: [Lnk.bio: GA](https://help.lnk.bio/en/articles/5418973-integrate-your-google-analytics-pixel)
- Facebook and TikTok pixel articles exist. - (snippet) [FB](https://help.lnk.bio/en/articles/5418967-integrate-your-facebook-pixel), [TikTok](https://help.lnk.bio/en/articles/5418970-integrate-your-tiktok-pixel)
- Inference: platform consent gates profile pixels.

### 2.10 Later Link in Bio (`linkin.bio/<name>`)

**Fact:**
- Free plan: "Monitor clicks and visits with Google Analytics tracking using default UTM values".
- Starter: "Set custom UTM parameters for Google Analytics tracking".
- No GA, Meta or GTM tag is documented for the Link in Bio page itself.
- Source: [Later: Link in Bio features by plan](https://help.later.com/hc/en-us/articles/360043255013-Link-in-Bio-Features-By-Plan) (cached 2026-09-29)

Inference: Later avoids running any customer tag on its domain and measures through UTMs on outbound links.

### 2.11 Gumroad (`<user>.gumroad.com`; receipts on `gumroad.com`): open source, best evidence for isolation

**(a) and (b) Facts:**
- Settings page `gumroad.com/settings/third_party_analytics` has a GA4 Measurement ID field, a Meta Pixel ID (no CAPI) and a TikTok Pixel ID.
- "Snippets" accept vendor code "and … your own custom JavaScript". Each snippet has a Location: product page, receipt, or all pages.
- Sale variables `$VALUE`, `$CURRENCY` and `$ORDER` are substituted into snippets.
- "All Gumroad snippets run from https://gumroad-analytics.com rather than https://gumroad.com".
- Meta traffic permissions "must allow **both** your Gumroad subdomain … **and** gumroad.com … the receipt page shown after a purchase is served from gumroad.com".
- Source: [Gumroad: Third-party analytics](https://gumroad.com/help/article/174-third-party-analytics)

**(c) Rendering.** Fact, from [`app/javascript/data/google_analytics.ts`](https://raw.githubusercontent.com/antiwork/gumroad/main/app/javascript/data/google_analytics.ts):
```ts
function logSellerEvent(id, eventName, payload) { gtag("event", eventName, { ...payload, send_to: `seller${id}` }); }
function shouldTrack() { return document.querySelector('meta[property="gr:google_analytics:enabled"]')?.getAttribute("content") === "true"; }
const SENSITIVE_QUERY_PARAMS = ["reset_password_token", "confirmation_token", "invitation_token", "unlock_token"];
export function startTrackingForSeller(data) { ... gtag("js", new Date());
  gtag("config", data.googleAnalyticsId, { groups: `seller${data.id}`, cookie_flags: "SameSite=None; Secure", send_page_view: false,
    page_location: sanitizedPageLocation(), page_referrer: sanitizedPageReferrer() }); }
export function startTrackingForGumroad() { ... gtag("config", "G-6LJN6D94N6", { groups: "gumroad", cookie_flags: "SameSite=None; Secure", ... }); }
```
- Gumroad's own property and the seller's property share **one gtag instance and one `dataLayer`**. Events are routed with `groups` and `send_to`.
- There is no `cookie_prefix` or `cookie_path`. Inference: seller and Gumroad share the `_ga` client ID.
- Gumroad fixed a real leak after an external report: GA4 had collected password-reset tokens through `page_location` and `page_referrer`. - (snippet) [antiwork/gumroad#6189](https://github.com/antiwork/gumroad/issues/6189)
- The snippet view is a bare page that renders `<%= raw @third_party_analytics %>`. - [index.html.erb](https://raw.githubusercontent.com/antiwork/gumroad/main/app/views/third_party_analytics/index.html.erb)

**Security evidence. Fact:**
- Hacktron's April 2025 white-box assessment lists "GUM-01-006 WP1 [Info]: Stored XSS via Unsanitized Third-Party Analytics Snippets".
- It notes: "This is considered miscellaneous issue as code executes inside a sandboxed domain (a separate origin from gumroad.com)."
- Remediation: "Consider rendering third-party code inside a sandboxed <iframe> or injecting it client-side with CSP isolation".
- Source: [Hacktron Gumroad report PDF](https://www.hacktron.ai/reports/Gumroad_01.pdf), p.16.

**(d) and (e) Facts:**
- A seller-level toggle, "Enable third-party analytics services", disables GA and the Facebook Pixel. The page notes Gumroad analytics "are collected server-side". - [Gumroad: Turn off third-party trackers](https://gumroad.com/help/article/285-turning-off-third-party-trackers)
- Events, from the help article: `view_item`, `add_to_cart`, `purchase` plus matching page views, and a profile page view. The source also sends `begin_checkout`.
- Meta mapping: viewed → `ViewContent`, iwantthis → `InitiateCheckout`, purchased → `Purchase`. TikTok: `ViewContent`, `AddToCart`, `CompletePayment`.
- On differences: "In every case, you should trust Gumroad's numbers over Google's … When these scripts don't run (a user's privacy preferences may turn off external loading, for example), the purchase data never makes its way to Google." - [help article](https://gumroad.com/help/article/174-third-party-analytics)
- I did not check whether Gumroad shows an EU banner.

### 2.12 Ko-fi (`ko-fi.com/<name>`)

**Facts:**
- "To use Google Analytics, you'll need to be a Contributor."
- The owner creates a web data stream with "your Ko-fi URL … (e.g., ko-fi.com/yourusername)" and pastes the Measurement ID into Page Settings (`ko-fi.com/settings?tab=page`).
- Source: [Ko-fi: Connect to GA](https://help.ko-fi.com/hc/en-us/articles/360007169993--Connect-your-Ko-fi-page-to-Google-Analytics)
- No pixel or consent documentation was found, and rendering was not inspected.

---

## 3. Contrast: platforms on subdomains or custom domains

- **Carrd.** Site Analytics "Requires Pro Standard or higher". Providers: Cloudflare Web Analytics, Fathom, Google Analytics, Matomo, Plausible, PostHog, Simple Analytics, Umami. "Certain site analytics providers may require the collection of additional data from a site's visitors." - [Carrd: Site Analytics](https://carrd.com/docs/sites/setting-up-site-analytics)
  - Marketing trackers (Meta, TikTok, LinkedIn) and Embed code including `<head>`, which allows GTM, are from prior notes: [trackers](https://carrd.com/docs/sites/setting-up-marketing-trackers), [embed](https://carrd.co/docs/building/embedding-custom-code). Not re-fetched.
  - Builder `carrd.com`; sites `<x>.carrd.co`. PSL entry `carrd.co`, "Submitted by AJ <aj@carrd.co>" (local PSL copy).
- **Notion Sites.** "If you're on a paid plan, you can … integrate with Google Analytics": Share → Publish → Site customization → Google Analytics → measurement ID. - [Notion Help](https://www.notion.com/help/edit-and-customize-your-notion-sites) (cached 2026-10-01)
  - PSL entry `notion.site`, "Submitted by Jess Yao <trust-core-team@makenotion.com>".
- **Substack.** The Analytics section takes a GA4 ID, a **GTM ID**, a Meta pixel ID, an X pixel ID and a Parse.ly ID. "Once you save a tracking tool ID, Substack automatically loads that tool on your publication's pages". No custom-domain requirement is stated. - [Substack: Analytics section](https://support.substack.com/hc/en-us/articles/52667879688980-How-do-I-use-the-Analytics-section-on-Substack) (cached 2026-09-29)
  - GA events: "page views, sign ups, and paid subscriptions". - [Substack: GA4](https://support.substack.com/hc/en-us/articles/15955098199444)
  - Live `https://on.substack.com/` (DE). Banner: "Substack and On Substack use cookies to improve your experience, for analytics, and for marketing. You can accept, reject, or manage your preferences."
  - Preloads: `"isEU":true`, `"showCookieBanner":true`, `"pubTrackerCookieIds":["_ga_tracking-publisher"]`. `disabledCookies` includes `"_ga_tracking-substack"`, `"meta_tracking_pixel-substack"`, `"_ga_tracking-publisher"`, `"_ga_tag_manager-publisher"`, `"fb_pixel-publisher"`, `"twitter_pixel-publisher"`, `"parsely_pixel-publisher"`.
  - Publication fields include `google_analytics_4_token`, `google_tag_manager_token` (null here) and `custom_domain: null`.
  - `substack.com` is not on the PSL (local copy).
  - Inference: Substack's banner names **both** the platform and the publisher, and publisher trackers are a separate category held until consent.
- **Shopify** (prior notes, not re-fetched). Custom pixels run in a "lax sandbox" iframe (`allow-scripts allow-forms`). GTM is allowed only as a custom pixel. The Shopify cookie banner governs Shopify pixels. PSL entry `myshopify.com`. - [shopify.dev: About web pixels](https://shopify.dev/docs/apps/build/marketing/pixels), [Shopify Help: privacy settings](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings)

**Inference: the split.** Free-form code or GTM appears only where tenant pages run on a different origin from the builder: a subdomain (Typeform, Substack), a separate registrable domain (Gumroad snippets, Carrd, Notion, Shopify) or a customer domain (Tally). On shared builder-origin paths, platforms accept only IDs. Taplink's "HTML code" add-on is the one unverified exception.

---

## 4. Google's own guidance for platforms that add customers' tags

**Facts:**
- Google has a guide written for "CMS owners or website builders". - [Integrate the Google tag into your CMS or website builder](https://developers.google.com/tag-platform/devguides/gtag-integration) (updated 2026-07-30)
  - **Developer ID:** "Make sure you have a Google tag Developer ID", via a request form. Use `gtag('set', 'developer_id.<developer ID>', true);` and "Attach the ID to every event." Eventbrite does this (`developer_id.dOGRkZj`, §2.3).
  - **Input:** "Your customers should be able to supply multiple forms of their Google tag ID through one interface". "The tag ID input should accept multiple ID variants using the regular expression pattern `[A-Z]{1,3}\w{5,}[\w]*`". That covers `G-`, `AW-` and `GT-` IDs, not just GA4.
  - **Consent:** "customers get at least the `gtag('consent', 'update' {...})` call integrated with no action required by the customer". Platforms may also deploy "the `gtag('consent', default' {...})` state and unblocking Google tags (i.e., no consent-based conditional firing)". In other words, Google steers platforms towards **advanced** consent mode.
  - **Events:** "Log everything possible". "Set up at least 8 core events": `view_item_list`, `add_to_cart`, `begin_checkout`, `purchase`, `sign_up`, `generate_lead`, `subscribe`, `book_appointment`.
  - **One snippet:** "Ideally, the Google tag snippet should appear only once per page. The snippet can accommodate multiple tag IDs."
- **Basic vs advanced consent mode.** Basic: "you prevent Google tags from loading until a user interacts with a consent banner … when the user doesn't consent, no data is transferred to Google at all". Advanced: tags load with defaults set to denied, and "While consent is denied, the Google tags send measurements without cookies". - [Consent mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode) (cached 2026-09-30)
  - Consent types: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`.
- **Cookie defaults.** "By default, Google tags use automatic cookie domain configuration. Cookies are set on the highest level of domain possible." `cookie_prefix: 'example'` turns `_ga` into `example_ga`. Changing names "may result in existing users appearing as new visitors". - [Configure and customize cookies](https://developers.google.com/tag-platform/security/guides/customize-cookies) (updated 2024-11-14)
  - GA4 config defaults: `cookie_domain` 'auto', `cookie_expires` 63072000, `cookie_path` '/', `cookie_update` true, `page_location` = `document.location`, `send_page_view` true. - [GA4 config reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
  - GA4 cookies: `_ga` (2 years, "Used to distinguish users") and `_ga_<container-id>` (2 years, "Used to persist session state"). - [GA4 cookie usage](https://support.google.com/analytics/answer/11397207?hl=en)
- **Renaming the dataLayer for gtag.js:** "Add a query parameter named "l" to the URL to set the new data layer name, for example, l=myNewName." - [The data layer](https://developers.google.com/tag-platform/devguides/datalayer)

---

## 5. Cross-cutting findings (facts, with the platforms they come from)

1. **Settings field, not content.** Every platform takes tracking as a settings ID (Linktree, Calendly, Eventbrite, Tally, Typeform, Beacons, Stan, Lnk.bio, Gumroad, Ko-fi, Substack, Notion, Carrd). It is usually paid:
   - Linktree Pro/Premium; Calendly paid plans; Tally Pro; Typeform Business; Stan Creator Pro; Lnk.bio MINI; Beacons paid; Ko-fi "Contributor".
   - The Eventbrite and Gumroad articles state no plan requirement.
   - Scope differs: Calendly allows one ID per organization; Eventbrite per event or all events; Tally per form; Linktree per profile.
2. **No GTM or free-form code on shared builder origins:** Linktree (none documented), Calendly ("doesn't support … Google Tag Manager"), Eventbrite (IDs plus URL-only image pixel), Tally (code injection only on custom domains), Gumroad (snippets on `gumroad-analytics.com`). Taplink is unverified.
3. **Where GTM is allowed, the tenant origin differs from the builder:**
   - Typeform: `form.typeform.com` vs `admin.typeform.com`, with a consent toggle required and payment forms excluded.
   - Substack: `<pub>.substack.com`.
   - Carrd and Shopify: PSL domains. Shopify additionally sandboxes GTM.
4. **Cookie isolation is absent in every implementation inspected** (Linktree, Calendly, Tally, Gumroad): default `cookie_domain:'auto'` and no `cookie_prefix` or `cookie_path`.
   - Only `cookie_flags` "SameSite=None; Secure" is added (Calendly, Tally, Gumroad), for iframe embeds.
   - Everything uses the default `dataLayer` name. Gumroad shares one gtag instance with its own GA and routes by `groups`/`send_to`.
5. **URL sanitization:**
   - Calendly overrides `page_location` and `page_referrer` with path plus `back`, `month`, `date` and the `utm_*` parameters.
   - Gumroad strips token parameters after a real token leak.
   - Typeform makes the owner responsible for excluding PII parameters.
6. **Preview exclusion:** Calendly never loads gtag.js when `embed_type === "preview"`.
7. **Consent patterns:**
   - Platform-run CMP on tenant pages with customer tags held until consent: Linktree (DataGrail, per-vendor IDs), Calendly (OneTrust), Eventbrite (Transcend plus region-scoped Consent Mode defaults), Substack (own banner, publisher trackers held, banner names platform **and** publication), Stan (own banner for EU/UK/unknown), Lnk.bio.
   - Owner toggle per form: Tally (if off, consent is forced to `granted`) and Typeform.
   - Basic consent mode, i.e. tags blocked, is what the inspected code actually does (Linktree, Calendly, Tally with banner on). Eventbrite sets denied defaults for its own tags. Google's CMS guide recommends advanced mode.
8. **Disclosed data differences:**
   - Gumroad: "trust Gumroad's numbers over Google's".
   - Eventbrite: refunds, transfers and manual sales missing; privacy settings block the pixel.
   - Tally: ad blockers; Google Signals threshold of 37 users.
   - Calendly: up to 24 hours delay.
9. **Responsibility language:**
   - Linktree: users' pixels serve "their own independent purposes".
   - Eventbrite: "does not have access to or control the cookies that organizers chose to use"; organizer is controller (snippet).
   - Typeform: "you are responsible for the data collected by Google Analytics".

---

## 6. Inferences for Quicktalog

Quicktalog-side facts used here:
- The root layout loads Clarity and Quicktalog's GTM container on every page: `src/app/layout.tsx:47`, `src/app/layout.tsx:48`.
- The site cookie banner returns early on `/catalogues/` paths: `src/components/general/CookieBanner.tsx:28-37`.
- The existing consent helpers push plain objects `{event:"consent_default", consent:{…}}` and `{event:"consent_update", …}` into `dataLayer`: `src/utils/cookies.ts:36-50` and `src/utils/cookies.ts:52-71`. These are not `gtag('consent', …)` command calls.

### 6.1 End-to-end mechanism the analogues point to (inference)

1. **Owner setting.**
   - A tracking section in the catalogue builder (sidebar General tab or a new tab) with "Google tag ID" and "Meta Pixel ID".
   - Validate on the server, as Linktree does by character-stripping, but stricter. Use Google's ID regex, or narrow it to `G-`, `AW-` and `GT-`. Meta IDs are numeric; Eventbrite: "usually 15-16 numbers".
   - Plan-gate it, as every analogue except Eventbrite and Gumroad does.
   - Keep it out of AI tool schemas. No analogue documents this; it carries over from prior research.
2. **Help text.**
   - "Add www.quicktalog.app to your GA4 web stream or create one" (Tally: "add tally.so as an additional domain"; Ko-fi: stream URL `ko-fi.com/yourusername`).
   - For Meta, "allow `quicktalog.app` in traffic permissions" (Linktree, Gumroad).
   - "Numbers will differ from Quicktalog's dashboard" (Gumroad, Eventbrite).
3. **Rendering.**
   - The published catalogue page renders the stored IDs into a small vendor-snippet component. No cookies or identity are needed, so it stays ISR-safe.
   - Never render on `/preview` or `/admin` (Calendly's preview rule).
   - Default to **Basic** consent mode for EU visitors: the scripts stay inert (`type="text/plain"` or conditional mount) until consent, as Linktree, Calendly and Tally with banner on do.
   - Advanced mode is Google's recommendation but sends cookieless pings before consent. Choosing it needs legal sign-off.
   - Add `developer_id.<id>` once Google issues one (Eventbrite).
4. **gtag config.** Improve on the analogues:
   - Override `page_location` and `page_referrer` with path plus UTM only (Calendly, Gumroad).
   - Consider a **per-catalogue `cookie_prefix`**. Without it, a visitor carries one `_ga` client ID across every catalogue on `www.quicktalog.app`, and across Quicktalog's own GA if its GTM container sets `_ga`. No surveyed platform does this, so it needs a probe in Chromium to confirm GA4 then only reads and writes `<prefix>_ga`. Google warns renamed cookies reset returning-user counts.
5. **Separate the customer's tag from Quicktalog's GTM.**
   - Quicktalog's own container currently runs on catalogue pages with the default `dataLayer` (`src/app/layout.tsx:48`).
   - A customer gtag on the same `dataLayer` would put the customer's commands and events where Quicktalog's container can see them, and the reverse.
   - Options: (a) load the customer tag with a renamed dataLayer (`gtag/js?id=…&l=<name>`, per Google's data-layer doc). This conflicts with Google's "snippet once per page" preference. (b) Gumroad-style shared instance with `groups`/`send_to`. (c) Simplest: stop loading Quicktalog's GTM and Clarity on public catalogue pages, or gate them behind the same banner.
6. **Events.**
   - Send `page_view` plus a small catalogue-appropriate set from Google's core list: `view_item` (item opened), `generate_lead` (call, WhatsApp or email tap) and `book_appointment` (booking button).
   - Meta: `PageView`, plus `ViewContent` and `Contact`/`Lead`. Calendly, Tally and Linktree each send only 2–7 platform-specific events.
7. **Consent banner on catalogue pages.**
   - It is platform-run and identity-free. A footer "Cookie preferences" link reopens it (Linktree, Calendly).
   - Choices are per category or per vendor (Linktree per vendor; Stan categories).
   - The text names Quicktalog **and** the business (Substack's pattern).
   - It must also cover Quicktalog's own tags on that page. Today they bypass consent because of the early return in `CookieBanner.tsx:28-37`.
   - Verify that the existing consent pushes (`src/utils/cookies.ts:36-71`) are turned into real Consent Mode states by the GTM container configuration, which is not in the repo. As written, they are not `gtag('consent', …)` commands.
8. **GTM and custom head code.** Refuse while catalogues share `www.quicktalog.app` with `/admin`. Every shared-origin analogue does the same. The evidence for later options:
   - Gumroad isolates free-form code on a separate registrable domain, and the pentest downgraded the XSS to "Info" for that reason.
   - Tally offers code injection only on customer domains.
   - Typeform allows GTM on a separate form origin, behind consent, and never with payments.

### 6.2 Decisions this research does not settle

- **Basic or advanced consent mode for EU visitors.** Google recommends advanced; the inspected platforms use basic. This needs legal input.
- **Who is named as controller in the banner and privacy text.** Linktree calls it users' "independent purposes"; Eventbrite says organizer is controller and Eventbrite processor (snippet). Needs legal input.
- **Banner scope:** EU/EEA/UK only (Stan, Eventbrite, Calendly, Substack via geo) or everyone. An ISR page cannot vary by geo on the server, so the check would have to run client-side.

---

## 7. Gaps and things not verified

- Organizer-tag rendering on Eventbrite was not observed (sampled event had no pixel).
- Live GA rendering on Linktree was seen only in code: none of the eight profiles sampled had a GA ID.
- Not inspected: Beacons, Stan, Taplink, Lnk.bio, Ko-fi and Typeform live rendering, cookie options or consent wiring.
- Stan: unclear whether creator pixels wait on its banner categories.
- Taplink: unclear whether its "Google Analytics HTML code" add-on runs raw HTML on `taplink.cc`.
- Linktree's DataGrail banner wording (who it names) was not retrieved. The DataGrail `consent.js` did not contain readable banner strings. Only the Cookie Notice wording is cited.
- Calendly's tracker registry ("performance") contradicts its code gate ("targeting"). I did not determine which is current.
- Gumroad's EU banner behaviour and Ko-fi's consent handling were not checked.
- Shopify and Carrd claims marked "prior notes" were not re-fetched today.
- No platform documents per-tenant cookie isolation, so the `cookie_prefix` idea in §6.1.4 is untested. A Chromium probe is needed (scratchpad has an earlier `ga4-probe.mjs` from 2026-09-30).
