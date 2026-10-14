# Vertical competitors: content-block libraries in QR-menu, catalogue / WhatsApp-commerce and link-in-bio builders (state as of 30 Sep 2026)

Scope: 24 products researched. Group A is digital/QR menu and restaurant site builders: Menubly, MenuTiger, FineDine, Popmenu, BentoBox, Square Online, DISH Website (METRO, Germany), plus GloriaFood as a deprecation note. Group B is catalogue and WhatsApp-commerce builders: Take App, WhatsApp Business catalog, Flipsnack, Publuu, Heyzine, Catalog Machine, Ecwid Instant Site. Group C is link-in-bio and mini-site builders: Linktree, Beacons, Taplink, Carrd, Stan Store, Milkshake, Lnk.bio, Later Link in Bio, Hoo.be, Bento.me (sunset).

Source-quality note: most findings come from vendor help centres and pricing pages. Where a finding comes from a search-result excerpt, a competitor's blog or a third-party review, it is marked **(secondary)** or **(unverified excerpt)**. Several pricing pages render with JavaScript, so their prices were read through a scraper. Treat exact prices as a snapshot taken on 30 Sep 2026.

---

## Q1. For each product: which blocks, sections or elements can an owner place, how does the add picker group them, and which plan unlocks each?

### Takeaway
Three architectures show up:
1. **Fixed-template menu builders.** Menubly, MenuTiger, FineDine and Popmenu give the owner a menu plus a few preset sections or tabs, not an open block library.
2. **Section libraries of purpose-built blocks.** BentoBox, Square Online, Ecwid, DISH and Take App let owners add, reorder and remove typed sections (text, gallery, reviews, location, hours, announcement, embed).
3. **Open block or element pickers.** Linktree, Beacons, Taplink, Carrd, Stan and Lnk.bio offer 10–50+ block types, grouped either by job-to-be-done (Linktree, Beacons, Flipsnack) or as a flat list (Taplink, Carrd, Take App).

Basic content blocks are almost always free. Paywalls fall on media and commerce blocks (Taplink), forms, embeds and widgets (Carrd), review or custom-code blocks (Take App, Square, Ecwid), and tracking.

### Cited Findings

#### A. Digital / QR menu and restaurant site builders

