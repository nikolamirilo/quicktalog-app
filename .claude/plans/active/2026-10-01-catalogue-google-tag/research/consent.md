# Consent on public catalogue pages: law, roles, scope, Quicktalog's own scripts, banner UX, build vs buy

Research notes for the founder's question "How the google tag and analytics will be added", consent part only. Written 2026-10-01. Not legal advice: every legal conclusion below is research for counsel to confirm.

Conventions:
- Code claims cite repo-relative `file:line` (paths are in `quicktalog-app/` unless prefixed `quicktalog-backend/` or `quicktalog-packages/`).
- External claims cite a URL. "(snippet)" means the claim comes only from a search-result summary and was not read on the page itself. "(vendor data)" marks figures published by a company that sells consent tools.
- **Fact** = read in code, in a primary source, or observed in a live probe. **Inference** = my reasoning from those facts.

---

## 0. Decision-relevant summary

1. **Today every catalogue visitor is tracked by Quicktalog's own tools with no consent step, and this is worse than the code suggests.** A live probe on 2026-10-01 of `https://www.quicktalog.app/catalogues/electronic-sale` (fresh German-locale mobile browser, analytics endpoints blocked so no hits were sent) found 18-20 cookies (two runs; Hotjar appeared in one) and 8 localStorage/sessionStorage entries before any interaction, and no banner: GA4 `_ga`/`_ga_DT7TJQYK3K` (via Quicktalog's GTM container `GTM-W9RHLVK6`), Hotjar `_hjSession*` (loaded by the GTM container; Hotjar is nowhere in the repo), Microsoft Clarity `_clck`/`CLID` plus Microsoft advertising IDs `MUID` on `.clarity.ms` and `.bing.com`, PostHog `ph_..._posthog` (cookie + localStorage + sessionStorage), Sentry `sentryReplaySession`, and Clerk auth cookies (section 1.2).
2. **Production runs a more invasive Sentry config than the `test` branch:** `origin/main` records 10% of all sessions with Session Replay and sets `sendDefaultPii: true` (section 1.3). Production also serves no Content-Security-Policy header at all; the Report-Only CSP exists only on `test`.
3. **The law is clear for the customer's tags:** GA4, Google Ads and Meta Pixel on EU/UK visitors need prior opt-in consent. This rests on ePrivacy Art. 5(3) as read by the EDPB (Guidelines 2/2023 cover pixels and JS-collected data), on Planet49 (no pre-ticked boxes; tell visitors cookie duration and third-party access) and on Fashion ID (the site operator is joint controller for collection and transmission). Google separately requires Consent Mode v2 signals from advertisers with EEA traffic. A Google-certified CMP is required only for *publishers* (AdSense, Ad Manager, AdMob); IAB TCF is irrelevant to Quicktalog.
4. **Serbia:** the 2023 Law on Electronic Communications, Art. 160(4)-(5), requires *consent* after "clear and complete information" for storing or reading data on an end user's terminal. Two 2026 practitioner guides nevertheless say Serbia has no specific cookie rules. Treat Serbia like the EU (opt-in): the statute text says consent, and ZZPL consent rules mirror the GDPR.
5. **Roles:** the business is controller for its own tags. Google acts as its processor for GA4 by default; Meta is joint controller under its Controller Addendum. Quicktalog should be the business's *processor* for rendering tags, the banner, consent logs and the owner's traffic dashboard. That needs an Art. 28 DPA, which Quicktalog's Terms lack today. Quicktalog is controller for its own purposes (metering, security, product analytics). Joint-controller risk is real: Quicktalog's own visitor analytics feed owner dashboards, which mirrors Wirtschaftsakademie (fan-page admins as joint controllers for Facebook Insights).
6. **Consent must be stored per catalogue (per controller), not per site.** Use one localStorage key per catalogue holding a versioned record and a hash of the vendor list. The consent record itself is exempt as strictly necessary (EDPB taskforce para 30; CNIL Délibération 2020-091 art. 5; ICO). Keep choices for 6 months (CNIL good practice; the Garante does not re-ask for at least 6 months after a refusal), and re-prompt when the vendor list changes. Log choices server-side with minimal data: EDPB 05/2020 para 108 says pointing to a correct website configuration is "not sufficient".
7. **Quicktalog's own tools:** Clarity (consent enforcement for EEA/UK/CH since 31 Oct 2025; it still records sessions in "no-consent mode"), Hotjar, GTM/GA4 (VG Hannover, 19 Mar 2025: GTM needs consent) and Sentry Replay cannot lawfully run on catalogue pages without consent. Only consent-free measurement can safely power the plan meter: server-side request counts or, with caveats, PostHog `cookieless_mode: "always"`. Gating the meter behind consent would leave roughly 32-44% of visitors uncounted (Didomi opt-in rates of 55.7-67.6% of banners shown, vendor data).
8. **No banner when the owner has no tags,** provided Quicktalog's own tools on catalogue routes are reduced to consent-free ones and third-party embeds use click-to-load. A footer "Privacy" link to a notice is still needed.
9. **UX for a phone opened from a QR code:** a non-blocking bottom sheet in the catalogue's language that never locks the menu. It offers equal "Reject" and "Accept" buttons plus "Settings", and names the business, the purposes and Google/Meta as recipients. Ignoring it means no tracking. Basic Consent Mode: no Google or Meta script loads before consent.
10. **Build, don't buy.** Commercial CMPs are scoped and priced per domain: Cookiebot treats `example.com/en` and `example.com/it` as one domain, Usercentrics prices by sessions, CookieYes by pageviews. None models different controllers on different paths of one origin, and each adds a third-party script to the builder's origin. An in-house identity-free component is small. If a library is wanted, vanilla-cookieconsent (MIT) or c15t (Apache-2.0) can serve as the engine.

---

## 1. What a visitor's browser gets today (verified)

### 1.1 Code facts (`test` branch, which is the working tree)

- **Root layout loads Clarity and GTM on every page,** including catalogues: `src/app/layout.tsx:46-49`.
  - Clarity is production-only, `afterInteractive`, project `t0vbket8rt`, and makes no consent call: `src/components/general/ClarityScript.tsx:5-17`.
  - GTM uses `@next/third-parties` 15.5.26, whose `GoogleTagManager` pushes `gtm.start` and loads `gtm.js` with no consent default: `node_modules/@next/third-parties/dist/google/gtm.js`.
- **PostHog and Sentry start on every page.**
  - PostHog `posthog.init` runs with `capture_pageview: true` and no `persistence` option: `src/instrumentation-client.ts:5-19`. Installed posthog-js 1.434.7 defaults to `persistence: "localStorage+cookie"` (`node_modules/posthog-js/dist/module.js`).
  - Sentry runs `replayIntegration()` with `replaysSessionSampleRate: 0` and `replaysOnErrorSampleRate: 1.0`: `src/instrumentation-client.ts:20-39`.
  - Installed `@sentry/replay` 10.75.2 defaults to `stickySession = true`, which writes `sentryReplaySession` to sessionStorage when a session is created, in buffer mode too: `node_modules/@sentry/replay/build/npm/esm/index.js:5721-5729,8161`.
- **The site cookie banner skips catalogues.**
  - It returns early when the pathname contains `/catalogues/`, before `initializeGTMConsent()` runs: `src/components/general/CookieBanner.tsx:28-39`.
  - It reads identity through `useUserContext()`: `src/components/general/CookieBanner.tsx:22`.
  - It is mounted for every page inside the auth and user providers: `src/components/general/PageWrapperClient.tsx:15-25`.
- **The marketing site's "consent mode" is a custom event, not Google Consent Mode.**
  - `initializeGTMConsent` pushes `{event: "consent_default", consent: {...}}`, and `updateGTMConsent` pushes `{event: "consent_update", ...}`: `src/utils/cookies.ts:36-71`. Google's API is the `gtag('consent', 'default'|'update', {...})` command form ([Google consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)).
  - Choices are stored in localStorage key `cookiePreferences`: `src/constants/index.ts:13`, `src/utils/cookies.ts:14-34`. Signed-in users' choices go on `users.cookie_preferences`: `src/actions/consent.ts:25-50`.
- **The CSP is Report-Only and permissive.** `script-src` includes `'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com`, and there is no Facebook host: `next.config.ts:47-69`. PostHog is proxied to the EU cloud via `/ingest` (`next.config.ts:71-86`); Sentry tunnels through `/monitoring` (`next.config.ts:113`).
- **The public catalogue page is ISR** (`revalidate = 86400`) and renders `<Catalogue item type="view">`: `src/app/catalogues/[name]/page.tsx:11,143-147`. Middleware treats `/catalogues/<name>` as public with no session, except `/preview`: `src/middleware.ts:32-36,66-69`. While `AUTH_PROVIDER` is not `supabase`, Clerk middleware runs on every path: `src/middleware.ts:62-64`.
- **Traffic dashboard and meter.**
  - The owner dashboard counts `count()` views and `count(distinct distinct_id)` visitors by `$host` + `$pathname`, including visitors across the whole 7/30/90-day period: `src/lib/analytics/catalogue-traffic.ts:30-40`; `docs/architecture/analytics.md:38`.
  - The daily worker aggregates `$pageview` per `$current_url` with `COUNT(DISTINCT properties.distinct_id)`: `quicktalog-backend/src/utils/analytics.ts:1-26`.
  - The monthly plan meter sums **pageviews only** against `traffic_limit`, for non-Starter users: `quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:23-42,55-58,74-77`. Limits are 500/2,000/5,000/15,000/40,000 (`quicktalog-packages/src/constants/pricing.ts:18,50,82,114,146`).
