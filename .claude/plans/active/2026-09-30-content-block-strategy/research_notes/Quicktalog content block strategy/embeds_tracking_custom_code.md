# Embeds, tracking scripts, custom code and banners: how website, store, menu and link-in-bio builders separate them (state as of September 2026)

Scope note: research covered Shopify, Wix, Squarespace, Webflow, Framer, Carrd, Linktree, Beacons, Taplink, Softr, Notion / Notion Sites and BentoBox (restaurant websites), plus Google, MDN, CJEU, EDPB and security sources. Pages were fetched between 29 and 30 September 2026. Some help-center pages show "last updated" dates in September 2026, e.g. Squarespace's pop-up article ([Squarespace](https://support.squarespace.com/hc/en-us/articles/115008375848-Creating-a-promotional-pop-up)). Sources marked "(third-party)" or "(search summary)" are weaker than the vendor's own docs.

## 1. Embeds: URL-first vs paste-embed-code, purpose-built blocks vs one generic embed

### Takeaway
The prevailing pattern has three layers:
- **URL-first embed.** The user pastes a normal share link and the platform detects the provider (oEmbed, Iframely, or a fixed provider list) and renders a curated player.
- **Purpose-built blocks** for the highest-volume content types: video, map and social post.
- **Raw embed code as a separate escape hatch.** It sits on a higher tier and is sandboxed, restricted or hidden in the editor.

Link-in-bio tools such as Linktree offer only the curated layers and no raw code.