**Menubly** (Free / PRO / CUSTOM)
- The menu uses two levels. "Sections" are top-level navigation buttons (e.g. Restaurant Menu, Bar Menu) and "categories" sit inside them as tabs. A category can belong to several sections. - [Menubly docs](https://docs.menubly.com/online-menu/how-to-organize-your-menu-with-sections-and-categories)
- Menu display layouts are a switchable preset: "grid view, list view, or category view". - [Menubly](https://www.menubly.com/)
- The mini website is not a block picker. It is configured through tabs: **Mini Website** (URL), **Business Information** (place name, phone, address, a "Header Note" shown above the links, a footer note) and **Branding** (theme colour, background colour or image, text colour, header image, logo). The online menu is integrated automatically, and custom links come from an "Add Link" button (the example given is booking via WhatsApp). - [Menubly docs: create a mini website](https://docs.menubly.com/mini-website/create-a-mini-website-for-restaurant)
- Location, social media and reservations are handled as links: "Share all important links in one place: menu, location, social media, reservations, and more". - [Menubly](https://www.menubly.com/)
- Plans: FREE $0 (mini website, "Unlimited links on mini website", built-in online menu, QR code menu, online ordering for pick-up/delivery). PRO $9.99/mo, or $95.99/yr (≈$7.99/mo), adds custom domain, full menu customisation, custom menu design and PDF-to-digital conversion. CUSTOM is priced on request (unlimited menus). - [Menubly pricing](https://www.menubly.com/pricing/)
- The help centre has a "Set up WhatsApp ordering" article. No articles cover custom code, analytics pixels or allergen labels. - [Menubly Help Center](https://docs.menubly.com/)

**MenuTiger (QR TIGER)** (Freemium / Regular / Advanced / Premium)
- The website builder is "drag-and-drop": "Add or rearrange sections instantly without coding knowledge". - [MenuTiger website builder](https://www.menutiger.com/features/web-site-builder)
- Ready-made sections are "the Hero Section, About Section, Feature Section, and the Why Choose Us Section". The site "does not support blog and news page integration" but can link social accounts. It supports 19 languages. - [MenuTiger website builder FAQ](https://www.menutiger.com/features/web-site-builder)
- Plans: Freemium $0 (7 menu categories × 7 items, "Run 1 promo deal type"), Regular $17/mo, Advanced $46/mo, Premium $119/mo. Paid plans can "Run multiple promo deals". A custom (white-label) domain is Premium-only. Every plan includes customer surveys and feedback reports. - [MenuTiger pricing](https://www.menutiger.com/pricing); custom domain "available only for a Premium subscription for only $119 per month" - [MenuTiger website builder FAQ](https://www.menutiger.com/features/web-site-builder)

**FineDine** (Starter / Growth / Premium; plans renamed from the older Base/Premium naming)
- Prices are Starter $29/mo, Growth $69/mo and Premium $135/mo, "billed annually, save 20%". - [FineDine pricing](https://www.finedinemenu.com/en/pricing/)
- Every plan includes the "AI Website Builder": 1 language on Starter, and unlimited languages plus a custom domain on Growth. Premium adds "Multi-Location Display". - [FineDine pricing](https://www.finedinemenu.com/en/pricing/)
- "Allergen & Nutrition Labels" are on every plan (Starter is capped at 100 items). "Item Ratings & Reviews" and "Feedback Collection" are also on every plan. "In-App Promotions & Banners" and "Menu Scheduling & Visibility" are Growth and Premium only; Starter gets only "Promo Codes" and "Paid Social Ads". Reservations: 50/mo on Starter, 250/mo with pre-payment on Growth, unlimited on Premium. - [FineDine pricing](https://www.finedinemenu.com/en/pricing/)
- The AI builder generates the site from the menu ("let AI transform it into beautifully structured website sections") and syncs opening hours, photos and reviews from Google Business Profile. No manual section picker is described. - [FineDine AI Website Builder](https://www.finedinemenu.com/en/solutions/ai-website-builder/)

**Popmenu** (Starter / Essentials / Premier / Build your own)
- Prices: Starter $159/mo prepaid annually ($179 monthly), Essentials $269/mo ($299), Premier $449/mo ($499). "Build your own" is priced by sales. - [Popmenu pricing](https://get.popmenu.com/pricing)
- Starter's website features are "SEO-driven website", "Interactive menu", "Google Business Profile sync", "Dish reviews and responses", "Event calendar" and an OpenTable integration. Premier adds "Digital waitlist and reservations" and "Guest feedback". Online ordering and catering is a paid add-on on every plan. - [Popmenu pricing](https://get.popmenu.com/pricing)
- Individual dish pages; "New price, new dish, new event - live before service"; "Schedule events and specials". - [Popmenu website design](https://get.popmenu.com/solutions/website-design)
- Section-level documentation sits behind a Salesforce support portal and could not be read. - [Popmenu support](https://support.popmenu.com/s/trainings-and-tips?language=en_US)

**BentoBox (now Clover)**
- "BentoBox is now Clover" and "BentoBox products/services are only available to Clover POS customers". - [getbento.com/pricing](https://getbento.com/pricing/)
- The homepage has **Landing Content** (a hero whose background type is Color, Images, Instagram, YouTube, Vimeo or Grid) and optional **Flexible Content** below it. - [BentoBox help: homepage layout](https://help.getbento.com/hc/en-us/articles/360020930894-How-to-change-your-homepage-layout-)
- Flexible Content types come from an "Add Section" dropdown: One Column Text, Two Column Text, Two Column Freeform Thumbnails, **Featured Box** ("Display featured content from your site's Press, News, Team, Galleries, Menus, Events, Venues, or Jobs boxes"), Full Overlay, Split Overlay, Gallery, Instagram (10 latest photos), YouTube, Vimeo and **Embed** ("a field that accepts web-based code snippets"). - [BentoBox help: add flexible content](https://help.getbento.com/en/articles/403585)
- Separate typed content areas exist, e.g. "Locations Content Boxes". - [BentoBox help](https://help.getbento.com/en/articles/416705); embedding web widgets through Flexible Content - [BentoBox help](https://help.getbento.com/en/articles/542465)

**Square Online** (Free / Plus / Premium)
- "Sections are the content building blocks of your website." Every page has a universal header and footer. Owners add sections through **+ > Section**. Sections are "categorized by purpose", and the "Organize" category is recommended for longer text. Some section layouts let you duplicate sub-parts called "groups". - [Square: manage site sections](https://squareup.com/help/us/en/article/6860-adding-sections-to-your-pages-in-square-online-store)
- Featured-item sections and product pages come in "various layouts". - [Square Bottom Line](https://squareup.com/us/en/the-bottom-line/inside-square/square-online-customization-updates)
- The Embed code section is restricted to "Square Online Plus and Premium subscribers". - [Square: embedded code](https://squareup.com/help/us/en/article/6899-add-external-content-and-widgets-with-embedded-code-in-square-online-store)
- The pricing page (Sept 2026) shows Free $0/mo, Plus $49/mo and Premium $149/mo per location. It lists "Coupons, pop-up notifications, and lead capture forms", "Product reviews" and "Expanded site customization… buttons, badges, navigation, and banners". The scrape could not map these features to tiers reliably. - [Square Online plans](https://squareup.com/us/en/online-store/plans)
- A Form section exists, but it cannot hold images (title, description and questions only). - [Square Community](https://community.squareup.com/t5/Square-Online/Add-an-image-to-a-form-section-in-Square-Online/m-p/649794)

**DISH Website (DISH Digital Solutions / METRO, Germany; European example)**
- The starter guide covers adding or changing a **Menu**, a **Description**, **Events** and **Galleries**, reordering content blocks ("How do I reorder the content on my DISH Website?"), opening hours, **food-ordering service links**, a custom domain, and Google Business Profile through DISH Weblisting. - [DISH Website starter guide](https://support.dish.co/website-weblisting-starter-guide/dish-website-starter-guide)
- DISH Starter is a free subscription with a "one-time set-up fee for new contracts: 99,00 €" (excl. VAT). It includes the website, digital menu management, multilingual content, Google Business Profile and an "integrated reservation widget". - [DISH Starter](https://www.dish.co/DE/en/dish-starter/)
- DISH Premium bundles Starter with DISH Professional Order and DISH Professional Reservation. - [DISH Premium](https://www.dish.co/XX/en/dish-premium/). The fetched summary of the Starter page puts the price at €79–€94/month **(unverified excerpt)**. - [DISH Starter](https://www.dish.co/DE/en/dish-starter/)
- "The Website Builder is now part of Dish.co". - [website.dish.co](https://website.dish.co/)

**GloriaFood (Oracle; deprecated)**
- GloriaFood is winding down: most sources give **30 Apr 2027** as end of service (one cites 31 Mar 2027) and say new sign-ups are closed **(secondary)**. - [Fleksa](https://fleksa.com/en/blog/gloriafood-shutting-down-what-restaurants-should-do-next); [EnactOn](https://www.enacton.com/blog/gloriafood-shutting-down/)

#### B. Product catalogue and WhatsApp-commerce builders

**Take App** (Basic free / Business / Enterprise)
- The storefront is built from **design cards**: **Text**, **Image** (with an optional link, "great for highlighting deals or events"), **Video** ("Only YouTube and TikTok links are supported"), **Countdown** (with image, title and description), **Map** ("store location or pickup point"), **Contact** ("save your contact info to their phone with one click"), **Link** (e.g. a "booking form, a menu PDF, or your social profile"), **Products** ("a hand-picked set of products, so a promotion or a new arrival sits at the top"), **Delivery** ("delivery and pick-up options up front") and **Review** ("Requires the Business plan"). - [Take App: designing storefront](https://www.take.app/help/designing-storefront)
- The picker is flat: "Admin > Website > Storefront, click `Add card`, and choose the type". - [Take App: add cards](https://www.take.app/help/add-cards-to-the-storefront)
- Settings-level extras: a top announcement **Banner** (text and optional link) under Website > Appearance. - [Take App: create a banner](https://www.take.app/help/create-a-banner); a **Popup** for announcements, promotions and sign-up offers. - [Take App: popup](https://www.take.app/help/popup-banner); a reviews-section toggle ("Show reviews"). - [Take App: customer review](https://www.take.app/help/customer-review)
- Plans: Basic $0 (50 orders/month, unlimited products). Business costs $50/mo after a $1 first month and adds unlimited orders, card payments, custom domain, logo removal, and multiple stores and staff. Enterprise is custom. - [Take App pricing](https://www.take.app/pricing)

**WhatsApp Business catalog**
- The catalog holds items and **collections** and has no page blocks or layout. To create a collection: open the catalog, choose "Add new collection", name it and select items. "Your collection will be reviewed… no more than 24 hours". Collections can be reordered and renamed **(unverified excerpt of official FAQ; page body failed to load)**. - [WhatsApp FAQ](https://faq.whatsapp.com/2929318000711140/?cms_platform=web)
- Up to 500 items per catalog; each item has up to 10 images plus title, description, price and link **(secondary)**. - [InstantReply guide](https://www.instantreply.co/blog/whatsapp-catalog-guide-2026); [Chatarmin](https://chatarmin.com/en/blog/whatsapp-business-catalog)

**Flipsnack** (Free / Starter / Pro / Business / Enterprise)
- Interactions are added from the "Interactions tab in the left panel" of the Design Studio, grouped as:
  - **Links and Tags:** Link area, Link button, Tag, Caption, Pop-up frame, **Embed code**
  - **Multimedia:** Image (Spotlight, Slideshow, Pop-up slideshow); Audio & Video (Video embed, Video button, Audio button)
  - **Shop:** Shop area, Shop button, Product tag
  - **Engagement:** Quiz, Question, Contact form
  - **Navigation:** Prev/Next page, Go to page, First/Last page
  - **Social Media:** Social buttons
  - also "Buy this item"
  - **Graphics:** stock photos and videos, shapes, GIFs, stickers, barcode
  - **Data:** line, pie and bar charts, table

  The article says "Available for all Business and Enterprise plans". - [Flipsnack help: interactions](https://help.flipsnack.com/en/articles/2364948-how-to-add-videos-and-interactions)
- Plans:
  - Free: 5 flipbooks × 15 pages, links auto-detected from the PDF.
  - Starter $35/mo or $192/yr: internal and external links; no video embedding or forms.
  - Pro $52/mo or $456/yr: YouTube, Vimeo and self-hosted video, "product tags, lead forms, charts, audio/video buttons, shopping list", Google Analytics.
  - Business $109/mo or $1,020/yr: HTML5 download, Zapier, up to 5 users.
  - Enterprise (custom): "Google Tag Manager integration", SSO, API.

  The pricing page puts interactive elements in Pro, which conflicts with the "Business and Enterprise" wording in the interactions article. - [Flipsnack pricing explained](https://help.flipsnack.com/en/articles/107456-pricing-plans-explained)

**Publuu** (Basic / Optimum / Professional / Premium)
- Every plan gets "Animated and customized hotspots", hotspot videos, photos, internal and external links, hotspot audio, and video and photo embedding. GIFs and uploading your own videos start at Basic. "Lead magnet forms" start at Optimum. "Product Tags", "Wishlist" and "Google Analytics integration" start at Professional. - [Publuu prices](https://publuu.com/prices/)
- Prices shown were Basic $7, Optimum $24, Professional $49 and Premium $89/mo. A search snippet of the same page showed Premium at $74, probably annual billing. - [Publuu prices](https://publuu.com/prices/)
- The Wishlist "works only with product tags" and readers send it by email. - [Publuu help](https://publuu.com/help/how-to-use-the-wishlist-feature/)

**Heyzine** (Basic free / Standard / Professional / Premium)
- Interactive elements: links (between pages or flipbooks), video, audio, images and GIFs, forms, web embeds ("Use web iframes to embed maps, calendars, agendas, panoramas, forms, payment gateways"), and links to a store or shopping cart **(search excerpt of vendor pages)**. - [Heyzine: make an interactive PDF](https://heyzine.com/how-to/make-an-interactive-pdf/)
- Plans:
  - Basic: free ("link, share, embed").
  - Standard: $5/mo, billed yearly at $59.
  - Professional: $9/mo billed yearly ($108) or $14 monthly; adds reader statistics, "Lead generation forms" and a custom URL.
  - Premium: $19/mo billed yearly ($228) or $29 monthly; adds a digital bookshelf and a custom DNS domain.

  - [Heyzine](https://heyzine.com/); Google Analytics integration comes "With Heyzine's Professional and Premium Plans". - [Heyzine GA how-to](https://heyzine.com/how-to/google-analytics-for-flipbooks/)

**Catalog Machine**
- Catalog Machine uses templates with placeholders rather than blocks: "Drag and drop products and images to fill placeholders" and "Use mix of custom or predefined templates and layouts in the same catalog". Page types include price lists with images, line sheets, spec sheets, pricing sheets and order forms, and a "Product Showroom". It generates the table of contents automatically, takes orders, payments and quote requests, and outputs PDF and HTML. - [Catalog Machine product tour](https://www.catalogmachine.com/product-tour)
- It offers 50+ templates. - [Catalog Machine templates](https://www.catalogmachine.com/product-catalog-templates). The Capterra listing says it is "Free to start" **(secondary)**. - [Capterra](https://www.capterra.com/p/148188/Catalog-Machine/)

**Ecwid Instant Site (Lightspeed)** (Starter / Venture / Business / Unlimited)
- The "+ Add Section" library includes Cover, Text, Image, Image & Text, Video, Customer Reviews, Company Info, Location, **Opening Hours**, Contact, Announcement, Slider, FAQ, Custom code and Custom Section. Header, Announcement and Footer are fixed in position. Translating sections requires Business or Unlimited. - [Ecwid: adding and editing site sections](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
- Store sections include Product Collection, Category Showcase, Featured Product, Logo Gallery and Featured Category **(search excerpt)**. - [Ecwid: store section](https://support.ecwid.com/hc/en-us/articles/11703951436700-Configuring-the-store-section-of-your-Instant-Site)
- AI can generate custom sections from a description, up to 30 per store **(search excerpt)**. - [Ecwid: custom sections with AI](https://support.ecwid.com/hc/en-us/articles/22157264768284-Creating-custom-sections-for-Instant-Site-with-AI)
- Plans shown: Starter $5, Venture $29, Business $49, Unlimited $119. No free plan is listed. - [Ecwid pricing](https://www.ecwid.com/pricing). Prices rose in Feb 2026 **(secondary)**. - [PricingSaaS](https://pricingsaas.com/news/ecwid/20260204/)

#### C. Link-in-bio and mini-site builders

**Linktree** (Free / Starter / Pro / Premium)
- There are two link kinds: "Classic links" and "Link Apps", which are "an embedded experience. Visitors can watch a video, stream a podcast, fill out a form, or book an appointment". The docs cite "30+ Link Apps" reached from "Add Link" > "View All Apps". - [Linktree: adding links](https://linktr.ee/help/en/articles/8614037-adding-links-what-s-possible)
- The picker is **+ Add**: paste a URL, or open "View all apps" and browse or search. - [Linktree: create a link](https://help.linktr.ee/en/articles/5434135-how-to-create-a-link-on-linktree). The marketplace groups apps by job: "Share your content", "Make and collect money" and "Grow your following". - [Linktree Marketplace](https://linktr.ee/marketplace). Contact Details sits under the "Grow your…" category in the in-app View all list. - [Linktree help](https://help.linktr.ee/en/articles/5912619-how-to-add-a-contact-details-link)
- Apps on the marketplace browse page (the group labels below came from the scraper and may not be Linktree's own):
  - **Social:** Instagram, TikTok, Threads, Snapchat, X, Reddit, Pinterest, Twitch, Facebook
  - **Music:** Music, Spotify, SoundCloud, Audiomack, Apple Music, Podcasts
  - **Commerce:** **Form**, Affiliate products, Amaze, Bonfire, Shopify, Fourthwall, SendOwl, Digital products, Courses, Mobile App, **Discount Code**
  - **Community / events:** Community Channels, Community SMS, Bandsintown, Seated, Tour and Events, **Calendly**, GoFundMe, Gleam
  - **Content:** **Contact Details**, Video, **Text**, YouTube, TikTok Video, Vimeo, **Image gallery**, **PDF display**, Books
  - **Utilities:** **Header**, **Maps**, Cameo, Typeform, **Reviews**, **FAQs**, Google Sheets, Laylo, Stats, Mailchimp, Kit, RSS Feed
  - **Other:** **Coaching & bookings**, UMG Signup

  - [Linktree Marketplace browse](https://linktr.ee/marketplace/browse)
- Collections group links with a layout of "Stack, Grid, Carousel, or Showcase", and a collection can be shared as its own page. - [Linktree: Collections](https://linktr.ee/help/en/articles/5434163-organize-your-links-with-collections)
- Prices: Free $0; Starter $6/mo annual ($8 monthly); Pro $12/mo annual ($15 monthly); Premium $30/mo annual ($35 monthly). - [Linktree pricing](https://linktr.ee/s/pricing/)
- **Every paid plan** includes "Unlimited Featured links", "More Link Collection layouts – Grid and Carousel", advanced design customisation, redirect links, scheduled links, and spotlight or animated prioritisation. **Pro and Premium** add UTM parameters, the Google Analytics and Meta Pixel integrations, a hero profile image, footer removal, QR customisation, and audience integrations (Mailchimp, Klaviyo, Kit, Google Sheets). The overview does not list any individual Link App as paid. - [Linktree: paid features overview](https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree)
- Bento.me (acquired by Linktree) shut down on **13 Feb 2026** and its users were offered migration to Linktree. - [AlternativeTo news](https://alternativeto.net/news/2025/12/bento-to-shut-down-in-2026-as-linktree-takes-over-and-offers-migration-path/); [Eike Drescher on X](https://x.com/eikedrescher/status/2001695639806316904). On 30 Sep 2026, bento.me/home/bento-sunset returned a 301 redirect to linktr.ee (observed during this research). - [bento.me/home/bento-sunset](https://bento.me/home/bento-sunset)

**Beacons** (Free Forever / Creator Plus)
- The picker is **+ Add block**, organised in categories such as **LAYOUT** (Text, spacing), **IMAGES**, **Monetize** ("Products", digital products, appointments), **Contact form** (Email & SMS), **Brand deals** (Media Kit), Music and Integrations. - [Beacons: Text block](https://help.beacons.ai/en/articles/4698433); [Image block](https://help.beacons.ai/en/articles/4698497); [Store block](https://help.beacons.ai/en/articles/4698113); [Email & SMS](https://help.beacons.ai/en/articles/4697537); [Media Kit](https://help.beacons.ai/en/articles/4697793)
- The help centre lists these blocks:
  - **Content:** Links; Video (YouTube, Vimeo, TikTok); Music (Bandcamp, YouTube Music, Spotify, SoundCloud); Tours + Events
  - **Monetisation:** Store; Support (tips); TikTok Shopping
  - **Audience:** Email & SMS; Follower Counts; Media Kit; Lead Magnet; Substack
  - **Layout:** Text; Image; Spacer
  - **Integration:** NFT Embed

  - [Beacons help: Link-in-Bio category](https://help.beacons.ai/en/categories/1086529)
- The Links block has per-link "layouts, headlines, animations, scheduling, countdowns, redirects" **(search excerpt)**. - [Beacons: Links block](https://help.beacons.ai/en/articles/4696577)
- Plans (the pricing URL now serves the homepage): "Free Forever" (customisable link-in-bio, 9% seller fees, media kits, courses, 5 email automations) and "Creator Plus" at $30/mo (0% seller fees, unlimited email sends, free custom domain). - [Beacons](https://beacons.ai/pricing)

**Taplink** (Free / Pro / Business)
- Taplink describes "20+ content blocks":
  - **Links:** buttons for "external sites, social profiles, calls, messaging, newsletters, contact saving"
  - **Text**
  - **Images and image carousels**
  - **Videos**
  - **Music**
  - **Forms**
  - **Maps**
  - **Countdown timers**
  - **Digital products**
  - **Custom block** (user-designed layouts with text, buttons and images)
  - **FAQ**
  - **HTML code block**

  - [Taplink: What is Taplink](https://taplink.at/en/blog/what-is-taplink.html)
- The help FAQ lists block topics: Avatar, Link, FAQ, **Messaging apps**, **Social networks**, Video, Image carousel, HTML code, Map, Timer, Form and payments. - [Taplink FAQ](https://taplink.at/en/help/faq/page/?page=3). There are also **Pricing plans** blocks. - [Taplink guide: Pricing plans](https://taplink.at/en/guide/pricing-plans.html); and **Price lists** and **Media and text** blocks **(search excerpt)**. - [Taplink FAQ p.2](https://taplink.at/en/help/faq/page/?page=2)
- The picker is a single "Add Block" button at the bottom of the page that opens a flat list. Blocks can be archived or duplicated and dragged to reorder **(search excerpt)**. - [Taplink FAQ p.2](https://taplink.at/en/help/faq/page/?page=2)
- Tiers per Taplink's own blog: **Free $0** includes links, text, maps, FAQ, custom blocks and themes. **Pro $4/mo** adds images, videos and music. **Business $8/mo** adds forms, digital-product sales and payments. - [Taplink: What is Taplink](https://taplink.at/en/blog/what-is-taplink.html). A search excerpt from taplink.at blog pages also puts request and order forms, countdown timer, custom domain, CRM and subpages in Business **(unverified excerpt; exact page not confirmed)**. - [Taplink blog](https://taplink.at/en/blog/tap-bio-alternative.html)
- For QR menus, Taplink recommends **Price lists** ("to add menu items and the prices"), Images, Text, Social network links, PDF links, Banner / Image carousel, Video, Media and text, FAQ, Link and Countdown. - [Taplink: QR code menu](https://taplink.at/en/blog/how-to-create-a-qr-code-menu.html)

**Carrd** (Free / Pro Lite / Pro Standard / Pro Plus; billed yearly)
- The element set is Text, Image, Buttons, Links, Icons, List, Divider, Video, Audio, Gallery, Slideshow, Table, Form, Timer, Embed, Container, Widget and Control. - [Carrd docs: element styles](https://carrd.com/docs/building/using-element-styles). Owners add them through a flat "Add Element" menu. - [Carrd docs: basics](https://carrd.com/docs/building/basics)
- Tiers:
  - **Pro Lite $9/yr:** Slideshows ("as backgrounds or standalone elements"), site icons, no element limit.
  - **Pro Standard $19/yr:** "Forms", "Widgets" (Stripe, PayPal, Gumroad, Typeform, Facebook), "Embeds" ("Directly embed your own code (including script tags)"), meta tags, analytics and tracking, custom domains.
  - **Pro Plus $49/yr:** "Advanced Forms" (Zapier, Make, n8n, Airtable) and site download.

  - [Carrd docs: plans](https://carrd.com/docs/pro/plans); [Carrd Pro](https://carrd.com/pro)

**Stan Store** (Creator / Creator Pro; no free plan)
- The page is a list of "products" added from My Store > **+ Add Product**. - [Stan help: URL/Media product](https://help.stan.store/article/18-external-link-url-product)
  - **URL / Media**: links out, with a "Button" (compact), "Callout" (larger card) or "Embed" style. - [Stan help: URL/Media product](https://help.stan.store/article/18-external-link-url-product)
  - **Collect Emails / Applications**: a lead magnet. - [Stan help](https://help.stan.store/article/13-collect-emails-applications-product)
  - Also digital downloads, courses, coaching calls, memberships, webinars and custom products **(search excerpt)**.
- Prices: Creator $29/mo and Creator Pro $99/mo, billed annually at $300 and $948. Pro adds email marketing, upsells, funnels, discount codes, affiliates and "ad pixel tracking". There is a 14-day trial **(secondary + vendor blog)**. - [Ruzuku](https://www.ruzuku.com/learn/articles/stan-store-pricing); [Stan blog](https://stan.store/blog/stan-store-pricing/)

**Milkshake** (Free + in-app subscriptions)
- Still live. The seller is now "Codelbee Pty Ltd" (it previously belonged to Envato). The latest version is 1.18.0, which added "Widgets and Siri support". - [App Store](https://apps.apple.com/us/app/milkshake-website-builder/id1452719910); Envato → Codelbee transition **(secondary)** - [Autoposting.ai](https://autoposting.ai/blog/milkshake-review)
- Card types mentioned include Contact Card, Sell Card (beta), blog post, podcast episode, YouTube video, link and promotional cards. Paid tiers are Lite $2.99, Pro $6.99/mo or $59.99/yr, and Pro Plus $29.99 per 3 months or $99.99/yr. Paid tiers unlock custom domain, contact form, mailing-list integration, SEO tools, a campaign builder, "Meta pixel" and branding removal. - [App Store](https://apps.apple.com/us/app/milkshake-website-builder/id1452719910)

**Lnk.bio** (Free / Mini / Unique / Agency)
- Lnk.bio offers "147 embed services (YouTube, Spotify, TikTok, SoundCloud, Twitch and more), 19 integrations… 50 newsletter integrations, 3,000+ social and music icons, 577 free templates, 38 page layouts". Pricing: free plan with unlimited links; Mini $0.99/mo or $9.99 one-time; Unique $24.99 one-time; Agency from $2/mo for 3 accounts; custom domain is a $29.99/yr add-on. - [Lnk.bio: What is Lnk.Bio](https://lnk.bio/what-is-lnk-bio)
- A competitor's blog also claims blocks for business hours, maps, testimonials, booking calendar, search bar, countdown and HTML code **(secondary; competitor-written, not confirmed on lnk.bio)**. - [Taplink blog on Lnk.bio](https://taplink.at/en/blog/lnk-bio.html)

**Later Link in Bio** (included with Later plans)
- Page components:
  - profile picture, name and bio
  - "links to your social profiles"
  - "clickable buttons" (unlimited, can be toggled)
  - linked Instagram and TikTok posts (a "shoppable feed", up to 5 links per Instagram post)
  - featured media ("your most recent post, a YouTube video, or custom media")

  - [Later: What is Link in Bio](https://help.later.com/hc/en-us/articles/4409203074967-What-is-Link-in-Bio)
- Button Groups: [Later: buttons](https://help.later.com/hc/en-us/articles/4409202843671-Add-Buttons-Button-Groups-to-Your-Link-in-Bio-Page)
- A "Featured Banner" block: [Later: featured banner](https://help.later.com/hc/en-us/articles/7980292968471-Add-Featured-Banner-to-Linkin-bio-Page)
- Featured Media is "a full-width Link in Bio block" and can show only one post at a time. - [Later: featured media](https://help.later.com/hc/en-us/articles/4411643898903-Feature-Media-on-Your-Linkin-bio-Page)
- Blocks are reordered in the Blocks tab through "Change Order". Themes and customisation are available on "all current plans, including Free". - [Later: design & layout](https://help.later.com/hc/en-us/articles/4988904359959-Customize-the-Design-Layout-of-Your-Link-in-Bio-Page)

**Hoo.be**
- Third parties list media embeds (video, Spotify, podcasts), email and phone forms, shop collections, tips and donations, a paywall, tickets and Calendly **(secondary)**. - [Taplink on hoo.be](https://taplink.at/en/blog/hoobe.html); [Later glossary](https://later.com/social-media-glossary/hoobe/)
- Hoo.be's own blog recommends seven sections (contact info, shop, current projects, latest content, social links, products/services, sign-up forms) and advertises "Get started free" for "1.5+ million creators". - [hoo.be blog](https://hoo.be/blog/what-to-add-to-link-in-bio). This conflicts with third-party descriptions of it as "invite-only". - [Taplink on hoo.be](https://taplink.at/en/blog/hoobe.html)

### Inferences
- **Purpose-built blocks versus primitives:**
  - Restaurant tools lean almost entirely on prepared, typed sections: Menubly tabs, MenuTiger's Hero/About/Feature/Why Choose Us, BentoBox's Featured Box, DISH's Menu/Events/Galleries. They add a single generic escape hatch (Embed) where one exists.
  - Link-in-bio tools mix a small primitive core (Text, Image, Link, Header, Spacer) with a long tail of prepared integration blocks (Calendly, Shopify, Spotify, Maps, Reviews).
  - Carrd is the only product checked whose library is mostly primitives (List, Table, Divider, Container, Control).
- **Picker organisation:**
  - Flat lists work for up to about 20 types: Carrd has 18, Take App 10, Taplink roughly 20.
  - Past about 30 types, vendors group by job-to-be-done: Linktree ("Share your content / Make and collect money / Grow your following"), Beacons (Layout / Images / Monetize / Contact / Brand deals), Flipsnack (Links and Tags / Multimedia / Shop / Engagement / Navigation).
  - Nobody groups by media type alone.
- **What is paywalled (typical pattern):**
  - Free: text, links, map, FAQ, basic media.
  - First paid tier: richer media (Taplink images and video on Pro), featured or spotlight styling, more layouts (Linktree), slideshows (Carrd Pro Lite).
  - Mid tier: forms, embeds, widgets, custom code, tracking (Carrd Pro Standard, Square Plus, Ecwid Venture, Linktree Pro).
  - Commerce tier: payments, reviews, order forms (Taplink Business, Take App Business Review card).
- Take App (a WhatsApp-commerce product with a flat single-column card list) is structurally the closest analogue to Quicktalog's flat ordered block list. Its card set (Text, Image, Video, Countdown, Map, Contact, Link, Products, Delivery, Review) is a useful benchmark for a "small-business essentials" set.

### Gaps
- Popmenu's section or block library is not publicly documented; the support portal needs a login.
- Square Online's full list of section types by category (only the "Organize" category is named) could not be retrieved from help articles.
- The feature-to-tier mapping on Square's plans page was not reliable in the scrape.
- DISH Website's full module list and the tier boundary between Starter and Premium are unclear; the Premium price is only an unverified excerpt.
- Taplink's official price page renders with JavaScript and could not be scraped. Tier details come from Taplink's own blog, and countdown and HTML-block tiers are unconfirmed.
- MenuTiger and Menubly allergen or dietary tag support could not be confirmed from vendor pages.
- Hoo.be pricing tiers and current access model (invite-only or open) are unresolved.
- The WhatsApp official FAQ body did not load, so catalog limits rest on secondary sources.
- Catalog Machine plan prices were not captured.
- Milkshake's full card list is not published outside the app.

---

## Q2. Which products have purpose-built blocks for maps/location, opening hours, WhatsApp/call/order buttons, reservations/booking, social posts, promotions/banners, allergen/dietary tags and reviews? Which rely on a generic embed instead?

### Takeaway
Map, reviews, booking and promo/countdown blocks are fairly common as purpose-built blocks. **Opening hours as a block is rare**: only Ecwid and DISH document it, and FineDine and Popmenu sync hours from Google Business Profile. **Allergen and dietary tags** exist only as item attributes in the restaurant tools (confirmed for FineDine), never as a page block. WhatsApp-specific buttons appear mainly as ordering flows or contact/messaging link types. Carrd, BentoBox, Square, Heyzine and Flipsnack push most of these needs to a generic Embed or iframe.

### Cited Findings
- **Maps / location**
  - Linktree **Maps** Link App. - [Linktree Marketplace browse](https://linktr.ee/marketplace/browse)
  - Taplink **Maps** block (free tier). - [Taplink](https://taplink.at/en/blog/what-is-taplink.html)
  - Take App **Map** card. - [Take App](https://www.take.app/help/designing-storefront)
  - Ecwid **Location** section. - [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
  - BentoBox Locations content boxes. - [BentoBox](https://help.getbento.com/en/articles/416705)
  - Menubly treats location as a link. - [Menubly](https://www.menubly.com/)
  - Heyzine embeds maps through iframes. - [Heyzine](https://heyzine.com/how-to/make-an-interactive-pdf/)
  - Carrd has no map element; its list has only Embed/Widget as escape hatches. - [Carrd elements](https://carrd.com/docs/building/using-element-styles)
- **Opening hours**
  - Ecwid **Opening Hours** section. - [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
  - DISH opening hours. - [DISH starter guide](https://support.dish.co/website-weblisting-starter-guide/dish-website-starter-guide)
  - FineDine: "Guests always see the right opening hours" through Google Business sync. - [FineDine AI builder](https://www.finedinemenu.com/en/solutions/ai-website-builder/)
  - Popmenu: "Google Business Profile sync". - [Popmenu pricing](https://get.popmenu.com/pricing)
  - None of the Linktree, Taplink, Take App or Carrd block lists include an opening-hours block. - [Linktree browse](https://linktr.ee/marketplace/browse); [Taplink](https://taplink.at/en/blog/what-is-taplink.html); [Take App](https://www.take.app/help/designing-storefront); [Carrd](https://carrd.com/docs/building/using-element-styles)
- **WhatsApp / call / order buttons**
  - Taplink link buttons cover "calls, messaging… contact saving", and it has a dedicated "Messaging apps" block. - [Taplink](https://taplink.at/en/blog/what-is-taplink.html); [Taplink FAQ](https://taplink.at/en/help/faq/page/?page=3)
  - Menubly has WhatsApp ordering and custom links (e.g. booking via WhatsApp). - [Menubly docs](https://docs.menubly.com/); [Menubly mini website](https://docs.menubly.com/mini-website/create-a-mini-website-for-restaurant)
  - Take App's whole store is a WhatsApp-order checkout, plus a **Contact** card (save contact). - [Take App](https://www.take.app/help/designing-storefront)
  - Linktree **Contact Details** ("downloadable contact details"). - [Linktree help](https://help.linktr.ee/en/articles/5912619-how-to-add-a-contact-details-link)
  - DISH has "food ordering service link[s]". - [DISH](https://support.dish.co/website-weblisting-starter-guide/dish-website-starter-guide)
- **Reservations / booking**
  - Linktree **Calendly** and **Coaching & bookings** Link Apps. - [Linktree browse](https://linktr.ee/marketplace/browse)
  - Beacons "Appointments" under Monetize. - [Beacons](https://help.beacons.ai/en/categories/1086529)
  - Stan coaching calls **(search excerpt)**. - [Stan help](https://help.stan.store/article/18-external-link-url-product)
  - DISH "integrated reservation widget". - [DISH Starter](https://www.dish.co/DE/en/dish-starter/)
  - FineDine reservations with per-tier caps. - [FineDine pricing](https://www.finedinemenu.com/en/pricing/)
  - Popmenu reservations on Premier or through OpenTable. - [Popmenu pricing](https://get.popmenu.com/pricing)
  - Square suggests embed code for "reservation services from OpenTable". - [Square plans](https://squareup.com/us/en/online-store/plans)
- **Social posts / feeds**
  - Later's linked Instagram and TikTok post feed. - [Later](https://help.later.com/hc/en-us/articles/4409203074967-What-is-Link-in-Bio)
  - BentoBox **Instagram** flexible content (10 latest photos). - [BentoBox](https://help.getbento.com/en/articles/403585)
  - Linktree Instagram, TikTok, YouTube and TikTok Video apps. - [Linktree browse](https://linktr.ee/marketplace/browse)
  - Milkshake YouTube, podcast and blog-post cards. - [App Store](https://apps.apple.com/us/app/milkshake-website-builder/id1452719910)
- **Promotions / banners / countdown**
  - FineDine "In-App Promotions & Banners" (Growth+). - [FineDine pricing](https://www.finedinemenu.com/en/pricing/)
  - MenuTiger promo deals (1 type on the free plan). - [MenuTiger pricing](https://www.menutiger.com/pricing)
  - Take App **Countdown** and **Products** cards, a top Banner and a Popup. - [Take App](https://www.take.app/help/designing-storefront); [banner](https://www.take.app/help/create-a-banner); [popup](https://www.take.app/help/popup-banner)
  - Ecwid **Announcement** (fixed at the top). - [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
  - Square "Coupons, pop-up notifications". - [Square plans](https://squareup.com/us/en/online-store/plans)
  - Carrd **Timer**. - [Carrd](https://carrd.com/docs/building/using-element-styles)
  - Taplink countdown timers. - [Taplink](https://taplink.at/en/blog/what-is-taplink.html)
  - Linktree **Discount Code** app. - [Linktree browse](https://linktr.ee/marketplace/browse)
  - Later **Featured Banner**. - [Later](https://help.later.com/hc/en-us/articles/7980292968471-Add-Featured-Banner-to-Linkin-bio-Page)
- **Allergen / dietary tags**
  - FineDine "Allergen & Nutrition Labels" on every plan, as an item-level attribute. - [FineDine pricing](https://www.finedinemenu.com/en/pricing/)
  - No link-in-bio or catalogue tool offers them.
- **Reviews / testimonials**
  - Take App **Review** card (Business plan). - [Take App](https://www.take.app/help/designing-storefront)
  - Ecwid **Customer Reviews** section. - [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
  - Ecwid "Product reviews" (Business+). - [Ecwid pricing](https://www.ecwid.com/pricing)
  - Linktree **Reviews** app. - [Linktree browse](https://linktr.ee/marketplace/browse)
  - FineDine "Item Ratings & Reviews". - [FineDine pricing](https://www.finedinemenu.com/en/pricing/)
  - Popmenu "Dish reviews and responses". - [Popmenu pricing](https://get.popmenu.com/pricing)
  - Square "Product reviews". - [Square plans](https://squareup.com/us/en/online-store/plans)
- **FAQ**
  - Taplink FAQ (free). - [Taplink](https://taplink.at/en/blog/what-is-taplink.html)
  - Ecwid FAQ section. - [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
  - Linktree **FAQs** app. - [Linktree browse](https://linktr.ee/marketplace/browse)
- **Delivery / fulfilment options**
  - Take App **Delivery** card is unique among the products checked. - [Take App](https://www.take.app/help/designing-storefront)
- **Tools that rely on a generic embed for these needs**
  - BentoBox **Embed** flexible content for third-party widgets. - [BentoBox](https://help.getbento.com/en/articles/403585); [BentoBox widgets](https://help.getbento.com/en/articles/542465)
  - Square **Embed code** for "Google calendar, … custom contact forms, … reservation services" **(search excerpt)**. - [Square: embedded code](https://squareup.com/help/us/en/article/6899-add-external-content-and-widgets-with-embedded-code-in-square-online-store)
  - Carrd **Embed/Widget**. - [Carrd](https://carrd.com/docs/building/embedding-custom-code)
  - Heyzine iframes for "maps, calendars, agendas, panoramas, forms, payment gateways". - [Heyzine](https://heyzine.com/how-to/make-an-interactive-pdf/)
  - Flipsnack "Embed code". - [Flipsnack](https://help.flipsnack.com/en/articles/2364948-how-to-add-videos-and-interactions)
  - Ecwid custom code for "chat or contact form widgets". - [Ecwid custom code](https://support.ecwid.com/hc/en-us/articles/8359349900828-Adding-custom-code-to-Instant-Site)

### Inferences
Coverage matrix, derived from the findings above. ✓ = purpose-built block or section; attr = item attribute; link = handled as a link; E = generic embed only; - = none found.

| Product | Map | Hours | WhatsApp/call/order | Booking | Social feed | Promo/banner/countdown | Allergens | Reviews |
|---|---|---|---|---|---|---|---|---|
| Menubly | link | - | ✓ (WhatsApp ordering) | link | - | - | - | - |
| MenuTiger | - | - | ✓ (ordering) | - | link | ✓ (promo deals) | - | survey only |
| FineDine | (GBP; map unverified) | ✓ (GBP sync) | ✓ (ordering) | ✓ | - | ✓ Growth+ | attr | ✓ |
| Popmenu | - | ✓ (GBP sync) | add-on | ✓ Premier | - (its "social posting" is outbound, Essentials) | ✓ (events/specials) | - | ✓ |
| BentoBox | Locations boxes (map unverified) | - | - | E | ✓ (Instagram) | - | - | - |
| Square Online | - | - | ✓ (store) | E (Plus+) | - | ✓ (pop-ups) | - | ✓ |
| DISH | - | ✓ | link | ✓ | - | - | - | - |
| Take App | ✓ | - | ✓ (store + Contact) | link | - | ✓ | - | ✓ Business |
| Ecwid | ✓ | ✓ | ✓ (store) | E (Venture+) | - | ✓ | - | ✓ |
| Linktree | ✓ | - | ✓ (Contact Details) | ✓ | ✓ | ✓ (Discount Code) | - | ✓ |
| Taplink | ✓ | - | ✓ (Messaging apps) | generic form (Business) | - | ✓ (countdown) | - | - |
| Carrd | E | E | link | E | - | ✓ (Timer) | - | E |

- The "local business essentials" blocks (map, hours, contact/WhatsApp, reviews) are covered best by tools serving merchants: Ecwid, Take App, Taplink and DISH. Creator-focused link-in-bio tools cover booking, social feeds and commerce better than hours.
- Opening hours and allergen tags are underserved as page blocks. A Quicktalog opening-hours block and item-level dietary/allergen badges would put it ahead of most of this set.

### Gaps
- It was not verified whether Linktree Maps or Taplink Map embed a live map or just link out.
- FineDine's "sticky booking buttons, click-to-call, embedded maps" appeared only in a search excerpt of FineDine's site and could not be confirmed on the fetched page.
- Lnk.bio's claimed business-hours, maps and testimonials blocks come only from a competitor's blog.
- Whether Popmenu's website has a dedicated map or hours section is undocumented.

---

## Q3. Do they offer raw HTML or custom code? At what tier, and how is it scoped (inline element vs site-wide head code)?

### Takeaway
Custom code is offered by the "builder" end of the market (Carrd, Taplink, Ecwid, Square, BentoBox, Flipsnack) and is nearly always gated to a mid tier. The best-documented implementations offer **both** an inline block and a site-wide head/body slot: Carrd's Embed with Inline or Hidden placement, Taplink's HTML block plus Settings > HTML-Code, and Ecwid's section plus head and body code. Restaurant QR-menu tools (Menubly, MenuTiger, FineDine, Popmenu, DISH) and creator link-in-bio tools (Linktree, Later, Stan) document no custom code. They offer curated embeds or integrations instead.

### Cited Findings
- **Carrd**
  - The Embed element accepts "HTML, `<style>` tags… and even `<script>` tags" and requires "Pro Standard or higher" ($19/yr).
  - Placement is **Inline** ("exactly where the embed appears") or **Hidden**, which inserts into **Head**, **Body Top** or **Body End** site-wide. Embeds do not render in the builder preview.

  - [Carrd: embedding custom code](https://carrd.com/docs/building/embedding-custom-code); iframe mode of the same element - [Carrd: iframes](https://carrd.com/docs/building/embedding-iframes); plan - [Carrd plans](https://carrd.com/docs/pro/plans)
- **Taplink**
  - HTML can go in two places: an "HTML code" block on the page (visual elements such as tables or forms), or "Settings – General – HTML-Code" for code without a visual part, "such as Pixel". Taplink warns that incorrect code may break the page **(search excerpt of Taplink FAQ; article body not loaded)**. - [Taplink FAQ: HTML code](https://taplink.at/en/help/faq/page/htmlcode/)
  - Taplink describes the block as able to "animate blocks, insert new elements or widgets from external websites". - [Taplink](https://taplink.at/en/blog/what-is-taplink.html)
  - Tier: a third-party excerpt says the HTML/CSS block is unlocked on Pro **(unverified)**. - [Taplink blog](https://taplink.at/en/blog/tap-bio-alternative.html)
- **Ecwid Instant Site**
  - Three scopes: "Custom Code Section" on individual pages; head code ("Header meta tags and site verification"); body code ("Custom JavaScript code", "no longer than 4000 symbols").
  - All three require Venture, Business or Unlimited.

  - [Ecwid: custom code](https://support.ecwid.com/hc/en-us/articles/8359349900828-Adding-custom-code-to-Instant-Site)
- **Square Online**
  - The **Embed code** section is inline only, for Plus and Premium. Owners may add multiple sections. "We're unable to assist with custom code of any kind", and "Pasting invalid or incomplete code can cause problems with your website". - [Square: embedded code](https://squareup.com/help/us/en/article/6899-add-external-content-and-widgets-with-embedded-code-in-square-online-store)
- **BentoBox**
  - **Embed** flexible content ("accepts web-based code snippets"), inline in page flow. The tier is not stated (BentoBox is now only for Clover POS customers). - [BentoBox](https://help.getbento.com/en/articles/403585); [getbento.com/pricing](https://getbento.com/pricing/)
- **Flipsnack**
  - An "Embed code" interaction in the Links and Tags group, positioned on the page. - [Flipsnack](https://help.flipsnack.com/en/articles/2364948-how-to-add-videos-and-interactions)
- **Heyzine**
  - Web iframes for arbitrary embeds (script-level code not documented). - [Heyzine](https://heyzine.com/how-to/make-an-interactive-pdf/)
- **Allowlist-style embeds instead of raw code**
  - Lnk.bio advertises "147 embed services" with "No third-party trackers running on creator pages by default". - [Lnk.bio](https://lnk.bio/what-is-lnk-bio)
  - Linktree offers curated Link Apps (YouTube, Vimeo, TikTok Video, Spotify, Typeform, PDF display, etc.). - [Linktree browse](https://linktr.ee/marketplace/browse)
  - Take App's Video card allows "Only YouTube and TikTok links". - [Take App](https://www.take.app/help/designing-storefront)
- **Beacons**
  - Third-party vendors (EmbedSocial, Testimonial.to) tell users to paste embed code through "+ Add block" **(secondary; no Beacons doc confirming a raw HTML block was found)**. - [EmbedSocial help](https://embedsocial.com/help/en/articles/8065474-how-to-embed-reviews-in-beacons-ai)

### Inferences
- Quicktalog's pairing of an allowlisted embed (~37 hosts) with a sandboxed `custom_code` block matches the market's two-tier approach. Lnk.bio (147 embed services) and Linktree (curated apps) lean on allowlists. Carrd, Ecwid and Taplink additionally expose raw code.
- Quicktalog runs custom code in a sandboxed iframe, which is stricter than Carrd, Taplink or Ecwid (those inject into the page, including `<head>`).
- The gap Quicktalog could consider is **site-wide head/body code**. Among web-page builders with inline code, Carrd, Taplink and Ecwid also offer a head-level slot, mainly for pixels and verification tags. Square and BentoBox document inline embeds only. The flipbook tools (Flipsnack, Heyzine) offer on-page embeds only.
- Gating convention: custom code sits at the first "serious" paid tier (Carrd $19/yr, Ecwid Venture $29/mo, Square Plus $49/mo) and never on free plans in this set.

### Gaps
- The exact Taplink tier for the HTML block and the Settings HTML-Code field is unconfirmed.
- Whether Heyzine or Beacons allow scripts, as opposed to iframes only, is undocumented.
- Flipsnack's tier for the "Embed code" interaction is not stated explicitly.

---

## Q4. Do they offer layout primitives (columns, grids, containers, free positioning) or only stacked full-width blocks? Do blocks come with named layout variants or presets?

### Takeaway
Nearly all mobile-first menu, catalogue and link-in-bio tools use **stacked, single-column blocks** with **named layout variants on specific blocks**, not general layout primitives. The only true primitives are Carrd's **Container** with columns and Taplink's **sections** and **custom block**. Linktree's **Collections**, BentoBox's multi-column presets and Square's layouts are preset variants. Flipbook tools are the exception: they use free positioning of hotspots over fixed PDF pages. Bento.me's free-sizing grid tiles were the most layout-flexible link-in-bio model, and Bento has been sunset.

### Cited Findings
- **Carrd**
  - "Container" is an element, and docs cover "Organizing Elements into Columns" and "Using Sections". Sections "divide a site into named regions… to simulate the effect of having multiple pages". - [Carrd docs index](https://carrd.com/docs/building); [Carrd: sections](https://carrd.com/docs/building/using-sections); element list - [Carrd](https://carrd.com/docs/building/using-element-styles)
  - Elements are moved "before or after another element" (flow layout, not free x/y). - [Carrd basics](https://carrd.com/docs/building/basics)
- **Taplink**
  - A section is "an extra design variation that can be applied to one or more blocks": grouped blocks with a custom background, colour or image. Primary and Secondary sections come from the theme. Free plans can make "local" sections only; Pro and Business can also make reusable "global" sections. - [Taplink: sections](https://taplink.at/en/guide/sections.html)
  - The "Custom block" lets users design layouts combining text, buttons and images. - [Taplink](https://taplink.at/en/blog/what-is-taplink.html); [Taplink guide: custom block](https://taplink.at/en/guide/custom-block.html)
- **Linktree**
  - Collections offer "Stack, Grid, Carousel, or Showcase" layouts, with Grid and Carousel on paid plans. Links have Classic vs "Featured" layouts, and paid plans get "Unlimited Featured links". - [Linktree Collections](https://linktr.ee/help/en/articles/5434163-organize-your-links-with-collections); [Linktree paid features](https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree)
- **BentoBox**
  - Named multi-column presets: "Two Column Text", "Two Column Freeform Thumbnails", "Split Overlay" ("two side-by-side content blocks"), "Full Overlay". The hero offers types such as "Grid". - [BentoBox flexible content](https://help.getbento.com/en/articles/403585); [BentoBox homepage](https://help.getbento.com/hc/en-us/articles/360020930894-How-to-change-your-homepage-layout-)
- **Square Online**
  - Section layouts and repeatable "groups" inside a section. - [Square sections](https://squareup.com/help/us/en/article/6860-adding-sections-to-your-pages-in-square-online-store)
  - "Various layouts for featured item sections and product detail pages". - [Square Bottom Line](https://squareup.com/us/en/the-bottom-line/inside-square/square-online-customization-updates)
- **Ecwid**
  - Owners pick sections from previews and reorder them, except the fixed Header, Announcement and Footer. AI-generated custom sections are available. - [Ecwid sections](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections); [Ecwid AI sections](https://support.ecwid.com/hc/en-us/articles/22157264768284-Creating-custom-sections-for-Instant-Site-with-AI)
- **Menubly**
  - The menu layout preset is "grid view, list view, or category view". The mini site is a fixed template configured through tabs. - [Menubly](https://www.menubly.com/); [Menubly docs](https://docs.menubly.com/mini-website/create-a-mini-website-for-restaurant)
- **MenuTiger**
  - Fixed section types that owners can "add or rearrange". - [MenuTiger](https://www.menutiger.com/features/web-site-builder)
- **Take App**
  - Single-column cards added one at a time. - [Take App](https://www.take.app/help/designing-storefront)
- **Later**
  - Fixed blocks reordered in "Change Order"; design options cover colours, fonts and button styles. - [Later design](https://help.later.com/hc/en-us/articles/4988904359959-Customize-the-Design-Layout-of-Your-Link-in-Bio-Page)
- **Stan Store**
  - The URL/Media product has display styles "Button", "Callout" or "Embed". - [Stan help](https://help.stan.store/article/18-external-link-url-product)
- **Lnk.bio**
  - "38 page layouts" and "577 free templates". - [Lnk.bio](https://lnk.bio/what-is-lnk-bio)
- **Beacons**
  - Per-link layouts in the Links block **(search excerpt)** and a "Spacer" block. - [Beacons Links](https://help.beacons.ai/en/articles/4696577); [Beacons category](https://help.beacons.ai/en/categories/1086529)
- **Flipsnack**
  - Page-based design studio with shapes, charts, tables and positioned interactions (link *areas*, shop *areas*, hotspots). - [Flipsnack](https://help.flipsnack.com/en/articles/2364948-how-to-add-videos-and-interactions)
  - Publuu "Animated and customized hotspots". - [Publuu prices](https://publuu.com/prices/)
- **Bento.me (sunset)**
  - Bento "differed from its competitors by offering grid-based content placement and flexible block sizing and layouts" **(secondary)**. - [SunsetHQ](https://www.sunsethq.com/blog/bento-acquisition)

### Inferences
- The category norm is "stack + variants": Quicktalog's flat single-column list with 4 card layouts on `items` is in line with the market.
- Where competitors add layout power, they do it through **block-level variants** (Grid, Carousel, Showcase, Split, Two-column), not a separate column or container primitive. That suggests extending the variants pattern (e.g. image/gallery as grid or carousel, a two-up featured-item layout) rather than adding free-form columns.
- A "section/group" wrapper that applies a background to several consecutive blocks (Taplink sections) is a lightweight middle ground that fits a flat list and theme-driven styling.
- Bento's shutdown (grid-first) and Linktree's absorption of its users suggest that free-form grids have not displaced stacked lists in this category **(interpretive)**.

### Gaps
- No usage data on how often owners use grid or carousel variants versus stacked layouts.
- Carrd's Container column limits and mobile stacking behaviour were not captured.

---

## Q5. Where do tracking pixels, Google Analytics and GTM live: a settings field or a block, and at which tier? (brief)

### Takeaway
Tracking lives in **settings fields**, never in blocks, and is almost always paid. It usually sits at the mid tier (Linktree Pro, Carrd Pro Standard, Heyzine and Publuu Professional, Take App Business, Ecwid Business). GTM is rare and top-tier: Flipsnack reserves it for Enterprise. Tools with head-code slots (Carrd, Taplink, Ecwid) let users paste any tag there instead.

### Cited Findings
- **Linktree:** Settings > "Analytics integrations". The owner pastes a Meta Pixel ID (plus an optional Conversions API access token) and a GA4 Measurement ID. Pro and Premium only. - [Linktree: Meta Pixel](https://help.linktr.ee/en/articles/5434194-facebook-meta-pixel-integration); [Linktree: GA](https://help.linktr.ee/en/articles/5434201-google-analytics-integration); [Linktree paid features](https://linktr.ee/help/en/articles/5434140-an-overview-of-paid-features-available-on-linktree)
- **Carrd:** Pro Standard includes "Enable optional site analytics and tracking". Any tag can also go in an Embed with Hidden (Head) placement. - [Carrd plans](https://carrd.com/docs/pro/plans); [Carrd embed](https://carrd.com/docs/building/embedding-custom-code)
- **Taplink:** Google Analytics is added through "Add-ons → Analytics → Google Analytics". - [Taplink GA](https://taplink.at/en/blog/google-analytics-integration.html). A search excerpt describes "20+ integrations… Google Analytics, Mailchimp, Facebook and TikTok Pixels" on paid plans **(secondary)**. - [Taplink blog](https://taplink.at/en/blog/tap-bio-alternative.html)
- **Take App:** "SEO and Trackings" covers GA, Facebook Pixel, TikTok Pixel and Snapchat Pixel, and the help page says "Business plan required". - [Take App: SEO & trackings](https://www.take.app/help/seo-and-trackings). This conflicts with the pricing page, which shows "SEO & Meta/TikTok Pixel" in both Basic and Business. - [Take App pricing](https://www.take.app/pricing)
- **Ecwid:** "Meta pixel" and ad-channel integrations start at Business. - [Ecwid pricing](https://www.ecwid.com/pricing). Head code is available from Venture. - [Ecwid custom code](https://support.ecwid.com/hc/en-us/articles/8359349900828-Adding-custom-code-to-Instant-Site)
- **Flipsnack:** Google Analytics on Pro; "Google Tag Manager integration" on Enterprise only. - [Flipsnack pricing](https://help.flipsnack.com/en/articles/107456-pricing-plans-explained)
- **Heyzine:** GA on Professional and Premium. - [Heyzine GA](https://heyzine.com/how-to/google-analytics-for-flipbooks/). **Publuu:** GA on Professional+. - [Publuu](https://publuu.com/prices/)
- **Milkshake:** Meta pixel is part of the paid subscription. - [App Store](https://apps.apple.com/us/app/milkshake-website-builder/id1452719910). **Stan:** "ad pixel tracking" on Creator Pro **(secondary)**. - [Ruzuku](https://www.ruzuku.com/learn/articles/stan-store-pricing)
- **Not listed on pricing pages:** GA, Pixel and GTM for MenuTiger, FineDine and Popmenu. - [MenuTiger](https://www.menutiger.com/pricing); [FineDine](https://www.finedinemenu.com/en/pricing/); [Popmenu](https://get.popmenu.com/pricing). MenuTiger's "Analytics Integration" means its own dashboard (scan counts, most sold food). - [MenuTiger](https://www.menutiger.com/features/web-site-builder)
- **Lnk.bio:** "No third-party trackers running on creator pages by default." - [Lnk.bio](https://lnk.bio/what-is-lnk-bio)

### Inferences
- The market convention is a settings field with named inputs (Pixel ID, Measurement ID), not a block, gated at the mid tier. It supports Quicktalog keeping tracking out of the block list.

### Gaps
- Tier details for Taplink and Lnk.bio tracking are unconfirmed. Another researcher covers tracking in depth.

---

## Q6. Is there vendor-published data on which blocks are most used? (brief)

### Takeaway
No vendor in this set publishes a ranking of block or section usage. The only vendor-published quantitative signals are conversion claims for specific integration blocks (Linktree Calendly) and counts of catalogue breadth (Taplink "20+ blocks", Linktree "30+ Link Apps", Lnk.bio "147 embed services").

### Cited Findings
- Linktree: "Linkers using the Calendly link app are generating 7x more bookings than those with a regular link out to another site." - [Linktree: Calendly app](https://linktr.ee/marketplace/apps/calendly)
- Linktree reports "30+ Link Apps" in its marketplace. - [Linktree help](https://linktr.ee/help/en/articles/8614037-adding-links-what-s-possible). The marketplace launched in June 2022 with Spotify, TikTok, Bandsintown and 30+ integrations **(secondary)**. - [Hypebot](https://hypebot.com/hypebot/2022/06/linktree-launches-marketplace-to-showcase-spotify-tiktok-bandsintown-and-30-app-integrations.html)
- Taplink markets "20+ content blocks" and positions **Price lists** as the core QR-menu block. - [Taplink](https://taplink.at/en/blog/what-is-taplink.html); [Taplink QR menu](https://taplink.at/en/blog/how-to-create-a-qr-code-menu.html)
- Lnk.bio says it offers "147 embed services… 38 page layouts". - [Lnk.bio](https://lnk.bio/what-is-lnk-bio)
- Hoo.be's editorial "7 must-have sections" (contact info, shop, current projects, latest content, social links, products/services, forms) is a vendor opinion, not usage data. - [hoo.be blog](https://hoo.be/blog/what-to-add-to-link-in-bio)

### Inferences
- The Linktree Calendly claim is a useful argument that embedded or purpose-built blocks beat plain outbound links for conversion. That favours Quicktalog building native booking, map or contact blocks over link buttons.

### Gaps
- No block-usage rankings from Linktree, Beacons, Taplink, Carrd, Take App or the menu vendors were found in help centres, changelogs or blogs. Customer-demand mining is covered by another researcher.

---

## Q7. What is the de-facto standard block set in this category, and what is rare or differentiating?

### Takeaway
The **de-facto standard set** across the 20+ products has three layers:
1. **Content primitives:** text/heading, image, gallery/carousel, video embed, link/button, spacer/divider.
2. **Small-business essentials:** social links, contact (form or vCard), map/location, countdown/promo/announcement, FAQ, reviews/testimonials, product or featured-items showcase.
3. **Escape hatch:** embed (allowlist or raw code at a paid tier).

**Differentiators** are vertical-specific blocks: price list or pricing plans, opening hours, delivery options, allergen tags, a featured box pulling from content types, a social-post feed, and AI-generated sections. Layout wrappers (sections, containers) and head-level code are power features.

### Cited Findings
- Text, image, video and link blocks appear in every open picker:
  - Carrd's Text, Image, Video and Links elements. - [Carrd](https://carrd.com/docs/building/using-element-styles)
  - Taplink's Text, Images, Videos and Links blocks. - [Taplink](https://taplink.at/en/blog/what-is-taplink.html)
  - Take App's Text, Image, Video and Link cards. - [Take App](https://www.take.app/help/designing-storefront)
  - Beacons' Text, Image, Video and Links blocks. - [Beacons](https://help.beacons.ai/en/categories/1086529)
  - Linktree's Text, Image gallery, Video/YouTube and Header apps. - [Linktree](https://linktr.ee/marketplace/browse)
  - Ecwid's Text, Image, Image & Text and Video sections. - [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
- Countdown/timer blocks appear in Carrd (Timer), Taplink (countdown timers) and Take App (Countdown card). - [Carrd](https://carrd.com/docs/building/using-element-styles); [Taplink](https://taplink.at/en/blog/what-is-taplink.html); [Take App](https://www.take.app/help/designing-storefront)
- FAQ blocks appear in Taplink, Ecwid and Linktree. - [Taplink](https://taplink.at/en/blog/what-is-taplink.html); [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections); [Linktree](https://linktr.ee/marketplace/browse)
- Forms or email capture are near-universal in link-in-bio. Carrd gates forms to Pro Standard, Taplink gates them to Business, and Stan has no free plan. Linktree's paid-features overview does not list the Form app as paid. Whether Beacons gates forms was not confirmed.
  - Linktree Form. - [Linktree Form app](https://linktr.ee/marketplace/apps/contact-form)
  - Beacons Email & SMS and Lead Magnet. - [Beacons](https://help.beacons.ai/en/categories/1086529)
  - Stan Collect Emails. - [Stan](https://help.stan.store/article/13-collect-emails-applications-product)
  - Carrd Form (Pro Standard). - [Carrd plans](https://carrd.com/docs/pro/plans)
  - Taplink forms (Business). - [Taplink](https://taplink.at/en/blog/what-is-taplink.html)
- Product or featured-item showcase blocks:
  - Take App Products card. - [Take App](https://www.take.app/help/designing-storefront)
  - Ecwid Product Collection and Featured Product **(search excerpt)**. - [Ecwid store section](https://support.ecwid.com/hc/en-us/articles/11703951436700-Configuring-the-store-section-of-your-Instant-Site)
  - BentoBox Featured Box (Menus, Events, Press…). - [BentoBox](https://help.getbento.com/en/articles/403585)
  - Linktree Shopify and Digital products. - [Linktree](https://linktr.ee/marketplace/browse)
- Rare, vertical blocks:
  - Taplink **Price lists** and **Pricing plans**. - [Taplink QR menu](https://taplink.at/en/blog/how-to-create-a-qr-code-menu.html); [Taplink pricing plans](https://taplink.at/en/guide/pricing-plans.html)
  - Ecwid **Opening Hours** and **Company Info**. - [Ecwid](https://support.ecwid.com/hc/en-us/articles/11721659199388-Adding-and-editing-site-sections)
  - Take App **Delivery** card. - [Take App](https://www.take.app/help/designing-storefront)
  - FineDine allergen labels. - [FineDine](https://www.finedinemenu.com/en/pricing/)
  - Flipsnack **Quiz / Question** and **charts / tables**. - [Flipsnack](https://help.flipsnack.com/en/articles/2364948-how-to-add-videos-and-interactions)
  - Publuu **Wishlist** from product tags. - [Publuu](https://publuu.com/help/how-to-use-the-wishlist-feature/)
  - Later shoppable social-post feed. - [Later](https://help.later.com/hc/en-us/articles/4409203074967-What-is-Link-in-Bio)
  - Ecwid AI-generated custom sections. - [Ecwid AI](https://support.ecwid.com/hc/en-us/articles/22157264768284-Creating-custom-sections-for-Instant-Site-with-AI)
- Deprecations and renames in 2025–2026:
  - Bento.me sunset on 13 Feb 2026. - [AlternativeTo](https://alternativeto.net/news/2025/12/bento-to-shut-down-in-2026-as-linktree-takes-over-and-offers-migration-path/)
  - BentoBox rebranded under Clover and limited to Clover POS customers. - [getbento.com](https://getbento.com/pricing/)
  - GloriaFood end of service ~30 Apr 2027 **(secondary)**. - [Fleksa](https://fleksa.com/en/blog/gloriafood-shutting-down-what-restaurants-should-do-next)
  - Milkshake moved to Codelbee. - [App Store](https://apps.apple.com/us/app/milkshake-website-builder/id1452719910)
  - FineDine tiers are now Starter/Growth/Premium. - [FineDine](https://www.finedinemenu.com/en/pricing/)
  - Beacons simplified to Free Forever + Creator Plus. - [Beacons](https://beacons.ai/pricing)
  - Ecwid shows no free plan and raised prices in Feb 2026. - [Ecwid](https://www.ecwid.com/pricing); [PricingSaaS](https://pricingsaas.com/news/ecwid/20260204/)
  - The DISH Website Builder has been folded into Dish.co. - [website.dish.co](https://website.dish.co/)

### Inferences
- **Quicktalog's current lineup against the standard set** (items, text, divider, embedding, custom_code; header, contact/socials, partners and newsletter at catalogue level):
  - **Already on par or ahead:**
    - The priced-items section is directly comparable to Taplink's Price list and Catalog Machine's price-list pages, and richer than both thanks to discount, image and 4 layouts.
    - Allowlisted embeds follow the Lnk.bio and Linktree pattern.
    - Sandboxed custom code is a feature only builder-type tools (Carrd, Taplink, Ecwid, Square, BentoBox) offer, and they only at paid tiers.
  - **Standard blocks Quicktalog lacks as blocks:**
    - image / gallery / carousel
    - button / CTA link (incl. WhatsApp, call, directions)
    - map / location
    - FAQ
    - countdown / promo banner
    - reviews / testimonials
    - featured-items spotlight (Take App Products card, BentoBox Featured Box)
    - heading as its own block (the `text` block may cover this)
  - **Kept at catalogue level:** contact/socials and newsletter are catalogue-level settings in Quicktalog. Several competitors also expose them as placeable blocks: Take App Contact card, Linktree Contact Details and Form, Taplink Messaging apps and Social networks, Ecwid Contact section. That lets owners place them mid-page.
  - **Differentiating opportunities (rare in this set):**
    - opening-hours block (only Ecwid and DISH)
    - dietary/allergen badges on items (only FineDine confirmed)
    - delivery/fulfilment info block (only Take App)
    - pricing-plans/packages block for service businesses such as gyms, salons and clinics (only Taplink)
    - a Taplink-style "section" wrapper applying a themed background to consecutive blocks
- **Tiering template the market uses:**
  - Free: text, links, basic media, map, FAQ.
  - First paid tier: rich media, featured/spotlight styling and variants.
  - Mid tier: embeds, custom code, forms, tracking.
  - Top tier: commerce, reviews, GTM, white-label.

  This maps naturally onto Quicktalog's Starter → Basic → Pro → Growth → Premium ladder **(interpretive)**.

### Gaps
- Without usage data, "standard" here means prevalence across vendors, not frequency of use by owners.
- Picker details for Square Online's categories and Popmenu's builder remain unverified, so the restaurant-website end of the set is under-sampled compared with link-in-bio tools.
