# Google tag and GA4 on catalogues: customer-value design

Status: proposed (design input for the 2026-10-01 catalogue-google-tag PLAN). Lens: customer value. Written 2026-10-01.

It answers the founder's question "How the google tag and analytics will be added": the end-to-end mechanism by which a restaurant, salon or shop owner adds Google Analytics 4 (GA4) to a Quicktalog catalogue, and what their visitors experience. It also decides what to do about Google Ads (`AW-`), the `GT-` Google tag ID, Google Tag Manager (`GTM-`) and the Meta Pixel.

**Inputs**
- The five research notes in `../research/`, all read in full: `code-render-path.md`, `code-write-path.md`, `google-tag-docs.md`, `consent.md` and `shared-domain-implementations.md`.
- The 2026-09-30 strategy report and its notes `codebase_embed_custom_code.md`, `embeds_tracking_custom_code.md` and `smb_demand_signals.md`.
- The 2026-09-25 `PLAN.md` §3.
- A re-read of the code on branch `test` at `d785bb8`, with `quicktalog-packages` at `7a2ca85` (1.66.0).
- Two new probes (Appendix A).

**Labels**
- **Fact** means one of three things:
  - read in code, cited as repo-relative `file:line` (the other two repos are prefixed `quicktalog-packages/` and `quicktalog-backend/`);
  - stated on a cited page;
  - observed in a probe.
- **Inference** is my reasoning.
- **Decision** is what this design chooses.
- **(snippet)** marks something seen only in a search-result excerpt.

Nothing in the three repos was changed. PROD was not queried.

---

## 0. The answer on one page

### What the owner does (about two minutes)

1. **Open the setting.** It lives on the catalogue's **Analytics** page (`/admin/<slug>/analytics`), in a **Google Analytics** card. The builder's General tab and the publish dialog link to it.
2. **Paste the Measurement ID** (`G-…`).
   - Pasting Google's whole snippet also works: the ID is taken out of it.
   - A wrong kind of ID gets a message that names what was pasted (Tag Manager, Google tag, Google Ads, old Universal Analytics, Meta Pixel) and where to find the right one.
3. **Optional:** tick **"I advertise with Google Ads"**, so visitors can also agree to ad measurement.
4. **Save.** The setting applies at once, with no Publish needed.
   - The card shows a status: Live, Starts when you publish, Needs your business name, or Paused by your plan.
   - It also shows a best-effort check that Google actually knows the tag.
5. **Test** in a private window with the card's "Test in DebugView" link.

### What the visitor sees

- **A notice, only when tracking is on.** A catalogue with tracking shows a small bottom notice that never blocks the menu. It is in the catalogue's language and names the business and Google. "Reject" and "Accept" have equal weight, and "Settings" opens a second layer.
- **Before Accept: no Google request** (basic consent mode).
- **After Accept:** Quicktalog's own code, not the owner's, loads `gtag.js` with the owner's ID. It issues the consent commands first and scopes cookies to that ID.
- **A way back:** "Privacy choices" in the footer reopens the notice.
- **Where nothing loads:** the owner preview, the builder, a framed catalogue, and any browser that is signed in to Quicktalog.

### What the owner gets in GA4, with no configuration

- **Page views** with source/medium.
- **`view_item` for every item opened.** GA4's default Ecommerce purchases report then shows "Items viewed" per item.
- **`search`** with the search term.
- **`generate_lead` for taps on phone, WhatsApp, Viber, Messenger, SMS or email**, and for newsletter sign-ups. `lead_source` names the channel. This populates GA4's Lead acquisition report.
- **`get_directions`, `book_appointment`, `order_online` and `cta_click`.**
- **Attribution tags.** QR codes and share links can carry fixed UTM tags, so table QR, window QR, Instagram and Google traffic separate.

### What is refused while catalogues share `www.quicktalog.app` with the signed-in builder, and why

| Refused | Reason | Alternative |
|---|---|---|
| `GTM-` containers | Remotely editable code that would run on the builder's origin | Paste the GA4 ID |
| `GT-` Google tag IDs | Not yet verified to be restricted like `G-` | Paste the GA4 ID |
| `AW-` Google Ads IDs | Not needed for SMB ads measurement | GA4 → Google Ads linking covers conversions and remarketing |
| Free-form code | Unrestricted script on the shared origin | The typed settings above |
| Meta Pixel (for now) | Phase 3 | Follows on the same banner |

### Order of work

| Phase | Content | Size |
|---|---|---|
| 0 | Clean catalogue pages of Quicktalog's own unconsented tags | S–M |
| 1 | The setting, consent banner and events | L |
| 2 | Attribution helpers (QR and share-link UTMs, apply-to-all, migration help) | M |
| 3 | Meta Pixel | M |
| 4 | Structural options | |
| 5 | A separate catalogue domain, which is what unlocks GTM | |

---

## 1. What owners actually want from GA4 and ad tracking

### Facts that frame the lens