- **Catalogue data relevant to the banner.**
  - `catalogues.language` defaults to `'eng'` and `legal` is jsonb: `quicktalog-packages/src/drizzle/migrations/schema.ts:120,124`. There are 32 language codes, including `srp` and `srp_latn`: `src/lib/catalogue/items.ts:60-93`.
  - Legal fields `legalName`, `address`, `termsAndConditions` and `privacyPolicy` are entered as free text; the last two are labelled as *links*: `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:14-43`.
  - They render only in the "custom" footer: `src/components/catalogue/view/CatalogueFooter.tsx:117-121,139-145`; `src/components/catalogue/view/components/LegalLinks.tsx:41-61`. The "default" footer links to Quicktalog's own policies: `LegalLinks.tsx:17-40`.
  - The AI tool schema treats `privacyPolicy` and `termsAndConditions` as up to 20,000 characters of **text**, not URLs: `src/agent/tools/navigation.ts:81-103`. The footer uses them as `href`, so the data model is inconsistent.
- **Quicktalog's own legal pages.**
  - The privacy policy names no analytics vendor and has no section for catalogue visitors. Its cookie section is generic: `src/app/(site)/(with-footer)/privacy-policy/page.tsx:102,181-192`.
  - The Terms' governing law is still a placeholder ("[JURISDICTION]", Reactify Solutions): `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:506-509`. I found no data processing agreement.
- **Embeds.** The `embedding` block may iframe YouTube, Google Maps, Facebook, Instagram, TikTok, X, LinkedIn and others: `src/lib/html/sanitize.ts:14-56`.

### 1.2 Live probe of production (2026-10-01)

**Method.** Playwright Chromium from the app's `node_modules` with locale `de-DE`, timezone `Europe/Berlin`, an iPhone user agent and a 390×844 viewport. Every request matching analytics collection endpoints was aborted (`/collect`, `/g/collect`, `/monitoring`, PostHog capture paths, `/tr?`, doubleclick), so **no hit reached any service**. Script loads were allowed so client-side storage could be observed; the page waited 9-10 s after `load`. The script is `scratchpad/consent_storage_probe.mjs` and the output is `consent_storage_probe.out.json`. This was one run per URL, and some tools may sample (Hotjar appeared in one of two runs).

**Catalogue `www.quicktalog.app/catalogues/electronic-sale`: no banner shown.**

| Tool | Cookies set before any interaction (domain, expiry) | Storage | Third-party hosts contacted |
|---|---|---|---|
| Quicktalog GTM `GTM-W9RHLVK6` → GA4 | `_ga`, `_ga_DT7TJQYK3K` (.quicktalog.app, 2027-11-05) | dataLayer contained only `gtm.js`, `gtm.dom`, `gtm.load`, with **no consent commands** | googletagmanager.com, google-analytics.com, google.com (`/g/collect` attempted) |
| Hotjar (site 6516875), injected via GTM, not in the repo | `_hjSessionUser_6516875`, `_hjSession_6516875` | `hjActiveViewportIds` (localStorage), `hjViewportId` (sessionStorage) | static.hotjar.com, script.hotjar.com, content.hotjar.io |
| Microsoft Clarity | `_clck` (.quicktalog.app), `CLID` (www.clarity.ms), `MUID` (.clarity.ms and .bing.com), `MR`, `SRM_B`, `SM`, `ANONCHK` | `_cltk` (sessionStorage) | www.clarity.ms, scripts.clarity.ms, a.clarity.ms, c.clarity.ms, c.bing.com |
| PostHog | `ph_phc_…_posthog` (.quicktalog.app, 1 year) | same key in localStorage and sessionStorage, plus `…_primary_window_exists` | eu-assets.i.posthog.com |
| Sentry | – | `sentryReplaySession` (sessionStorage) | `/monitoring` tunnel (envelopes attempted) |
| Clerk (auth) | `__client` (.clerk.quicktalog.app), `__client_uat`, `__client_uat_pyEulCkp` (.quicktalog.app) | `__clerk_environment` (localStorage) | clerk.quicktalog.app |
| Cloudflare | `cf_clearance` (.quicktalog.app), `__cf_bm`, `_cfuvid` (.clerk.quicktalog.app) | – | static.cloudflareinsights.com (Web Analytics beacon; source not in the repo or in the curl'd HTML) |

`window.google_tag_manager` also listed `G-RXHJ9X3T5T`, so the container holds a second Google tag destination. The live HTML contains `gtm.js?id=GTM-W9RHLVK6` and the Clerk script. The site is proxied by Cloudflare (`server: cloudflare`, `cf-ray … BEG`) in front of Vercel.

**Marketing homepage `www.quicktalog.app/`.** The banner "We respect your privacy" *is* shown, but while it waits for a choice 19 cookies are already set, including `_ga`, `_ga_DT7TJQYK3K`, Clarity/Bing `MUID`, PostHog and Clerk. The dataLayer shows the custom `consent_default` events, yet GA4 still set its cookies. This confirms by observation that the custom event does not work as Consent Mode, unless the container ignores it by design.

**Inference.** For EU visitors this is the exact pattern the CNIL fined SHEIN €150M for on 1 Sept 2025: "several cookies, particularly with advertising purposes, were placed … as soon as they arrived on the site, even before they interacted with the information banner" ([CNIL, SHEIN](https://www.cnil.fr/en/cookies-placed-without-consent-shein-fined-150-million-euros-cnil) (snippet)). The GTM container also lets someone with GTM access add tools such as Hotjar that never appear in code review.

### 1.3 Production (`origin/main`) vs the `test` branch

- **Sentry.** On `origin/main:instrumentation-client.ts` it runs with `replaysSessionSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`, `tracesSampleRate: 1`, `enableLogs: true` and `sendDefaultPii: true` (`git show origin/main:instrumentation-client.ts`, lines ~20-42). The `test` branch has already reduced this to replay-on-error only and `sendDefaultPii: false` (`src/instrumentation-client.ts:28-42`).
- **CSP.** `origin/main:next.config.ts` has no CSP; it was last changed 2026-04-30. `curl -I` shows no CSP header on `www.quicktalog.app`, while `test.quicktalog.app` sends `content-security-policy-report-only`.
- **Cookie banner.** `origin/main:components/general/CookieBanner.tsx:31` has the same `/catalogues/` skip, and `origin/main:app/layout.tsx:45-46` loads Clarity and GTM, so the live probe reflects `main`.

---

## 2. Law

### 2.1 EU: ePrivacy Art. 5(3) and the EDPB's technical reading

**Facts.**
- **Art. 5(3) ePD:** "the storing of information, or the gaining of access to information already stored, in the terminal equipment of a subscriber or user is only allowed on condition that the subscriber or user concerned has given his or her consent, having been provided with clear and comprehensive information … about the purposes of the processing." It "shall not prevent any technical storage or access for the sole purpose of carrying out the transmission of a communication … or as strictly necessary in order for the provider of an information society service explicitly requested by the subscriber or user to provide the service." ([EUR-Lex consolidated ePD](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219))
- **EDPB Guidelines 2/2023 on the technical scope of Art. 5(3).** Version 2.0 was adopted 7 October 2024 and published as final on 16 October 2024 ([EDPB page](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en); [PDF](https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf)). Key paragraphs:
  - **Para 4:** the guidelines "do not address the circumstances under which a processing operation may fall within the exemptions … these circumstances should be analysed on a case-by-case basis accounting for the relevant member state transposition(s), and guidance issued by national Competent Authorities."
  - **Paras 32-33:** taking steps to gain access, including instructing a device "through the use of a protocol, or an SDK" to send stored information, triggers Art. 5(3).
  - **Paras 42-43:** IP or MAC addresses, session identifiers and HTTP headers such as the user agent can be "information"; "relying on those mechanisms to collect information (for example in the context of fingerprinting …) can lead to the application of Article 5(3)".
  - **Para 44:** local processing in the browser is not access "as long as the information does not leave the device, but when this information or any derivation of this information is accessed, Article 5(3) ePD would apply."
  - **Paras 50-51:** tracking pixels and links involve storage, at least via cache, "even if this storage is not permanent". For "dynamically constructed tracking pixels, it is the distribution of the applicative logic (usually a JavaScript code) that constitutes the instruction", and collecting identifiers this way "constitutes a 'gaining of access'".
  - **Para 53:** locally produced information that is "sent back over the network" is a gaining of access.
  - **Paras 54-56:** IP-only tracking can fall under Art. 5(3) where the IP originates from the terminal, such as IPv6 or a static IPv4. Applicability "does not systematically mean that consent needs to be collected"; exemptions must be assessed case by case.
  - **Para 63:** collecting "unique identifiers" via client-side code is a gaining of access.

**Inference.** GA4, Google Ads, Meta Pixel, Clarity, Hotjar, Sentry Replay and PostHog in any mode (cookies or cookieless) are all inside Art. 5(3), because their JavaScript collects device and browsing information and sends it. Whether consent is needed therefore turns entirely on the "strictly necessary" exemption as each Member State and its DPA reads it (section 2.6).

### 2.2 GDPR consent standard

**Facts.**
- **Definition and conditions.** Consent is "freely given, specific, informed and unambiguous" and given "by a statement or by a clear affirmative action" (GDPR Art. 4(11)). Art. 7(1): the controller "shall be able to demonstrate" consent. Art. 7(3): withdrawal "as easy as" giving consent ([GDPR, EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679)).
- **EDPB Guidelines 05/2020 on consent** (v1.1, adopted 4 May 2020; [PDF](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf)):
  - Paras 39-41: cookie walls do not produce freely given consent.
  - Para 64, minimum information: "(i) the controller's identity, (ii) the purpose of each of the processing operations …, (iii) what (type of) data will be collected and used, (iv) the existence of the right to withdraw consent, (v) … automated decision-making … where relevant, and (vi) on the possible risks of data transfers due to absence of an adequacy decision".
  - Para 65: where consent is relied on by multiple (joint) controllers, "these organisations should all be named"; processors need not be named for consent but must be listed under Arts. 13/14.
  - Para 86: scrolling or swiping is never consent.
  - Para 106: proof "should not in itself lead to excessive amounts of additional data processing".
  - Para 108: a controller "could retain information on the session in which consent was expressed, together with documentation of the consent workflow at the time of the session, and a copy of the information that was presented … It would not be sufficient to merely refer to a correct configuration of the respective website."
  - Paras 110-111: there is no fixed duration; if processing "change[s] or evolve[s] considerably" new consent is needed, and consent should be "refreshed at appropriate intervals".
  - Para 114: withdrawal "via the same electronic interface".

### 2.3 CJEU case law

**Facts.**
- **Planet49 (C-673/17, 1 Oct 2019).** Consent "is not validly constituted if … permitted by way of a pre-checked checkbox which the user must deselect" (operative pt 1). The information "includes the duration of the operation of cookies and whether or not third parties may have access to those cookies" (para 81; also paras 75, 80) ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0673)).
- **Fashion ID (C-40/17, 29 Jul 2019).** A site embedding a third-party plugin "can be considered to be a controller", limited to "the collection and disclosure by transmission". Consent "must be obtained by that operator only with regard to the operation[s] … in respect of which that operator determines the purposes and means". The duty to inform also falls on the operator for those operations (operative pts 2-4) ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0040)).
- **Wirtschaftsakademie (C-210/16, 5 Jun 2018).** The administrator of a fan page hosted on Facebook, "by its definition of parameters depending in particular on its target audience and the objectives of managing and promoting its activities", takes part in determining purposes and means. It is a controller "jointly with Facebook Ireland" for processing visitor data, which included Facebook's visitor statistics (para 39; operative pt 1) ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62016CJ0210)).
- **IAB Europe (C-604/22, 7 Mar 2024).** A consent string (TC String) "constitutes personal data … in so far as … those data may, by reasonable means, be associated with an identifier, such as … the IP address". A sectoral organisation that sets binding rules for consent processing "must be classified as a 'joint controller' … where … it exerts influence over the personal data processing at issue, for its own purposes", even without direct data access. That joint controllership "does not extend automatically to the subsequent processing" (operative pts 1-2) ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62022CJ0604)).