### Cited Findings
- **Notion (URL-first via Iframely, plus preset blocks).** "Notion allows you to embed external content from over 1,900 domains via the Iframely service." "In most cases, Notion will recognize an embeddable URL when you paste it into your page." — [Notion Help](https://www.notion.com/help/embed-and-connect-other-apps)
  - Notion also has "preconfigured embed blocks for some of the commonly used media types (e.g., File, Image, PDF, Video) and apps (CodePen, Loom, Miro, Tweet)". Typing "/tweet" embeds a Tweet and "/maps" embeds an interactive Google Map. — [Notion Help](https://www.notion.com/help/embed-and-connect-other-apps)
  - Caveat from the same page: "Some websites prohibit their content from being embedded elsewhere." — [Notion Help](https://www.notion.com/help/embed-and-connect-other-apps)
- **Squarespace (oEmbed URL first, code snippet second, purpose-built blocks preferred).** "The embed block pulls content from external sites and services that use the oEmbed Standard. If you have more advanced or customizable code, use a code block." Embed blocks are available on all plans. — [Squarespace: Add custom code](https://support.squarespace.com/hc/en-us/articles/205815928-Add-custom-code-to-your-site)
  - The Embed block accepts either a URL "from a site that uses the oEmbed standard" or "Code snippet → Embed Data" for a manual embed code. — [Squarespace: Embed blocks](https://support.squarespace.com/hc/en-us/articles/206543617-Embed-blocks)
  - Squarespace steers users to dedicated blocks: "For most YouTube and Vimeo videos, use the video block instead." — [Squarespace: Embed blocks](https://support.squarespace.com/hc/en-us/articles/206543617-Embed-blocks)
  - Embedded code is hidden from logged-in editors: "As a security measure, sometimes embedded code or content doesn't appear when you're logged in. As long as the code is valid, it should display to visitors." — [Squarespace: Embed blocks](https://support.squarespace.com/hc/en-us/articles/206543617-Embed-blocks)
  - Code blocks accept plain text, HTML, Markdown and CSS on all plans. "Adding JavaScript or iframes to code blocks is available in the Core, Plus, Advanced" and some legacy plans. — [Squarespace: Code blocks](https://support.squarespace.com/hc/en-us/articles/206543167-Code-blocks)
  - After a downgrade to Basic, JavaScript or iframe code "will remain in the block, but it won't be functional", with a logged-in-only notice. — [Squarespace: Premium features](https://support.squarespace.com/hc/en-us/articles/115015517328-Premium-features)
- **Wix (HTML iframe element, always sandboxed).** "Code within the HTML element is displayed on your client's site within a sandboxed iFrame. Using a sandbox protects visitors from potential side effects of custom code." — [Wix: Adding an HTML iFrame Element](https://support.wix.com/en/article/studio-editor-adding-an-html-iframe-element)
  - The sandbox re-enables allow-same-origin, allow-forms, allow-popups, allow-scripts and allow-pointer-lock. — [Wix: Adding an HTML iFrame Element](https://support.wix.com/en/article/studio-editor-adding-an-html-iframe-element)
  - The embed is served from a per-site subdomain of filesusr.com. A user saw the error "www-driftscape-com.filesusr.com refused to connect" (user report, not official doc). — [Wix Studio forum](https://forum.wixstudio.com/t/filesusr-com-refused-to-connect-with-html-embed/59940)
  - Wix announced tighter sandboxing of iframes and custom elements from 1 January 2025 "to improve the security of apps and components on Wix sites". Access to sessionStorage, localStorage, cookies, IndexedDB and cache "will be limited". — [Wix: Updates to iFrames and Custom Elements](https://support.wix.com/en/article/updates-to-iframes-and-custom-elements)
- **Webflow (dedicated media elements plus a paid-tier code embed).**
  - The Video element embeds third-party-hosted video by URL from a fixed provider list: YouTube, Vimeo, DailyMotion, Wistia, TED, Twitch, Hulu and others. — [Webflow: Video](https://help.webflow.com/hc/en-us/articles/33961304305427-Video)
  - A separate YouTube element exposes YouTube's embed options such as start time and controls. — [Webflow: YouTube video](https://help.webflow.com/hc/en-us/articles/33961367617299-YouTube-video)
  - The Map element "embed[s] an interactive map ... via the Google Maps API" and needs an API key. — [Webflow: Map](https://help.webflow.com/hc/en-us/articles/33961389315987-Map) (search summary)
  - Code Embed elements "are available on any paid Site plan and on Core, Growth, Agency, and Freelancer Workspace plans". — [Webflow Help: Meta Pixel](https://help.webflow.com/hc/en-us/articles/33961406577171-Embed-Meta-Pixel-on-your-Webflow-site)
- **Framer (one Embed component with URL or HTML mode).** Users "input the desired URL into the component", or add a `<script>` tag "in the HTML section of the Embed component". Framer warns: "Some websites may block embedding through HTTP headers." — [Framer Help: iframe or embed script](https://www.framer.com/help/articles/how-to-add-an-iframe-or-embed-script/)
- **Carrd (one Embed element, Pro Standard and up).** The Embed element "allows you to insert custom HTML, CSS, and even Javascript code practically anywhere on a site (including its <head> element)".
  - Style "Inline" places the code where the element sits. Style "Hidden" places it in Head, Body Top or Body End.
  - "The embed element will not actually output anything in the builder so you'll need to publish the site to see it in action."
  - Requires Pro Standard or higher.
  - Source: [Carrd docs: Embedding Custom Code](https://carrd.co/docs/building/embedding-custom-code)
- **Linktree (curated link apps only).** Link apps exist for "YouTube, Music, Spotify, TikTok and Instagram". Google Maps links can use the "Featured" layout "for an expanded map preview". — [Linktree Help: Google Maps](https://help.linktr.ee/en/articles/9035839-how-to-add-a-google-maps-link-to-your-linktree), [Linktree Help: Featured Layouts](https://help.linktr.ee/en/articles/8580581-how-to-feature-your-links-with-a-visual-preview-on-linktree) (search summary)
  - A third-party comparison states Linktree "supports specific embed types (Spotify, YouTube, TikTok, etc.) as 'link types' that render inline. You cannot add arbitrary HTML or custom JavaScript. The integrations are curated rather than open." — [startwith.carrd.co](https://startwith.carrd.co/) (third-party)
  - Linktree's own paid-features overview lists no custom code, CSS or JS feature. — [Linktree: paid features overview](https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree)
- **Shopify (Liquid setting in the editor; apps via theme extensions, not script tags).** The Online Store 2.0 "Liquid input setting allows merchants to add custom Liquid code directly from the editor" and is "similar to the HTML setting type". It powers the Custom Liquid section. — [Shopify developer changelog](https://shopify.dev/changelog/online-store-2-0-introducing-the-new-liquid-input-setting) (search summary)
  - Apps that load JavaScript must move from script tags to "an app embed block in a theme app extension". Analytics-only scripts should become "a web pixel". — [Shopify dev community announcement](https://community.shopify.dev/t/deprecation-script-tags-will-stop-running-on-march-1-2027/37108)

### Inferences
- **The standard is layered.** Most products pair (a) a paste-a-link embed backed by provider detection, (b) named blocks for video, map and social post, and (c) a separate raw-code block that is paid, sandboxed or hidden while editing. No surveyed product uses "paste iframe code" as its main embed UX for mainstream providers. Even Squarespace, which accepts codes, puts URL/oEmbed first and points video users to its Video block.
- **Quicktalog's current `embedding` block is closer to the Linktree/Notion curated model than to raw code.** It is an allowlisted iframe with no scripts, which fits a same-origin, SMB-focused product. The industry-standard improvements are mostly UX:
  - accept share URLs rather than iframe snippets;
  - detect the provider, either against the allowlist or via an oEmbed/Iframely-style resolver;
  - render per-provider;
  - add purpose-built blocks for the few embeds SMBs actually use, such as Map (address → Google Maps), Video (YouTube/Vimeo), Social post (Instagram/TikTok/Facebook) and Booking (e.g. Calendly).
- **Third-party embeds should be treated as tracking-adjacent.** Maps, video and social iframes contact the provider on page load, so they carry consent implications (see Q6).

### Gaps
- I did not verify Beacons' embed/block catalogue or Shopify's Video section fields.
- Framer's documentation does not say whether HTML-mode embeds render in an iframe or inline in the page.
- Squarespace's current docs don't name the oEmbed resolver they use, e.g. whether it's Embedly. Webflow's docs likewise don't say whether its Video element uses Embedly.

## 2. Tracking: where GA4, GTM, Meta Pixel and TikTok Pixel live, at which tier, GTM restrictions, and consent handling

### Takeaway
Every product surveyed treats tracking as site-level configuration, never as a positional content block. The common form is validated ID fields in an "Integrations / Marketing / Analytics" settings area (GA4 "G-" ID, Meta Pixel ID, TikTok Pixel ID), usually on a paid tier, plus site-wide head/body code for anything else.

GTM support splits by architecture:
- **Generalist site builders support it.** Wix and Softr have native GTM fields. Webflow offers it via app or custom code. Squarespace, Framer and Carrd support it via head code.
- **Linktree and Notion Sites don't document it.** They offer only fixed integrations.
- **Shopify confines it** to a sandboxed "custom pixel".

Consent is handled by built-in banners that gate platform-rendered integrations: Shopify, Squarespace (Consent Mode), Wix (Usercentrics, Consent Mode v2) and Framer (component with GTM + Consent Mode). Arbitrary code must be categorised (Wix) or is outside the banner's reach (Shopify).

### Cited Findings
**Shopify (Customer Events / Web Pixels API)**
- "Web pixels are loaded in a sandbox on a visitor's browser, and are designed to give merchants and customers complete control over what data is accessible". Features "that rely on scraping the DOM for information or attempting to write to the DOM" won't work. — [shopify.dev: About web pixels](https://shopify.dev/docs/apps/build/marketing/pixels)
- **Two sandboxes.** App pixels run in a "strict sandbox environment using web workers". "Custom pixels are loaded in a lax sandbox environment. The lax sandbox is an iframe element that has the sandbox attribute defined with the allow-scripts and allow-forms values." — [shopify.dev: About web pixels](https://shopify.dev/docs/apps/build/marketing/pixels)
- **No access to the real page.** Custom pixels "cannot access the top frame ... For example, window.href returns the sandbox URL instead of the top frame URL." Shopify "strongly recommend[s] that developers create apps ... instead of creating Custom Pixels". — [shopify.dev: About web pixels](https://shopify.dev/docs/apps/build/marketing/pixels)
- **Consent gating.** "In regions where customers must consent to tracking, app extension callbacks are executed only after consent is given." Web pixel extensions "honor the consent signals chosen by the customer". — [shopify.dev: About web pixels](https://shopify.dev/docs/apps/build/marketing/pixels)
- **The bridge that makes sandboxed tracking work.** The API's `browser` object "Provides access to specific browser methods that asynchronously execute in the top frame (cookie, localStorage, sessionStorage)". `init` is "a snapshot of the page at time of page render" including page context, and `analytics.subscribe(...)` delivers customer events. — [shopify.dev: Web Pixels API](https://shopify.dev/docs/api/web-pixels-api)
- **Support stance.** "Custom pixels are loaded in a Lax sandbox, designed for improved security and control over the data that you send to third parties." "Adding and using custom pixels is unsupported by Shopify." — [Shopify Help: Custom pixels](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels)
- **GTM runs only as a custom pixel.**
  - Setup: copy the GTM head snippet, remove the `<script>` tags, and insert it into a custom pixel.
  - Restrictions: "tag managers loaded in our sandbox have the same restrictions as any other pixels". "Google Tag Assistant's Troubleshoot tag feature isn't compatible with custom pixels."
  - Workaround for clean GA4 URLs: disable automatic page tracking and send `page_viewed` with a custom `page_location`.
  - Shopify's sample code includes Google Consent Mode v2 settings.
  - Source: [Shopify Help: GTM tutorial](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/gtm-tutorial)
- **Built-in cookie banner.** "The Shopify cookie banner governs Shopify-specific tools, including cookies and Shopify Pixels". Merchants who "manually installed third-party cookies or pixels ... may need to use a third-party cookie banner or add custom logic". Automated privacy settings "automatically configure your cookie banner for visitors in the UK and EEA regions, if you have active markets in these regions". — [Shopify Help: Customer privacy settings](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings)
- Third-party consent tools "must sync consent to Shopify through the Customer Privacy API", or "pixels might not fire". — [Shopify Help: App pixels](https://help.shopify.com/en/manual/promoting-marketing/pixels/app-pixels)

**Wix**
- **Marketing Integrations.** "To use marketing integrations, you need to upgrade your site and connect a domain." Options: Google Tag (for GA), Meta Pixel & CAPI, Google Tag Manager, TikTok Pixel and Google Ads Conversions. Wix warns: "Avoid installing Google Tag and Google Tag Manager together, as they may conflict." — [Wix: About Marketing Integrations](https://support.wix.com/en/article/about-marketing-integrations)
- Wix markets Meta CAPI as "a server-to-server connection" that "bypasses the risks of using browser-based tracking only, like losing events due to pop-up banners and blockers". — [Wix: About Marketing Integrations](https://support.wix.com/en/article/about-marketing-integrations)
- **Custom Code** is added in dashboard "Settings > Custom Code"; the site must be published with a connected domain. It can apply to "All pages" (with "load the code only once per visit, or on each page") or to "specific pages", and be placed in "Head, Body – start, or Body – end". Wix recommends categorising code for GDPR. — [Wix: Embedding Custom Code](https://support.wix.com/en/article/embedding-custom-code-on-your-site)
- **Consent categories.** ESSENTIAL code is "Always loaded, regardless of user preferences", and "any tracking, marketing, or analytics scripts should never be categorized this way". FUNCTIONAL "Can be loaded conditionally". ANALYTICS is "Subject to user privacy preferences". ADVERTISING is "Subject to user consent". Wix's API lists "Add a banner to a site with a custom embed" as a use case. — [Wix Custom Embeds API](https://dev.wix.com/docs/api-reference/business-management/custom-embeds/introduction)
- **Warnings.** "Custom code snippets don't appear as elements in the editor." "Custom code is injected directly into the page's HTML and is visible to anyone who views the page source ... Don't include API keys, passwords". — [Wix Developers: About Custom Code](https://dev.wix.com/docs/develop-websites-sdk/code-your-site/build-a-custom-frontend/custom-code/about-custom-code)
- **Cookie banner.** Wix partners with Usercentrics for a banner "supported for Google Consent Mode v2". With a banner active, GTM and GA "will only gather data after a visitor provides consent". — [Wix: Usercentrics cookie banner](https://support.wix.com/en/article/displaying-a-cookie-banner-on-your-site), [Wix: Connecting GTM](https://support.wix.com/en/article/connecting-your-google-tag-manager-account-to-your-wix-site) (search summary)

**Squarespace**
- **GA4.** "To connect Google Analytics, add your property's measurement ID ... Measurement IDs start with G-". To use Google consent mode: add the ID, turn on "Cookie banner" in Cookies and Data Privacy, and turn on the "Decline all button". — [Squarespace: Connect Google Analytics](https://support.squarespace.com/hc/en-us/articles/205815608-Connect-Google-Analytics-to-your-site)
- **Meta Pixel** is a separate built-in integration. — [Squarespace: Using Meta Pixel](https://support.squarespace.com/hc/en-us/articles/115015760107-Using-Meta-Pixel-with-Squarespace)
- **Code Injection** is available on Core, Plus and Advanced (not Basic). Its fields are Header, Footer, Lock Page and order confirmation / order status, with order variables such as {orderId}. "You can't add custom code to checkout pages." — [Squarespace: Code injection](https://support.squarespace.com/hc/en-us/articles/205815908-Customize-parts-of-your-site-with-code-injection)

**Carrd**
- **Site Analytics** (Pro Standard or higher) supports Cloudflare Web Analytics, Fathom, Google Analytics, Matomo, Plausible, PostHog, Simple Analytics and Umami. — [Carrd: Site Analytics](https://carrd.com/docs/sites/setting-up-site-analytics)
- **Marketing Trackers** (Pro Standard or higher) are LinkedIn Insight Tag, Meta Pixel and TikTok Pixel, each switched on individually. "Enabling a marketing tracker will require the collection of additional data from a site's visitors." — [Carrd: Marketing Trackers](https://carrd.com/docs/sites/setting-up-marketing-trackers)
- Anything else, GTM included, goes through a "Hidden" Embed in Head, Body Top or Body End. — [Carrd: Embedding Custom Code](https://carrd.co/docs/building/embedding-custom-code)
- No built-in cookie banner is documented. A third-party guide suggests adding the open-source CookieConsent script via an Embed. — [startwith.carrd.co](https://startwith.carrd.co/) (third-party)

**Linktree**
- **GA4** on Pro and Premium: "All you need to do is add your Google Analytics Measurement ID ... and we'll do the rest." — [Linktree: Google Analytics](https://help.linktr.ee/en/articles/5434201-google-analytics-integration)
- **Meta Pixel** on Pro and Premium: paste the Pixel ID, and optionally a "Facebook Conversions API Access Token", into Linktree settings at `linktr.ee/admin/settings`. — [Linktree: Meta Pixel](https://help.linktr.ee/en/articles/5434194-facebook-meta-pixel-integration)
- Linktree's "Insight integrations" collection lists only Google Analytics, UTM parameters, Meta Pixel and advanced Meta Pixel audiences. — [Linktree Help collection](https://help.linktr.ee/en/collections/7059206-insight-integrations)
- The paid-features overview mentions GA and Meta Pixel on Pro/Premium and does not mention TikTok Pixel, GTM or custom code. — [Linktree: paid features overview](https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree)

**Beacons**
- "Advanced Marketing: Use your own Facebook, TikTok, and Pinterest pixels" first appears in Creator Plus ($30/mo, or $25/mo billed annually). — [Beacons pricing](https://beacons.ai/i/pricing)
- The help center has "Facebook Pixel ID" and "Google Analytics Tracking Id" articles. — [Beacons Help](https://help.beacons.ai/en/categories/1086529-beacons-link-in-bio-and-website-%F0%9F%94%97)

**Taplink**
- **GA is an add-on that takes code, not an ID.** "Add-ons → Analytics → Google Analytics": "simply add Google Analytics HTML code to the new add-on". — [Taplink blog](https://taplink.at/en/blog/google-analytics-integration.html)
- Facebook Pixel is set up via "Taplink → Add-ons → Facebook Pixel". — [Taplink guide](https://taplink.at/en/guide/facebook-pixel.html)
- An aggregator says Pro adds "Facebook Pixel", "Scheduled Display of Blocks" and "Using HTML Blocks", while Business adds a custom domain and a countdown timer. — [SoftwareAdvice](https://www.softwareadvice.com/landing-page/taplink-profile/) (third-party; its prices look unreliable, and Taplink's own pricing page would not render)

**Webflow**
- Adding custom code to head or body "requires a paid site plan (Basic, CMS, or Business) or a Core, Growth, Agency, or Freelancer Workspace plan". Fields have a 50,000-character limit. — [Webflow: Facebook Pixel integration page](https://webflow.com/integrations/the-facebook-pixel)
- GTM can be installed via the "Google site tools app" or pasted into Site settings > Custom code. — [Webflow: Facebook Pixel integration page](https://webflow.com/integrations/the-facebook-pixel)
- "The native 'Delay for Cookie Consent' toggle in the Apps & Integrations tab is binary. It does not distinguish between analytics consent and marketing consent categories." — [Webflow: Facebook Pixel integration page](https://webflow.com/integrations/the-facebook-pixel)
- The native Meta Pixel field has a "Delay for cookie consent" option that delays loading "until your site visitors accept your cookie consent". Webflow's tutorial has users design their own consent banner. — [Webflow Help: Meta Pixel](https://help.webflow.com/hc/en-us/articles/33961406577171-Embed-Meta-Pixel-on-your-Webflow-site)
- GA4 connects "through a native integration, the official Google Site Tools app, or direct API access". — [Webflow: Google Analytics integration](https://webflow.com/integrations/google-analytics)

**Framer**
- Custom code can be site-wide (Site Settings) or per page, with "positions at the start or end of the head and body". "Framer does not load Custom Code in the canvas preview." — [Framer Academy: Custom Code](https://www.framer.com/academy/lessons/custom-code)
- The official Cookie Banner component (published 7 September 2023) "allows you to run a complete cookie consent system through Google Tag Manager. It's fully integrated with Google's Consent Mode". It can "Separately control behavior for the EU and the rest of the world". — [Framer Updates](https://www.framer.com/updates/cookie-banner-component)

**Softr**
- Native GTM: paste the container ID at "Settings => Integration => Google Tag Manager".
- Alternative: paste the snippets into the Header and Footer of the Custom Code panel.
- "Do not combine this method with the standard method above. Doing so will cause your tags to trigger twice".
- Source: [Softr Docs: GTM](https://docs.softr.io/integrations/google-tag-manager)

**Notion Sites**
- Paid plans unlock "search engine optimization, themes, integration with Google Analytics, and more". Sites publish on a notion.site domain, and custom domains are a paid add-on. — [Notion Help: Sites](https://www.notion.com/help/public-pages-and-web-publishing)
- No custom code or script feature is documented on that page.

### Inferences
**Position (a), "tracking cannot be a content block", is supported.**
- None of the 13 products puts tracking in a positional content block. All use settings-level ID fields and/or site-wide head/body injection.
- Carrd is the partial exception: its "Hidden" Embed is technically an element, but it explicitly publishes "outside the normal element flow".
- Shopify is the one platform that runs third-party tags in a sandbox. It can only do so because it built a bridge: top-frame cookie/storage proxies, a page-context snapshot and an event bus. Even with that bridge, GTM debugging (Tag Assistant) breaks and GA4 needs a manually set `page_location`.
- A generic opaque-origin content block has none of that bridge. It cannot set first-party cookies and sees the sandbox URL (MDN and Shopify both confirm this; see Q5). Tracking-as-block is therefore both non-standard and technically broken.

**Position (b), "refuse GTM", is consistent with the pattern for platforms with Quicktalog's architecture, but is not universal.**
- **Who supports GTM.** Wix, Softr, Webflow, Framer, Squarespace and Carrd all support it natively or via head code. Most of them serve customer pages from separate registrable domains on the Public Suffix List (Q5). Wix also requires a connected custom domain for both Custom Code and Marketing Integrations; its docs don't give the reason.
- **Who doesn't.** Linktree, whose profiles share linktr.ee with its `/admin` UI, offers no GTM and no custom code, only GA4 and Meta Pixel IDs. Notion Sites offers only GA.
- **Shopify** allows GTM only inside its no-top-frame-access sandbox, and is removing script-tag injection from storefronts (March 2027).
- **Abuse history.** Public GTM-based skimming campaigns (Q3/Q5) show that a container ID works as a remotely editable code channel.
- **Viable alternatives to outright refusal:**
  - a Shopify-style sandbox with an events/cookie bridge (significant engineering);
  - allowing GTM only where catalogue pages are served from a separate registrable domain or a customer-verified custom domain.

**Industry UX for tracking**
- "Marketing integrations" is a settings page with one field per vendor (GA4, Meta Pixel with optional CAPI token, TikTok Pixel, and sometimes LinkedIn or Pinterest).
- It is almost always paid: Linktree Pro/Premium, Carrd Pro Standard, Beacons Creator Plus, Wix Premium plus domain, Webflow paid site plan for code, Squarespace Core+ for code injection, Notion Sites paid plans.
- Vendors warn against double-installing: GA field plus GTM (Wix, Softr).

**AI-agent angle (inference only; no platform evidence found).** A GTM ID field is equivalent to arbitrary script injection. It should be owner-only configuration, not something Quicktalog's AI agent can write.

### Gaps
- Plan gating for Squarespace's built-in GA and Meta Pixel connections isn't stated on the pages fetched.
- I found no documentation of consent/cookie-banner features for Linktree, Beacons, Taplink, Softr or Notion Sites.
- Framer's plan requirement for custom code was not found; its pricing/help pages don't state it.
- Taplink's primary pricing page could not be read, so its tiering rests on an aggregator.
- Wix doesn't explain why custom code and marketing integrations require a connected domain.
- Linktree's help center shows no TikTok Pixel or GTM integration. That is absence of evidence, not a confirmed "no".

## 3. Custom code: scoping, tier, warnings and preview; incidents and policies that restricted scripts

### Takeaway
Custom code comes in two scopes:
- an **inline element**: Wix HTML iframe, Squarespace code block, Webflow Code Embed, Framer Embed, Carrd inline Embed, Shopify Custom Liquid;
- **site-wide head/body injection** with optional page targeting: Wix, Squarespace, Webflow, Framer, Carrd hidden Embed, Softr.

It is paywalled, runs only on the published site (not in the editor canvas), and comes with "unsupported" disclaimers.

The clear trajectory is to confine third-party JavaScript to sandboxes and typed extension points:
- Shopify's checkout.liquid and additional-scripts sunset (2024–2026) and storefront script-tag removal (March 2027);
- Wix's 2025 iframe and custom-element sandboxing;
- the PCI DSS v4 script-control rules.

### Cited Findings
**Where it runs and when you can see it**
- **Placement and targeting.** Wix: all pages or specific pages; Head, Body-start or Body-end; load once per visit or on every page. — [Wix: Embedding Custom Code](https://support.wix.com/en/article/embedding-custom-code-on-your-site)
- **Framer**: site-level or page-level code. — [Framer Academy](https://www.framer.com/academy/lessons/custom-code)
- **Carrd**: Inline, or Hidden in Head, Body Top or Body End. — [Carrd docs](https://carrd.co/docs/building/embedding-custom-code)
- **Squarespace**: Code Injection Header, Footer, Lock Page and order pages, plus inline code blocks. Per-page injection is listed only for version 7.0. — [Squarespace: Code injection](https://support.squarespace.com/hc/en-us/articles/205815908-Customize-parts-of-your-site-with-code-injection), [Squarespace: Premium features](https://support.squarespace.com/hc/en-us/articles/115015517328-Premium-features)
- **Not executed in the editor.**
  - Carrd: "will not actually output anything in the builder". — [Carrd](https://carrd.co/docs/building/embedding-custom-code)
  - Framer: "does not load Custom Code in the canvas preview". — [Framer Academy](https://www.framer.com/academy/lessons/custom-code)
  - Webflow: custom code "does not execute until the site is published to a live domain". — [Webflow integration page](https://webflow.com/integrations/the-facebook-pixel)
  - Wix: snippets "don't appear as elements in the editor". — [Wix Developers](https://dev.wix.com/docs/develop-websites-sdk/code-your-site/build-a-custom-frontend/custom-code/about-custom-code)
- **Squarespace protects its logged-in editor from site code.**
  - "Custom code can sometimes prevent you from securely editing your site, so we might ask you to disable it while editing your site."
  - Users can click "Disable Scripts in Preview", or "Type /safe directly after /config at the end of your secure editing URL".
  - Source: [Squarespace: Code injection](https://support.squarespace.com/hc/en-us/articles/205815908-Customize-parts-of-your-site-with-code-injection)
  - Separately: "As a security measure, sometimes embedded code or content doesn't appear when you're logged in." — [Squarespace: Embed blocks](https://support.squarespace.com/hc/en-us/articles/206543617-Embed-blocks)

**Tiers**
- Squarespace: JavaScript/iframes in code blocks and Code Injection need Core, Plus or Advanced. — [Squarespace](https://support.squarespace.com/hc/en-us/articles/205815928-Add-custom-code-to-your-site)
- Carrd: Pro Standard ($19/yr). — [Carrd](https://carrd.co/docs/building/embedding-custom-code)
- Webflow: paid site plan or Core/Growth/Agency/Freelancer Workspace. — [Webflow](https://webflow.com/integrations/the-facebook-pixel)
- Wix: published site with a connected domain. — [Wix](https://support.wix.com/en/article/embedding-custom-code-on-your-site)
- Linktree: none offered. — [Linktree paid features](https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree)

**Disclaimers**
- Squarespace: "Custom code might break your site's appearance or behavior, especially on mobile devices. Our support team can't help you add custom code to your site or troubleshoot issues that arise from using it." — [Squarespace: Code injection](https://support.squarespace.com/hc/en-us/articles/205815908-Customize-parts-of-your-site-with-code-injection)
- Squarespace also says code-based customisation "falls outside the scope of our support ... we can't guarantee its functionality". — [Squarespace: Embed blocks](https://support.squarespace.com/hc/en-us/articles/206543617-Embed-blocks)
- Shopify: "Adding and using custom pixels is unsupported by Shopify." — [Shopify Help](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels)
- Wix: do not put secrets in custom code. — [Wix Developers](https://dev.wix.com/docs/develop-websites-sdk/code-your-site/build-a-custom-frontend/custom-code/about-custom-code)

**Shopify: checkout and script-tag restrictions (policy history)**
- "checkout.liquid is now unsupported for the Information, Shipping, and Payment checkout steps. checkout.liquid and additional scripts were sunset for the Thank you and Order status pages on August 28, 2025. Script tags were sunset on those pages on August 28, 2025 for Plus stores, and are sunset for non-Plus stores on August 26, 2026." — [shopify.dev: checkout.liquid](https://shopify.dev/docs/storefronts/themes/architecture/layouts/checkout-liquid)
- Shopify staff (February 2025): "Additional scripts are unsupported in the new version of the Thank you and Order status pages". Shopify disabled the field for shops not already using it. "All merchants should now be focusing on reducing their dependency on legacy features". — [Shopify Developer Community](https://community.shopify.dev/t/order-status-page-additional-scripts-is-disabled-for-merchants-with-no-other-alternative/8289)
- Storefront script tags (announced 24 August 2026). "Script tags have been deprecated since 2021". "From October 1, 2026, scriptTagCreate and scriptTagUpdate will return a user error ... From March 1, 2027, we'll stop injecting script tags into storefronts." — [Shopify Developer Community announcement](https://community.shopify.dev/t/deprecation-script-tags-will-stop-running-on-march-1-2027/37108)
- Shopify's PCI DSS v4 rationale (Partners blog, 11 February 2025):
  - "only Shopify-approved scripts execute in the parent page".
  - App code runs "in isolated JavaScript environments, and communicates with the parent page via mediated postMessage() bridge". Web Pixels and UI extensions run "using a combination of iframe elements and Web Workers".
  - Controls: "Content Security Policy (CSP) to allowlist authorized scripts", "Subresource Integrity (SRI) and CSP nonces", and a payment-form iframe "for defense-in-depth".
  - Source: [Shopify Partners blog](https://www.shopify.com/partners/blog/checkout-compliance)
- PCI DSS v4 requirement 6.4.3 "imposes requirements aimed at combatting digital skimming through the effective management of scripts" on payment pages, covering script authorisation, integrity and an inventory. — [Shopify Enterprise blog](https://www.shopify.com/enterprise/blog/shopify-checkout-compliance) (search summary)

**Wix sandboxing (policy history)**
- Wix introduced sandboxing of iframes and custom elements on 1 January 2025 "to improve the security of apps and components on Wix sites", limiting storage access. — [Wix](https://support.wix.com/en/article/updates-to-iframes-and-custom-elements)
- A user reported that Wix said "allow-same-origin" would no longer be allowed for such elements (user report). — [Wix Studio forum](https://forum.wixstudio.com/t/wix-is-sandboxing-custom-element-and-iframe-extensions/65088)

**Documented incidents: GTM as a script-injection vector**
- Recorded Future (September 2022): threat actors "place HTML elements or JavaScript into the GTM containers, with these items later injected into a victim website at run time by the GTM loader". The report found 569 e-commerce domains with e-skimmer infections linked to GTM abuse, 314 of them confirmed GTM-based. — [Recorded Future](https://www.recordedfuture.com/research/threat-actors-continue-to-abuse-google-tag-manager-for-payment-card-e-skimming)
- Sucuri found known-malicious GTM containers on 327 sites in the first 11 months of 2023. One container (GTM-WJ6S9J6) appeared on at least 178 sites before Google removed it. — [The Record / Recorded Future News](https://therecord.media/web-skimmers-hit-300-sites-hidden-inside-google-tag-manager-containers), [Cybersecurity News](https://cybersecuritynews.com/magecart-hackers-abuse-google-tag-manager/) (secondary reporting of Sucuri data)

**Documented incident: GitHub Pages moved off github.com (April 2013)**
- GitHub cited "Session fixation and CSRF vulnerabilities resulting from a browser security issue sometimes referred to as 'Related Domain Cookies'". It also cited "Phishing attacks relying on the presence of the 'github.com' domain". — [GitHub Blog](https://github.blog/2013-04-05-new-github-pages-domain-github-io/)
- Because Pages sites could run custom JavaScript on github.com subdomains, they could write github.com cookies. — [GitHub Blog](https://github.blog/2013-04-05-new-github-pages-domain-github-io/), [GitHub Blog: Yummy cookies across domains](https://github.blog/2013-04-09-yummy-cookies-across-domains/)

### Inferences
- **Quicktalog's `custom_code` block already matches the safest industry variant.** It is a sandboxed srcdoc iframe with `allow-scripts` and without `allow-same-origin`. Wix gets a similar result differently: it adds `allow-same-origin` but serves the frame from a separate domain (filesusr.com).
- **Don't add same-origin head/body injection on the shared origin.** The platforms that offer site-wide head/body injection mostly isolate customer sites on separate registrable domains (Q5). Squarespace, whose editor runs at /config on the site, needs logged-in suppression and a "safe" mode.
- **Common hygiene:** paid-tier gating, an "unsupported/advanced" disclaimer, no execution in the builder canvas, and a warning about secrets.
- **Custom code is the "anything else" escape hatch, not the vehicle for banners or tracking.** Squarespace pop-ups explicitly reject custom code (Q4). Shopify moved analytics to pixels and UI to typed extensions.
- **AI agents and custom code (inference; no platform precedent found).** With an AI agent writing catalogue content, `custom_code` should arguably be excluded from what the agent may create or edit, or require explicit owner confirmation.

### Gaps
- The exact date checkout.liquid became unsupported for the Information, Shipping and Payment steps isn't on the page fetched.
- I did not find a Squarespace, Wix, Framer or Carrd security incident caused by customer custom code.
- I found no platform policy on AI agents writing embed/code content.
- The PCI 6.4.3 description comes from a search summary of a Shopify blog, not a direct fetch.

## 4. Banners, announcement bars and promos: no-code components vs HTML

### Takeaway
Builders ship banners and promos as no-code, theme-bound components and do not ask users to write HTML. Squarespace pop-ups explicitly refuse custom code. Common options:
- text with light formatting and links, or a whole-bar link;
- colours taken from the theme's colour scheme;
- dismiss/close;
- several rotating messages;
- image + headline + body + up to two CTA buttons for promos;
- page targeting;
- timing (delay/scroll);
- frequency caps;
- a mobile toggle;
- scheduled publish/unpublish;
- email capture in exchange for a promo code.

These features are often on paid tiers.

### Cited Findings
- **Shopify announcement bar.**
  - "You can have only one announcement bar section in your theme, but you can add up to 12 announcement blocks".
  - Style is a colour scheme. Function covers language selector, country/region selector and social icons.
  - Animation: "Choose to have your announcements automatically rotate, or let your customers go through your announcements using the chevron buttons".
  - Settings include "Auto-rotate announcements", "Change slides every", "Show separator line" and "Show icons on desktop".
  - For more, merchants use App Store banner apps.
  - Source: [Shopify Help: Add an announcement bar](https://help.shopify.com/en/manual/online-store/themes/customizing-themes/common-customizations/add-announcement-banner)
- **Shopify image banners and slideshows.** Image banners and slideshows are standard theme sections. Their Height setting has an "Adapt to first image" option. — [Shopify Help: Uploading images](https://help.shopify.com/en/manual/online-store/images/theme-images)
- **Squarespace announcement bar** (Core, Plus, Advanced).
  - It displays "a sale announcement, promotion, change to your hours, or other important updates". It "appears on every page of your site except cover pages. You can't limit it to specific pages."
  - Text supports bold, italic and links; "Attach Link" makes the whole bar a link.
  - Colour "generally matches the header color theme". Visitors can close it, and there are controls to make it reappear.
  - Source: [Squarespace: Add an announcement bar](https://support.squarespace.com/hc/en-us/articles/205815318-Add-an-announcement-bar)
- **Squarespace promotional pop-up** (Core, Plus, Advanced).
  - Settings: Layout, Action (newsletter signup or up to two buttons), Content (Headline and Body), Image, Style, and Display & timing.
  - Pages: "Any first page" or "Only certain pages".
  - Timing: a timer and/or scroll percentage.
  - Frequency: next day, 1 week, 2 weeks, 30 days or never. Option "Don't show again after newsletter signup".
  - Also: "Show on mobile", Reset, and conversion tracking.
  - Limits: only one pop-up at a time; no exit intent. "Pop-ups don't work with custom code, and you can't upload a video file."
  - SEO warning: "Pop-ups can lower your site's ranking".
  - Source: [Squarespace: Add a promotional pop-up](https://support.squarespace.com/hc/en-us/articles/115008375848-Creating-a-promotional-pop-up)
- **Wix popups (lightboxes).** A popup can "show automatically once the page loads" with a Delay slider, or open on click. — [Wix: Adding and Setting up a Popup](https://support.wix.com/en/article/wix-editor-adding-and-setting-up-a-lightbox) (search summary)
  - Exit-intent triggers are not available. — [Wix: Request: exit popup](https://support.wix.com/en/article/wix-editor-request-triggering-a-lightbox-when-a-visitor-attempts-to-leave-your-site) (search summary)
- **Wix custom-embed banners (developer route).** Wix's developer API lists "Add a banner to a site with a custom embed" as a use case, so code-based banners exist there but as a developer/app route. — [Wix Custom Embeds API](https://dev.wix.com/docs/api-reference/business-management/custom-embeds/introduction)
- **Linktree (link-in-bio emphasis tools).**
  - "Use Spotlight or animations to bring more attention to your most important links".
  - Featured Layouts: "Free plans are limited to one, but paid plans give you unlimited use".
  - Scheduling: "Set links to go live or expire automatically at specific times. Ideal for timed drops, seasonal promos, or limited-time offers."
  - Source: [Linktree: paid features overview](https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree)
- **BentoBox (restaurant website builder) overlays.**
  - Promotion Overlay: "provide customers with a promotional code in exchange for their email submission". Email is required; phone and birthday are optional.
  - Announcement Overlay: "communicate announcements directly to your customers".
  - Custom Overlay: designed "from scratch" in a WYSIWYG editor.
  - Display & Timing: "select which pages you'd want the popup to appear on and how often".
  - Publish settings: "control publish and unpublish dates".
  - Source: [BentoBox Help Center](https://help.getbento.com/en/articles/415425)
  - Separately, BentoBox offers homepage "banner alerts or overlay popups" with Promotions / Announcements / Custom types and scheduled "go up / come down" times. — [BentoBox blog](https://www.getbento.com/blog/how-to-optimize-restaurant-websites-for-the-holidays/) (search summary)
- **Taplink.** "Scheduled Display of Blocks" is reportedly on Pro and "Countdown Timer" on Business. — [SoftwareAdvice](https://www.softwareadvice.com/landing-page/taplink-profile/) (third-party)
- **Carrd.** Carrd has no native countdown or banner timer. A third-party guide describes embedding a countdown script with the Embed element (Pro Standard). — [startwith.carrd.co](https://startwith.carrd.co/) (third-party)

### Inferences
- **The founder's idea of building banners inside a custom-code component runs against the industry pattern.** Every mainstream builder offers native announcement bars, promo pop-ups/overlays or featured/spotlight items. Code-based banners appear only as a developer route (Wix API) or a workaround on minimal builders (Carrd).
- **A no-code design fits Quicktalog's AI agent.** Structured fields (text, link, colour-scheme token, image, CTA, schedule) are safe for the agent to write and preview. HTML/JS is not.
- **Suggested shape for Quicktalog, drawn from the fields above:**
  - **Announcement bar (site-wide):** text, optional link, theme colour scheme, dismissible, optional rotation of several messages, schedule start/end.
  - **Promo/"special" banner block (in-flow):** image, heading, body, CTA button(s), theme colours, schedule. For menus this covers happy hour or daily specials, echoing Linktree's scheduled links and BentoBox's publish/unpublish dates.
  - **Optional pop-up/overlay:** delay/scroll trigger, frequency cap, page targeting, mobile toggle, one active at a time. Squarespace's SEO/mobile caution applies.
- **Countdown timers and promo-code capture** (BentoBox) are menu/restaurant-specific additions seen in the market.

### Gaps
- Shopify Image banner / Slideshow field lists (heading, buttons, overlay opacity, autoplay) were not fetched in detail.
- Beacons' banner/spotlight features were not checked.
- Popmenu's pop-up/offer features could not be verified: its blog returned HTTP 403.
- Other QR-menu builders (e.g. MENU TIGER, Menubly, Square Online) were not verified from primary docs.
- No source compared click-through performance of banners vs pop-ups.

## 5. Security models behind these surfaces (sandboxing, CSP, allowlists, first- vs third-party execution)

### Takeaway
Platforms use three isolation strategies, often combined:
1. **Curated/allowlisted embeds with no customer JavaScript** (Linktree, Notion, Squarespace oEmbed).
2. **Sandboxed execution** in opaque-origin iframes or Web Workers, with a platform-mediated bridge (Shopify pixels and checkout extensions, Wix HTML iframe).
3. **Separate registrable domains for user-controlled pages**, recorded on the Public Suffix List. Webflow's and Framer's entries were submitted by their security teams.

CSP, SRI and nonces are layered on top where the platform controls the page (Shopify checkout). Products whose public pages share an origin with the admin either allow no customer JavaScript (Linktree) or add editor mitigations (Squarespace).

### Cited Findings
- **MDN on iframe sandboxing.**
  - The sandbox attribute is either "empty to apply all restrictions" or a list of tokens that lift restrictions.
  - Without `allow-same-origin`, "the resource is treated as being from a special origin that always fails the same-origin policy (potentially preventing access to data storage/cookies and some JavaScript APIs)".
  - "When the embedded document has the same origin as the embedding page, it is strongly discouraged to use both allow-scripts and allow-same-origin, as that lets the embedded document remove the sandbox attribute — making it no more secure than not using the sandbox attribute at all."
  - Source: [MDN: iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)
- **Shopify's sandboxes.** Strict (Web Worker) and lax (`sandbox="allow-scripts allow-forms"` iframe, no top-frame access, `window.href` returns the sandbox URL). — [shopify.dev](https://shopify.dev/docs/apps/build/marketing/pixels)
  - A mediated postMessage bridge, CSP allowlisting, SRI plus CSP nonces, and a payment iframe. — [Shopify Partners blog](https://www.shopify.com/partners/blog/checkout-compliance)
- **Wix.** The HTML element runs "within a sandboxed iFrame" with allow-same-origin, allow-forms, allow-popups, allow-scripts and allow-pointer-lock. — [Wix](https://support.wix.com/en/article/studio-editor-adding-an-html-iframe-element)
  - It is served from a per-site filesusr.com host (user report). — [Wix Studio forum](https://forum.wixstudio.com/t/filesusr-com-refused-to-connect-with-html-embed/59940)
  - Wix restricted storage access in iframes and custom elements from 1 January 2025. — [Wix](https://support.wix.com/en/article/updates-to-iframes-and-custom-elements)
- **Public Suffix List (downloaded 30 September 2026).** Customer-hosting domains registered by builders:

  | PSL entry | Platform | Submitted by |
  |---|---|---|
  | `myshopify.com` | Shopify | Shopify |
  | `webflow.io` | Webflow | "Webflow Security Team <security@webflow.com>" |
  | `notion.site` | Notion | Notion's "trust-core-team" |
  | `framer.ai`, `framer.app`, `framercanvas.com`, `framer.media`, `framer.photos`, `framer.website`, `framer.wiki` | Framer | "security@framer.com" |
  | `carrd.co` | Carrd | Carrd |
  | `wixsite.com`, `wixstudio.com`, `editorx.io` | Wix | Wix |
  | `github.io` | GitHub | (not recorded) |

  No PSL entries were found for Squarespace, Linktree or Softr. — [Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat)
- **GitHub's rationale for moving Pages to github.io (2013).** Related-domain cookie attacks (session fixation, CSRF) and phishing on github.com subdomains that host custom JavaScript. — [GitHub Blog](https://github.blog/2013-04-05-new-github-pages-domain-github-io/)
- **Squarespace editor mitigations.** Code "can sometimes prevent you from securely editing your site". Users can disable scripts via "/config/safe". Embedded code may be hidden while logged in "as a security measure". — [Squarespace: Code injection](https://support.squarespace.com/hc/en-us/articles/205815908-Customize-parts-of-your-site-with-code-injection), [Squarespace: Embed blocks](https://support.squarespace.com/hc/en-us/articles/206543617-Embed-blocks)
- **Restricting GTM itself.**
  - "To control which tags, triggers, and variables are allowed on a page, use the gtm.allowlist and/or gtm.blocklist keys in your data layer".
  - The `customScripts` class ("Capable of running JavaScript code provided by the user") includes Custom HTML tags. "Blocklists override allowlists".
  - Google adds: "For improved security management, tag installations should upgrade to custom templates and implement template policies instead of the allowlist and blocklist guidance".
  - Source: [Google Tag Platform: Restrict tag deployment](https://developers.google.com/tag-platform/tag-manager/web/restrict)
- **Wix custom code** is visible in page source; don't include keys or passwords. — [Wix Developers](https://dev.wix.com/docs/develop-websites-sdk/code-your-site/build-a-custom-frontend/custom-code/about-custom-code)
- **GTM skimming.** Recorded Future and Sucuri data show GTM containers used as a skimming vector because GTM serves code from the trusted googletagmanager.com. — [Recorded Future](https://www.recordedfuture.com/research/threat-actors-continue-to-abuse-google-tag-manager-for-payment-card-e-skimming), [The Record](https://therecord.media/web-skimmers-hit-300-sites-hidden-inside-google-tag-manager-containers)

### Inferences
- **Quicktalog's architecture is the high-risk variant.** Public catalogues and the signed-in builder share one origin, and an AI agent writes content. That resembles Linktree (no customer JS at all) and Squarespace's built-in-domain editor (mitigations required). It does not resemble Wix, Webflow, Framer, Carrd, Shopify or Notion, which put customer pages on PSL-registered separate domains. Webflow's and Framer's entries were submitted by their security teams, i.e. registered deliberately for isolation.
- **Same-document third-party JavaScript on Quicktalog's origin** (GTM containers, head injection, un-sandboxed custom code) would need one of three prerequisites:
  - serve public catalogues from a separate registrable domain, ideally PSL-listed;
  - build a Shopify-style sandbox plus bridge;
  - restrict to platform-rendered, pinned vendor scripts: GA4 gtag, Meta fbevents and TikTok pixel only, from known hosts, which allows a tight CSP script-src allowlist.
- **Existing blocks follow MDN guidance.** The `custom_code` sandbox (opaque origin, no `allow-same-origin`) matches MDN's advice for same-origin content. The `embedding` allowlist matches the curated model.
- **GTM hardening is available but partial.** Blocklisting `customScripts` via `gtm.blocklist` would cut GTM's code-execution surface. Google itself recommends template policies for "improved security", so this should be treated as hardening, not a guarantee. It is also enforced by the GTM runtime on the page, not by the browser.

### Gaps
- I did not fetch Google's CSP guide for GTM (https://developers.google.com/tag-platform/security/guides/csp), so I can't state its exact nonce and 'unsafe-inline' requirements.
- I found no platform statement tying GTM restrictions to a specific incident.
- Linktree publishes no security rationale for its no-custom-code policy.
- I did not verify whether Squarespace's `/config` editor and the public site share an origin on custom domains. The docs only show the editor at `/config` on the "secure editing URL".

## 6. EU/GDPR implications of a platform that hosts SMB pages and fires customers' tracking pixels (brief)

### Takeaway
Three sources set the bar:
- **ePrivacy Art. 5(3)**, as applied by the EDPB (Guidelines 2/2023, v2.0, adopted 16 October 2024), explicitly covers tracking pixels and the JavaScript that constructs them. They need prior opt-in consent unless strictly necessary.
- **Planet49** (CJEU, 1 October 2019) requires active consent; pre-ticked boxes are invalid.
- **Fashion ID** (CJEU, 29 July 2019) makes the operator of a site that embeds a third-party plugin a joint controller with the vendor for collection and transmission. The operator must obtain consent for those operations, and each joint controller needs its own legitimate interest where that is the legal basis.

Google additionally requires EEA consent signals (Consent Mode v2) for measurement, ads personalisation and remarketing. The industry answer is a platform-provided banner that gates platform-rendered integrations. Arbitrary customer code falls outside it: Shopify says so explicitly, and Wix requires categorisation.

### Cited Findings
- **Fashion ID (C-40/17, press release, 29 July 2019).**
  - "The operator of a website that features a Facebook 'Like' button can be a controller jointly with Facebook in respect of the collection and transmission to Facebook of the personal data of visitors to its website". "that operator is not, in principle, a controller in respect of the subsequent processing of those data carried out by Facebook alone".
  - The operator "must obtain that prior consent (solely) in respect of operations for which it is the (joint) controller, namely the collection and transmission of the data".
  - Under legitimate interests, "each of the (joint) controllers ... must pursue a legitimate interest".
  - Source: [CJEU press release No 99/19](https://curia.europa.eu/jcms/upload/docs/application/pdf/2019-07/cp190099en.pdf)
- **Planet49 (C-673/17, press release, 1 October 2019).**
  - "Storing cookies requires internet users' active consent. A pre-ticked checkbox is therefore insufficient". This holds "whether or not the information stored or accessed on the user's equipment is personal data".
  - Users must be told "the duration of the operation of cookies and whether or not third parties may have access to those cookies".
  - Source: [CJEU press release No 125/19](https://curia.europa.eu/jcms/upload/docs/application/pdf/2019-10/cp190125en.pdf)
- **EDPB Guidelines 2/2023** on the technical scope of Art. 5(3) ePrivacy Directive. Version 2.0 (final), adopted 16 October 2024. — [EDPB](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)
  - "Tracking pixels on websites may link to an entity collecting many such requests and thus being able to track users' behaviour ... As such, Article 5(3) ePD is applicable, even if this storage is not permanent." — [EDPB Guidelines 2/2023 PDF](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf)
  - "In the case of dynamically constructed tracking pixels, it is the distribution of the applicative logic (usually a JavaScript code) that constitutes the instruction". Collecting identifiers this way "constitutes a 'gaining of access' in the meaning of Article 5(3) ePD". — [EDPB Guidelines 2/2023 PDF](https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf)
- **Google (EEA).**
  - "To keep using applicable tags/SDKs for measurement, and for ad personalization, and remarketing features, you must collect consent for use of personal data from end users based in the EEA and share consent signals with Google".
  - Consent Mode v2 adds `ad_user_data` and `ad_personalization`.
  - "If you use a Google-certified consent management platform (CMP), your CMP provider will automatically update to the newest version of consent mode."
  - Source: [Google Tag Manager Help: Updates to consent mode for EEA traffic](https://support.google.com/tagmanager/answer/13695607?hl=en)
  - Google's advertiser guidance repeats the requirement and tells custom-banner owners to "implement consent mode v2". — [Google Ads Help](https://support.google.com/google-ads/answer/14625550?hl=en)
  - "Starting in March 2024", both consents must be GRANTED for Customer Match use of EEA data. — [Google Ads Help: Customer Match consent FAQ](https://support.google.com/google-ads/answer/14310715?hl=en) (search summary)
- **Platform practice: Squarespace.** Websites dropping non-essential cookies must, via a cookie banner, inform visitors and "Obtain consent". "You need to obtain affirmative consent before placing non-essential cookies". Squarespace lists Code Injection, Embed Blocks, Meta Pixel and Google Analytics among integrations whose data handling the site owner must review, and describes itself as "a pass-through for such data or displayed content". — [Squarespace: GDPR](https://support.squarespace.com/hc/en-us/articles/360000851908-GDPR-and-Squarespace)
- **Platform practice: Shopify.** The banner governs Shopify pixels. Manually installed third-party pixels may need their own banner. It is auto-configured for UK and EEA. — [Shopify Help](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings)
- **Platform practice: Wix.** Consent categories for custom code. — [Wix API](https://dev.wix.com/docs/api-reference/business-management/custom-embeds/introduction)
  - Usercentrics banner with Consent Mode v2. — [Wix](https://support.wix.com/en/article/displaying-a-cookie-banner-on-your-site) (search summary)
- **Platform practice: Webflow.** A binary delay-for-consent toggle. — [Webflow](https://webflow.com/integrations/the-facebook-pixel)
- **Platform practice: Framer.** A Cookie Banner with GTM and Consent Mode, and separate EU vs rest-of-world behaviour. — [Framer](https://www.framer.com/updates/cookie-banner-component)
- **Platform practice: Carrd.** Carrd only warns that trackers collect additional data. — [Carrd](https://carrd.com/docs/sites/setting-up-marketing-trackers)

### Inferences
- **Who is controller.** When Quicktalog renders a business's GA4 or Meta Pixel on catalogue pages, the business, by Fashion ID's logic, is a (joint) controller with Google/Meta for collection and transmission, and must have prior consent for EU visitors. Quicktalog designs the integration and the consent flow. It is plausibly the business's processor, but because it determines the technical means for all tenants, a joint-controller argument can't be ruled out. This needs legal review; these notes are not legal advice.
- **Baseline for a platform serving many EU SMBs:**
  - a platform-level consent banner that blocks all non-essential tags until opt-in, with no pre-ticked choices (Planet49) and disclosure of duration and third-party access;
  - Consent Mode v2 signals for Google tags in the EEA;
  - a settings-level integration model where the platform knows exactly which tags exist and can gate them.

  Arbitrary GTM containers or custom code break that guarantee: the platform cannot know what they load. This supports position (a).
- **Embeds carry the same exposure.** Fashion ID concerned a social plugin that transmitted data on page load. Consent-gated or click-to-load placeholders for third-party maps, video and social embeds are a reasonable mitigation, but I found no builder documenting this as default behaviour (see Gaps).

### Gaps
- The Google pages I fetched state the EEA consent requirement but not the "March 2024" enforcement date for tags. Only the Customer Match FAQ search summary states "Starting in March 2024".
- EDPB Guidelines 07/2020 (controller/processor) and national DPA guidance on embedded third-party content (e.g. click-to-load for YouTube/Maps) were not reviewed.
- I found no DPA decision specific to website-builder platforms firing tenants' pixels.
- I found no builder documenting consent-gated or click-to-load embeds.