- **Volume is already covered.** Owners already see daily views and visitors from PostHog on Quicktalog's own analytics page (`src/app/admin/[name]/analytics/page.tsx:21-54`; `src/lib/analytics/catalogue-traffic.ts:19-36`). GA4's added value is sources, item interest, leads and ads, not "how many visits".
- **Owners market themselves on social and Google.** 54% of US small-business owners manage their own marketing. 50% use Facebook, 44% Instagram and 35% a Google Business Profile ([BrightLocal 2025](https://www.brightlocal.com/research/smb-marketing-2025/), via `smb_demand_signals.md:276`).
- **Messaging is the preferred contact.**
  - 73.3% of consumers prefer messaging a business (Meta-commissioned Kantar survey, [WhatsApp Business](https://whatsappbusiness.com/resources/resource-library/state-of-business-messaging/)).
  - Viber has about 90% penetration in Serbia ([Infobip](https://www.infobip.com/blog/most-popular-messaging-apps-by-country), vendor data).
  - Both via `smb_demand_signals.md:95-96`.
- **Platforms send events for their users.**
  - Google's CMS guide asks platforms to "send rich event data from the customer's website to their Google account with no action required by the customer" ([Google](https://developers.google.com/tag-platform/devguides/gtag-integration), via `google-tag-docs.md` §7.2).
  - Calendly sends seven `invitee_*` events, and Gumroad tells sellers to "trust Gumroad's numbers over Google's" (`shared-domain-implementations.md` §2.2, §2.11).
- **Expect partial coverage.** Opt-in rates in Europe are 55.7–67.6% of banners displayed (Didomi 2026, vendor data, via `consent.md` §5.7).

### Owner jobs and how the design serves them

| Owner job | How this design delivers it | Owner effort | Caveat |
|---|---|---|---|
| "Where do my guests come from: table QR, window QR, Instagram, Google?" | GA4 source and medium. QR codes carry `utm_source=qr&utm_campaign=<placement>`. One-tap tagged links for Instagram bio, Facebook, Google Business Profile and WhatsApp (§11.5, §11.6) | Pick a placement when printing; copy a link | Old untagged QR codes show as Direct. GA4 has no QR channel by default ([Google](https://support.google.com/analytics/answer/9756891)) |
| "What do people look at?" | `view_item` carries item, section and price on every item open, which fills "Items viewed" in the default Ecommerce purchases report ([Google](https://support.google.com/analytics/answer/12924131)). `search` carries the term | None | Only visitors who accept |
| "Did they call, message or book?" | `generate_lead` with a `lead_source` per channel. Lead events populate the Lead acquisition report, which "shows which channels drive new leads" ([Google](https://support.google.com/analytics/answer/16376749)). `book_appointment`, `get_directions` and `order_online` cover the rest | Mark key events (one click each) | A tap shows intent, not a completed call |
| "Did my Google Ads work?" | Link GA4 to Google Ads and import key events as conversions ([Google](https://support.google.com/analytics/answer/10632359)). Event names match the Ads lead categories Contact, Get directions and Book appointment ([Google Ads](https://support.google.com/google-ads/answer/9791434)) | Link the accounts and import | EEA conversions need `ad_user_data` consent ([Google](https://support.google.com/analytics/answer/14275483)), hence the "I advertise" switch |
| "Show ads to people who looked at my menu" | GA4 audiences shared through the Ads link, consent-gated. Meta Pixel in Phase 3 | Build an audience | Small audiences; EEA needs ad consent |
| "My website or agency already uses GA4" | Use the same `G-` ID as the website, or a separate stream. The same ID on several catalogues counts one visitor (§8) | Paste the ID | Cross-domain session stitching with the owner's site is untested |
| "Don't annoy my guests or slow the menu" | No banner unless tracking is on. The sheet never blocks the menu. The tag loads only after Accept. Quicktalog's own unconsented tags leave catalogue pages (Phase 0), which also lightens the page | None | Every visitor of a tracked catalogue sees the notice |
| "Don't get me into legal trouble" | Reject on the first layer, per-catalogue consent, a consent log, a generated privacy notice, and a business name required before tags run | Fill in the business name | Counsel must approve the texts; Quicktalog needs a DPA (§7.9) |

**Inference.** The built-in dashboard already answers "how many". The jobs worth paying for are therefore attribution (QR vs Instagram vs Google) and leads (calls and WhatsApp). This design spends its effort on automatic events, tagged QR codes and share links, and guided setup, not on configuration options. Every option it does add has a default that works without touching it.

---

## 2. Where the research disagrees or has gaps, and what this design chooses

| Topic | What the sources say | Decision here |
|---|---|---|
| When the custom-code tracking broke | The task context says owners' snippets stopped on 2026-09-15 (`e87e1f2`). `code-render-path.md` §1 shows PROD still serves `origin/main` (May 2026), where embeds and custom code re-create scripts first-party. | **Correction:** it broke on TEST only. On PROD, owners' snippets still run, unconsented, and will stop on the release that brings `test` to PROD. Outreach and launch timing follow from that (§15.4). |
| Where the setting lives | `code-write-path.md` §4 offers a General-tab section or an Analytics-page card. `google-tag-docs.md` §1.1 suggests a new Integrations tab or a General section. `code-render-path.md` §11 suggests the sidebar. | **The Analytics page card** (§3.1), plus a pointer row in the General tab. A fifth tab would break the 4-column bar sized for 360px (`src/components/catalogue/inputs/sidebar/index.tsx:28-33, 128`). It would also be the only builder field that skips Save and Publish. |
| Data layer name | `code-render-path.md` §10.3: a custom layer, `l=`, and `send_to`. `google-tag-docs.md` §3.4: preferred is "tenant tag is the only Google tag, default `window.dataLayer`". | **Both.** Quicktalog's own GTM leaves catalogue pages (Phase 0), so the customer's tag is the only Google tag. It still uses its own layer, `qtDataLayer` with `&l=qtDataLayer`, as defence in depth. Probe A.2 confirms it works and that `window.dataLayer` is never created. |
| Cookie scoping | All notes propose a per-**catalogue** `cookie_prefix` and `cookie_path`. | **Per measurement ID**: `cookie_prefix = qt_<id>` with `cookie_path: '/catalogues'`. A café with a food menu and a drinks menu on one GA4 property then counts one visitor, not two. Different businesses (different IDs) still never share a cookie. Probe A.2 confirms both. |
| Ad consent category | `google-tag-docs.md` §1.3: always offer "Advertising", because a `G-` tag can be linked to Ads remotely. | **Offer it only when the owner says they advertise**, or when the tag check sees an `AW-` destination. Without it, `ad_storage`, `ad_user_data` and `ad_personalization` stay **denied**, so a remotely added Ads destination receives no consented ad data. That is the safe outcome. A café that doesn't advertise does not ask its guests about ads: more choices on the first page cut consent by 8–20 points (Nouwens et al., via `consent.md` §6.2). |
| Basic vs advanced consent mode | Google's CMS guide favours advanced (`google-tag-docs.md` §4.4). The consent research and every shared-origin analogue that was inspected use basic (`consent.md` §6.3; `shared-domain-implementations.md` §5). | **Basic, for everyone, in v1.** Owner opt-in to advanced mode outside the EEA is a Phase 4 option after legal review. |
| Event names | `google-tag-docs.md` §7.3 calls it "the founder's call": `generate_lead` with `lead_source`, or custom names. | **Use GA4's recommended event where one exists:** `view_item`, `search`, and `generate_lead` for contact taps and newsletter sign-ups, because recommended lead events populate the Lead acquisition report. **Elsewhere use custom names that mirror the Google Ads lead categories:** `get_directions`, `book_appointment`. (§11.2) |
| Session-cookie guard | Only `google-tag-docs.md` §2.5 proposes it. | **Adopt it**, and show a small owner-facing note so signed-in owners understand why nothing fires (§6.3). |
| Plan tier | The 09-25 PLAN and earlier research say Pro+. `code-write-path.md` §3 says it is the founder's call. | **Recommend Basic+** (§14), for five reasons there. |
| What a downgrade does | `code-write-path.md` §3: clear the ID or suspend it. | **Pause, keep the ID, resume in one click** (§5.8). |
| Quicktalog's own tags | The 09-25 PLAN §3.2 proposed a Premium flag, `suppressQuicktalogAnalytics`. `consent.md` §5 shows Quicktalog's GTM, Clarity and Sentry Replay have no lawful basis on catalogue pages. | **Drop the flag. Remove them from all public catalogue pages for everyone** (§9). |
| Separate root layout vs guards | `code-render-path.md` §9 offers both. | **Phase 1 uses guards** (landing document, hard exits, framing, session). The separate root layout is Phase 4 (§16). |
| Plan-meter counting | `consent.md` §5.7 prefers server-side counts and lists PostHog cookieless mode as an option. | **Phase 0: PostHog `cookieless_mode: 'always'` on catalogue routes.** The same queries keep working. Server-side counting comes later (§9). |
| `GT-` IDs | Google's CMS guide wants one field for `G-`, `AW-` and `GT-` (`shared-domain-implementations.md` §4). `code-render-path.md` §9.5 says leave `GT-` out until checked. | **Reject `GT-` in v1 with guidance.** Revisit after verifying its restriction class (§13). |
| Meta Pixel in v1 | The 09-30 report puts GA4 and Meta together, after consent. | **Phase 3.** The database CHECK accepts the key from day one, so no second migration is needed (§4.2). |
| The 09-25 PLAN's consent example | `dataLayer.push(["consent","default",…])` (PLAN.md §3.2). | **Wrong form.** gtag.js ignores array pushes (`google-tag-docs.md` §4.6). The loader pushes `Arguments` objects; probe A.2 confirms `[object Arguments]`. |
| Whether Google's endpoint can check a tag ID | Not covered by any note. | **New probe A.1:** made-up `G-` IDs return a generic container, a configured tag returns its destinations, and some IDs return 404. This powers the card's best-effort "Found at Google" check (§5.3). |

---

## 3. Owner UX (task item 1)

### 3.1 Where the setting lives

**Decision: a Google Analytics card on `/admin/<slug>/analytics`.** It sits below the traffic report, with anchor `#google-analytics`.

**Why this page.**
- **It is where owners look.** Owners think "analytics", and this is the page the dashboard card already opens (`src/components/dashboard/overview/DashboardItem.tsx:154`, per `code-write-path.md` §4).
- **It already proves ownership on the server.** The page checks ownership in `withUser` before anything renders (`src/app/admin/[name]/analytics/page.tsx:25-34`). The same block can read the integrations, the catalogue status, the business name and the plan.
- **"Saves on its own" fits there.** In the builder it would be the one field that skips Save and Publish (`src/components/catalogue/builder/useBuilderActions.ts:48-69, 100-139`, per `code-write-path.md` §4).
- **It works when PostHog is down.** If PostHog is unreachable the page shows an error block (`src/components/analytics/CatalogueAnalytics.tsx:51-70`). The card renders independently.

**Ways in, so it is discoverable:**
1. **General tab pointer.** A new last `PanelSection` in `src/components/catalogue/inputs/sidebar/GeneralTab.tsx` (after "Search and sharing", `:118-163`):
   - Title "Analytics & tracking".
   - A one-line status ("Connected: G-PSW1MY7HB4" or "Not connected").
   - A button "Open Google Analytics settings" that opens the Analytics page in a new tab, so builder state is not lost.
2. **Publish dialog nudge.** In the success modal, "Measure visits in Google Analytics" appears only on eligible plans with no ID yet. This is Phase 2.
3. **Dashboard card menu.** A "Google Analytics" item in the catalogue card's dropdown (`src/components/dashboard/overview/ItemDropdownMenu.tsx`).

### 3.2 The card, by state

A text wireframe of the connected state:

```
Google Analytics                                                   Live
See where visitors come from and what they open, in your own Google Analytics.

Measurement ID   [ G-PSW1MY7HB4                ]  [Save]
                 Found at Google. Sends data to G-PSW1MY7HB4.
[ ] I advertise with Google Ads (lets visitors agree to ad measurement)
[ ] Use this ID on all my catalogues

Test in DebugView  ·  What gets measured  ·  Why numbers differ  ·  Remove
Preview the cookie notice your visitors see  [ v ]
```

| State | When | Status line (copy) |
|---|---|---|
| Locked | The plan lacks `features.integrations.googleAnalytics` | "Available on Basic and above. Connect your own Google Analytics and see visitors' sources, item views and calls." Upgrade button; "Remove" stays usable if an old ID exists. |
| Not set | No ID | A guided start with two choices (§3.4): "I have a Measurement ID" and "Help me create one". |
| Live | ID set, not paused, catalogue active, business name present | "Live. Google Analytics runs on your published catalogue for visitors who accept cookies." |
| Waiting for publish | ID set, catalogue draft or inactive | "Saved. It starts when you publish your catalogue." (`app_public` reads active rows only, per `code-write-path.md` §1 Q5.) |
| Needs business name | ID set, published row has no `legal.legalName` | "Add your business name in the builder (Footer → Business information) and publish. Visitors must know who asks for their consent." |
| Paused | `integrations.paused` | "Paused because your plan no longer includes Google Analytics. Your ID is kept: upgrade, then press Resume." |

**Tag-check chip** (best effort, §5.3):

| Result | Chip copy |
|---|---|
| Found | "Found at Google. Sends data to G-…, AW-…" |
| Empty container | "Google returns an empty tag for this ID. Check for typos (0 and O, 1 and I). A tag created minutes ago can take a moment." |
| 404 | "Google has no tag with this ID. In GA4 open Admin → Data streams → your web stream → Configure tag settings, and copy the Google tag ID if it starts with G-." |
| Error | "Couldn't check right now." |

If the found destinations include an `AW-…` ID while "I advertise" is off, the card adds: "This tag also sends to Google Ads. Turn on 'I advertise with Google Ads' so visitors in Europe can agree to ad measurement; otherwise those conversions aren't counted."

### 3.3 Field copy and validation messages

**Field copy**
- Label "Measurement ID", placeholder `G-XXXXXXXXXX`.
- Help: "In Google Analytics: Admin → Data collection and modification → Data streams → Web → your stream. The Measurement ID is in the first row." This is Google's own path ([Google](https://support.google.com/analytics/answer/12270356)).

**Input handling.** Normalization is silent: trim, remove spaces, upper-case, turn en/em dashes and the minus sign into a hyphen. The client shows live hints with the same pure function the server uses (§5.1).

| Input | Result | Message |
|---|---|---|
| `g-psw1my7hb4`, ` G–PSW1MY7HB4 ` | Accepted as `G-PSW1MY7HB4` | none |
| A pasted gtag snippet or URL containing one `G-` ID | Accepted | "We found G-PSW1MY7HB4 in what you pasted and used it." |
| A snippet containing a `GTM-` container | Refused | "This is Google Tag Manager code. Catalogues can't run Tag Manager yet. Paste your GA4 Measurement ID instead; it starts with G-." Plus a "Why?" link (§13.1). |
| `GTM-…` | Refused | Same as above. |
| `GT-…` | Refused | "This is a Google tag ID. Paste the Measurement ID of your GA4 web stream instead; it starts with G-." |
| `AW-…` | Refused | "This is a Google Ads ID. To measure ads, paste your GA4 Measurement ID here and link Google Analytics to Google Ads. [How]" |
| `UA-…` | Refused | "This is an old Universal Analytics ID. Google stopped processing these on 1 July 2023. Create a GA4 property and paste its Measurement ID (G-…)." The date is Google's ([Google](https://support.google.com/analytics/answer/9355666)). |
| 10–20 digits | Refused in v1 | "This looks like a Meta Pixel ID. Meta Pixel support is coming; this field takes your GA4 Measurement ID (G-…)." |
| Anything else | Refused | "That doesn't look like a Measurement ID. It starts with G- followed by letters and numbers, for example G-PSW1MY7HB4." |
| Empty and Save | Removes tracking | "Google Analytics removed. Your catalogue stops loading it within a minute." |

### 3.4 Guided setup when the owner has no GA4 yet

"Help me create one" opens five numbered steps. Each has a deep link or a copy button:

1. Open analytics.google.com, then Admin, then Create, then Property. Suggested name: "<Catalogue> menu".
2. Business objectives: choose **Generate leads**, so GA4 shows its lead reports. (The library location is reported by third parties (snippet); Google's own page says the Lead acquisition report is populated by the lead events: [Google](https://support.google.com/analytics/answer/16376749).)
3. Data collection: Web. Website URL `www.quicktalog.app/catalogues/<slug>`, with a copy button. Stream name "Quicktalog catalogue".
4. Copy the Measurement ID shown on the stream.
5. Paste it here.

**Inference.** This replaces the "go read Google's docs" step that loses non-technical owners. The analogues stop at "paste your ID" (`shared-domain-implementations.md` §2.1, §2.4).

### 3.5 Plan lock

- **Lock.** `LockedGroup locked={!plan.features.integrations?.googleAnalytics}`, the existing pattern (`src/components/catalogue/inputs/sidebar/panel/LockedGroup.tsx:14-43`, per `code-write-path.md` §3).
- **Copy.** It needs a feature-aware "Available on Basic and above". `getRequiredPlan` only knows numeric limits today (`src/lib/entitlements/required-plan.ts:16-31`, per `code-write-path.md` §3). Add a feature lookup there.
- **Remove and Resume are never locked.** A downgraded owner can always clear tracking.

### 3.6 Testing guidance (shown under "Test in DebugView")

1. **Open a private window, or sign out of Quicktalog.** For your safety, Google tags never run while you are signed in to Quicktalog in that browser. This also keeps your own visits out of your reports.
2. **Open your catalogue with the debug link** `https://www.quicktalog.app/catalogues/<slug>?qt_debug=1`. With it, the loader adds `debug_mode: true`, so events show in GA4 under Admin → DebugView ([Google](https://support.google.com/analytics/answer/7201382)).
3. **Tap Accept in the cookie notice.** Without consent, events do not appear in DebugView (same Google page).
4. **Try the events.** Open an item, search, and tap your phone or WhatsApp button. Within seconds you should see `page_view`, `view_item`, `search` and `generate_lead` in DebugView or Reports → Realtime.
5. **Alternative.** Google Tag Assistant (tagassistant.google.com) works on the same URL. Open it from the private window. That it handles the renamed data layer still needs manual testing (§15.1).
6. **Afterwards:** mark `generate_lead` and `book_appointment` as key events (Admin → Events), and link Google Ads if you advertise (§3.7).

**Inference.** The `?qt_debug=1` flag is harmless to expose: it only flags that visitor's own hits as debug traffic. Query strings do not split the ISR cache, as live probes measured (`code-write-path.md` §6, probe B1).

### 3.7 "After setup" checklist on the card

Optional, collapsible items, each with a deep link to Google's help:
- **Mark `generate_lead` as a key event.** It counts calls, WhatsApp, Viber, email and newsletter sign-ups.
- **Mark `book_appointment` as a key event** for salons, gyms and clinics.
- **If you advertise:** link Google Analytics to Google Ads ([Google](https://support.google.com/analytics/answer/9379420)) and import the key events as conversions ([Google](https://support.google.com/analytics/answer/10632359)).
- **See calls vs WhatsApp:** register `lead_source` as a custom dimension. **Inference:** event parameters other than built-in ones need registering before they show in reports.
- **See QR scans as their own channel:** create a custom channel group "QR code" where Source exactly matches `qr` ([Google](https://support.google.com/analytics/answer/13051316)).

### 3.8 Migration helper for owners whose old snippet stopped

**Inputs.**
- The analytics page reads the owner's published row in its `withUser` block.
- It scans `embedding`, `custom_code` and `text` blocks with the same ID regexes as the drafted PROD audit (`code-write-path.md` §7).

**What the owner sees.**
- **A `G-` ID was found:** a one-click suggestion, "We found G-XXXX in your 'Tracking' code block. Use it here?" After saving: "Remove that block. Its code no longer runs."
- **Only a `GTM-` container was found:** "Tag Manager isn't supported on catalogues yet. Paste the GA4 Measurement ID your container uses."

**Builder warning.** In edit mode, `EmbeddingBlock` and `CustomCode` show a warning when their code matches the tracking regexes: "This block contains tracking code, which doesn't run here. Use Analytics → Google Analytics instead."

---

## 4. Data model and migration (task item 2)

### 4.1 Shape

**Decision: a new `catalogues.integrations jsonb not null default '{}'` column with flat keys.**
- It goes into `PUBLIC_CATALOGUE_COLUMNS` (`src/utils/db/columns.ts:10-31`), so the ISR page can read it.
- It stays out of `CATALOGUE_EDITABLE_FIELDS` (`src/utils/db/columns.ts:38-53`), so no create, save, publish or duplicate payload can carry it. `pickEditable` copies only listed keys (`:58-66`).
- It must hold IDs and flags only. `/api/items/<slug>` returns every public column to anyone (`code-render-path.md` §2.2), so no Conversions API token or other secret may ever go here.

```ts
// quicktalog-packages/src/types/catalogue.ts (new type; Catalogue's Update map at :15-29 gains `integrations: Integrations`)
/**
 * Owner-entered tracking settings for the published catalogue.
 * IDs and flags only: never markup, URLs or tokens. The row is public via /api/items/<slug>.
 */
export type Integrations = {
  /** GA4 measurement ID of a web data stream, e.g. "G-PSW1MY7HB4". */
  ga4MeasurementId?: string;
  /** The owner uses this data for ads (Google Ads conversions/remarketing, later Meta ads).
   *  The banner then offers an "Advertising" choice; without it every ad_* consent type stays denied. */
  advertising?: boolean;
  /** Meta Pixel ID, digits only. Accepted by the DB from day one, enabled in the app in Phase 3. */
  metaPixelId?: string;
  /** Set by a plan downgrade. The ID is kept so the owner can resume in one click; never rendered while true. */
  paused?: boolean;
};

// quicktalog-packages/src/constants/catalogue.ts:3-79  defaultCatalogueData gains:  integrations: {},
// quicktalog-packages/src/types/general.ts:25-46      PricingPlan.features gains:
//   integrations: { googleAnalytics: boolean; metaPixel: boolean };
// quicktalog-packages/src/constants/pricing.ts        all six tiers set it (see §14).
```

**Why flat keys rather than the 09-25 PLAN's nested `{ ga4: { measurementId } }`.**
- The CHECK stays one readable expression.
- `code-write-path.md` §1 already validated a flat CHECK as a SELECT on TEST.

### 4.2 Migration

Create it with `supabase migration new catalogue_integrations`, per `docs/guides/drizzle.md:21`.

```sql
-- supabase/migrations/<YYYYMMDDHHMMSS>_catalogue_integrations.sql
-- Owner-entered tracking IDs for the published catalogue. IDs and flags only - never markup, URLs or snippets.
alter table public.catalogues
  add column integrations jsonb not null default '{}'::jsonb;        -- constant default: no table rewrite

alter table public.catalogues
  add constraint catalogues_integrations_check check (
        jsonb_typeof(integrations) = 'object'
    and pg_catalog.pg_column_size(integrations) < 1024
    and integrations - array['ga4MeasurementId','advertising','metaPixelId','paused'] = '{}'::jsonb   -- no unknown keys
    and (not integrations ? 'ga4MeasurementId'
         or (jsonb_typeof(integrations->'ga4MeasurementId') = 'string'
             and integrations->>'ga4MeasurementId' ~ '^G-[A-Z0-9]{6,20}$'))
    and (not integrations ? 'metaPixelId'
         or (jsonb_typeof(integrations->'metaPixelId') = 'string'
             and integrations->>'metaPixelId' ~ '^[0-9]{10,20}$'))
    and (not integrations ? 'advertising' or jsonb_typeof(integrations->'advertising') = 'boolean')
    and (not integrations ? 'paused'      or jsonb_typeof(integrations->'paused') = 'boolean')
  );

-- UPDATE is column-level for app_user (20260921181104_app_role_grants_policies.sql:54-60): name the column or every write is 42501.
grant update (integrations) on public.catalogues to app_user;
-- SELECT is column-level for app_public: without it the ISR page's read fails (42501) and renders "not found".
grant select (integrations) on public.catalogues to app_public;
```

The grant facts and the CHECK's behaviour come from `code-write-path.md` §1 (TEST queries Q1, Q2 and Q9). The `{6,20}` length bound replaces Q9's `{4,20}`, a cosmetic change. The charset is the security property, and the app regex uses exactly the same pattern (§5.1).

**pgTAP** (`supabase/tests/database/10_catalogues.test.sql`; bump `plan(20)`):
1. The owner updates `integrations` on their own row.
2. An update on another owner's row affects 0 rows.
3. `app_public` reads `integrations` of active rows only.
4. The CHECK raises 23514 for each of: lowercase, `GTM-…`, `GT-…`, a quote and script payload, an array, a number, an unknown key such as `headCode`, and an oversize object.

### 4.3 Release order (project rules)

This follows `docs/guides/drizzle.md:21-31` and `.claude/CLAUDE.md`.

1. **Test locally.** Run `npm run test:db`, which is PGlite: migrations newer than the phase chain are reported but not applied unless added (`code-write-path.md` §1). Also run `supabase start` then `supabase test db` (pgTAP).
2. **Apply to TEST:** `supabase db push` against `imhinsgyzzyblghwnedk`.
3. **Regenerate types.** In `../quicktalog-packages`, run `npx drizzle-kit pull` with `DB_ADMIN_CONNECTION_STRING` pointing at TEST. Review the diff to `src/drizzle/migrations/schema.ts`. It is generated, so never hand-edit it.
4. **Edit the package by hand:**
   - `types/catalogue.ts`: the `Integrations` type, plus the override in the `Catalogue` `Update` map. Without it `integrations` becomes a required `unknown`.
   - `constants/catalogue.ts`: `integrations: {}`. Without it `tsc` fails in the pre-commit hook.
   - `types/general.ts`: `features.integrations`.
   - `constants/pricing.ts`: the flag on all six tiers.
   - Optionally export `GA4_ID` from the package, so app, tests and docs share one pattern.
5. **Commit and release.** The hook runs `drizzle-kit pull`, then `npm run build`, then a minor bump to 1.67.0 (`quicktalog-packages/.husky/pre-commit:8-38`). Release with `npm run release` and bump `@quicktalog/common` in the app.
6. **PROD.** Apply the migration to PROD before deploying an app build that selects the column. Drizzle's bare `select()` and `.returning()` name every schema column. A build ahead of the database would fail with 42703 on builder load, save and publish. A missing `app_public` grant would make the public page render "not found", which ISR can cache for 24 h (`code-write-path.md` §1, deployment ordering).
   - **PROD lags TEST.** The `20260926130000` and `20260929120000` migrations must be applied there first (`code-write-path.md` §1 and §11.8).

**Batching.** Batch the Phase 1 consent-log migration (§7.7) into the same package release, so the app bumps once.

---

## 5. Write path (task item 3)

### 5.1 ID validation: one pure module used everywhere

```ts
// src/lib/integrations/ids.ts  - pure, no imports. Used by the settings form (live hints), the server action
// (the authority), the public page (re-validation before props) and the loader (the sink).

/** GA4 measurement ID. The DB CHECK uses the identical pattern. */
export const GA4_ID = /^G-[A-Z0-9]{6,20}$/;
/** Meta Pixel ID: digits only (Phase 3). */
export const META_PIXEL_ID = /^[0-9]{10,20}$/;

export type TagInputKind =
  | "ga4" | "empty" | "gtm" | "google_tag" | "google_ads" | "universal" | "meta_pixel" | "invalid";
export type TagInput = { kind: TagInputKind; id?: string; extracted?: boolean };

/** "  g–psw1my7hb4 " -> "G-PSW1MY7HB4": NFKC, any dash to "-", no whitespace, upper case. */
export function normalizeTagId(raw: string): string {
  return raw.normalize("NFKC").replace(/[‐-―−]/g, "-").replace(/\s+/g, "").toUpperCase();
}

const GTM_IN_TEXT = /\bGTM-[A-Z0-9]{4,}\b/i;
const GA4_IN_TEXT = /\bG-[A-Z0-9]{6,20}\b/i;

export function classifyTagInput(raw: unknown): TagInput {
  if (typeof raw !== "string") return { kind: "invalid" };
  const text = raw.slice(0, 10_000);
  const id = normalizeTagId(text);
  if (id === "") return { kind: "empty" };
  if (GA4_ID.test(id)) return { kind: "ga4", id };
  if (id.startsWith("GTM-")) return { kind: "gtm", id };
  if (id.startsWith("GT-")) return { kind: "google_tag", id };
  if (id.startsWith("AW-")) return { kind: "google_ads", id };
  if (id.startsWith("UA-")) return { kind: "universal", id };
  if (META_PIXEL_ID.test(id)) return { kind: "meta_pixel", id };
  // A pasted snippet or URL: take its G- ID, but never out of a Tag Manager snippet.
  if (GTM_IN_TEXT.test(text)) return { kind: "gtm" };
  const found = text.match(GA4_IN_TEXT)?.[0];
  if (found && GA4_ID.test(normalizeTagId(found))) {
    return { kind: "ga4", id: normalizeTagId(found), extracted: true };
  }
  return { kind: "invalid" };
}

/** One cookie name per measurement ID: all catalogues using the same ID share one GA4 visitor ID. */
export function ga4CookiePrefix(measurementId: string): string {
  if (!GA4_ID.test(measurementId)) throw new Error("invalid measurement id");
  return `qt_${measurementId.slice(2).toLowerCase()}`;
}
```

**Why this regex, and not Google's.** Google's published pattern `[A-Z]{1,3}\w{5,}[\w]*` is malformed. Anchored, it rejects every real ID. Unanchored, it matches inside `GTM-…` (`google-tag-docs.md` §2.2). The anchored `^G-[A-Z0-9]{6,20}$` is the security boundary: Google states that `G-` and `AW-` containers are limited to Google tags, while `GTM-` allows Custom HTML even through `/gtag/js` ([Google](https://support.google.com/tagmanager/answer/17070049); [release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708)).

### 5.2 Server action

The action follows the pattern of `src/actions/qr-configs.ts:15-69` and the rules in `.claude/skills/server-action-and-route/SKILL.md`, as `code-write-path.md` §2 lists them:
- identity first;
- one short `withUser` block;
- an owner predicate;
- a returned-row check;
- the plan read from `users.plan_id`;
- revalidation after the block.

```ts
"use server";
// src/actions/integrations.ts - exports only actions
import * as Sentry from "@sentry/nextjs";
import { integrationsSchema } from "@/constants/schemas";          // z.object({...}).strict() over the §4.1 keys
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { revalidateCatalogue } from "@/lib/cache/revalidate";
import { setOwnedGoogleAnalytics } from "@/lib/catalogue/integrations"; // server-only, owner filter inside
import { allowsIntegrations } from "@/lib/entitlements/integrations";
import { getPlanForUpdate } from "@/lib/entitlements/plan";
import { classifyTagInput, type TagInputKind } from "@/lib/integrations/ids";
import { TAG_INPUT_MESSAGES } from "@/lib/integrations/messages";    // the §3.3 copy
import { withinRateLimit } from "@/lib/rate-limit";
import { pgError, withUser } from "@/utils/db";
import type { Integrations } from "@quicktalog/common";

export type IntegrationsResult =
  | { success: true; data: { integrations: Integrations; extracted: boolean; catalogues: string[] } }
  | { success: false; error: string; reason?: TagInputKind | "locked" | "not_found" | "rate_limited" };

const NOT_FOUND = { success: false, error: "Catalogue not found", reason: "not_found" } as const;

export async function saveGoogleAnalytics(
  catalogue: string,
  input: { measurementId?: unknown; advertising?: unknown; applyToAll?: unknown },
): Promise<IntegrationsResult> {
  try {
    const me = await getVerifiedIdentity();                                     // 1. identity
    if (!me) return { success: false, error: "Unauthorized" };
    if (typeof catalogue !== "string" || catalogue.length > 200) return NOT_FOUND;
    if (!(await withinRateLimit("integrations", me.userId))) {                // Redis before the DB block
      return { success: false, error: "Too many changes. Try again in a few minutes.", reason: "rate_limited" };
    }

    const parsed = classifyTagInput(input?.measurementId);                    // 2. trust nothing from the client
    if (parsed.kind !== "ga4" && parsed.kind !== "empty") {
      return { success: false, error: TAG_INPUT_MESSAGES[parsed.kind], reason: parsed.kind };
    }
    const next = integrationsSchema.parse(
      parsed.kind === "empty"
        ? {}
        : { ga4MeasurementId: parsed.id, ...(input?.advertising === true ? { advertising: true } : {}) },
    );
    const applyToAll = input?.applyToAll === true;

    const out = await withUser(me, async (tx) => {                            // 3. one short block
      if (next.ga4MeasurementId) {                                            // removing is always allowed
        const tier = await getPlanForUpdate(tx, me);                          // users row locked "for no key update"
        if (!allowsIntegrations(tier)) return { locked: true as const };
      }
      return { rows: await setOwnedGoogleAnalytics(tx, me, applyToAll ? null : catalogue, next) };
    });
    if ("locked" in out) {
      return { success: false, error: "Google Analytics is available on Basic and above.", reason: "locked" };
    }
    if (out.rows.length === 0) return NOT_FOUND;                              // 4. check what came back

    for (const row of out.rows) revalidateCatalogue(row.name);               // 5. after the block
    return {
      success: true,
      data: { integrations: next, extracted: parsed.extracted === true, catalogues: out.rows.map((r) => r.name) },
    };
  } catch (err) {
    const pg = pgError(err);
    if (pg?.code === "23514" && pg.constraint === "catalogues_integrations_check") {
      return { success: false, error: TAG_INPUT_MESSAGES.invalid, reason: "invalid" };   // DB backstop, not a Sentry event
    }
    // Unlike qr-configs.ts:55-57, a 42501 here can only mean a missing column grant: a deploy bug that must reach Sentry.
    Sentry.captureException(err, { tags: { op: "saveGoogleAnalytics" } });
    console.error("Unexpected error while saving Google Analytics:", err);
    return { success: false, error: "Failed to save. Please try again." };
  }
}
```

The owner-scoped helper, `server-only`:

```ts
// src/lib/catalogue/integrations.ts
import "server-only";
import { schema, type Integrations } from "@quicktalog/common";
import { and, eq, sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { Tx } from "@/utils/db";
const c = schema.catalogues;

/** Writes the GA keys (and clears `paused`) on one owned catalogue, or on all of the owner's catalogues. */
export function setOwnedGoogleAnalytics(tx: Tx, me: VerifiedIdentity, name: string | null, next: Integrations) {
  return tx
    .update(c)
    .set({
      // Merge, so a later Meta Pixel ID on the same row survives a GA change (Phase 3).
      integrations: sql`(${c.integrations} - 'ga4MeasurementId' - 'advertising' - 'paused') || ${JSON.stringify(next)}::jsonb`,
    })
    .where(name ? and(eq(c.name, name), eq(c.userId, me.userId)) : eq(c.userId, me.userId))
    .returning({ name: c.name });
}
```

**Supporting changes.**
- **Rate limit:** add an `integrations` rule (for example 20 per hour) and a `tagCheck` rule to `RULES` in `src/lib/rate-limit.ts:8-19`.
- **Why rate-limit at all:** each save calls `revalidateCatalogue`, whose shared tags purge every catalogue's data cache (`src/lib/cache/revalidate.ts:13-16`).

### 5.3 "Found at Google" tag check (best effort)

**Facts, from probe A.1 (curl of `https://www.googletagmanager.com/gtag/js?id=…`, 2026-10-01).**

| ID | HTTP | Body |
|---|---|---|
| `G-RXHJ9X3T5T`, a configured Google tag | 200 | Its own resource (`"version":"4"`), with `__ogt_*` settings and `"vtp_destinationId":"G-DT7TJQYK3K"` |
| Two made-up `G-` IDs | 200 | A generic resource (`"version":"1"`) with no destinations |
| `G-DT7TJQYK3K` | 404 | Google's error page. It is a GA4 destination (the `tid` on Quicktalog's hits), not a loadable tag ID |

**Inferences.**
- A status code alone cannot catch typos, but the body can.
- A measurement ID whose stream sits inside another Google tag can load nothing at all. Without a check, an owner would never know.

**Decision: a separate `checkGoogleTag(catalogue)` action.** The card calls it after a save and when it opens.
1. It reads the ID from the owner's row and never accepts an ID from the client.
2. It fetches outside any `withUser` block, with a 4 s timeout.
3. It returns one of:
   - `found`, with destination IDs taken by regex `"vtp_destinationId":"((?:G|AW|DC)-[A-Z0-9-]{4,30})"`;
   - `empty`;
   - `not_found`;
   - `unknown`.

**Limits.**
- It only parses text and never executes it.
- It is rate-limited and behind a flag.
- Google's container format is undocumented and can change, so the check is a hint and never blocks saving.

### 5.4 Plan check

- **Where it is enforced:** on the server inside the write transaction, with `getPlanForUpdate` (`src/lib/entitlements/plan.ts:27-38`) and a new `allowsIntegrations(tier)` in `src/lib/entitlements/integrations.ts`.
- **Don't reuse the analytics flag:** `features.analytics` means the built-in dashboard tier ("Basic"/"Advanced") and must not be overloaded (`code-write-path.md` §3).
- **The public page can't check the plan:** `app_public` cannot read `users`, and `userId` never reaches public pages (`src/utils/db/columns.ts:6-9`). So downgrades must change stored data (§5.8).

### 5.5 Immediate semantics, revalidation and drafts

**Decision: apply immediately, independent of the builder's draft.**
- **Save never writes the database.** It writes Redis only (`src/actions/catalogue.ts:319-366`, per `code-write-path.md` §2).
- **Publish couldn't even remove a tag over the traffic limit.** Publish is refused once the monthly limit is reached (`src/lib/entitlements/plan.ts:67-79`), so a draft-then-publish setting would trap owners.
- **Active catalogues** change on the next request after `revalidateCatalogue(name)` (`src/lib/cache/revalidate.ts:8-18`).
- **Drafts** carry the setting from their first publish, because `app_public` reads active rows only.

**Draft cache.** `readOwnedDraft` must treat `integrations` as server-owned. Add it to the row-wins list at `src/lib/catalogue/draft-cache.ts:61-71`, and strip it in `writeOwnedDraft` (`:75-82`). Otherwise the editor's `{...row, ...draft}` spread would show a stale copy after the dedicated action changes the row. The builder context then shows the real value in the General-tab pointer.

### 5.6 Apply to all catalogues, and duplicates

- **"Use this ID on all my catalogues"** runs the same statement without the name filter and with the owner filter kept. It revalidates each returned name. It suits Pro+ owners with several menus (6 to 50 catalogues: `quicktalog-packages/src/constants/pricing.ts`).
- **`duplicateItem` won't copy the ID** (not in the editable list). The new catalogue's card offers "Use G-XXXX like <other catalogue>?" instead of copying silently. This is Phase 2.

### 5.7 Remove

Saving an empty field removes the GA keys. Removal skips the plan check, so a locked or paused owner can always clear tracking.

### 5.8 Downgrade: pause, keep and resume

**Today.** Only a cancellation that leaves no active subscription calls `applyPlanDowngrade` (`src/utils/paddle/process-webhook.ts:157-187`). Only the catalogues it deactivated are revalidated (`:213-215`).

**Decision.** Extend `applyPlanDowngrade` (`src/lib/entitlements/catalogue.ts:37-78`):

```ts
if (!tier.features.integrations.googleAnalytics) {
  const paused = await tx.execute<{ name: string }>(sql`
    update public.catalogues
       set integrations = integrations || '{"paused": true}'::jsonb
     where user_id = ${userId}
       and (integrations ? 'ga4MeasurementId' or integrations ? 'metaPixelId')
       and coalesce((integrations->>'paused')::boolean, false) = false
    returning name`);
  // return these alongside `deactivated` so process-webhook.ts revalidates them too
}
```

**Resume.** The card's Resume button calls `saveGoogleAnalytics` with the kept ID. The plan is re-checked, and the merge clears `paused`.

**Why Basic+ helps here.** With integrations on every paid tier (§14), only paid-to-free changes can remove the feature, and that is the one path that already reconciles. Paid-to-paid downgrades never reconcile today (`code-write-path.md` §3).

---

## 6. Render path (task item 4)

### 6.1 Where it mounts

**Facts.**
- `src/app/catalogues/[name]/page.tsx` is ISR (`:11`). It fetches its own API with tags `catalogue-${name}` and `catalogue-detail` (`:114-123`) and renders `<Catalogue item type="view">` for active rows (`:143-147`).
- The owner preview renders the **same** `<Catalogue type="view">` (`src/app/catalogues/[name]/preview/page.tsx:36`).
- There is no `catalogues/[name]/layout.tsx`. One would also wrap `/preview` (`code-render-path.md` §3).

**Decision.** Mount a sibling client component from the public page only. Never mount it inside `Catalogue`, `CatalogueHeader`, `CatalogueFooter`, `CatalogueContent`, a layout or the root layout.

```tsx
// src/app/catalogues/[name]/page.tsx (replaces :143-147)
if (item.status === "active") {
  const tags = publicTagConfig(item);              // server: re-validates, derives, or returns null
  return (
    <>
      <Catalogue item={item} type="view" />
      {tags && <CatalogueTracking {...tags} />}
    </>
  );
}
```

```ts
// src/lib/integrations/public-config.ts  (server-only: uses node:crypto)
import "server-only";
import { createHash } from "node:crypto";
import type { Catalogue } from "@quicktalog/common";
import { GA4_ID } from "@/lib/integrations/ids";
import { kebabToTitle } from "@/lib/format/text";

export const BANNER_VERSION = 1;                   // bump when the legal copy changes: everyone is asked again

export type PublicTagConfig = {
  catalogueId: string; slug: string; language: string;
  businessName: string; privacyUrl: string; pageTitle: string;
  vendorHash: string; bannerVersion: number;
  ga4: { measurementId: string }; advertising: boolean;
};

export function publicTagConfig(item: Catalogue): PublicTagConfig | null {
  const i = item.integrations ?? {};
  if (i.paused === true) return null;
  const id = typeof i.ga4MeasurementId === "string" && GA4_ID.test(i.ga4MeasurementId) ? i.ga4MeasurementId : null;
  if (!id) return null;
  const businessName = item.legal?.legalName?.trim();
  if (!businessName) return null;                  // no identifiable controller, no banner, no tags
  const advertising = i.advertising === true;
  const vendorHash = createHash("sha256").update(`ga4:${id}|ads:${advertising}|name:${businessName}`).digest("hex").slice(0, 12);
  return {
    catalogueId: item.id, slug: item.name, language: item.language, businessName,
    privacyUrl: httpsUrl(item.legal?.privacyPolicy) ?? `/catalogues/${item.name}/privacy`,
    pageTitle: item.metadata?.title || kebabToTitle(item.name),
    vendorHash, bannerVersion: BANNER_VERSION, ga4: { measurementId: id }, advertising,
  };
}

const httpsUrl = (v: unknown) => (typeof v === "string" && /^https:\/\/[^\s]+$/.test(v) && v.length <= 500 ? v : null);
```

**How IDs reach the client.**
- **Fact:** server pages already pass the whole public row to client components as props, which React serializes into the escaped flight payload (`code-render-path.md` §2.4).
- **Decision:** the derived config travels the same way. Nothing per-visitor is decided on the server, there are no cookies or identity, and ISR stays intact.

### 6.2 What the client component does

`src/components/catalogue/tracking/CatalogueTracking.tsx` (client) owns six things:
1. **Guards**, each of which skips the tag entirely (sketch in §6.4):
   - **Framed:** `window.top !== window.self`. This covers the non-sandboxed `/showcases` iframes, which are `pointer-events-none` below `lg` (`src/components/showcases/ShowcaseFrame.tsx:64-69`).
   - **Wrong path:** `location.pathname` is not `/catalogues/<slug>`.
   - **Not the landing document:** the document did not land here, judged by `performance.getEntriesByType("navigation")[0].name`. For example, the visitor soft-navigated from the dashboard's `<Link>` (`src/components/dashboard/overview/DashboardItem.tsx:151`) or the newsletter table (`src/components/dashboard/overview/NewsletterTable.tsx:123`).
   - **Signed in:** a Quicktalog session cookie is present (§6.3).
2. **Consent.** Read the per-catalogue record (§7.1), show the banner (§7.2), and apply the choice.
3. **The loader** (§6.4), only after a grant.
4. **Events.** Subscribe to catalogue events and classify link taps (§11), only after the tag loaded.
5. **Hard exits.** Once the tag is loaded, same-origin links that leave `/catalogues/<slug>` become full page loads, so the tag never survives into `/auth`, `/`, policy pages or another catalogue.
   - **Fact:** the catalogue's own links use `next/link`. That covers `src/components/general/SmartLink.tsx:54-58`, header contact links (`src/components/catalogue/view/CatalogueHeader.tsx:195-205`) and the logo (`:157-161`).
6. **Privacy choices.** It portals a "Privacy choices" link into a slot in the footer's legal row (`src/components/catalogue/view/components/LegalLinks.tsx:41-61`). It falls back to a small floating pill.

**Search.** The search box writes `?q=` on every keystroke with `router.replace` (`src/components/catalogue/view/CatalogueContent.tsx:88-95`). GA4's history listener reacts to `replaceState`, and `q` is a default site-search key (`google-tag-docs.md` §7.1). Phase 0 debounces the URL write (§16). The `search` event is sent from the same debounced callback.

### 6.3 The session guard and its owner-facing note

**Facts.**
- The Supabase session cookie is deliberately not HttpOnly and lives at path `/` (`src/lib/auth/cookie-options.ts:8-21`).
- Clerk's `__session` is readable by scripts ([Clerk](https://clerk.com/docs/guides/how-clerk-works/overview)).
- Since August 2026 a `G-` tag can be upgraded into a Tag Manager container. It may then use Google-provided variables such as First Party Cookie ([Google](https://support.google.com/tagmanager/answer/17079602); [Google](https://developers.google.com/tag-platform/tag-manager/restrict)).

**Inference** (untested, `google-tag-docs.md` §2.5). A malicious tenant could make its own tag read a signed-in visitor's session cookie.

**Decision.**

```ts
const SESSION_COOKIE = /(?:^|;\s*)(?:__session(?:_[A-Za-z0-9-]+)?|sb-[a-z0-9]+-auth-token(?:\.\d+)?)=/;
export const hasQuicktalogSession = () => SESSION_COOKIE.test(document.cookie);
```

**When the guard trips:**
- No tag and no banner load.
- A small dismissible pill shows instead: "Google Analytics is paused while you're signed in to Quicktalog. That keeps your own visits out of your reports. [Learn more]"

**Inference.** The pill turns a security control into a feature owners understand. Without it, the top support question would be "my Google Analytics doesn't work" from owners testing their own page while signed in.

### 6.4 The loader (no inline script, consent first)

```ts
// src/lib/integrations/google-tag.ts - imported only by client components. No dangerouslySetInnerHTML,
// no next/script (it de-duplicates by id/src and interpolates IDs into inline code: code-render-path.md §8.4).
import { GA4_ID, ga4CookiePrefix } from "@/lib/integrations/ids";

export type Consent = { analytics: boolean; advertising: boolean };
export type GoogleTagOptions = { measurementId: string; pageTitle: string; debug: boolean; developerId?: string };

const LAYER = "qtDataLayer";
const COOKIE_PATH = "/catalogues";
const COOKIE_MAX_AGE_S = 34_128_000;                 // 395 days ≈ 13 months; disclosed in the banner (Planet49)

declare global { interface Window { qtDataLayer?: IArguments[] } }

/** gtag.js only reads Arguments objects; an array push is silently ignored (google-tag-docs.md §4.6). */
function qtag(..._args: unknown[]): void {
  // biome-ignore lint/style/noArguments: gtag.js requires the Arguments object
  (window.qtDataLayer ??= []).push(arguments);
}

const consentState = (c: Consent) => ({
  analytics_storage: c.analytics ? "granted" : "denied",
  ad_storage: c.advertising ? "granted" : "denied",
  ad_user_data: c.advertising ? "granted" : "denied",
  ad_personalization: c.advertising ? "granted" : "denied",
});

let loadedId: string | null = null;

/** Basic consent mode: call only after the visitor granted analytics. Idempotent. */
export function startGoogleTag(opts: GoogleTagOptions, consent: Consent): void {
  if (!consent.analytics || !GA4_ID.test(opts.measurementId)) return;     // re-validate at the sink
  if (loadedId) return updateGoogleConsent(consent);
  loadedId = opts.measurementId;
  (window as unknown as Record<string, unknown>)[`ga-disable-${loadedId}`] = false;

  qtag("consent", "default", consentState({ analytics: false, advertising: false }));   // 1. defaults first
  qtag("consent", "update", consentState(consent));                                      // 2. the visitor's choice
  qtag("set", "ads_data_redaction", true);
  if (opts.developerId) qtag("set", `developer_id.${opts.developerId}`, true);           // once Google issues one
  qtag("set", {                                                                          // 3. cookie scope, before config
    cookie_prefix: ga4CookiePrefix(loadedId),
    cookie_path: COOKIE_PATH,
    cookie_domain: "none",                                                               // host-only: never .quicktalog.app
    cookie_flags: "SameSite=Lax;Secure",
    cookie_expires: COOKIE_MAX_AGE_S,
    cookie_update: false,                                                                // a true 13-month maximum
  });
  qtag("js", new Date());
  qtag("config", loadedId, {                                                             // 4. config sends page_view
    page_title: opts.pageTitle,                                                          // "Bistro Luna", not "Bistro Luna | Quicktalog"
    allow_google_signals: consent.advertising,
    allow_ad_personalization_signals: consent.advertising,
    ...(opts.debug ? { debug_mode: true } : {}),
  });
  const s = document.createElement("script");                                            // 5. only now load Google's code
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(loadedId)}&l=${LAYER}`;
  document.head.appendChild(s);
}

export function updateGoogleConsent(c: Consent): void {
  if (loadedId) qtag("consent", "update", consentState(c));
}

export function sendGoogleEvent(name: string, params: Record<string, unknown>): void {
  if (loadedId) qtag("event", name, { ...params, send_to: loadedId });
}

/** Withdrawal: deny, stop GA, delete this ID's cookies. */
export function stopGoogleTag(): void {
  if (!loadedId) return;
  qtag("consent", "update", consentState({ analytics: false, advertising: false }));
  (window as unknown as Record<string, unknown>)[`ga-disable-${loadedId}`] = true;     // Google's documented kill switch
  const prefix = ga4CookiePrefix(loadedId);
  for (const name of document.cookie.split(/;\s*/).map((p) => p.split("=")[0])) {
    if (name.startsWith(`${prefix}_ga`)) document.cookie = `${name}=; Max-Age=0; Path=${COOKIE_PATH}; Secure; SameSite=Lax`;
  }
}
```

**Facts behind the choices.**
- Defaults must come before `config` or `event` ([Google](https://developers.google.com/tag-platform/security/guides/consent)).
- The data layer is renamed with `l=` ([Google](https://developers.google.com/tag-platform/devguides/datalayer)).
- `window['ga-disable-<ID>']` is Google's documented kill switch ([Google](https://developers.google.com/tag-platform/security/guides/privacy)).
- Probe A.2 ran this exact sequence. It produced `gcs=G101` (analytics granted, ads denied), entries of type `[object Arguments]`, a clean `dt`, and no `window.dataLayer`.

**Strict CSP readiness.** The loader adds no inline executable JavaScript, so it will never be what blocks a future strict CSP. Next.js's own inline flight scripts, UploadThing's inline script and nonce/ISR incompatibility are separate constraints (`code-render-path.md` §7.3).

**The orchestration**, abbreviated:

```tsx
// src/components/catalogue/tracking/CatalogueTracking.tsx (abridged)
"use client";
export function CatalogueTracking(cfg: PublicTagConfig) {
  const [phase, setPhase] = useState<"off" | "signed-in" | "ask" | "decided">("off");
  const [choice, setChoice] = useState<Consent>({ analytics: false, advertising: false });

  useEffect(() => {
    if (blockReason(cfg.slug)) return;                         // framed | wrong path | soft navigation
    if (hasQuicktalogSession()) return setPhase("signed-in");
    const stored = readConsent(cfg.catalogueId, cfg.bannerVersion, cfg.vendorHash);
    if (!stored) return setPhase("ask");
    apply({ analytics: stored.a, advertising: stored.m && cfg.advertising && !gpc() });
    setPhase("decided");
  }, [cfg]);

  function apply(c: Consent) {
    setChoice(c);
    if (!c.analytics) return stopGoogleTag();
    startGoogleTag({ measurementId: cfg.ga4.measurementId, pageTitle: cfg.pageTitle,
                     debug: new URLSearchParams(location.search).has("qt_debug"),
                     developerId: process.env.NEXT_PUBLIC_GTAG_DEVELOPER_ID }, c);
    subscribeCatalogueEvents(cfg);                              // §11.1, idempotent
    installHardExits(cfg.slug);                                 // capture-phase click listener, idempotent
  }

  function decide(c: Consent) {
    const rec = writeConsent(cfg.catalogueId, { v: cfg.bannerVersion, h: cfg.vendorHash, a: c.analytics, m: c.advertising });
    void recordConsent({ catalogueId: cfg.catalogueId, choiceId: rec.id, bannerVersion: cfg.bannerVersion,
                         vendorHash: cfg.vendorHash, analytics: c.analytics, advertising: c.advertising,
                         language: cfg.language });               // §7.7, fire-and-forget
    apply(c);
    setPhase("decided");
  }

  if (phase === "signed-in") return <SignedInNote />;
  return (
    <>
      {phase === "ask" && <ConsentBanner cfg={cfg} initial={choice} onDecide={decide} />}
      {phase === "decided" && <PrivacyChoicesLink onOpen={() => setPhase("ask")} />}
    </>
  );
}

function blockReason(slug: string): string | null {
  if (window.top !== window.self) return "framed";
  const path = `/catalogues/${slug}`;
  if (location.pathname.replace(/\/$/, "") !== path) return "wrong-path";
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav && new URL(nav.name).pathname.replace(/\/$/, "") !== path) return "soft-navigation";
  return null;
}
```

**How the hard-exit listener works.**
- It is a capture-phase `click` listener on `document`. It ignores modified clicks, middle clicks, `target="_blank"`, downloads and cross-origin links.
- For a same-origin anchor whose pathname differs from the catalogue's, it calls `preventDefault()` and `stopPropagation()`, then `location.assign(href)`.
- **Inference:** running in capture phase at `document`, it fires before React's root listeners. `next/link` therefore never soft-navigates.

### 6.5 What preview, builder and admin get

- **Nothing from this feature.** `CatalogueTracking` is rendered only by the public page, and the guards would refuse anyway.
- **What remains there is Quicktalog's own analytics.** Today GTM, Clarity, PostHog and Sentry run on every route, `/admin` and `/preview` included (`src/app/layout.tsx:46-49`; `src/instrumentation-client.ts:5-42`). That is a separate Quicktalog decision (§9). The promise "no tracking in preview" applies to customer tags only.

---

## 7. Consent banner (task item 5)

### 7.1 Scope and storage

**Decision.**
- **One record per catalogue, keyed by the immutable catalogue ID** (the slug can change): `localStorage["qt:consent:v1:<catalogueId>"]`. The reason: consent is specific to a controller, and different catalogues belong to different controllers (`consent.md` §4.1).
- **Read only on the client, after hydration.** Public and ISR pages never read cookies or identity (`.claude/CLAUDE.md`).
- **The record itself is exempt from consent** as strictly necessary (EDPB taskforce para 30 and CNIL, via `consent.md` §4.2).

```ts
// src/lib/integrations/consent-store.ts
export type ConsentRecord = { v: number; h: string; a: boolean; m: boolean; t: string; id: string };
const key = (catalogueId: string) => `qt:consent:v1:${catalogueId}`;
const MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;    // ~6 months (CNIL good practice; Garante: don't re-ask sooner)

export function readConsent(catalogueId: string, version: number, vendorHash: string): ConsentRecord | null {
  try {
    const raw = window.localStorage.getItem(key(catalogueId));
    if (!raw) return null;
    const r = JSON.parse(raw) as Partial<ConsentRecord>;
    if (r.v !== version || r.h !== vendorHash || typeof r.t !== "string") return null;   // copy or vendors changed: ask again
    if (!(Date.now() - Date.parse(r.t) <= MAX_AGE_MS)) return null;                      // expired or unparsable
    return { v: r.v, h: r.h, a: r.a === true, m: r.m === true, t: r.t, id: typeof r.id === "string" ? r.id : "" };
  } catch {
    return null;                                  // private mode or blocked storage = "no choice yet"
  }
}

export function writeConsent(catalogueId: string, rec: Pick<ConsentRecord, "v" | "h" | "a" | "m">): ConsentRecord {
  const full: ConsentRecord = { ...rec, t: new Date().toISOString(), id: crypto.randomUUID() };
  try { window.localStorage.setItem(key(catalogueId), JSON.stringify(full)); } catch { /* still applied for this page */ }
  return full;
}
```

**When the notice comes back.**
- After 6 months.
- When the vendor hash changes: a new ID, ads switched on, or the business name changed.
- When `BANNER_VERSION` is bumped.
- **Silence stores nothing,** so the notice shows again on the next visit. CNIL treats continued browsing as refusal, and the EDPB's own site works the same way (`consent.md` §4.3).
- **Fact:** Safari's ITP clears script-written storage after 7 days without interaction ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)), so iPhone visitors will see the notice more often.

### 7.2 Phone UX

The spec follows `consent.md` §6.3 and is adapted to the catalogue's components.

**Layout**
- A non-modal region (`role="region"`, `aria-label` "Privacy choices"), not a dialog: no backdrop, no scroll lock, no focus trap.
- Anchored to the bottom safe area (`padding-bottom: env(safe-area-inset-bottom)`), with at most about 35% of a 390×844 viewport.
- Its z-index sits below the item detail dialog, so opening an item is never blocked.

**Buttons**
- "Reject" and "Accept" side by side, the **same size and the same style** (CNIL Q37, `consent.md` §2.5).
- "Settings" and "Privacy notice" as text links under them.
- Touch targets of at least 44px.

**Theme**
- It uses the catalogue's theme tokens (card background, text, border and font variables), so it looks like part of the business's page.
- Contrast is checked against WCAG AA in all 7 standard themes and in custom themes.

**Collapse**
- After the visitor scrolls one screen without choosing, it collapses to a small "Privacy choices" pill.
- That counts as no choice, so no tags load.

**Second layer ("Settings")**
- One switch per purpose, off by default. "Statistics (Google Analytics)" maps to `analytics_storage`. "Advertising (Google Ads)" appears only if `advertising` is set and maps to the three `ad_*` types.
- The vendor (Google Ireland / Google LLC) with a privacy link.
- A cookie table: `qt_<id>_ga` and `qt_<id>_ga_<ID>`, 13 months, first-party, read by Google.
- Buttons "Reject all", "Accept all" and "Save choices".

**Never**
- No cookie wall.
- No "Accept & close ×".
- No consent on scroll.
- Nothing pre-ticked (Planet49 and the EDPB taskforce, `consent.md` §2.3–2.4).

**Accessibility**
- The region's `lang` is the catalogue's language. The root `<html lang="en">` is hardcoded (`src/app/layout.tsx:44`).
- Animation follows `prefers-reduced-motion`.

**Owner preview.** The settings card renders the same `ConsentBanner` component in a static preview mode, with no side effects, in the catalogue's theme and language. **Inference:** owners fear that a banner will annoy their guests, and seeing the actual notice addresses that fear better than any description.

### 7.3 Copy and language

The English template needs native-speaker and legal review.

| | Text |
|---|---|
| GA only | "**Bistro Luna** would like to use Google Analytics to see how visitors use this page. This stores cookies on your device and sends data about your visit to Google, which may process it outside the EU. Nothing is sent unless you accept. You can change your mind anytime under Privacy choices." |
| GA and ads | "…to see how visitors use this page and to measure its Google ads…" |
| Buttons | [Reject] [Accept] · Settings · Privacy notice |
| Serbian (Latin), illustrative (adapted from `consent.md` §6.3) | "**Bistro Luna** želi da koristi Google Analytics da vidi kako posetioci koriste ovu stranicu. Time se čuvaju kolačići na vašem uređaju i podaci o poseti šalju kompaniji Google, koja ih može obrađivati van EU. Ništa se ne šalje bez vaše saglasnosti. Izbor možete promeniti u svakom trenutku preko „Podešavanja privatnosti“." [Odbij] [Prihvati] · Podešavanja · Obaveštenje o privatnosti |

**Language.**
1. Use the catalogue's `language` if a translation exists. There are 32 codes, mapped by `localeForLanguage` (`src/lib/catalogue/items.ts:60-100`).
2. Otherwise use the visitor's `navigator.language` if a translation exists.
3. Otherwise English.

**Launch requirement.** Strings exist for all 32 codes, with native review for at least English, Serbian (Latin and Cyrillic), Croatian, Slovenian, German, French, Italian and Spanish. **Inference:** those match the stated EU and Serbia customer base. PROD language distribution was not queried.

### 7.4 Consent Mode v2 flow

**Basic mode.** Nothing from Google loads before a choice, so the defaults and the update are pushed together, immediately before the script (§6.4).

| Moment | Commands (all into `qtDataLayer`, via `qtag`) | Network |
|---|---|---|
| Page load, no stored choice | none | none |
| Accept (statistics only) | `consent default` all denied → `consent update {analytics_storage: granted}` → `set` cookie scope → `js` → `config` → inject `gtag/js?id=G-…&l=qtDataLayer` | `page_view` with `gcs=G101` (probe A.2) |
| Accept all, with `advertising` on | Same, with the three `ad_*` granted and `allow_google_signals: true` | `gcs=G111`-style hits (`google-tag-docs.md` §4.4) |
| Reject | none; the choice is stored | none |
| Later visit, stored Accept | The same sequence at mount | as above |
| Visitor changes statistics only to all | `consent update` with `ad_*` granted | as above |
| Withdrawal | `consent update` all denied → `ga-disable-<ID>` → delete `qt_<id>_ga*` cookies | none after this |

**Global Privacy Control.** `navigator.globalPrivacyControl === true` forces advertising off and greys out the switch with an explanation. Statistics stay a free choice (`consent.md` §2.9).

### 7.5 Basic vs advanced

**Decision: basic, worldwide, in v1.**
- **Why basic.** Advanced mode sends cookieless pings before consent, and the EDPB treats JavaScript-built requests as falling under ePrivacy Art. 5(3) (`consent.md` §2.1; `google-tag-docs.md` §4.4). Every shared-origin analogue that was inspected uses basic in practice (`shared-domain-implementations.md` §5.7).
- **Why worldwide.** ISR pages cannot vary by geography (`consent.md` §2.9).
- **Cost to owners.** GA4 sees only consenting visitors and gets the general rather than advertiser-specific conversion model. The card says so plainly (§11.7).
- **Later (Phase 4).** An owner opt-in to advanced mode for non-EEA visitors, through a cookie-free `/api/geo` endpoint that the banner calls client-side, after legal review.

### 7.6 Withdrawal, GPC and expiry

These are covered in §7.1 and §7.4. "Privacy choices" is reachable from every footer type, because the component portals into the legal row or falls back to a pill. Withdrawal therefore happens in the same interface (`consent.md` §4.5).

### 7.7 Consent log (proof for the owner)

**Facts.**
- Google's EU user consent policy requires keeping records of consent ([Google](https://www.google.com/about/company/user-consent-policy/)).
- The EDPB says pointing to a correct configuration is not sufficient proof (`consent.md` §2.2, para 108).

**Decision: an append-only log.**
- **No IP is stored.** The IP is used only as the Redis rate-limit key, as the newsletter does.
- **Same pattern as the public newsletter signup:** a server action running as `app_public` calls a `private.*` function (`src/actions/newsletter.ts:26-57`).

```sql
-- supabase/migrations/<ts>_consent_events.sql
create table public.consent_events (
  id             bigint generated always as identity primary key,
  catalogue_id   uuid not null references public.catalogues(id) on delete cascade,
  choice_id      uuid not null,                                   -- the localStorage record's random id
  banner_version smallint not null check (banner_version between 1 and 1000),
  vendor_hash    text not null check (vendor_hash ~ '^[a-f0-9]{12}$'),
  analytics      boolean not null,
  advertising    boolean not null,
  language       text not null check (language ~ '^[a-z_]{2,12}$'),
  created_at     timestamptz not null default now()
);
create index consent_events_catalogue_created_idx on public.consent_events (catalogue_id, created_at desc);
alter table public.consent_events enable row level security;
create policy consent_events_select_owner on public.consent_events for select to app_user
  using (catalogue_id in (select id from public.catalogues where user_id = (select private.current_user_id())));
grant select on public.consent_events to app_user;

create function private.record_catalogue_consent(
  p_catalogue uuid, p_choice uuid, p_version smallint, p_hash text,
  p_analytics boolean, p_advertising boolean, p_language text
) returns void language sql security definer set search_path = '' as $$
  insert into public.consent_events (catalogue_id, choice_id, banner_version, vendor_hash, analytics, advertising, language)
  select c.id, p_choice, p_version, p_hash, p_analytics, p_advertising, p_language
    from public.catalogues c
   where c.id = p_catalogue
     and c.status = 'active'
     and (c.integrations ? 'ga4MeasurementId' or c.integrations ? 'metaPixelId');
$$;
revoke all on function private.record_catalogue_consent(uuid, uuid, smallint, text, boolean, boolean, text) from public;
grant execute on function private.record_catalogue_consent(uuid, uuid, smallint, text, boolean, boolean, text) to app_public;
```

**The action.** `recordConsent(...)` (`"use server"`): zod parse, then `withinRateLimit("consent", clientIp())`, then `withPublic(tx => tx.execute(sql\`select private.record_catalogue_consent(...)\`))`. It reads no identity. It is fire-and-forget from the banner, and a failure never affects the visitor.

**Retention.** Records are kept for the life of the consent plus a limitation period that counsel sets. A scheduled purge goes in the worker.

**Owner value (Phase 2 on the card).**
- "Last 30 days: 64% of visitors allowed statistics." This explains why GA4 shows fewer visitors than Quicktalog.
- A CSV export as evidence for the owner's duty under Google's policy.

### 7.8 Generated privacy notice per catalogue

**Decision.** Add `src/app/catalogues/[name]/privacy/page.tsx`.
- **Delivery:** ISR, the same fetch and tags as the catalogue (deduplicated), `noindex`. It reads no cookies or identity.
- **Content, built from structured data:**
  - the controller: legal name, address, email;
  - what is collected: page views, item views, searches and contact taps;
  - purpose and legal basis: consent;
  - recipients: Google as the business's processor, and Quicktalog as hosting processor;
  - transfers;
  - retention: cookies 13 months, GA data per the owner's GA4 setting of 2 or 14 months;
  - rights, withdrawal through "Privacy choices", and the right to complain;
  - Quicktalog's own consent-free counting.
- **Link target.** The banner links to the owner's own `legal.privacyPolicy` when it is a valid `https` URL, and to this page otherwise.
- **Why it is needed.** The field's meaning is inconsistent today: the UI treats it as a URL, while the AI tool writes up to 20,000 characters of text (`consent.md` §3.4).
- **Inference.** Most SMBs have no privacy policy, so without a generated notice most owners could not enable tracking lawfully.

### 7.9 Legal preconditions (not code, but blocking)

- **No business name, no tags.** Tags render only when `legal.legalName` is set (§6.1). The card guides the owner there.
- **Quicktalog's own papers.** Quicktalog needs an Art. 28 processing agreement in its Terms, which has no DPA today, and the governing law is still "[JURISDICTION]". It also needs a visitor section in its privacy policy (`consent.md` §3.5).
- **Counsel sign-off is a launch gate for EU catalogues.** Counsel must approve the banner copy, the notice template and the choice of basic mode.

---

## 8. Cookie isolation (task item 6)

**Facts, from probe A.2** (Chromium, fake IDs, collection answered locally):

| Visit | Client ID | Cookies |
|---|---|---|
| `/catalogues/bistro-a` (G-QTPROBEA1) | `283502865.1790836380` | `qt_qtprobea1_ga`, `qt_qtprobea1_ga_QTPROBEA1`: host `www.<origin>`, path `/catalogues`, Secure, Lax, 395 days |
| `/catalogues/bistro-a-drinks` (same ID) | **same** `283502865.1790836380`, same session | reused |
| `/catalogues/salon-b` (G-QTPROBEB2) | `1712320735.1790836393` | `qt_qtprobeb2_ga…`, separate |

`window.dataLayer` was never created. All commands went to `qtDataLayer`.

**Decision.**
- `cookie_prefix = qt_<measurement id without "G-", lowercase>`, with `cookie_path: '/catalogues'`, `cookie_domain: 'none'` (host-only, so never `.quicktalog.app` and never shared with `test.quicktalog.app`), and `cookie_flags: 'SameSite=Lax;Secure'`.
- A 395-day lifetime with `cookie_update: false`.
- A custom data layer, `qtDataLayer`, with its own `qtag` function and `send_to` on every event.

**Why per ID rather than per catalogue.**
- **For the owner:** the same business on several catalogues counts one visitor. With per-catalogue prefixes, a guest who opens the food menu and then the drinks menu would be two users in the same GA4 property.
- **For isolation:** different businesses use different IDs, so their cookies never meet.
- **Consent stays per catalogue.** A shared cookie never loads a tag without that catalogue's own consent.

**Quicktalog's own `_ga` collision disappears.** The probe in `code-render-path.md` §10.1 saw Quicktalog's tag and a customer tag mint the same client ID on a first-ever visit. That is solved by removing Quicktalog's GTM from catalogue pages (Phase 0). The cookie names now differ in any case (`_ga` vs `qt_<id>_ga`).

**Not verified.** Safari and Firefox behaviour of path-scoped prefixed cookies, and cross-domain stitching with an owner's website through Google's `_gl` linker. Both are in the manual test plan (§15.1).

---

## 9. Quicktalog's own tags on catalogue pages (task item 7)

**Facts.**
- The root layout puts Clarity and GTM in `<head>` for every route (`src/app/layout.tsx:46-49`).
- PostHog captures page views with default cookie and localStorage persistence (`src/instrumentation-client.ts:5-19`).
- Sentry runs Replay in buffer mode, which writes sessionStorage (`:20-42`).
- The live container `GTM-W9RHLVK6` v6 holds three things, none with consent settings (`code-render-path.md` §6.4):
  - a Google tag (`G-RXHJ9X3T5T` sending to `G-DT7TJQYK3K`);
  - a GA4 event named after the full URL;
  - Hotjar.
- A live German-locale probe found 18–20 cookies on a catalogue before any interaction (`consent.md` §1.2).

| Tool | Change on `/catalogues/<slug>` (public page only) | Why | Effect on the plan meter |
|---|---|---|---|
| Quicktalog GTM (GA4, Hotjar) | Not rendered. A `QuicktalogSiteTags` client wrapper in the root layout returns null on public catalogue paths; GTM and Clarity stay everywhere else | No lawful basis on a business's page (VG Hannover held GTM itself needs consent: `consent.md` §2.5). Consent state is page-global, so a customer banner would otherwise govern Quicktalog's tags too (`code-render-path.md` §10.2). It also removes a remotely editable code channel and the `_ga` collision | None: the meter uses PostHog |
| Microsoft Clarity | Not rendered | Session recording continues in no-consent mode (`consent.md` §5.1) | None |
| PostHog | Keep `capture_pageview: true`, and on catalogue routes add `cookieless_mode: "always"` and `person_profiles: "never"`. Needs PostHog's project setting "Cookieless server hash mode" | No cookies or storage. Unique users come from a daily-salted server hash ([PostHog](https://posthog.com/tutorials/cookieless-tracking)). That plausibly fits audience-measurement exemptions in FR, NL and UK; counsel must confirm (`consent.md` §2.6, §5.2) | **Page views are unchanged**, and they are what the limit counts (`quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:23-42`, per `consent.md` §1.1). Unique visitors become daily hashes, so multi-day uniques over-count; relabel the dashboard. GeoIP is lost; it is not used |
| Sentry | No `replayIntegration` on catalogue routes; error capture stays with `sendDefaultPii: false` | Replay is not strictly necessary (`consent.md` §5.4) | None |
| Auth SDK, `UserContext`, `CookieBanner` | Phase 4, with the separate root layout. Fix now: `CookieBanner`'s effect depends on `[isSignedIn, userData]`, not the pathname (`src/components/general/CookieBanner.tsx:28-37, 65`); add the pathname | Identity code on a public page; page weight for QR visitors | None |

```ts
// src/instrumentation-client.ts (sketch of the branch)
const PUBLIC_CATALOGUE = /^\/catalogues\/[^/]+\/?$/;
const onPublicCatalogue = typeof window !== "undefined" && PUBLIC_CATALOGUE.test(window.location.pathname);

posthog.init(KEY, {
  /* ...existing options at :6-17... */
  ...(onPublicCatalogue ? { cookieless_mode: "always", person_profiles: "never" } : {}),
});
Sentry.init({
  /* ...existing options... */
  integrations: onPublicCatalogue ? [] : [Sentry.replayIntegration()],
});
```

**Verify on TEST before PROD:**
1. The worker's HogQL still counts `$pageview` rows (`quicktalog-backend/src/utils/analytics.ts:10-26`).
2. `COUNT(DISTINCT properties.distinct_id)` behaves sensibly when the distinct ID comes from the cookieless hash. PostHog's tutorial does not say how the stored `distinct_id` looks; that is an open item.
3. The owner analytics page still renders (`src/lib/analytics/catalogue-traffic.ts:30-40`).

**Later (Phase 4): server-side counting.** Count document requests in middleware with `event.waitUntil`, filter bots and prefetches, and store no IP. That removes even PostHog's client SDK from catalogue pages (`consent.md` §5.7).

**Owner value.** Quicktalog's built-in numbers keep counting every visitor, while GA4 counts consenting visitors only. The difference is explained on the card and in the docs (§11.7).

---

## 10. CSP (task item 8)

**Facts.**
- The policy is `Content-Security-Policy-Report-Only` on `/:path*` with no reporting endpoint (`next.config.ts:48-69`). PROD sends no CSP at all (`code-render-path.md` §1).
- Google's lists for GA4 without and with Ads features come from [Google](https://developers.google.com/tag-platform/security/guides/csp) (updated 2026-09-18). EU collection additionally needs `*.analytics.google.com` ([Google](https://support.google.com/analytics/answer/12017362)).
- When two header rules match a path, the later one wins, and `/catalogues/:name` does not match nested paths such as `/preview` ([Next.js](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers), via `code-render-path.md` §7.2).

**Decision.** Build the policy from one directive map. Add a second rule for the public catalogue route only, placed after the global rule:

```ts
// next.config.ts (sketch)
const BASE: Record<string, string[]> = { /* today's directives from :48-62, as arrays */ };
const CATALOGUE_TRACKING: Record<string, string[]> = {
  "script-src":  ["https://www.googletagmanager.com"],
  "connect-src": ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com",
                  "https://*.google.com", "https://*.g.doubleclick.net", "https://pagead2.googlesyndication.com",
                  "https://www.googleadservices.com"],                 // the last three: GA4 with Ads features / linked Ads
  "frame-src":   ["https://www.googletagmanager.com"],                // service worker / Ads features
  // Phase 3 (Meta): "script-src": ["https://connect.facebook.net"], "connect-src": ["https://www.facebook.com", "https://connect.facebook.net"]
};
const build = (extra: Record<string, string[]> = {}) =>
  Object.entries(BASE).map(([d, v]) => [d, ...v, ...(extra[d] ?? [])].join(" ")).join("; ");

async headers() {
  return [
    { source: "/:path*",          headers: [{ key: "Content-Security-Policy-Report-Only", value: build() }] },
    { source: "/catalogues/:name", headers: [{ key: "Content-Security-Policy-Report-Only", value: build(CATALOGUE_TRACKING) }] },
  ];
}
```

**Notes.**
- **What doesn't need adding.** `img-src https:` already covers beacons. `*.google.<TLD>` country domains cannot be wildcarded: either list the main EU ccTLDs or accept report noise (`google-tag-docs.md` §6.2).
- **Before enforcing:** add a `report-to` endpoint. The CSP is not the security boundary here; ID validation is. `'unsafe-inline'` must stay on ISR pages (`code-render-path.md` §7.3).
- **What the narrow rule buys.** `/catalogues/<slug>/preview`, `/catalogues/<slug>/privacy` and `/admin/*` keep the global policy, which has no tracking hosts.

---

## 11. Events Quicktalog sends, and UTM parameters (task item 9)

### 11.1 Mechanism: a semantic event bus, consumed only on the published page

**Decision.**
- **Item opens, searches, section expands and newsletter sign-ups.** Shared view components emit tracking-agnostic DOM events (`quicktalog:catalogue-event`). Only `CatalogueTracking` listens, and only after the tag loaded. In preview and the builder nothing listens, so emitting there is a no-op.
- **Link taps** are classified by a capture-phase listener in `CatalogueTracking`, from the anchor's `href` and its closest `[data-qt-area]` ancestor (header, menu, content, footer). That covers today's header, sidebar, footer and text links, and the future Buttons and Hours & Location blocks, without editing each component.
- **Small attribute edits:**
  - `data-qt-area` on `CatalogueHeader`'s `<header>`, `CatalogueSidebar`, `Catalogue`'s `<main>` (`src/components/catalogue/view/Catalogue.tsx:213`) and `CatalogueFooter`'s `<footer>`;
  - `data-qt-cta` on the header and footer CTA `SmartLink`s (`CatalogueHeader.tsx:209-223`; `CatalogueFooter.tsx:159-174`). `SmartLink` needs to forward `data-*` (`src/components/general/SmartLink.tsx:28-58`).
- **Security.** Cross-origin embeds and the `custom_code` sandbox cannot dispatch events on the parent window, so events are trusted (`codebase_embed_custom_code.md` §3).

```ts
// src/lib/integrations/catalogue-events.ts
export type CatalogueEvent =
  | { type: "item_view"; item: { id: string; name: string; section?: string; price?: number }; currency: string }
  | { type: "search"; term: string }
  | { type: "section_open"; section: string }
  | { type: "newsletter_signup" };

const EVENT = "quicktalog:catalogue-event";
export function emitCatalogueEvent(e: CatalogueEvent): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<CatalogueEvent>(EVENT, { detail: e }));
}
export function onCatalogueEvent(handler: (e: CatalogueEvent) => void): () => void {
  const listener = (ev: Event) => handler((ev as CustomEvent<CatalogueEvent>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export type LinkAction =
  | { type: "contact"; method: "phone" | "sms" | "email" | "whatsapp" | "viber" | "messenger" | "telegram" }
  | { type: "directions" } | { type: "booking"; provider: string } | { type: "order"; platform: string } | { type: "cta" };

const HOSTS: Array<[RegExp, (h: string) => LinkAction]> = [
  [/^(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)$/, () => ({ type: "contact", method: "whatsapp" })],
  [/^(m\.me|(www\.)?messenger\.com)$/, () => ({ type: "contact", method: "messenger" })],
  [/^t\.me$/, () => ({ type: "contact", method: "telegram" })],
  [/^(maps\.app\.goo\.gl|maps\.google\.[a-z.]+|maps\.apple\.com|(www\.)?waze\.com)$/, () => ({ type: "directions" })],
  [/(^|\.)(fresha|booksy|treatwell|calendly|opentable|thefork|resy|simplybook|setmore)\.[a-z.]+$/, (h) => ({ type: "booking", provider: h })],
  [/(^|\.)(wolt|glovoapp|ubereats|deliveroo|foodpanda)\.[a-z.]+$/, (h) => ({ type: "order", platform: h })],
];

export function classifyLink(a: HTMLAnchorElement): LinkAction | null {
  const href = a.getAttribute("href") ?? "";
  if (href.startsWith("tel:")) return { type: "contact", method: "phone" };
  if (href.startsWith("sms:")) return { type: "contact", method: "sms" };
  if (href.startsWith("mailto:")) return { type: "contact", method: "email" };
  if (href.startsWith("whatsapp:")) return { type: "contact", method: "whatsapp" };
  if (href.startsWith("viber:")) return { type: "contact", method: "viber" };
  let url: URL;
  try { url = new URL(href, location.href); } catch { return null; }
  if (/^(www\.)?google\.[a-z.]+$/.test(url.hostname) && url.pathname.startsWith("/maps")) return { type: "directions" };
  for (const [re, make] of HOSTS) if (re.test(url.hostname)) return make(url.hostname);
  return a.closest("[data-qt-cta]") ? { type: "cta" } : null;   // other outbound clicks: GA4 enhanced measurement already logs them
}
```

**Where item and search events are emitted.**
- **`item_view`:** in `CardsSwitcher`'s `onClick` (`src/components/catalogue/cards/index.tsx:99`), when the mode is not edit. It needs one new optional prop, `sectionName`, threaded from `ItemsSection`.
- **Price rule:**
  - Use the discounted price when the item is on discount.
  - **Leave `price` and `value` out when the price is 0 and `isFree` is not true.** Today a blank price saves as 0 and renders "Free" (`src/components/catalogue/cards/index.tsx:69-70`). Sending 0 would put false zeros into GA4 item value.
  - Items without a price omit `price`, `value` and `currency`.
- **`search`:** from the Phase 0 debounced callback in `CatalogueContent.tsx:88-95`.
  - Only after 1 s idle, at least 2 characters, and not the same term twice in a row.
  - Clipped to 100 characters.
  - Dropped when it looks personal (contains `@`, or a run of 7 or more digits).
- **`section_open`:** from `handleToggleSection` (`CatalogueContent.tsx:125-130`), only when a collapsed section opens in view mode.
- **`newsletter_signup`:** on the success branch of the footer form (`src/components/catalogue/view/CatalogueFooter.tsx:50-53`).

### 11.2 What is sent

| Visitor action | GA4 event | Parameters | Google Ads category it maps to | Meta event (Phase 3) | Owner value |
|---|---|---|---|---|---|
| Lands, after Accept | `page_view` (from `config`) | page_location (UTMs, gclid kept), clean page_title | Page view | `PageView` | Sources and campaigns |
| Opens an item | `view_item` | `items:[{item_id, item_name, item_category: section, price}]`, `currency` (ISO 4217, `src/constants/index.ts:52`), `value` | none | `ViewContent` (content_ids, value, currency) | "Items viewed" per item in the default Ecommerce purchases report ([Google](https://support.google.com/analytics/answer/12924131)) |
| Searches (debounced) | `search` | `search_term` | none | `Search` (search_string) | What guests look for |
| Taps phone, WhatsApp, Viber, Messenger, Telegram, SMS or email | `generate_lead` | `lead_source`: phone, whatsapp, viber, messenger, telegram, sms or email; `link_location` | Contact | `Contact` | Lead acquisition report, "which channels drive new leads" ([Google](https://support.google.com/analytics/answer/16376749)) |
| Subscribes to the newsletter | `generate_lead` | `lead_source: newsletter` | Sign up | `Lead` | Same report |
| Taps directions or a map link | `get_directions` (custom) | `link_location` | Get directions | `FindLocation` | Visit intent |
| Taps a booking provider link | `book_appointment` (custom) | `booking_provider`, `link_location` | Book appointment | `Schedule` | Salons, gyms, clinics |
| Taps a delivery platform link | `order_online` (custom) | `order_platform`, `link_location` | Outbound click | `trackCustom("OrderOnline")` | Restaurants' money click |
| Taps the header or footer button (other links) | `cta_click` (custom) | `link_text`, `link_url` (origin and path only, clipped to 100), `link_location` | Outbound click | `trackCustom("CtaClick")` | Did the button work? |
| Expands a section | `select_content` | `content_type: "menu_section"`, `content_id: <section name>` | none | none | Which parts of the menu open |

**Facts behind the names.**
- GA4's recommended events include `generate_lead` (with an optional `lead_source`), `view_item`, `search` and `select_content`. **`book_appointment`, `contact` and `get_directions` are not GA4 recommended events** ([Google, updated 2026-09-16](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag)).
- Google Ads' lead categories include Contact, Book appointment, Get directions, Sign up and Outbound click ([Google Ads](https://support.google.com/google-ads/answer/9791434)).
- Meta's standard events include Contact, FindLocation, Schedule, Search, ViewContent and Lead ([Meta](https://developers.facebook.com/docs/meta-pixel/reference)).
- Probe A.2 checked the wire format of `view_item`, `generate_lead` and `search` (`pr1=iditm_1~nmCappuccino~caCoffee~pr7.5`, `ep.lead_source=whatsapp`, `ep.search_term=…`).

**Inference: why this split.** Recommended GA4 events light up GA4's built-in reports with no owner work. The custom names mirror Ads' goal categories, so importing them as conversions is a one-click choice for the owner.

**Limits.** At most 25 parameters per event, parameter values of 100 characters and event names of 40 characters ([Google](https://support.google.com/analytics/answer/9267744)). This design stays far inside them. Google's developer ID goes on every event once issued (`google-tag-docs.md` §1.3).

### 11.3 UTM on QR codes

**Facts.**
- The QR URL is pinned to `NEXT_PUBLIC_BASE_URL/catalogues/<slug>`. The editor overwrites it on load and the action on save (`src/lib/qr/design.ts:143-146, 177-197, 214-221`; `docs/architecture/qr-codes.md`).
- Without UTMs a QR scan has no referrer and lands in GA4's Direct channel. Google says to always use `utm_source`, `utm_medium` and `utm_campaign` ([Google](https://support.google.com/analytics/answer/10917952)).
- Query strings do not fragment the ISR cache: never-seen UTM URLs were cache HITs (`code-write-path.md` §6, B1).
- The meter and dashboard fold query strings into the right catalogue. Unique visitors inflate slightly (`code-write-path.md` §6).

**Decision: a fixed placement list keeps the "URL is pinned" rule.**

```ts
// src/lib/qr/design.ts
export const QR_PLACEMENTS = ["table", "counter", "window", "flyer", "poster", "card", "packaging"] as const;
export type QrPlacement = (typeof QR_PLACEMENTS)[number];

/** The URL every catalogue's code points at; the server builds it from enumerated values only. */
export function catalogueUrl(catalogue: string, placement?: QrPlacement | null): string {
  const base = `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue}`;
  if (!placement || !QR_PLACEMENTS.includes(placement)) return base;
  return `${base}?utm_source=qr&utm_medium=print&utm_campaign=${placement}`;
}
```

**How it fits the editor.**
- `QrConfig` gains `placement`, validated by a zod enum in `qrConfigSchema`. `normalizeQrConfig` pins `data` to `catalogueUrl(catalogue, placement)`.
- The editor asks "Where will this code be?" with chips. When GA4 is connected, a nudge says "Pick a place so Google Analytics can tell your QR codes apart." "Download for…" can produce codes for several placements from one design.

**Effects.**
- Already-printed codes keep working. GA4 shows them as Direct.
- The code gets about 49 characters longer. That raises the QR version, for example from about 5 to about 8 at error-correction level Q. The editor's version caption and scan-risk check already show this (`src/lib/qr/version.ts`, `src/lib/qr/scan-risk.ts`).
- GA4's default channel definitions have no QR or print channel ([Google](https://support.google.com/analytics/answer/9756891)). Tagged scans show under source/medium "qr / print" with campaign = placement, and the card's checklist explains the "QR code" custom channel group (§3.7).

### 11.4 Share links

**Decision (Phase 2).** In the share and "copy link" menus (`src/components/modals/SuccessModal.tsx`; `src/components/dashboard/overview/ItemDropdownMenu.tsx:112`), offer one-tap copies of tagged links from a fixed table:

| Link | Tags | GA4 channel (inference from Google's default definitions) |
|---|---|---|
| Instagram bio | `utm_source=instagram&utm_medium=social&utm_campaign=bio` | Organic Social |
| Facebook page | `utm_source=facebook&utm_medium=social&utm_campaign=page` | Organic Social |
| Google Business Profile | `utm_source=google&utm_medium=organic&utm_campaign=business_profile` | Organic Search |
| WhatsApp status or broadcast | `utm_source=whatsapp&utm_medium=social&utm_campaign=share` | Organic Social |
| Email signature | `utm_source=email&utm_medium=email&utm_campaign=signature` | Email (the source/medium "email" rule is in [Google](https://support.google.com/analytics/answer/9756891)) |

**Inference.** For owners, this answers "Instagram or Google?" without them ever opening Google's Campaign URL Builder.

### 11.5 Telling owners why the numbers differ

Card and docs copy:

> "Quicktalog counts every visit. Google Analytics only counts visitors who accept cookies, usually half to two-thirds in Europe. It misses visitors with ad blockers and starts counting when they accept. Use Quicktalog for totals and Google Analytics for sources, items and leads."

The coverage figure is from `consent.md` §6.2. The pattern follows Gumroad, Eventbrite and Tally (`shared-domain-implementations.md` §5.8).

---

## 12. Security and AI-agent exclusion (task item 10)

### The trust boundary

- **One strict ID pattern, checked in four places.** The UI hints, the server action (authority), the database CHECK (backstop) and the render path (re-validation in `publicTagConfig` and again at the sink in `startGoogleTag`) all use `^G-[A-Z0-9]{6,20}$`.
- **The pattern decides what can run.** Google states that a `G-` container "is limited to Google tags", while `GTM-` allows Custom HTML through any path ([Google](https://support.google.com/tagmanager/answer/17070049)).
- **No owner-supplied markup.**
  - No snippet field, no inline script, no `dangerouslySetInnerHTML`.
  - The script URL is built with `encodeURIComponent`.
  - Not `@next/third-parties` `<GoogleAnalytics>`: it interpolates the ID into inline JS, drops `&l=`, de-duplicates by ID and has no consent support (`code-render-path.md` §8.4; `google-tag-docs.md` §5.1).
- **Where the tag runs.**
  - Only on the published page.
  - Never framed, never after a soft navigation, never for a signed-in browser, with hard exits once loaded (§6.2–6.4).
  - **Inference:** these guards close the paths by which a tenant's tag could observe the builder or a signed-in owner on the shared origin, pending a separate domain.
- **The column is public.** IDs are public by design. No tokens, ever (§4.1).
- **Abuse friction.** Tracking only on paid plans (§14). Saves and tag checks are rate-limited.
- **Consent log privacy.** A random choice ID only; no IP stored (§7.7).

### Open security item, a launch gate

**What to test.** Take a Quicktalog-owned GA4 property, upgrade its Google tag to a Tag Manager container, and try to read a test session cookie through a First Party Cookie variable into an event parameter (`google-tag-docs.md` §10.1).

**What the result decides.**
- **If it works:** the session guard is necessary. It is planned, and the separate domain (§13.4) becomes more urgent.
- **If it doesn't:** the guard stays as cheap defence in depth.

### The AI agent cannot reach the setting

**Facts.**
- The tool schema is a closed `z.object` (`src/agent/tools/general.ts:8-60`).
- The applier copies named fields (`src/lib/catalogue/operations.ts:474`).
- The snapshot lists fields explicitly (`src/agent/session.ts:375-419`).
- Agent operations persist only through the owner's Save and Publish, and `integrations` is not an editable field (`code-write-path.md` §5).

**Decision: keep it that way, and add three things.**
1. One prompt line in `settingsRules` (`src/agent/instructions.ts:48-53`): "Tracking (Google Analytics, Meta Pixel, Google Tag Manager or any pixel or snippet) is not something you can set. The owner connects Google Analytics on the catalogue's Analytics page; if asked, say so and point them there. Never put a tracking snippet into an embedding or custom_code section."
2. Tests: `catalogueFieldsSchema.parse({ integrations })` yields no `integrations`; `snapshot()` contains no `G-` ID; the prompt line is present (`code-write-path.md` §8, item 4).
3. `writeOwnedDraft` strips `integrations` (§5.5), so the client draft sent to `/api/agent` never carries it from Redis.

---

## 13. Decisions on `GTM-`, `GT-`, `AW-` and Meta Pixel, and the separate-domain path (task item 11)

### 13.1 Google Tag Manager: refused for now

**Decision.** Refuse `GTM-` with a friendly message and a "Why?" link. The link says: "Tag Manager can run any code. Catalogues share quicktalog.app with your account, so we only run Google's own tags here. We'll offer Tag Manager when catalogues move to their own domain." It ends with "Tell us you need it", which records demand.

**Facts.**
- A `GTM-` container loaded even through `/gtag/js` is unrestricted ([release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708)).
- The CSP cannot contain it, because it allows `'unsafe-inline'`, `'unsafe-eval'` and `*.googletagmanager.com` (`next.config.ts:50`).
- Every shared-origin analogue refuses GTM; Calendly says it "doesn't support direct integration with Google Tag Manager" (`shared-domain-implementations.md` §0, §2.2).

### 13.2 `GT-`: refused in v1, revisit

**Facts.**
- New Google tags get `GT-` IDs, and "the tag IDs are interchangeable" ([Google](https://developers.google.com/tag-platform/gtagjs/configure), via `google-tag-docs.md` §2.1).
- Google's restriction article names "product-specific prefixes like G- or AW-" and not `GT-` ([Google](https://support.google.com/tagmanager/answer/17070049)).
- Probe A.1 shows a made-up `GT-` ID returns an empty container. That says nothing about restriction.

**Decision.** Refuse it, with the guidance in §3.3 (paste the stream's `G-` ID, or create a web stream for the catalogue).

**Revisit (Phase 4, S–M).** Accept `GT-` once a Quicktalog-owned `GT-` tag is confirmed restricted to Google tags. That means trying a Custom HTML tag through it.

### 13.3 `AW-` Google Ads: not built until demand shows

**Decision.** No Ads field in v1. The path for owners is:
1. **Link GA4 to Google Ads** ([Google](https://support.google.com/analytics/answer/9379420)).
2. **Import key events as conversions** ([Google](https://support.google.com/analytics/answer/10632359)), where the event names already match Ads' categories (§11.2).
3. **Build GA4 audiences for remarketing.**
4. **Tick "I advertise with Google Ads"**, so EEA visitors can grant `ad_user_data` and `ad_personalization`. Without it, Analytics data cannot be used for EEA ads measurement ([Google](https://support.google.com/analytics/answer/14275483)).

**Why.**
- It covers conversions and remarketing for a single-location SMB with one ID.
- It avoids conversion labels per action, the Ads `script-src` hosts (`googleadservices.com`, `google.com`) and a second consent model.

**Later (on demand, S–M).** An optional `AW-` ID would go into the same `qtag` instance as a second `config`. Native conversions would need `send_to: "AW-…/label"` per action ([Google](https://developers.google.com/tag-platform/devguides/conversions)).

### 13.4 Meta Pixel: Phase 3 on the same banner

**Decision.** A "Meta Pixel ID" field (digits; the database already accepts the key), gated by `features.integrations.metaPixel`.
- **Banner:** the Advertising category, which needs the `advertising` flag. Meta is joint controller under its Controller Addendum ([Meta](https://www.facebook.com/legal/controller_addendum), via `consent.md` §3.1), and the banner names Meta.
- **Loading (basic mode):** no `fbevents.js` before consent. On grant: `fbq('consent','grant')`, then `fbq('set','autoConfig',false,ID)` so the pixel does not scrape Quicktalog's UI ([Meta](https://developers.facebook.com/documentation/meta-pixel/advanced.md)), then `init` and `PageView`.
- **Events:** the §11.2 mapping, with `trackSingle` so a second pixel on the page never receives them.
- **On withdrawal:** `fbq('consent','revoke')`.
- **CSP:** `connect.facebook.net` and `www.facebook.com`.
- **Owner docs:** add `quicktalog.app` to the pixel's traffic permissions. Domain verification is impossible on a shared domain (Eventbrite says the same, `shared-domain-implementations.md` §2.3).
- **Never in v1–3:** a Conversions API token, because the column is public. Server-side CAPI would be its own project with secret storage.

### 13.5 The separate-domain path (what unlocks GTM and head code)

**Facts.** Free-form code or GTM appears only where tenant pages run on a different origin from the builder:
- Gumroad snippets run on `gumroad-analytics.com`.
- Typeform's GTM runs on `form.typeform.com`, with a consent toggle and no payments.
- Carrd, Notion and Shopify host tenant pages on Public Suffix List domains.
- Sources: `shared-domain-implementations.md` §3 and the 09-30 report.

**Decision (Phase 5, L+).** Serve public catalogues from a new registrable domain with per-tenant subdomains, `<slug>.<new-domain>`, registered on the Public Suffix List. Each tenant then gets its own site. After that:
- **Premium may get GTM and head code**, with the consent banner forced on and Typeform-style rules.
- **The cookie-prefix workaround becomes unnecessary.**
- **The session-cookie risk disappears**, because no builder cookie lives on that domain.

**What must move together** (`code-write-path.md` §6):
- QR codes pinned to `NEXT_PUBLIC_BASE_URL`. Old printed codes need 301s from `www.quicktalog.app/catalogues/<slug>`.
- The worker's domain filter (`quicktalog-backend/src/utils/analytics.ts:6-7`).
- The dashboard's `$host` match (`src/lib/analytics/catalogue-traffic.ts:56`).
- The CRM views' URLs (`quicktalog-packages/src/drizzle/migrations/schema.ts:254,263`).
- Canonical and sitemap metadata.
- The CSP.
- Owners' GA4: the hostname changes, and new cookies mean returning visitors look new once.

**Customer custom domains** (`menu.bistroluna.rs`) are a later variant of the same move.

---

## 14. Plan gating (task item 12)

**Decision (recommendation; the founder decides).** Set `features.integrations = { googleAnalytics: true, metaPixel: true }` on Basic, Pro, Growth, Premium and the custom plan (id 5), and `false` on Starter.

**Reasons, through the customer-value lens.**
1. **The business name is a precondition, and Starter can't set one.** Tags need the business's legal name in the banner and notice (§7.9). The Business information fields sit behind `branding`, which Starter lacks (`src/components/catalogue/inputs/sidebar/FooterTab.tsx:15, 72-82`; `quicktalog-packages/src/constants/pricing.ts:19`).
2. **Analogues put it at the first or second paid tier.** Linktree Pro/Premium, Calendly and Tally on their first paid plans, Carrd Pro Standard (`shared-domain-implementations.md` §5.1). Basic's only block feature today is a divider (`quicktalog-packages/src/constants/pricing.ts:51-55`). Tracking gives Basic a reason to pay for it.
3. **The cost per catalogue is close to zero.**
4. **Downgrades stay simple.** Only paid-to-free changes can remove the feature, and that is the one path that already reconciles (§5.8).
5. **Abuse friction.** Free accounts cannot attach third-party tags to Quicktalog-branded pages.

**Alternative.** Pro+, the 09-25 PLAN's choice, keeps a stronger Pro upsell. It also needs paid-to-paid downgrade reconciliation, which does not exist today (`code-write-path.md` §3).

**Enforcement.** The server checks the plan on every save (§5.4). The UI locks (§3.5). The public page renders `paused` tags as nothing. Remove and Resume are always available. Add feature rows to the pricing comparison and plan cards (`src/constants/pricing.ts:24-59, 112-204`) and to `src/components/dashboard/subscription/PlanFeatures.tsx:32-59`.

---

## 15. Testing, docs, rollout and outreach (task item 13)

### 15.1 Tests

**Unit (Vitest)**
- `tests/unit/lib/integrations/ids.test.ts`:
  - normalization: lowercase, en dash, spaces;
  - snippet extraction, and a snippet containing `GTM-`;
  - every refused prefix;
  - a script payload such as `G-ABC123'><script>`;
  - length bounds;
  - `ga4CookiePrefix`.
- `tests/unit/lib/integrations/google-tag.test.ts` (happy-dom):
  - every layer entry is `[object Arguments]`;
  - the order is consent default → update → set → js → config;
  - the exact script `src` with `&l=qtDataLayer`;
  - no script for an invalid ID or without analytics consent;
  - `stopGoogleTag` deletes the prefixed cookies and sets `ga-disable-*`.
- `consent-store.test.ts`: expiry, version or hash mismatch re-asks, throwing storage returns null.
- `catalogue-events.test.ts`:
  - the link classifier table: `tel:`, `wa.me`, `viber:`, a maps link, Fresha, Wolt, a CTA, a plain outbound link;
  - the GA4 mapping;
  - the search PII filter;
  - the price rule (0 without `isFree` omits value).
- `tests/unit/components/catalogue-tracking.test.tsx` (happy-dom):
  - renders nothing when framed, on the wrong path or after a soft navigation;
  - the signed-in note when a session cookie is present;
  - the banner when there is no record;
  - Accept injects the script, Reject injects nothing;
  - a stored grant loads on mount;
  - withdrawal works.
- `tests/unit/server_actions/integrations.test.ts`:
  - identity first;
  - each refused kind returns its message without touching the database;
  - Starter is refused but removal is allowed;
  - 0 rows means not found;
  - 23514 is mapped without Sentry, 42501 goes to Sentry;
  - revalidation runs after `withUser` resolves;
  - `applyToAll` keeps the owner filter;
  - no Redis draft write.
- `tests/unit/entitlements/plan-limits.test.ts`:
  - `integrations` is not in `CATALOGUE_EDITABLE_FIELDS`, and `pickEditable` drops it;
  - `PUBLIC_CATALOGUE_COLUMNS` includes it;
  - `allowsIntegrations` per tier.
- A draft-cache test (none exists today): the row wins for `integrations`, and the write strips it.
- `tests/unit/paddle/process-webhook.test.ts`: a downgrade pauses tags and revalidates the paused names.
- Agent tests (§12).
- QR tests: `catalogueUrl` with a placement, the schema enum, normalization pins the URL.
- The CSP header rules (§10).

**Database.** pgTAP for the new column (§4.2), and `consent_events` policies plus the function: active only, `app_public` executes only.

**E2E (Playwright, TEST only:** `playwright.config.ts:22-26` refuses production hosts, per `code-write-path.md` §8). Every request to `*.google-analytics.com`, `*.analytics.google.com`, `*.google.com` and `doubleclick` is answered with 204, as in probe A.2, so no real property ever receives data.
1. A TEST user on Basic saves `G-QTE2E00001`, publishes, and opens the catalogue in a fresh context.
   - Before Accept: the banner shows, with no `gtag/js` request.
   - After Accept: one `gtag/js?id=G-QTE2E00001&l=qtDataLayer` and a `/g/collect` with `gcs=G101`.
   - Cookies: `qt_qte2e00001_ga` at `/catalogues`, host-only.
   - Opening an item sends `view_item`; tapping `tel:` sends `generate_lead`.
2. Reject: zero Google requests, then and on reload.
3. `/catalogues/<slug>/preview`: no banner and no Google request.
4. A signed-in context: the note shows and no Google request is made.
5. Withdrawal through Privacy choices deletes the cookies and makes no further hits.
6. A Starter user sees the locked card, and the action refuses.

**Manual**
- A real Quicktalog-owned GA4 property:
  - Realtime and DebugView with `?qt_debug=1`;
  - the "Items viewed" report and the Lead acquisition report after 24–48 h;
  - key-event import into a test Ads account, if one exists;
  - Tag Assistant with the renamed data layer.
- Browsers: Safari iOS, the Instagram and Facebook in-app browsers, Firefox and Chrome Android.
- Screen-reader pass on the banner.
- The security test in §12.

### 15.2 Docs to update

**Developer docs (`docs/`)**
- **New:** `docs/architecture/catalogue-tracking.md`, listed in `docs/README.md`. It covers the column and CHECK, the action and its immediate semantics, the plan gate and pause, the render path and guards, the consent flow and log, cookie scoping, the events table, the CSP rule, why GTM, `GT-` and `AW-` are refused, and the domain plan.
- **Updates:**
  - `docs/architecture/analytics.md`: PostHog cookieless on catalogue routes, the dashboard's unique-visitor semantics, and GA4 vs Quicktalog numbers.
  - `docs/architecture/catalogue-html-safety.md`: tracking is a typed setting, not a fifth sink.
  - `docs/architecture/builder.md`: the General-tab pointer.
  - `docs/architecture/data-access.md`: the column grants and the consent function.
  - `docs/architecture/qr-codes.md`: placement UTMs. The "URL is pinned" rule still holds.
  - `docs/architecture/ai-chat-flow.md`: the agent cannot set tracking.

**Skills**
- `server-action-and-route`: the "settings that bypass the draft" pattern.
- `data-revalidation`: an integrations row (`code-write-path.md` §8).

**Customer docs**
- **New:** `src/content/docs/connect-google-analytics.tsx`, registered in `src/content/docs/registry.ts`. It covers what you get, setup, testing, numbers vs Quicktalog, Google Ads, QR tracking, and an FAQ ("Why not Tag Manager?", "Why don't my own visits show?").
- **Updates:**
  - `src/content/docs/track-performance.tsx`: a "Quicktalog vs Google Analytics" section.
  - `src/content/docs/plans-and-billing.tsx`: the feature row.
  - `src/content/docs/share-your-catalogue.tsx`: tagged QR codes and links.

**Legal.** Terms (DPA), the platform privacy policy (visitor section), and the per-catalogue notice template, all through counsel.

### 15.3 Rollout

1. **Phase 0 to TEST.** Verify the meter and the owner page against PostHog for a few days. It then rides the next PROD release.
2. **Phase 1 behind a flag.** An env flag plus a user allowlist hide the card and make the action refuse.
3. **Stages.** A Quicktalog test catalogue, then a beta of 5–10 owners (those found by the audit first), then all Basic+ owners.
4. **Launch.** An email to eligible owners, an in-app banner on the Analytics page, the docs article, and a changelog entry.
5. **Metrics.**
   - share of eligible catalogues connected;
   - setup completion rate: card opened → saved → tag check "found";
   - consent acceptance rate from the log;
   - support tickets tagged "GA".

### 15.4 Outreach to owners whose tracking broke or will break

**Facts.**
- TEST custom code moved into the sandbox on 2026-09-15 (`e87e1f2`).
- PROD still runs first-party embeds and custom code (`code-render-path.md` §1).
- A read-only PROD query that lists blocks with `gtag`, GTM or `fbq` snippets and their owners' emails is drafted and checked on TEST, but has not been run (`code-write-path.md` §7).

**Plan.**
1. **Run the audit query on PROD**, after the founder approves it.
2. **Segment the owners:**
   - `G-` found: "Set up in 2 minutes; we found your ID G-XXXX in your old code."
   - `GTM-` only: explain, offer the `G-` route, and record GTM interest.
   - `fbq` (Meta Pixel): "Meta Pixel support is coming." Notify them at Phase 3.
   - `AW-`: explain linking GA4 to Google Ads.
3. **Timing.** Email one to two weeks **before** the release that brings `test` to PROD. Their snippets stop at that release, so ideally Phase 1 ships in the same release or right after it. Be honest about the gap if the security release cannot wait, and it shouldn't: on PROD the old path runs unsanitized owner code on the builder's origin.
4. **In-product.** The migration helper (§3.8) and the builder warning on blocks with dead tracking code.

---

## 16. Phased delivery (task item 14)

S = a sitting, M = a few sittings, L = a week or more.

| Phase | Content | Size | Depends on |
|---|---|---|---|
| **0. Clean catalogue pages** | | **S–M** | none |
| 0a | GTM and Clarity off public catalogue paths (`QuicktalogSiteTags` wrapper) | S | |
| 0b | Sentry Replay off there | S | |
| 0c | PostHog cookieless there, the project setting, and verifying meter and dashboard on TEST | S–M | |
| 0d | `CookieBanner` pathname reactivity | S | |
| 0e | Debounce search URL writes | S | |
| 0f | Dashboard and newsletter-table links into catalogues become plain `<a>` | S | |
| **1. Connect Google Analytics** | | **L** | 0 and counsel review of texts |
| 1a | Data and write: migrations (integrations and consent log), pgTAP, package 1.67.0, `saveGoogleAnalytics`, `checkGoogleTag`, entitlements, draft-cache rule, downgrade pause | M | |
| 1b | Owner UI: Analytics card with states, guided setup, validation copy, banner preview, test guide; General-tab pointer; locked state | M | 1a |
| 1c | Visitor side: `CatalogueTracking`, guards, loader, consent store, banner (32 languages), privacy choices, event bus and classifier, CSP rule | M–L | 1a |
| 1d | Compliance: generated privacy notice page, consent-log action, Google developer ID application (lead time, so start now) | M | 1a |
| 1e | Tests, docs, flag, beta, launch | S–M | 1b–1d |
| **2. Attribution helpers** | | **M** | 1 |
| 2a | QR placement UTMs | S–M | |
| 2b | Share links | S | |
| 2c | Apply to all and the duplicate prompt | S | |
| 2d | Old-snippet import helper and builder warning | S | |
| 2e | Consent rate and CSV on the card | S | |
| 2f | Publish-dialog nudge | S | |
| 2g | Outreach campaign | S | |
| **3. Meta Pixel** | Field, banner Advertising category with Meta named, `fbq` basic-mode loader (revoke/grant, autoConfig off, `trackSingle`), event mapping, CSP hosts, docs | **M** | 1 |
| **4. Structural and optional** | | **M–L each** | 1 |
| 4a | Separate root layout for public catalogues (removes auth SDK, `UserContext` and banner code; structurally hard exits). Needs a build spike first: `preview/` in the other group, `MainContextProvider`, not-found and global-error (`code-render-path.md` §9.4) | | |
| 4b | Server-side page-view counting | | |
| 4c | `GT-` and optional `AW-` after verification | | |
| 4d | Geo-aware advanced-mode opt-in outside the EEA | | |
| 4e | Built-in "Sources and taps" card in Quicktalog's own dashboard from the same event bus | | Legal review: aggregated counts, no identifiers |
| **5. Separate catalogue domain** | PSL-listed per-tenant subdomains, then GTM and head code for Premium | **L+** | Strategic decision |

**Critical path to "an owner can add GA4": 0 → 1a → (1b, 1c, 1d in parallel) → 1e.** Inference: about two weeks of focused work for one developer, plus counsel's turnaround on the texts.

---

## 17. Risks and open questions (task item 15)

### Risks

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| 1 | **Legal:** counsel rejects parts of the copy or the processor model; Quicktalog lacks a DPA; Serbia's ZEK Art. 160(4) is read strictly (`consent.md` §2.8) | Medium / high | Treat counsel sign-off as a gate. Basic mode, reject on the first layer, a log and a notice already take the conservative reading |
| 2 | **Exfiltration through upgraded `G-` containers** (untested, `google-tag-docs.md` §2.5) | Unknown / high | Session guard, hard exits, landing and frame guards, the §12 test before GA; the separate domain long term |
| 3 | **Google changes the tag platform.** New snippets drop `config`, and `gtm init` triggers may change how on-page `set` and `config` apply ([Google](https://support.google.com/tagmanager/answer/17079602)) | Medium / medium | Probe A.2 verified behaviour on 2026-10-01. Re-run it in CI weekly against live `gtag.js`, with collection mocked |
| 4 | **The tag check relies on an undocumented container format** | High / low | Best effort, flagged, never blocks a save |
| 5 | **Owners expect GA4 to match Quicktalog;** consent coverage is about 55–68% | High / medium | Copy on the card and in the docs; consent-rate display; Quicktalog numbers stay complete |
| 6 | **iOS ITP** clears consent and JS cookies after 7 days without a visit, so more "new users" and more banner re-shows | High / low | Document it; it is standard for every site |
| 7 | **PostHog cookieless semantics** change the dashboard's unique visitors; how `distinct_id` is stored is unverified | Medium / medium | Verify on TEST first (§9); relabel; server-side counting later |
| 8 | **Revalidation purges every catalogue's data cache** on each save, because of shared tags (`src/lib/cache/revalidate.ts:15-16`) | Certain / low | Rate limit. Optional narrower helper for settings saves (`revalidatePath` plus `catalogue-${name}` only) |
| 9 | **PROD lags TEST,** and PROD owners' old snippets still run until the big release | Certain / medium | Migration order (§4.3); outreach timing (§15.4) |
| 10 | **Owners set someone else's `G-` ID,** sending spam to another property | Low / low | Inherent to client-side tags; harmless to visitors; rate limit |
| 11 | **Translation quality across 32 languages** | Medium / medium | Native review for the top languages; English fallback |
| 12 | **The hard-exit listener or guards miss an edge case** (a new link type, a future component) | Medium / medium | Unit tests on the classifier and guards; Phase 4a structural fix |
| 13 | **Owners with combined tags** (`GT-` main ID) or a stream merged into another tag hit friction | Medium / low | §3.3 and §3.2 guidance; Phase 4c |
| 14 | **Events fired just before a hard exit can be lost** (GA4 batches hits; probe A.2 did not observe first-page events queued about 3.5 s before navigation) | Low / low | Most money clicks open new tabs or `tel:`/`mailto:` with no unload. Accept the rest |

### Open questions for the founder or counsel

1. **Tier.** Basic+ (recommended) or Pro+?
2. **Quicktalog's own tags.** Approve removing Quicktalog's GTM (GA4 and Hotjar) and Clarity from public catalogue pages. Does anyone rely on that GA4 data? Separately, fix the container's URL-named event and Hotjar on `/admin`.
3. **Counting.** PostHog cookieless on catalogue routes (counsel: exemption?) or go straight to server-side counting?
4. **Banner scope.** Worldwide (v1) or geo-aware later? Basic mode for all (v1) or an owner opt-in to advanced mode outside the EEA later?
5. **Consent-log retention,** and whether to store a coarse country.
6. **The PROD audit.** Approve the read-only query (`code-write-path.md` §7) for outreach.
7. **Google tag Developer ID.** Apply now? The form is linked from Google's CMS guide.
8. **Meta Pixel timing** (Phase 3) and whether server-side CAPI is ever in scope.
9. **The separate catalogue domain** (Phase 5): the strategic decision that unlocks GTM and head code.
10. **Duplicates.** Copy the ID silently, or prompt (recommended)?
11. **Legal entity.** Fill in the governing law and entity in the Terms (still "[JURISDICTION]") and add the DPA.

---

## Appendix A. Probes run for this design (2026-10-01)

### A.1 Can Google's endpoint tell a real tag ID from a typo?

**Method.** `curl https://www.googletagmanager.com/gtag/js?id=<ID>`. This is a plain GET of a public script; no analytics hit is sent. Bodies were saved in the session scratchpad (`scratchpad/gtag-id-check/`), and markers were extracted with a Python regex.

| ID | HTTP, bytes | `resource.version` | Destination markers |
|---|---|---|---|
| `G-RXHJ9X3T5T` (Quicktalog's Google tag, public in its container) | 200, 550,855 | "4" | `vtp_destinationId: G-DT7TJQYK3K`; `__ogt_auto_events`, `__ogt_cross_domain`, `__ogt_event_create`, `__ogt_ga_send` |
| `G-ZZZZQQ9X7W` (made up) | 200, 438,747 | "1" | none |
| `G-AAAAAAAAAA` (made up) | 200, 438,727 | "1" | none |
| `G-DT7TJQYK3K` (Quicktalog's GA4 destination) | 404, 1,584 | none (Google 404 page) | none |
| `GT-ZZZZQQ9X` (made up) | 200, 244,985 | "1", empty | none |
| `GTM-W9RHLVK6` (Quicktalog's container) | 200, 372,396 | "6" | `vtp_tagId: G-RXHJ9X3T5T` |
| `GTM-ZZZZQQ9X` (made up) | 200, 245,012 | "1", empty | none |

**Limits.** One run. Google can change the format at any time. A brand-new tag may look empty for a while (not tested).

### A.2 Does the proposed loader behave as designed?

**Method.**
- `scratchpad/cv-loader-probe/probe.mjs` with output in `probe.out.txt`.
- Playwright 1.62.1 with chromium-1234 from the app's `node_modules`.
- A fake origin `https://www.quicktalog-probe.test` served by `route.fulfill`, with fake IDs `G-QTPROBEA1` and `G-QTPROBEB2`.
- The page ran the §6.4 sequence as plain JS: `qtag` pushing `arguments`, consent default then update (analytics only), the cookie `set`, `js`, `config` with `page_title`, then the script with `&l=qtDataLayer`. After 3 s it sent `view_item`, `generate_lead` and `search` with `send_to`.
- The real `gtag.js` came from Google. Every request to `google-analytics.com`, `analytics.google.com`, `google.com`, `doubleclick`, `googlesyndication` and `googleadservices` was logged and answered with 204. Nothing reached a real property.
- The run visited `/catalogues/bistro-a`, then `/catalogues/bistro-a-drinks` (same ID), then `/catalogues/salon-b`, waiting 6.5 s each.

**Results.**
- **Hits:**
  - `page_view` on all three pages, all `gcs=G101`, `gcd=13q3r3q3q7l1`, with `dt` = the clean title.
  - On the drinks page: `view_item` with `pr1=iditm_1~nmCappuccino~caCoffee~pr7.5&epn.value=7.5&cu=EUR`, `generate_lead` with `ep.lead_source=whatsapp&ep.link_location=header`, and `search` with `ep.search_term=oat milk`.
  - No requests to Ads or doubleclick hosts.
- **Client IDs:** bistro-a and bistro-a-drinks shared `283502865.1790836380` and one session. salon-b had `1712320735.1790836393`.
- **Cookies:**
  - `qt_qtprobea1_ga` and `qt_qtprobea1_ga_QTPROBEA1`;
  - `qt_qtprobeb2_ga` and `qt_qtprobeb2_ga_QTPROBEB2`;
  - all host-only `www.quicktalog-probe.test`, path `/catalogues`, Secure, SameSite=Lax, 395 days.
- **Data layer:** `qtDataLayer` entries were `[object Arguments]`, and `window.dataLayer` was undefined.

**Limits.**
- Chromium only.
- Fake IDs carry no stream settings, so enhanced measurement (history page views, outbound clicks, site search) was not observable.
- Bistro-a's queued events were not seen before the next navigation; not investigated (risk 14).

---

## Appendix B. File change list (by phase)

**Phase 0**

| File | Change |
|---|---|
| `src/app/layout.tsx:46-49` | Replace `<ClarityScript />` and `<GoogleTagManager />` with `<QuicktalogSiteTags gtmId={process.env.GTM_ID} />`, which returns null on public catalogue paths |
| `src/components/general/QuicktalogSiteTags.tsx` (new, client) | Pathname-gated Clarity and GTM |
| `src/instrumentation-client.ts:5-42` | Public-catalogue branch: PostHog cookieless and `person_profiles: 'never'`; Sentry without Replay |
| `src/components/general/CookieBanner.tsx:28-37, 65` | Add the pathname to the effect's dependencies |
| `src/components/catalogue/view/CatalogueContent.tsx:88-95` | Debounce `router.replace`; hook for `search` |
| `src/components/dashboard/overview/DashboardItem.tsx:151`, `NewsletterTable.tsx:123` | Plain `<a>` into catalogues |

**Phase 1**

| File | Change |
|---|---|
| `supabase/migrations/<ts>_catalogue_integrations.sql`, `<ts>_consent_events.sql` (new) | §4.2, §7.7 |
| `supabase/tests/database/10_catalogues.test.sql`, plus a consent test file | pgTAP |
| `quicktalog-packages/src/drizzle/migrations/schema.ts` | `drizzle-kit pull` only |
| `quicktalog-packages/src/types/catalogue.ts:15-29` | `Integrations` and the `Update` map |
| `quicktalog-packages/src/constants/catalogue.ts:3-79` | `integrations: {}` |
| `quicktalog-packages/src/types/general.ts:25-46`; `constants/pricing.ts` (six tiers) | `features.integrations` |
| `package.json` | `@quicktalog/common` ^1.67.0 |
| `src/utils/db/columns.ts:10-31` | Add `integrations` to `PUBLIC_CATALOGUE_COLUMNS` only, with a comment explaining why it is not editable |
| `src/lib/integrations/ids.ts`, `messages.ts`, `google-tag.ts`, `consent-store.ts`, `catalogue-events.ts`, `public-config.ts` (new) | §5.1, §3.3, §6.4, §7.1, §11.1, §6.1 |
| `src/actions/integrations.ts` (new) | `saveGoogleAnalytics`, `checkGoogleTag` |
| `src/actions/consent.ts` | Add `recordConsent`, a public action through `private.record_catalogue_consent`. Kept separate from `saveCookiePreferences` |
| `src/lib/catalogue/integrations.ts` (new, server-only) | Owner-scoped update and read |
| `src/lib/entitlements/integrations.ts` (new); `src/lib/entitlements/required-plan.ts` | `allowsIntegrations`; feature-aware required plan |
| `src/lib/entitlements/catalogue.ts:37-78`; `src/utils/paddle/process-webhook.ts:180-184, 213-215` | Pause on downgrade and revalidate paused names |
| `src/lib/catalogue/draft-cache.ts:61-71, 75-82` | `integrations` comes from the row; strip it on write |
| `src/lib/rate-limit.ts:8-19` | `integrations`, `tagCheck` and `consent` rules |
| `src/constants/schemas.ts` | `integrationsSchema` (strict) |
| `src/app/catalogues/[name]/page.tsx:143-147` | Mount `CatalogueTracking` |
| `src/app/catalogues/[name]/privacy/page.tsx` (new) | Generated notice (ISR) |
| `src/components/catalogue/tracking/CatalogueTracking.tsx`, `ConsentBanner.tsx`, `PrivacyChoicesLink.tsx`, `SignedInNote.tsx` (new) and a strings module | Visitor side |
| `src/components/catalogue/cards/index.tsx:99`, `sections/ItemsSection`, `view/CatalogueFooter.tsx:50-53`, `view/CatalogueContent.tsx:125-130` | Emit catalogue events; `sectionName` prop |
| `src/components/catalogue/view/CatalogueHeader.tsx`, `CatalogueSidebar.tsx`, `Catalogue.tsx:213`, `CatalogueFooter.tsx`, `components/LegalLinks.tsx`; `src/components/general/SmartLink.tsx` | `data-qt-area`, `data-qt-cta`, the privacy-choices slot, `data-*` forwarding |
| `src/app/admin/[name]/analytics/page.tsx:29-31`; `src/components/analytics/CatalogueAnalytics.tsx`; `src/components/analytics/TrackingSettingsCard.tsx` (new) | Load integrations, status, plan and the snippet scan in the existing `withUser` block; render the card |
| `src/components/catalogue/inputs/sidebar/GeneralTab.tsx` | "Analytics & tracking" pointer section |
| `next.config.ts:47-69` | CSP built from a map, plus the `/catalogues/:name` rule |
| `src/agent/instructions.ts:48-53` | Prompt line |
| `src/constants/pricing.ts`; `src/components/dashboard/subscription/PlanFeatures.tsx` | Feature rows |
| Docs and skills | §15.2 |

**Phase 2:** `src/lib/qr/design.ts`, `src/constants/schemas.ts` (`qrConfigSchema` placement), QR editor components, `SuccessModal.tsx`, `ItemDropdownMenu.tsx`, and the `EmbeddingBlock` and `CustomCode` edit-mode warning.

---

## Appendix C. Sources (external, fetched or confirmed 2026-10-01 unless noted)

**Google Analytics and tags**
- GA4 recommended events reference, updated 2026-09-16: https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag
- Lead acquisition report: https://support.google.com/analytics/answer/16376749; recommended events (lead generation): https://support.google.com/analytics/answer/9267735
- Ecommerce purchases report ("Items viewed"): https://support.google.com/analytics/answer/12924131; ecommerce metrics: https://support.google.com/analytics/answer/13428834
- Measurement ID location and format: https://support.google.com/analytics/answer/12270356
- Universal Analytics end of processing: https://support.google.com/analytics/answer/9355666
- Default channel group: https://support.google.com/analytics/answer/9756891; custom channel groups: https://support.google.com/analytics/answer/13051316
- Link GA4 and Google Ads: https://support.google.com/analytics/answer/9379420; Ads conversions from GA4 key events: https://support.google.com/analytics/answer/10632359
- Google Ads conversion categories: https://support.google.com/google-ads/answer/9791434
- Consent for ads measurement (`ad_user_data`): https://support.google.com/analytics/answer/14275483
- DebugView: https://support.google.com/analytics/answer/7201382; GA4 limits: https://support.google.com/analytics/answer/9267744; UTMs: https://support.google.com/analytics/answer/10917952; EU data collection: https://support.google.com/analytics/answer/12017362
- Consent mode setup: https://developers.google.com/tag-platform/security/guides/consent; data layer rename: https://developers.google.com/tag-platform/devguides/datalayer; privacy controls (`ga-disable`): https://developers.google.com/tag-platform/security/guides/privacy; CSP: https://developers.google.com/tag-platform/security/guides/csp; CMS integration guide: https://developers.google.com/tag-platform/devguides/gtag-integration; Ads conversions: https://developers.google.com/tag-platform/devguides/conversions; configure (tag ID prefixes): https://developers.google.com/tag-platform/gtagjs/configure; restrict deployment: https://developers.google.com/tag-platform/tag-manager/restrict
- Container-ID restriction: https://support.google.com/tagmanager/answer/17070049; release notes (2026-07-09): https://support.google.com/tagmanager/answer/4620708; Google tag upgrade (2026-08-20): https://support.google.com/tagmanager/answer/17079602
- EU user consent policy: https://www.google.com/about/company/user-consent-policy/

**Other vendors**
- Meta Pixel reference (standard events): https://developers.facebook.com/docs/meta-pixel/reference; advanced (autoConfig): https://developers.facebook.com/documentation/meta-pixel/advanced.md; Controller Addendum: https://www.facebook.com/legal/controller_addendum
- PostHog cookieless tracking: https://posthog.com/tutorials/cookieless-tracking
- Clerk cookies: https://clerk.com/docs/guides/how-clerk-works/overview
- WebKit ITP: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- Next.js headers: https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers

**Market data (via prior notes, not re-fetched)**
- BrightLocal SMB marketing 2025: https://www.brightlocal.com/research/smb-marketing-2025/
- WhatsApp Business / Kantar: https://whatsappbusiness.com/resources/resource-library/state-of-business-messaging/
- Infobip messaging apps by country: https://www.infobip.com/blog/most-popular-messaging-apps-by-country
- Didomi consent benchmarks (vendor data): https://www.didomi.io/blog/benchmark-average-consent-rate-europe

**(snippet)** The GA4 "Generate leads" business-objective location comes from search excerpts only (for example https://www.lovesdata.com/blog/google-analytics-lead-reports/).