### 2.4 EDPB Cookie Banner Taskforce report (adopted 17 Jan 2023)

**Facts** ([PDF](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)):
- **Reject option.** "a vast majority of authorities considered that the absence of refuse/reject/not consent options on any layer with a consent button … constitutes an infringement" (para 08). By default "no cookies which require consent can be set without a consent" (para 07).
- **Pre-ticked boxes** "do not lead to valid consent" (para 11).
- **Design.** Banners must not give "the impression that they have to give a consent to access the website content", nor clearly push users to consent. A reject *link* embedded in text "in the absence of sufficient visual support" is invalid (paras 15-16). Colours and contrast are judged case by case; unreadable reject text is "manifestly misleading" (D/E practices).
- **Legitimate interest.** The legal basis for placing or reading cookies "cannot be the legitimate interests of the controller" (para 24).
- **Preference cookies.** "cookies allowing website owners to retain the preferences expressed by users, regarding a service, should be deemed essential" (para 30, citing WP29 Opinion 04/2012).
- **Withdrawal.** Sites should offer "easily accessible solutions allowing users to withdraw their consent at any time, such as an icon … or a link placed on a visible and standardized place" (para 33). No specific mechanism can be imposed, but withdrawal must be as easy as consent (para 36).

### 2.5 CNIL and other national authorities

**CNIL (France)**
- **Délibération 2020-091 of 17 Sept 2020, art. 5.** Exempt trackers include "les traceurs conservant le choix exprimé par les utilisateurs sur le dépôt de traceurs", authentication trackers, interface-personalisation trackers such as language, load balancing, and "certains traceurs de mesure d'audience" under conditions ([PDF](https://www.cnil.fr/sites/cnil/files/atoms/files/lignes_directrices_de_la_cnil_sur_les_cookies_et_autres_traceurs.pdf)).
- **CNIL FAQ (updated 29 Apr 2026)** ([page](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ)):
  - Q19: continued browsing "doit aujourd'hui s'interpréter comme un refus".
  - Q21: keep the user's choice, consent *or* refusal. "Généralement, une conservation des choix pendant une durée de 6 mois constitue une bonne pratique."
  - Q23: external content (videos, social buttons) needs consent, collected either in the banner or contextually before activation. Refusing must not block the rest of the site.
  - Q25-26: list all controllers, including joint controllers, from the first layer via a link, with links to their privacy policies.
  - Q28: withdrawal "aussi simple" as consent, via a "gérer mes cookies" link or a cookie icon available on all pages.
  - Q35: one consent may cover several domains of *one* publisher if the user perceives one site. Multi-property ("cross-domain") consent across a group's sites is still under study.
  - Q37: a "tout refuser" button "au même niveau et avec le même aspect" as "tout accepter" is a clear and simple way to offer refusal. Alternatively, refusal may be inferred from silence if users are clearly told.
  - Q38: refusal must not require more clicks than acceptance.
  - Q39: no designs that mislead or visually favour one choice.
  - Q17: anti-bot or CAPTCHA trackers whose "seule finalité" is security for users' benefit need no consent.
- **Enforcement.** On 1 Sept 2025 the CNIL fined Google €325M (cookies at Google-account creation, plus Gmail ads) and SHEIN €150M (advertising cookies placed before any banner interaction) ([CNIL press release](https://www.cnil.fr/en/cookie-regulation-cnil-continuing-action-plan-initiated-2019-and-has-imposed-two-fines-shein-and) (snippet); [SHEIN decision SAN-2025-005](https://www.cnil.fr/sites/default/files/2025-09/cnil_sanction_shein_en.pdf) (snippet)).

**Other authorities**
- **Garante (Italy)**, guidelines of 10 June 2021: the banner should not be shown again for at least 6 months after a choice, unless conditions change significantly ([Garante](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876) (snippet)).
- **AEPD (Spain)**, cookie guide, section 3.2.8: "Esta Agencia considera buena práctica que la validez del consentimiento … no tenga una duración superior a 24 meses", with the choice kept meanwhile ([AEPD PDF](https://www.aepd.es/guias/guia-cookies.pdf); verified in the PDF text).
- **VG Hannover (Germany), 19 Mar 2025, 10 A 5385/22.** Official headnotes:
  - "Google Tag Manager requires consent under § 25 TTDSG and Art. 6(1)(a) GDPR".
  - A first layer offering only "Accept all", "Accept & Close X" and "Settings" "lenkt die Nutzer … gezielt zur Abgabe der Einwilligung hin".
  - "Accept & Close X" consent is neither unambiguous nor voluntary.
  - Source: [voris](https://voris.wolterskluwer-online.de/browse/document/230df5cf-d76c-4561-9499-e44445a96f11).
- **Dutch AP (Netherlands), official note of 13 Nov 2025.**
  - With the DPF adequacy decision, transfers to the US "voor zover er is voldaan aan de eisen van het DPF" meet GDPR transfer rules, so the GA3 investigation does not carry over one-to-one to GA4. A total GA ban is "niet voor de hand".
  - Cookie-law supervision of art. 11.7a Tw lies with ACM, and the AP is studying which cookies fall under the exemption.
  - Source: [AP PDF](https://www.autoriteitpersoonsgegevens.nl/system/files?file=2025-12%2FAmbtsbericht+Google+Analytics.pdf). The AP's cookie page says analytics cookies used only to count visitors, with little or no privacy impact, need no consent ([AP cookies](https://autoriteitpersoonsgegevens.nl/nl/onderwerpen/internet-telefoon-tv-en-post/cookies) (snippet)).

### 2.6 Is consent-free audience measurement defensible?

**Facts.**
- **WP29 Opinion 04/2012 (WP194, 7 Jun 2012).**
  - First-party analytics cookies are "not strictly necessary". They are "not likely to create a privacy risk when they are strictly limited to first party aggregated statistical purposes" and come with clear information, "a user friendly mechanism to opt-out" and anonymisation such as for IP addresses.
  - "the European legislator might appropriately add a third exemption criterion … for cookies that are strictly limited to first party anonymized and aggregated statistical purposes."
  - The user-centric security exemption "would not however cover the use of cookies that relate to the security of websites or third party services that have not been explicitly requested by the user."
  - Source: [WP194 PDF](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf).
- **CNIL audience-measurement exemption** ([page, 4 Jul 2025](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience); FAQ Q9-11). The trackers must:
  - have a purpose "strictement limitée à la seule mesure de l'audience du site … pour le compte exclusif de l'éditeur";
  - "servir à produire des données statistiques anonymes uniquement";
  - not lead to "un recoupement des données avec d'autres traitements" nor to non-anonymous data going to third parties;
  - not allow tracking across sites. "Toute solution utilisant un même identifiant à travers plusieurs sites … pour croiser, dédoubler ou mesurer un taux de couverture … unifié … est exclue."
  - Recommendations: inform users; tracker lifetime of 13 months, not auto-extended; data retention of at most 25 months.
  - A processor serving many publishers qualifies only if data are "collectées, traitées et stockées de manière indépendante pour chaque éditeur" and trackers are "totalement indépendants". Offers whose providers "réutiliser les données pour leur propre compte" fall outside the exemption.
  - An opt-out mechanism is required where the legal basis is legitimate interest (Q10). Pseudonymisation is not anonymisation (Q11).
- **UK** (section 2.7): a statutory statistical-purposes exception since 5 Feb 2026.
- **EU, future:** the Digital Omnibus proposal (section 2.10) would add such an exemption EU-wide.

**Inference for Quicktalog.**
- *Today's* PostHog set-up cannot claim the CNIL exemption, for three reasons:
  - it uses persistent cookie and localStorage identifiers;
  - one identifier spans every catalogue on `www.quicktalog.app`, which means different publishers, plus the marketing site;
  - Quicktalog uses the same events for its own purposes (product analytics and plan metering).
- A reconfigured set-up could plausibly qualify in France, the Netherlands and the UK. It would need to:
  - measure audience *for each catalogue owner* only;
  - keep no persistent identifier and no cross-catalogue linkage;
  - make no own-purpose reuse of those events;
  - publish a notice with an opt-out;
  - keep data for at most 25 months.
- Germany and other strict jurisdictions remain uncertain. I did not research the German TDDDG § 25(2) position beyond VG Hannover.
- Plan metering is Quicktalog's *own* purpose, not audience measurement "pour le compte exclusif de l'éditeur". It should therefore rely on mechanisms that involve no terminal access: server-side counts of document requests.

### 2.7 UK (PECR as amended by the Data (Use and Access) Act 2025)

**Facts.**
- DUAA s. 112 and Sch. 12 ("storing information in the terminal equipment of a subscriber or user") came into force on 5 February 2026 under the Data (Use and Access) Act 2025 (Commencement No. 6) Regulations 2026, reg. 2 ([SI 2026/82](https://www.legislation.gov.uk/uksi/2026/82/regulation/2/made)).
- ICO guidance lists five exceptions: communication, strictly necessary, statistical purposes, appearance, and emergency assistance ([ICO](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)). The statistical exception requires that:
  - "the sole purpose of the storage or access is to enable the person to collect information for statistical purposes about how the service is used with a view to making improvements";
  - users get clear information and a "simple and free" way to object;
  - data is not shared "except for the purpose of enabling that other person to assist with making improvements to the service". A third party may help only as a processor.
  - It "does not apply to purposes related to online advertising."
- Consent-preference cookies "can be exempt" as strictly necessary.
- ICO guidance was finalised on 29 Apr 2026 ([secondary](https://measuredcollective.com/ico-updates-cookie-consent-rules-under-the-data-use-and-access-act-what-organisations-need-to-do-now/) (snippet)).

**Inference.** GA4 with advertising features, Meta Pixel and Google Ads still need consent in the UK. Quicktalog's own owner-dashboard statistics may fit the statistical exception if processed only to improve the service. The exception is framed around the service operator's own statistics, so who counts as "the person" on a hosted catalogue needs counsel.

### 2.8 Serbia

**Facts.**
- **Law on Electronic Communications ("Sl. glasnik RS", br. 35/2023), Art. 160 "Tajnost elektronskih komunikacija", para 4:** "Korišćenje elektronskih komunikacionih mreža i usluga radi čuvanja ili pristupanja podacima pohranjenim u terminalnoj opremi krajnjeg korisnika, dozvoljeno je pod uslovom da je krajnji korisnik dao svoj pristanak, nakon što mu je dato jasno i potpuno obaveštenje o svrsi prikupljanja i obrade podataka, u skladu sa zakonom kojim se uređuje zaštita podataka o ličnosti, kao i da mu je pružena prilika da takvu obradu odbije."
  - My translation: using networks and services to store or access data stored in the end user's terminal equipment is permitted if the end user has given consent after clear and complete information about the purpose, in accordance with the data protection law, and has been given the opportunity to refuse.
  - **Para 5** exempts technical storage or access solely to ensure communication, or to provide services the end user explicitly requested.
  - Source: [Paragraf](https://www.paragraf.rs/propisi/zakon-o-elektronskim-komunikacijama.html).
  - Supervision lies with the Regulator (Art. 161) and Ministry inspectors (Art. 163). My search of the penal provisions found no misdemeanour clause citing Art. 160.
- **Practitioners' view.**
  - Chambers Data Protection & Privacy 2026, Serbia (Djeric, Petrovic, Radovic; updated 10 Mar 2026): "Serbian legislation does not have special rules governing the application of cookies, beacons, the use of tracking technologies or behavioural advertising; therefore, the general rules of the PDPA apply" ([Chambers](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/serbia)).
  - DLA Piper: "There are no specific regulations explicitly governing online privacy (including cookies)" ([DLA Piper](https://www.dlapiperdataprotection.com/index.html?t=transfer&c=RS)).
  - DataGuidance says the Commissioner (Poverenik) has issued no cookie guidance ([DataGuidance](https://www.dataguidance.com/notes/serbia-cookies-similar-technologies) (snippet)).
- **ZZPL, the Law on Personal Data Protection ("Sl. glasnik RS", br. 87/2018)** ([Paragraf](https://www.paragraf.rs/propisi/zakon_o_zastiti_podataka_o_licnosti.html)):
  - It applies nine months after entry into force (Art. 102).
  - Consent definition mirrors the GDPR (Art. 4 t. 12).
  - Art. 15: the controller must be able to show consent; "Opozivanje pristanka mora biti jednostavno, kao i davanje pristanka".
  - Art. 3(3)-(4): applies to controllers established in Serbia, and to foreign controllers offering goods or services in Serbia or monitoring activities in Serbia. Those foreign controllers must appoint a Serbian representative (Art. 44), with an exemption for occasional low-risk processing.
  - Art. 64(2): adequacy is presumed for Convention 108 parties and for places "za koje je od strane Evropske unije utvrđeno da obezbeđuju primereni nivo zaštite".
- **Transfers to the US.** The Government's 2019 list still reads "United States (limited to Privacy Shield)". The Foreign Investors Council asks the Government to update it for the EU-US DPF ([FIC White Book 2024 PDF](https://fic.org.rs/wp-content/uploads/2024/11/32-Law-on-Personal-Data-Protection-1.pdf), verified).

**Inference.**
- The statute text requires consent. The practitioner guides probably reflect doubt about whether ZEK's confidentiality article binds website operators rather than e-communications operators.
- Either way, opt-in is the safe and uniform design. ZEK points to ZZPL's consent standard, Serbian catalogues receive EU tourists, and one behaviour for all catalogues is simpler.
- For US transfers, ZZPL Art. 64(2) refers directly to EU adequacy findings. That arguably covers DPF-certified Google LLC and Meta Platforms Inc. even before the Government list is updated, but this needs counsel.

### 2.9 Rest of world (brief)

**Facts.**
- **California (CCPA/CPRA).** It applies to businesses above $26,625,000 annual gross revenue, adjusted from 1 Jan 2025 ([CPPA](https://cppa.ca.gov/regulations/cpi_adjustment.html)), among other thresholds. "Sharing" means for cross-context behavioural advertising. Businesses must honour opt-out preference signals such as Global Privacy Control ([CPPA OOPS](https://cppa.ca.gov/pdf/oops.pdf); [OAG](https://www.oag.ca.gov/privacy/ccpa) (snippet)).
- Outside the EEA, UK, Switzerland and Serbia, opt-in banners are generally not required by law.

**Inference.** Meta Pixel and Google Ads remarketing are "sharing". Few restaurants or salons reach the CCPA thresholds, but honouring GPC as an automatic "reject advertising" is cheap and covers US state laws. One opt-in banner shown to everyone is simpler than geo-switching: ISR pages cannot read request geo, and the customer base is EU/Serbia-heavy.

### 2.10 Forward-looking: EU Digital Omnibus

**Facts.**
- The Commission proposal COM(2025) 837 ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52025PC0837)) moves terminal-access rules into a new GDPR Art. 88a. The proposed exemption in 88a(3)(c) covers "creating aggregated information about the usage of an online service to measure the audience of such a service, where it is carried out by the controller of that online service solely for its own use" (text via [noyb report](https://noyb.eu/sites/default/files/2025-12/noyb%20Digital%20Omnibus%20Report%20V1.pdf) (snippet)).
- The EDPB-EDPS issued Joint Opinion 2/2026 ([PDF](https://www.edpb.europa.eu/system/files/documents/2026-02/edpb_edps_jointopinion_202602_digitalomnibus_en.pdf)).
- The Council's 18 June 2026 position reportedly dropped Art. 88b, the browser consent signals, and the Parliament has not voted ([ppc.land](https://ppc.land/eu-council-drops-cookie-signal-after-google-lobbying-eur-40-50-bn-at-stake/) (snippet)).

**Inference.** Do not build on the Omnibus. Its "solely for its own use" test points the same way as the CNIL: audience measurement is per controller.

---

## 3. Roles, disclosures, legal fields

### 3.1 Who is controller for the customer's GA4, Google Ads and Meta Pixel

**Facts.**
- **Google.** Google says GA processes data "on behalf of" customers under the Ads Data Processing Terms, so Google is a processor ([Google Analytics, safeguarding data](https://support.google.com/analytics/answer/6004245?hl=en) (snippet)). Some data-sharing settings bring the Google Measurement Controller-Controller terms into play ([Google](https://support.google.com/analytics/answer/9012600?hl=en) (snippet)).
- **Meta.** The Controller Addendum, effective 25 Apr 2023, says the business and Meta Platforms Ireland "are Joint Controllers in accordance with Article 26 GDPR". The joint processing "covers collection of Personal Data … and their transmission to Meta Ireland; subsequent processing by Meta Ireland does not constitute part of the Joint Processing". The business must inform data subjects of Meta's role ([Meta](https://www.facebook.com/legal/controller_addendum)).
- **Google's EU User Consent Policy** covers properties under "your control or that of your affiliate or your client". It requires legally valid consent for cookies or local storage where legally required, and for ads personalisation. The site must "conserver la preuve du consentement" (keep proof of consent), give clear revocation instructions, and "clairement identifier chaque partie" (clearly identify every party) receiving data ([Google EUUCP](https://www.google.com/about/company/user-consent-policy/); the scraper received the French rendering).

**Inference.**
- **The business** decides to measure or advertise and enters its own IDs. It is the controller (Art. 4(7)) and, under Fashion ID, the party that must obtain consent for collection and transmission.
- **Quicktalog** renders the tag and the banner on the business's instructions. That is the processor role, and it requires an Art. 28 contract.
- **Joint-controller risk for Quicktalog's integration.** EDPB 07/2020 para 64-65 says a party that sets up "platforms, standardised tools, or other infrastructure" can share means. Para 68 says a common infrastructure does not make parties joint controllers "where the provider is a processor in the absence of any purpose of its own"; footnote 29 says otherwise the provider "should be considered as a processor" ([EDPB 07/2020 v2.1](https://www.edpb.europa.eu/system/files/2023-10/EDPB_guidelines_202007_controllerprocessor_final_en.pdf)). IAB Europe extends joint controllership to a framework designer that acts "for its own purposes". So the risk stays low *as long as* Quicktalog never uses the customers' tag data or consent signals for its own ends.

### 3.2 Quicktalog's own processing on catalogue pages

**Inference.**
- **Controller for its own purposes:** plan metering, security, error monitoring and product analytics.
- **Owner traffic dashboard.** If Quicktalog measures visits *for* each owner, it can be the owner's processor. If it also uses the same data for itself, the closest precedent is Wirtschaftsakademie (fan-page statistics), which made the page owner a joint controller with the platform. Two clean options:
  - **(a)** split the purposes: owner statistics as processor, metering with no terminal access;
  - **(b)** accept joint controllership with an Art. 26 arrangement made available to visitors, as Meta does for Page Insights.
- **EU representative.** If Reactify Solutions is established outside the EU (the Terms do not say), its own tracking of visitors in the EU brings it under GDPR Art. 3(2)(b): "the monitoring of their behaviour as far as their behaviour takes place within the Union". Art. 27 then requires an EU representative unless processing "is occasional … and is unlikely to result in a risk" ([GDPR](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679)). The mirror rule for Serbia is ZZPL Arts. 3(4) and 44.

### 3.3 What must be disclosed, and where

Sources: GDPR Art. 13; EDPB 05/2020 para 64-65; Planet49 para 81; CNIL FAQ Q25-27; Google EUUCP; Meta Controller Addendum.

**First layer (the banner itself).**
- The business's name as controller.
- The purposes in short labels: "measure visits" for analytics; "measure and personalise ads" for advertising.
- That data goes to Google and/or Meta, including outside the EU.
- Reject, Accept and Settings buttons.
- How to change one's mind later ("Privacy choices" link at the bottom).
- A link to the full notice.

**Second layer (Settings).**
- One toggle per purpose, off by default.
- A vendor list with each vendor's identity, role and privacy-policy link.
- Cookie names and durations. GA4's `_ga` and `_ga_<id>` default to 2 years ([Google](https://support.google.com/analytics/answer/11397207?hl=en)); Meta's `_fbp` lifetime should be taken from [Meta's cookie policy](https://www.facebook.com/policies/cookies/), which I did not verify.
- Third-party access, which Planet49 requires.

**Per-catalogue privacy notice page.** It should cover:
- the controller's legal name, address and contact;
- purposes and legal bases: consent for tags, legitimate interest for exempt measurement and security;
- recipients and processors: Google Ireland/Google LLC, Meta Platforms Ireland as joint controller, and Quicktalog as host and processor;
- transfers: the EU-US DPF. The General Court upheld it in *Latombe*, T-553/23, 3 Sept 2025 ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62023TJ0553)); an appeal, C-703/25 P, was filed 31 Oct 2025 ([snippet](https://edpl.lexxion.eu/article/EDPL/2026/1/15)). SCCs are the fallback;
- retention: the owner's GA4 setting of 2 or 14 months ([Google](https://support.google.com/analytics/answer/7667196?hl=en)) and the cookie lifetimes;
- rights, withdrawal, and the right to complain to a supervisory authority;
- Quicktalog's own consent-free measurement and security processing, with the opt-out.

### 3.4 How to use the catalogue's legal fields

**Inference.**
- **Make the fields a precondition.** Require `legalName` plus at least one contact (address or e-mail) before tracking can be enabled. A controller must be identifiable (EDPB 05/2020 para 64(i)).
- **Show them** in the banner (name), the notice and the footer.
- **Fix the `privacyPolicy` semantics first.** The UI and footer treat it as a URL, but the AI schema writes up to 20,000 characters of text (`src/agent/tools/navigation.ts:81-103` vs `BusinessInfoSection.tsx:29-42`, `LegalLinks.tsx:43-58`). Recommendation:
  - Make `privacyPolicyUrl` an optional, validated https URL to the owner's own policy.
  - Generate the catalogue notice from structured data instead of free text.
  - Keep legal identity fields and tracking settings out of AI write paths, or require owner confirmation: they become legal statements shown to visitors.
- **Starter footers.** Starter catalogues use the "default" footer with Quicktalog's links (`LegalLinks.tsx:17-40`), which misattributes the controller. If tracking is a paid feature, the custom footer applies, but the notice link must appear on every footer type.

### 3.5 Contract and policy gaps to close before launch

**Facts.**
- No DPA in the Terms; the governing law is a placeholder (`terms-and-conditions/page.tsx:506-509`).
- The privacy policy names no vendors and does not address catalogue visitors (`privacy-policy/page.tsx:102,181-192`).
- The catalogue newsletter form collects visitor e-mails for owners (`CatalogueFooter.tsx:39-63`), another processor activity.

**Inference.** Quicktalog needs:
- processing terms (Art. 28) covering rendering tags, the banner, consent logs, the traffic dashboard and newsletter sign-ups;
- an updated platform privacy policy with a visitor section;
- the legal entity and jurisdiction filled in;
- an EU/Serbian representative where applicable (section 3.2).

---

## 4. Scope, storage, expiry and records of consent

### 4.1 Per catalogue, not per site

**Inference.**
- **Why per controller.** Consent is "specific" and must identify the controller (GDPR Art. 4(11), Recital 42; EDPB 05/2020 paras 64-65, 68). A visitor who agrees to Bistro A's GA4 has not agreed to Salon B's Meta Pixel. The CNIL lets one consent cover several domains only where they are perceived as *one* publisher (FAQ Q35); one domain with many publishers is the reverse case.
- **Key.** Store one record per catalogue, keyed by the immutable catalogue ID rather than the slug, which can change.
- **Re-prompt.** Re-prompt when the business's vendor set changes, for example adding Meta to GA4 (EDPB 05/2020 para 110). The record carries a hash of the vendor list.
- **Quicktalog's own consent.** Do not ask for any consent for Quicktalog's own tools on catalogue pages. Make those tools consent-free (section 5). Otherwise every catalogue would carry a second, Quicktalog-controlled consent question, confusing on a page the visitor perceives as the business's.

### 4.2 Where to store the record

**Facts.**
- **The record itself is exempt:** EDPB taskforce para 30; CNIL Délibération 2020-091 art. 5 ("traceurs conservant le choix exprimé"); ICO ("can be exempt").
- **Safari ITP** deletes "all of a website's script-writable storage after seven days of Safari use without user interaction on the site". That covers localStorage, sessionStorage and IndexedDB; ITP also caps client-side cookies at 7 days ([WebKit, 24 Mar 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).
- **Project rules.** Public pages and ISR never read cookies or identity (`.claude/CLAUDE.md`), and public paths come back without `Set-Cookie` (`src/middleware.ts:28-33,66-69`).

**Inference.**
- **Use localStorage,** with key `qt:consent:v1:<catalogueId>` and value `{v: bannerVersion, h: vendorHash, a: analytics, m: marketing, t: ISO time, id: random UUID}`. It is never sent to the server, so it keeps CDN caching clean and the "no cookies on public pages" rule intact. It also allows per-catalogue keys on one origin.
- A JS cookie with `Path=/catalogues/<slug>` would also work. It would reach the server on every request, which the server must then ignore, and gets the same 7-day ITP cap.
- **Wrap every read and write in try/catch.** Private modes and blocked storage are not errors; treat them as "no choice yet".
- **Enforce expiry in code** from `t`, because localStorage has no expiry of its own.
- **Isolate GA4 cookies per catalogue.** Configure each catalogue's GA4 with `cookie_prefix` (Google: "_ga becomes example_ga") and a host-only `cookie_domain` ([Google](https://developers.google.com/tag-platform/security/guides/customize-cookies)). Otherwise every GA4 property on `.quicktalog.app`, including Quicktalog's own `G-DT7TJQYK3K`, shares one `_ga` client ID. That would link the same visitor across different controllers and reuse a cookie set under another catalogue's consent.

### 4.3 Expiry and re-prompting

**Facts.** CNIL: keeping both consent and refusal for 6 months is good practice (FAQ Q21). Garante: do not re-ask for at least 6 months (snippet). AEPD: consent valid for at most 24 months (guide 3.2.8). CNIL also recommends a 13-month lifetime for exempt audience trackers.

**Inference.** A rule set that satisfies all of these:
- Remember either choice for 6 months, then ask again.
- Re-ask immediately if the vendor hash or the banner's legal text version changes.
- Never re-ask within the 6 months after a "Reject" unless something material changed.
- If the visitor ignores the banner, store nothing and show it again on the next visit. The EDPB's own site works this way: "If you don't select any of the two options, no cookies will be deployed, but the banner will re-appear every time you enter our website" ([EDPB page footer](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)).
- On iOS, ITP will clear choices after 7 days without a visit to any `quicktalog.app` page, so repeat visitors on iPhones will see the banner more often. This is acceptable.

### 4.4 Records of consent

**Inference.** Google's EUUCP requires the business to keep proof, and EDPB 05/2020 para 108 says configuration alone does not count. Design:
- **What to send.** On each choice, the browser POSTs `{catalogueId, id, bannerVersion, vendorHash, analytics, marketing, language, time}` to a Quicktalog route that sets no cookie and needs no auth. Do not store the IP: it would make the log personal data in the sense of IAB Europe C-604/22 without being needed. Keep at most a coarse country if wanted.
- **What to keep server-side.** Insert into an append-only `consent_events` table. Keep each banner version's exact text and config, giving the "copy of the information presented".
- **Who can read it.** Expose per-catalogue counts and an export to the owner, as processor support for their duty under Google's policy.
- **Retention.** Keep records for the consent's life plus a limitation period set by counsel (EDPB 05/2020 para 107).
- **Implementation notes.** The table needs a Supabase migration with an insert-only policy for the public role, or a SECURITY DEFINER function, plus rate limiting.

### 4.5 Withdrawal

**Inference.**
- **Where.** A "Privacy choices" link in every catalogue footer type and on the notice page reopens the same layer, so withdrawal happens in the same interface (EDPB 05/2020 para 114; taskforce para 33; CNIL Q28). A small persistent icon is optional; a footer link reachable by scrolling a one-page menu is an accepted "visible and standardized place".
- **On withdrawal:**
  - `gtag('consent','update',{… 'denied'})`;
  - `fbq('consent','revoke')` ([Meta Pixel GDPR](https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr) (snippet));
  - delete that catalogue's prefixed GA cookies;
  - stop loading the tags on later visits.

---

## 5. Quicktalog's own scripts on catalogue pages

### 5.1 Microsoft Clarity

**Facts.**
- "Starting October 31, 2025, Clarity begins enforcing consent signal requirements for page visits originating from the European Economic Area (EEA), United Kingdom (UK), and Switzerland (CH)." The API is `window.clarity('consentv2', {ad_Storage, analytics_Storage})`. The older `clarity('consent')` "is planned for deprecation". `clarity('consent', false)` erases Clarity cookies ([Microsoft Learn, updated 28 Aug 2025](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)).
- When consent is granted, Clarity sets "first-party and third-party cookies and track[s] users across sessions". Without consent it runs in "no-consent mode (with limited tracking)" with "a unique ID per page view".
- Microsoft's table for reporting without consent lists "Session recordings: Increased number of session recordings" ([Microsoft Learn](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-without-cookie-consent)).
- The live probe saw Clarity set `MUID` on `.bing.com` and `.clarity.ms` (section 1.2).

**Inference.** Session recording is neither strictly necessary nor exempt audience measurement, and Clarity's no-consent mode still records. Clarity therefore cannot run on catalogue pages without consent; remove it from catalogue routes. On the marketing site, wire it to `consentv2` from the site banner.

### 5.2 PostHog

**Facts.**
- `cookieless_mode: "always"` means PostHog "never stores data in cookies or local/session storage". Unique users come from a server-side `hash(team_id, daily_salt, ip_address, user_agent, hostname)`, and the salt "changes daily which we delete once that day's events have been processed".
- `"on_reject"` means no events are captured "until after consent is either given or denied"; after a refusal PostHog counts with the hash.
- The project setting "Cookieless server hash mode" must be enabled.
- Limitations: "Higher user count … beyond one day"; hash collisions; session replay and surveys disabled; no GeoIP or bot-detection enrichment.
- Sources: [PostHog tutorial, 27 Aug 2025](https://posthog.com/tutorials/cookieless-tracking); [PostHogConfig](https://posthog.com/docs/references/posthog-js/types/PostHogConfig).
- `persistence: 'memory'` is the older equivalent and keeps an in-page ID only.

**Inference on defensibility.**
- **ePrivacy still applies.** Cookieless mode removes "storage" but not "gaining access": the SDK collects URL, referrer and device data via JS (EDPB 2/2023 paras 51, 53, 63). So it is consent-free only where a national exemption applies (section 2.6).
- **Conditions to meet:**
  - PostHog EU as processor under a DPA;
  - `person_profiles: 'never'` and no `identify()`;
  - no reuse of catalogue events for Quicktalog's own product analytics;
  - owner-facing reports only;
  - raw events kept for at most 25 months;
  - a notice with an opt-out, honoured as a flag in exempt storage.
- **Shared hostname.** The hash includes the *hostname*, which every catalogue shares. Within a day the same visitor therefore gets the same hash on every catalogue, so cross-publisher deduplication is technically possible. That is the opposite of the CNIL's per-publisher independence condition. Mitigations:
  - never analyse across catalogues; or
  - compute Quicktalog's own per-catalogue salted hash server-side and send server-side events.
- **Dashboard semantics change.** The dashboard's "unique visitors over the whole period" (`docs/architecture/analytics.md:38`) would overcount. Relabel it as an average of daily visitors, or drop period uniques.

### 5.3 Google Tag Manager: container vs tags

**Facts.**
- A container is a loader. Its tags are configured remotely, and the live container on catalogue pages fired GA4 and Hotjar (section 1.2).
- VG Hannover held that GTM itself requires consent because loading it transmits device data to Google's US servers (section 2.5).
- Google's built-in consent checks exist only for Google tags such as GA, Ads and Floodlight; third-party tags need separate gating ([Google](https://developers.google.com/tag-platform/security/concepts/consent-mode)).

**Inference.** Quicktalog's GTM serves Quicktalog's marketing and has no exempt purpose on a business's catalogue. Remove it from catalogue routes. This also removes the remotely editable injection channel from public catalogue pages.

### 5.4 Sentry (errors and Replay)

**Facts.**
- Buffer mode "will continuously record data … the last 60 seconds of event logs in a memory ring buffer" and uploads on error ([Sentry](https://docs.sentry.io/platforms/javascript/session-replay/understanding-sessions/)).
- Sticky sessions write `sentryReplaySession` to sessionStorage, which the probe observed.
- Production records 10% of all sessions and sends default PII (section 1.3).

**Inference.**
- **Replay is not strictly necessary.** Remove `replayIntegration` from public catalogue routes, or lazy-load it only for signed-in builder pages.
- **Plain error capture** with no storage, PII scrubbing (`sendDefaultPii: false`, which `test` already has) and sampling is a grey area. "Strictly necessary to keep the service working" is arguable, but I found no DPA guidance on error monitoring specifically. It is low risk, but list it in the notice.

### 5.5 Auth SDK and Cloudflare

**Facts.**
- Clerk loads on every page through `PageWrapperClient` (`src/components/general/PageWrapperClient.tsx:15-25`; `src/components/auth/session/ClerkAuthProvider.tsx:35-44`) and set cookies and localStorage for an anonymous catalogue visitor in the probe.
- Cloudflare says `__cf_bm` "is necessary for these bot solutions to function properly" (30-minute inactivity expiry). `_cfuvid` is used only with rate-limiting rules ([Cloudflare](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/)).
- CNIL FAQ Q17 accepts anti-bot trackers whose sole purpose is security; WP194 (2012) was narrower.

**Inference.**
- **Clerk.** Authentication cookies are exempt when the user is authenticating. An anonymous menu visitor has not requested authentication, so don't mount the auth providers or `UserContext` on public catalogue routes. This also enforces the "public pages never read identity" rule.
- **Cloudflare.** Bot-management cookies are commonly treated as strictly necessary; keep them and list them in the notice. Find out what loads the Cloudflare Web Analytics beacon, a zone setting or GTM, and decide whether it belongs on catalogue pages.

### 5.6 Classification table

| Tool on catalogue pages | Without consent? | Condition / action |
|---|---|---|
| Consent record (localStorage) | Yes | Exempt (EDPB TF para 30; CNIL art. 5; ICO) |
| Cloudflare `__cf_bm`/`cf_clearance`/`_cfuvid` | Yes (likely) | Security only; disclose |
| Server-side pageview count, no device access | Yes | Not a terminal access; GDPR legitimate interest; no IP retained |
| PostHog `cookieless_mode: "always"` for owner stats | Plausibly, in FR/NL/UK | CNIL/ICO conditions; no cross-catalogue linkage; no own-purpose reuse; opt-out; ≤25 months |
| Sentry error capture (no replay, PII off) | Grey area | Disclose; minimise |
| Sentry Replay (buffer or session) | No | Remove from catalogue routes |
| Microsoft Clarity | No | Remove; consent-gate elsewhere via `consentv2` |
| GTM container (GA4 `G-DT7TJQYK3K`, Hotjar) | No | Remove from catalogue routes (VG Hannover) |
| PostHog with cookies/localStorage (current) | No | Switch to cookieless or server-side on catalogue routes |
| Clerk auth SDK for anonymous visitors | Not needed | Don't load on public catalogue routes |
| Customer GA4 / Google Ads / Meta Pixel | No | Basic Consent Mode: load only after opt-in |
| Third-party embeds (YouTube, Maps, Instagram, …) | No, if they set trackers | Click-to-load placeholders (CNIL Q23) or an "External media" category |

### 5.7 What this means for the traffic meter and dashboard

**Facts.** The meter sums monthly pageviews and needs no identifier (`subscriptionProcessingJob.ts:23-42,74-77`). Didomi 2026 measured opt-in rates of 55.7-67.6% of banners displayed and no-choice rates of 21.7-27.4% ([Didomi](https://www.didomi.io/blog/benchmark-average-consent-rate-europe), vendor data).

**Inference.**
- **Don't gate the meter.** If Quicktalog's pageview counting were consent-gated, roughly a third or more of visitors would vanish from both the meter and owner dashboards. Customers would hit limits later, and the dashboards would disagree with reality.
- **Options, most robust first:**
  - **(1) Server-side count in middleware.** Middleware runs for `/catalogues/<name>` (`src/middleware.ts:79-85`). Use `event.waitUntil` so the response isn't delayed, filter bots and `next-router-prefetch`, and store no IP.
  - **(2) Server-side capture to PostHog** with a per-catalogue daily salted hash computed by Quicktalog.
  - **(3) PostHog cookieless "always"** in the browser.
- **Tell customers.** Any switch changes the numbers: server counts include adblock users, minus filtered bots. Document this, and consider recalibrating `traffic_limit`.

---

## 6. Banner UX for a phone opened from a QR code

### 6.1 Legal constraints that shape the UX

- No tag before a choice.
- A reject option on the first layer, as easy as accept (EDPB TF para 08; CNIL Q37-38).
- No pre-ticked toggles (Planet49).
- No design that steers (EDPB TF; VG Hannover; CNIL Q39).
- Silence or scrolling is refusal (CNIL Q19; EDPB 05/2020 para 86).
- No cookie wall: the menu must stay usable after refusal (EDPB 05/2020 paras 39-41).
- Name the controller and recipients (EDPB 05/2020 para 64-65; CNIL Q25-26).
- A persistent withdrawal path (EDPB TF para 33).

### 6.2 Evidence on design and consent rates

**Peer-reviewed studies**
- **Nouwens et al., CHI 2020.** Only 11.8% of CMP banners met minimal legal requirements. "notification style (banner or barrier) has no effect; removing the opt-out button from the first page increases consent by 22--23 percentage points; and providing more granular controls on the first page decreases consent by 8--20 percentage points" ([arXiv 2001.02479](https://arxiv.org/abs/2001.02479)).
- **Utz et al., CCS 2019** (80,000+ users on a German site; read in the PDF text) ([arXiv 1909.02638](https://arxiv.org/abs/1909.02638)):
  - Small bars at the top or bottom got low interaction (2.9% and 9.6%); the bottom-left position "received the most attention".
  - Experiment 2 (36,395 participants): interaction 13.8%-55.3%, highest (55%) "for binary notices on mobile devices".
  - Pre-selected checkboxes led "around 30 % of mobile users and 10 % of desktop users to accept all third parties", against "< 0.1 %" with true opt-in.
  - Highlighting "Accept" raised acceptance (50.8% vs 39.2% on mobile).
- **Bielova et al., USENIX Security 2024** (co-authored by CNIL staff): "a 'bright pattern' that highlights the decline option has a substantial effect on users' decisions". Design effects "persist … designs can significantly affect users' future choices" ([USENIX](https://www.usenix.org/conference/usenixsecurity24/presentation/bielova)).

**Industry benchmarks (vendor data, Didomi 2026)**
- **By region** ([Didomi, 19 Mar 2026](https://www.didomi.io/blog/benchmark-average-consent-rate-europe)): consent rate 75.1%-89.3%, with France at 71%; opt-in rate 55.7%-67.6% of banners displayed; no-choice rate 21.7%-27.4%.
- **By format** ([Didomi, 2 Apr 2026](https://www.didomi.io/blog/best-consent-banner-format-europe-2026)), where consent rate = "the share of opt-ins among users who made a choice":
  - pop-up: 78.5% adoption, 69.9% consent rate;
  - footer: 19.8% adoption, 69.7% consent rate; its placement "may also mean some users never see it at all";
  - full-screen: 77.2%;
  - header: 80%.
- **By device** ([Didomi](https://www.didomi.io/blog/benchmark-consent-rate-by-device)): mobile 80.6%, desktop 77.8%.

**Inference.** A fair, non-blocking bottom sheet with equal Reject/Accept buttons costs some acceptance compared with nudged designs. On mobile, with a short binary choice, expect roughly half to two-thirds of visitors to be measurable by the owner's GA4. Tell owners this up front, and that Quicktalog's built-in counts do not depend on the banner.

### 6.3 Recommended design

**Inference: spec for the catalogue banner.**
- **When it shows.** Render only when the published catalogue has at least one consent-requiring integration. That is decided at ISR time from catalogue data; no identity is involved.
- **Layout.**
  - A bottom sheet anchored to the bottom safe area, at most about 35% of a 390×844 viewport.
  - No backdrop, no scroll lock, no focus trap: the menu stays fully usable. This is a non-modal region, not a dialog.
  - Collapse the sheet to a small "Privacy choices" pill after the user scrolls without choosing. That counts as no choice, so no tags load.
- **Controls.**
  - "Reject" and "Accept" side by side, the same size and the same visual weight.
  - "Settings" opens the second layer; a "Privacy notice" link sits beside it.
  - Touch targets of at least 44px and WCAG AA contrast inside the catalogue theme.
- **Copy** (EN template; needs native-speaker and legal review):
  - "**Bistro Luna** would like to use Google Analytics to count visits and Meta to measure its ads. This stores cookies and sends data about your device and visit to Google and Meta, including in the USA. Nothing is sent unless you agree. You can change this anytime under 'Privacy choices'. [Reject] [Accept] · Settings · Privacy notice"
  - Serbian (Latin) illustration: "**Bistro Luna** želi da koristi Google Analytics za merenje poseta i Meta za merenje oglasa. Time se čuvaju kolačići i podaci o vašem uređaju i poseti šalju kompanijama Google i Meta, i u SAD. Ništa se ne šalje bez vaše saglasnosti. Izbor možete promeniti u svakom trenutku preko „Podešavanja privatnosti“. [Odbij] [Prihvati] · Podešavanja · Obaveštenje o privatnosti"
- **Language.** Default to the catalogue's `language`, mapped by `localeForLanguage` (`src/lib/catalogue/items.ts:97-100`). Fall back to English. Optionally prefer `navigator.language` when a translation exists. Ship translations for all 32 codes before enabling the setting in a language.
- **Second layer.**
  - Toggles: "Statistics (Google Analytics)" maps to `analytics_storage`. "Advertising (Meta, Google Ads)" maps to `ad_storage`, `ad_user_data`, `ad_personalization` and the Meta grant. All are off by default.
  - "Accept all", "Reject all" and "Save choices", with the vendor and cookie table.
- **Signals.**
  - Use Basic Consent Mode: no Google or Meta script before consent ([Google](https://developers.google.com/tag-platform/security/concepts/consent-mode): basic mode "transmits no data to Google prior to user interaction").
  - On grant: set `gtag('consent','default', all denied)`, then `update` with the granted types. Then load gtag.js with the per-catalogue `cookie_prefix`. For Meta: `fbq('consent','grant')`, `init` and `PageView`.
  - Treat `navigator.globalPrivacyControl === true` as a refusal of advertising.
- **Never.** No cookie wall; no "Accept & close ×"; no consent on scroll.

### 6.4 Should the banner appear when the owner has no tags?

**Inference.** No. Two conditions apply:
- (a) Quicktalog's catalogue-route tooling is reduced to the "Yes" rows of section 5.6;
- (b) third-party embeds are click-to-load.

Without them, there is nothing to consent to. Art. 13 information is still due for Quicktalog's own processing, and the CNIL recommends informing about exempt trackers (FAQ Q18). So keep a footer "Privacy" link to the notice. Starter catalogues would then have no banner at all.

---

## 7. Build vs buy

### 7.1 Open-source options

Versions and licences are from `npm view` on 2026-10-01.

| Library | Licence / version / last publish | Google Consent Mode | Fit for per-catalogue consent on one origin |
|---|---|---|---|
| orestbida/cookieconsent (`vanilla-cookieconsent`) | MIT, 3.1.0, 2025-02-04 | Documented example wiring `gtag('consent','default'/'update')` via callbacks ([docs](https://cookieconsent.orestbida.com/advanced/google-consent-mode.html)) | Good: `cookie: {name, domain, path, expiresAfterDays (number or fn; default 182), useLocalStorage}` allows a per-catalogue name and localStorage; `revision` re-prompts; `disablePageInteraction` is opt-in. Risk: no release since Feb 2025; its own CSS needs theming |
| c15t | Apache-2.0, 2.2.1, 2026-09-28 | Yes (GTM, GCM v2), IAB TCF 2.3 optional; hosted or self-hosted backend for consent records ([GitHub](https://github.com/c15t/c15t)) | React/Next-native and active; per-catalogue namespacing needs verifying |
| tarteaucitron.js | MIT, 1.35.1, 2026-09-23 | `"googleConsentMode": true` built in ([GitHub](https://github.com/AmauriC/tarteaucitron.js)) | Site-wide model with `cookieName`; the CNIL's own site uses a tarteaucitron panel (seen on cnil.fr) |
| Klaro (kiprotect) | BSD-3-Clause, 0.7.21, 2024-03-26 | n/a | Stale |

### 7.2 Commercial CMPs: pricing model and fit

| Vendor | Pricing model (public page, 2026) | Fit |
|---|---|---|
| Cookiebot | Per domain by subpages: Free (50), Lite $8, Small $16 (350), Medium $34 (3,500), Large $56 (7,000), XL $96 (>7,000) per month. "`example.com/en`, `example.com/it` … are treated as 1 domain" ([Cookiebot](https://www.cookiebot.com/en/pricing/)) | One consent config per domain. Every catalogue on `www.quicktalog.app` would share one controller identity, one vendor list and one stored choice: wrong for multi-controller paths |
| Usercentrics | Sessions per month: Free 1k; Essential $8 1.5k; Plus $16 3k; Pro $34 15k (3 domains); Business $56 50k (10 domains); Corporate custom from 1M ([Usercentrics](https://usercentrics.com/pricing/)) | Cost scales with all catalogue traffic; domain-scoped storage |
| CookieYes | Per domain by pageviews: Free 5k; Basic $10 100k; Pro $25 300k; Ultimate $55 unlimited; extra $0.30 per 1k ([CookieYes](https://www.cookieyes.com/pricing/)) | Domain-scoped |
| iubenda | Per site by pageviews, Essentials to Ultimate ([iubenda](https://www.iubenda.com/en/pricing/) (snippet)) | Domain-scoped |
| Didomi | Custom quotes, priced on monthly unique visitors ([third-party summary](https://www.enzuzo.com/blog/didomi-pricing) (snippet)) | Enterprise |

### 7.3 Certified CMP and TCF

**Facts.**
- Google requires a Google-certified CMP integrated with IAB TCF only for "partners using our publisher products—Google AdSense, Ad Manager, or AdMob" serving ads to the EEA or UK (since 16 Jan 2024) and Switzerland (since 31 Jul 2024) ([Google, for publishers](https://support.google.com/admanager/answer/13554116?hl=en); [for CMPs](https://support.google.com/admanager/answer/13554020?hl=en)).
- Advertisers must "collect consent … and share consent signals with Google". If "you maintain your own banner, implement consent mode v2". A CMP Partner is optional ([Google Ads Help](https://support.google.com/google-ads/answer/14625550?hl=en)).

**Inference.** Catalogue owners are advertisers or analysts, not publishers selling inventory. No certified CMP is required and TCF is irrelevant. Adopting TCF would add complexity and IAB-framework obligations (cf. C-604/22) for no benefit.

### 7.4 Recommendation

**Inference: build an in-house, identity-free consent component.**
- **Why build:**
  - It must scope consent per catalogue on one origin. CMPs scope per domain, and Cookiebot explicitly treats paths as one domain.
  - It must render inside an ISR page without identity or cookies.
  - It must follow each catalogue's theme and its 32 languages.
  - It must emit Google Consent Mode v2 commands and the Meta consent API, and log consent records to Quicktalog's own database.
  - No third-party CMP script is added to the origin that hosts the signed-in builder.
- **Size.** A small client component plus an inline bootstrap of a few lines that defines `dataLayer`/`gtag` and the default denied state. Tags are injected only after a stored or new grant.
- **Library fallback.** If a library is preferred, use vanilla-cookieconsent as the engine: per-catalogue `cookie.name`, `useLocalStorage: true`, `revision` = vendor hash. Or use c15t if its storage can be namespaced per catalogue; that needs checking.

---

## 8. Sequencing implied by the consent findings

1. **Now, independent of the GA4 feature.** On catalogue routes:
   - stop Quicktalog's GTM (which removes Quicktalog GA4 and Hotjar), Clarity, Sentry Replay and the auth SDK;
   - move catalogue measurement to consent-free counting (section 5.7) and adjust dashboard semantics.
   - On the marketing site, implement real Consent Mode and gate Clarity, PostHog and GTM before any choice. The probe shows tags firing while the banner waits.
2. **Per-catalogue privacy notice and footer link,** built from structured legal fields. Fix the `privacyPolicy` field semantics.
3. **The banner component** (section 6.3), the consent log (section 4.4), and the withdrawal link.
4. **Then the GA4, Google Ads and Meta settings.** IDs only; tags injected only after consent; per-catalogue `cookie_prefix` and host-only cookies; tags never on `/preview` or `/admin`.
5. **Legal paperwork:**
   - a processing agreement (Art. 28) in the Terms;
   - a platform privacy policy with a visitor section and a vendor list;
   - the entity and jurisdiction filled in;
   - EU and Serbian representatives assessed;
   - a review of whether GA4/Meta transfers rely on DPF (EU) and on ZZPL Art. 64 (Serbia).

---

## 9. Gaps and open questions

- **Entity location.** Where is Reactify Solutions established? This decides Art. 3(2)/27 GDPR exposure and which DPA leads.
- **GTM container contents.** Who controls `GTM-W9RHLVK6` and what else it injects. Two GA4 destinations (`G-DT7TJQYK3K`, `G-RXHJ9X3T5T`) and Hotjar were seen; I did not inspect the container.
- **Cloudflare Web Analytics beacon.** Its origin is unknown: a zone setting or GTM.
- **German position.** Not researched beyond VG Hannover: does TDDDG § 25(2) allow any consent-free analytics? Same for other strict Member States.
- **Serbian authorities.** Whether the Serbian Regulator or the Poverenik has applied ZEK Art. 160(4) to websites; I found no guidance or decisions.
- **Owner-dashboard role.** Whether Quicktalog should be processor only for owner dashboards (option a), or accept joint controllership (option b); counsel decision.
- **Consent-log retention.** Retention period, and whether storing a coarse country is acceptable.
- **Meta details.** Meta Pixel cookie lifetimes, and whether `fbevents.js` should not load at all before consent; I recommend not loading it.
- **Unverified snippets.** Garante text, Didomi pricing, iubenda pricing, the Latombe appeal status and the Omnibus Council position all come from snippets or secondary sources.

## Sources (primary first)

- ePrivacy Directive (consolidated): https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219
- GDPR: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679
- EDPB Guidelines 2/2023 v2.0: https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf
- EDPB Guidelines 05/2020 (consent): https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf
- EDPB Guidelines 07/2020 v2.1 (controller/processor): https://www.edpb.europa.eu/system/files/2023-10/EDPB_guidelines_202007_controllerprocessor_final_en.pdf
- EDPB Cookie Banner Taskforce report: https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf
- WP29 Opinion 04/2012 (WP194): https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf
- CJEU: Planet49 https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0673 ; Fashion ID https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0040 ; Wirtschaftsakademie https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62016CJ0210 ; IAB Europe https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62022CJ0604 ; Latombe (GC) https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62023TJ0553
- CNIL: guidelines 2020-091 https://www.cnil.fr/sites/cnil/files/atoms/files/lignes_directrices_de_la_cnil_sur_les_cookies_et_autres_traceurs.pdf ; FAQ https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ ; audience measurement https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience
- AEPD guide: https://www.aepd.es/guias/guia-cookies.pdf ; Garante: https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876 ; Dutch AP: https://www.autoriteitpersoonsgegevens.nl/system/files?file=2025-12%2FAmbtsbericht+Google+Analytics.pdf ; VG Hannover: https://voris.wolterskluwer-online.de/browse/document/230df5cf-d76c-4561-9499-e44445a96f11
- UK: SI 2026/82 https://www.legislation.gov.uk/uksi/2026/82/regulation/2/made ; ICO exceptions https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/
- Serbia: ZEK 2023 https://www.paragraf.rs/propisi/zakon-o-elektronskim-komunikacijama.html ; ZZPL https://www.paragraf.rs/propisi/zakon_o_zastiti_podataka_o_licnosti.html ; FIC White Book 2024 https://fic.org.rs/wp-content/uploads/2024/11/32-Law-on-Personal-Data-Protection-1.pdf ; Chambers 2026 https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/serbia ; DLA Piper https://www.dlapiperdataprotection.com/index.html?t=transfer&c=RS
- US: https://cppa.ca.gov/regulations/cpi_adjustment.html ; https://cppa.ca.gov/pdf/oops.pdf
- Digital Omnibus: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52025PC0837 ; EDPB-EDPS Joint Opinion 2/2026 https://www.edpb.europa.eu/system/files/documents/2026-02/edpb_edps_jointopinion_202602_digitalomnibus_en.pdf
- Google: consent mode https://developers.google.com/tag-platform/security/concepts/consent-mode ; EEA advertiser requirements https://support.google.com/google-ads/answer/14625550?hl=en ; publisher CMP requirement https://support.google.com/admanager/answer/13554116?hl=en ; EUUCP https://www.google.com/about/company/user-consent-policy/ ; GA4 cookies https://support.google.com/analytics/answer/11397207?hl=en ; GA4 retention https://support.google.com/analytics/answer/7667196?hl=en ; cookie customisation https://developers.google.com/tag-platform/security/guides/customize-cookies
- Meta: Controller Addendum https://www.facebook.com/legal/controller_addendum ; Pixel GDPR https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr
- Microsoft Clarity: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2 ; https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-without-cookie-consent
- PostHog: https://posthog.com/tutorials/cookieless-tracking ; https://posthog.com/docs/references/posthog-js/types/PostHogConfig
- Sentry: https://docs.sentry.io/platforms/javascript/session-replay/understanding-sessions/
- Cloudflare cookies: https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/
- WebKit ITP: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- Studies: Nouwens et al. https://arxiv.org/abs/2001.02479 ; Utz et al. https://arxiv.org/abs/1909.02638 ; Bielova et al. https://www.usenix.org/conference/usenixsecurity24/presentation/bielova ; Didomi benchmarks https://www.didomi.io/blog/benchmark-average-consent-rate-europe , https://www.didomi.io/blog/best-consent-banner-format-europe-2026 , https://www.didomi.io/blog/benchmark-consent-rate-by-device
- Libraries and CMPs: https://cookieconsent.orestbida.com/advanced/google-consent-mode.html ; https://github.com/c15t/c15t ; https://github.com/AmauriC/tarteaucitron.js ; https://www.cookiebot.com/en/pricing/ ; https://usercentrics.com/pricing/ ; https://www.cookieyes.com/pricing/
- Live probe artefacts (scratch): `/private/tmp/claude-501/-Users-nikola-Desktop-Quicktalog/b64d7aca-2aef-4bfb-96c9-9b9e1c127e6e/scratchpad/consent_storage_probe.mjs`, `consent_storage_probe.out.json`, `consent_storage_probe_home.out.json`, `consent_banner_check.mjs`
