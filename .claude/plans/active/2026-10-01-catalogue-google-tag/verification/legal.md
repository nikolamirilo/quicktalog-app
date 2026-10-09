# Legal verification: claims L1-L7 (catalogue Google tag design)

Date: 2026-10-01. Scope: the seven legal claims in `../designs/synthesis.md` (lines 1799-1805, used in §5 and §7). Method: primary texts downloaded and read in full where possible (EUR-Lex via Firecrawl, EDPB/CNIL/AEPD/DSK PDFs via curl + text extraction, vendor pages via curl). Working copies are in the session scratchpad (`legal/`). Repo code was read on branch `test` (working tree), read-only.

Labels: **Fact** = quoted from the cited source. **Inference** = my reading. "(snippet)" = seen only in a search-result excerpt.

## Verdict summary

| Claim | Verdict | One-line correction |
|---|---|---|
| L1 GA4 needs opt-in; basic mode is the default | **partially** | The conclusion holds, but EDPB 2/2023 only settles that GA4 is *inside* Art. 5(3). It says expressly that it does not decide when consent is needed (paras 4, 56). Consent follows from Art. 5(3) plus each Member State's reading of the "strictly necessary" exemption, and those readings differ. |
| L2 Equal-prominence reject on layer 1; "Accept & close ×" invalid | **partially** | Taskforce para 08 requires *a* reject on the layer that has the accept button. It does not require equal prominence, and para 17 refuses to set any colour or contrast standard. CNIL, the DSK, the AEPD and the Garante each differ. The VG Hannover part is confirmed, but it does not support "no close control": the Garante's model *is* a close "×" that means reject. |
| L3 Storing the choice is exempt | **confirmed** | Small nuance: the WP29 and the ICO tie persistent preference storage to clear information. Sending the record's id to a server is a separate act these sources do not cover. |
| L4 Consent must name each controller, so consent is per catalogue | **confirmed** | The naming duty comes from "informed" (Recital 42; EDPB 05/2020 paras 64(i), 65, 68), not from "specific". The law does not require one consent per catalogue, but in practice a visitor cannot consent to businesses they were never shown. |
| L5 Google requires consent records; EDPB para 108 | **confirmed** | Both quotes are accurate. Google's FAQ goes further: "date and time" per consent. The GDPR itself prescribes no method, and the CNIL's proof methods work at the level of the mechanism, so the per-event log rests mainly on Google's terms. |
| L6 Loading GTM itself needs consent (VG Hannover) | **partially** | Headnote 4 says exactly this, but it comes from a first-instance German court applying § 25 TTDSG to a publisher whose GTM loaded more than 100 ad vendors. It is not an EU-wide rule. Whether the judgment is final was not verified. |
| L7 Quicktalog is the Art. 28 processor; the Terms lack processing terms | **confirmed** | This holds only while Quicktalog has no purpose of its own for those data. Quicktalog also fixes essential means (lifetimes, retention), which must be described to the owner and accepted by them. The gap already exists today, because the newsletter sign-ups are collected for owners. |

---

## L1. GA4 needs prior opt-in for EU/EEA visitors; basic consent mode is the defensible default

**Verdict: partially.** The design decision (basic mode, no Google request before Accept) is well supported. The legal premise is attributed too strongly to EDPB 2/2023 and stated more uniformly than national law is.

### Facts
- **ePrivacy Directive Art. 5(3)** (consolidated 2009 text): "Member States shall ensure that the storing of information, or the gaining of access to information already stored, in the terminal equipment of a subscriber or user is only allowed on condition that the subscriber or user concerned has given his or her consent, having been provided with clear and comprehensive information … This shall not prevent any technical storage or access for the sole purpose of carrying out the transmission of a communication over an electronic communications network, or as strictly necessary in order for the provider of an information society service explicitly requested by the subscriber or user to provide the service." Art. 2(f): consent "corresponds to the data subject's consent in Directive 95/46/EC" (now the GDPR). [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219)
- **Planet49, C-673/17**, operative part:
  - Pt 1: consent "is not validly constituted if … permitted by way of a pre-checked checkbox which the user must deselect to refuse his or her consent".
  - Pt 2: Art. 5(3) is "not to be interpreted differently according to whether or not the information stored or accessed … is personal data".
  - [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0673)
- **EDPB Guidelines 2/2023 v2.0** (adopted 7 Oct 2024) [PDF](https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf):
  - Para 33 (not cited by the claim, but the most on point): "Additional examples would include JavaScript code, where the accessing entity instructs the browser of the user to send asynchronous requests with the targeted information. Such access clearly falls within the scope of Article 5(3) ePD".
  - Para 50: distributing tracking pixels "does constitute storage, at the very least through the caching mechanism … even if this storage is not permanent."
  - Para 51: "In the case of dynamically constructed tracking pixels, it is the distribution of the applicative logic (usually a JavaScript code) that constitutes the instruction … the collection of identifiers provided through such tracking mechanisms constitutes a 'gaining of access'".
  - Para 52 is about local processing. Para 53: information "sent back over the network to a server … would constitute a 'gaining of access to information already stored'".
  - Para 63: "the entity collecting is instructing the browser (through the distribution of client-side code) to send that information. As such a 'gaining of access' is taking place and Article 5(3) ePD applies."
  - **Limits stated in the guidelines themselves.**
    - Para 4: they "do not address the circumstances under which a processing operation may fall within the exemptions from the consent requirement … these circumstances should be analysed on a case-by-case basis accounting for the relevant member state transposition(s), and guidance issued by national Competent Authorities."
    - Para 56: "the applicability of this article does not systematically mean that consent needs to be collected."
- **WP29 Opinion 04/2012**: first-party analytics are "not strictly necessary" (quoted in `../research/consent.md` §2.6; the source is the [WP194 PDF](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf)).
- **Google's own definition of the two modes** ([Google, updated 2026-07-30](https://developers.google.com/tag-platform/security/concepts/consent-mode)):
  - Basic: "you prevent Google tags from loading until a user interacts with a consent banner. This setup transmits no data to Google prior to user interaction … when the user doesn't consent, no data is transferred to Google at all – not even the consent status."
  - Advanced: "Google tags load when a user opens the website … While consent is denied, the Google tags send measurements without cookies."
- **Germany, DSK OH Digitale Dienste v1.2 (Nov 2024), para 121** ([PDF](https://www.datenschutzkonferenz-online.de/media/oh/OH_Digitale_Dienste.pdf)): while the banner is shown, "werden zunächst keine weitergehenden Skripte einer Webseite … die potenziell auf die Endgeräte der Nutzenden zugreifen … und insbesondere auch keine Inhalte von fremden Servern geladen, soweit eine Einwilligung hierfür erforderlich ist." Para 122: storage and reading may happen only after an active consent action.
- **Serbia, ZEK ("Sl. glasnik RS" 35/2023) Art. 160 st. 4**: "Korišćenje elektronskih komunikacionih mreža i usluga radi čuvanja ili pristupanja podacima pohranjenim u terminalnoj opremi krajnjeg korisnika, dozvoljeno je pod uslovom da je krajnji korisnik dao svoj pristanak, nakon što mu je dato jasno i potpuno obaveštenje o svrsi prikupljanja i obrade podataka, u skladu sa zakonom kojim se uređuje zaštita podataka o ličnosti, kao i da mu je pružena prilika da takvu obradu odbije." St. 5 exempts storage or access solely to ensure communication or to provide services the end user expressly requested.
  - Source: [Paragraf](https://www.paragraf.rs/propisi/zakon-o-elektronskim-komunikacijama.html), fetched fresh today. The official portal record ([PIS](https://www.pravno-informacioni-sistem.rs/SlGlasnikPortal/eli/rep/sgrs/skupstina/zakon/2023/35/1/reg)) confirms publication in Sl. glasnik 35/2023 and entry into force on 7 May 2023, but its full text was too long to extract.
  - In Paragraf's text "160" appears only at the article itself, so no penal provision cross-references Art. 160.
- **Serbian Commissioner (Poverenik).**
  - Publication No. 6 (2024), "Stavovi i mišljenja Poverenika", contains no cookie guidance.
  - Its only Google Analytics item (case 073-14-2369/2019-02, 15 Jan 2020, pp. 48-49) holds that an IP address in a GA context is personal data "уколико је преко 'IP' адресе могуће доћи до идентитета одређеног физичког лица".
  - [PDF](https://poverenik.rs/h-content/uploads/2024/02/6PublikacijaZZPL-poverenik.pdf)

### Inferences
- GA4's gtag.js sets `_ga` cookies and builds requests in JavaScript that carry a client id. That falls within Art. 5(3) on any reading (2/2023 paras 33, 51, 53, 63). No national exemption covers *advertising* features. For plain GA4 statistics, the outcome depends on the state:
  - **France:** exempt only if the tool meets CNIL Délibération 2020-091 para 51: measurement "pour le compte exclusif de l'éditeur", "données statistiques anonymes" only, data not "transmises à des tiers" ([PDF](https://www.cnil.fr/sites/cnil/files/atoms/files/lignes_directrices_de_la_cnil_sur_les_cookies_et_autres_traceurs.pdf)). I found no CNIL statement that a default GA4 set-up qualifies. The CNIL GA page is about transfers and proxies only ([CNIL](https://www.cnil.fr/fr/mesure-daudience-et-transferts-de-donnees-comment-mettre-son-outil-de-mesure-daudience-en-conformite)).
  - **Netherlands:** low-impact analytics may be exempt (Dutch AP cookie page, cited (snippet) in `../research/consent.md` §2.5, not re-verified).
  - **UK (not EEA):** the PECR statistical-purposes exception may apply ([ICO](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)).
  - **Germany:** strict (TDDDG § 25; DSK paras 121-122).
  - **Serbia:** statutory consent (ZEK 160(4)).
- So "GA4 needs prior opt-in consent" is the correct *uniform* rule for a platform, but strictly it is not true in every EEA state for every configuration.
- Basic mode is the defensible default. Advanced mode loads gtag.js and sends cookieless pings (user agent, timestamp, a random number, and the IP in transit) before any choice. That is JavaScript-instructed sending of device information (2/2023 paras 33, 51, 53, 55), and the DSK (para 121) and VG Hannover (see L6) treat this kind of pre-consent loading as unlawful in Germany. No authority I checked endorses advanced mode before consent.
- **"Show the notice to every visitor."** This is a product simplification, because ISR pages cannot vary by geography. It is not a legal requirement everywhere: Swiss and US law were not checked, and outside the EEA, the UK, Switzerland and Serbia an opt-in notice is generally not required. Google's EU User Consent Policy itself covers only the EEA, the UK and Switzerland (see L5).

### Correction
Cite Art. 5(3) plus Planet49 for the opt-in rule, and EDPB 2/2023 paras 33, 51, 53 and 63 only for *scope*. Add that the exemption question is national (2/2023 paras 4, 56), and that GA4 meets no exemption reliably across the EEA. That is why opt-in is used everywhere. Add DSK para 121 and Google's basic-mode definition as direct support for "no Google script before Accept".

---

## L2. Equal-prominence reject on the first layer; "Accept & close ×" is not valid consent

**Verdict: partially.** "A reject on the first layer when that layer has an accept button" is supported by the Taskforce majority, the CNIL (strong recommendation) and the AEPD (requirement). "Same prominence is required" overstates the EDPB and the CNIL and contradicts the DSK. The VG Hannover holding is quoted correctly, but the design reads it too broadly (see below).

### Facts
- **EDPB Cookie Banner Taskforce report (17 Jan 2023)** ([PDF](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)):
  - Disclaimer: the positions "reflect the common denominator agreed by the SAs" and a "minimum threshold", and "do not constitute stand-alone recommendations".
  - Para 08: "a vast majority of authorities considered that the absence of refuse/reject/not consent options on any layer with a consent button of the cookie consent banner is not in line with the requirements for a valid consent and thus constitutes an infringement. Few authorities considered that they cannot retain an infringement in this case as article 5(3) … does not explicitly mentioned a 'reject option'."
  - Para 14: a reject *link* embedded in text "in the absence of sufficient visual support" is not valid.
  - Para 17: "a general banner standard concerning colour and/or contrast cannot be imposed on data controllers … a case-by-case verification must be carried out".
  - Para 18: the only practice named as manifestly misleading is a reject button whose text contrast is "so minimal that the text is unreadable to virtually any user".
- **CNIL FAQ (page dated 29 Apr 2026)** ([CNIL](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ)):
  - Q37, "L'intégration d'un bouton « tout refuser » au même niveau et dans les mêmes formes que le bouton « tout accepter » est-elle obligatoire ?" Answer: "Oui, ou à défaut une autre solution permettant de refuser aussi aisément qu'accepter devra être présentée à l'internaute … le refus doit pouvoir, soit se déduire du silence de l'internaute, soit se manifester par une action aussi simple que celle permettant d'accepter."
  - Q38: the CNIL "recommande fortement" that refusal be "accessible sur le même écran et avec la même facilité".
  - Q39: "Le design des interfaces de recueil des choix est laissé à l'appréciation de l'éditeur sous réserve de ne pas chercher à tromper l'utilisateur ou à rendre plus complexe le fait de refuser".
- **CNIL Recommendation 2020-092** ([PDF](https://www.cnil.fr/sites/cnil/files/atoms/files/recommandation-cookies-et-autres-traceurs.pdf)):
  - Para 32: two buttons "au même niveau et sur le même format" are "un moyen simple et clair".
  - Para 33: refusal may be expressed "par la simple fermeture de la fenêtre de recueil du consentement" if this "doit être clairement indiquée aux utilisateurs".
- **Germany, DSK OH Digitale Dienste v1.2** ([PDF](https://www.datenschutzkonferenz-online.de/media/oh/OH_Digitale_Dienste.pdf)):
  - Para 124: "Eine Ablehnfunktion auf erster Ebene ist aus Sicht der Aufsichtsbehörden nicht generell erforderlich, sondern nur dann, wenn Nutzer:innen mit dem Einwilligungsbanner interagieren müssen, um den Besuch der Webseite fortzusetzen. Sofern durch das Banner keine Webseitenbereiche versperrt und die Inhalte zugänglich sind … kann eine Ablehnmöglichkeit auf erster Ebene entbehrlich sein."
  - Para 127: "Es gibt keinen allgemeinen Standard für die Gestaltung von Einwilligungsbannern in Bezug auf Farbe, Größe oder Kontraste".
  - Para 130: a different colour alone "muss nicht zwangsläufig" defeat voluntariness.
- **Spain, AEPD "Guía sobre el uso de las cookies" (May 2024)** ([PDF](https://www.aepd.es/guias/guia-cookies.pdf)):
  - "La opción para rechazar las cookies deberá ofrecerse en la misma capa y al mismo nivel que la opción para aceptarlas y el mecanismo empleado al efecto (botón u otro) deberá ser similar."
  - Elsewhere: "al mismo tiempo, al mismo nivel y con la misma visibilidad que la de aceptarlas".
- **Italy, Garante, Guidelines of 10 June 2021** ([Garante](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876), English text on the page):
  - A user who wants to keep the defaults "should therefore simply close the banner by clicking on … the 'X' … The command in question will have to be as visible as any other commands".
  - "the banner … shall contain, in addition to the 'X' at its top right end … (i) A warning to the effect that if the banner is closed by clicking on the 'X' … the default settings are left unchanged".
  - The Garante presents this as a suggested approach: "a controller is free to implement such arrangements as are considered most suited".
- **VG Hannover, 19 Mar 2025, 10 A 5385/22**, official headnotes ([voris](https://voris.wolterskluwer-online.de/browse/document/230df5cf-d76c-4561-9499-e44445a96f11)):
  - Headnote 2: a first layer with only "Alle akzeptieren", "Akzeptieren & schließen x" and "Einstellungen" "lenkt die Nutzer … gezielt zur Abgabe der Einwilligung hin".
  - Headnote 3: "Die Gestaltung eines Cookie-Einwilligungsbanners mit dem Button 'Akzeptieren & schließen x' in der rechten oberen Ecke führt zur Unwirksamkeit der Einwilligung, weil es sich weder um eine unmissverständlich abgegebene noch um eine freiwillige Erklärung … handelt."

### Inferences
- **Law vs best practice.** No EU-level source requires *equal prominence*. The common legal core is:
  - refusing must be as easy as accepting (CNIL 2020-091 para 30; GDPR Art. 4(11) "freely given"; Art. 7(3) for withdrawal);
  - refusal must not be hidden or unreadable (Taskforce paras 14, 18; DSK para 131).
- **Which states demand what.** Spain demands the same level and visibility. Italy demands an "X" that is equally visible. France treats same-level, same-format buttons as the safe model. Germany does not require a first-layer reject for a banner that blocks nothing, and the design's non-modal sheet blocks nothing.
- **The design still stands.** Equal Reject and Accept buttons is the one layout that satisfies every authority checked, so keep it. Just do not present it as an EU-wide legal requirement.
- **"No × close" is not supported by VG Hannover.** The court objected to a close control that *accepts*.
  - A "×" that means "continue without accepting" is the Garante's model, and the CNIL permits it if the banner says so (Reco para 33).
  - The design's "ignoring is refusal" behaviour already matches CNIL Q19 and Reco para 33.
  - Whether to add a "×" is a product choice. If added, it must reject, it must be labelled so, and it must be as visible as the buttons (Garante).

### Correction
Replace "required (EDPB TF para 08; CNIL Q37-38)" with: "A reject on the same layer as accept is expected by most EU authorities (Taskforce para 08) and required in Spain (AEPD). Equal visual weight is the CNIL's safe model, and the Garante requires an equally visible reject-'×'. Germany (DSK para 124) does not strictly require a first-layer reject when the banner blocks nothing. Equal buttons satisfy all of them." Keep the VG Hannover citation only for "a close control must never mean accept".

---

## L3. Storing the visitor's consent choice is strictly necessary and needs no consent

**Verdict: confirmed** (with a duration/information nuance, and a separate issue about the server log; see "Other issues" #3).

### Facts
- **Taskforce para 30**: "The opinion n°04/2012 on Cookie Consent Exemption of WP 29 has also been recalled … in particular the fact that cookies allowing website owners to retain the preferences expressed by users, regarding a service, should be deemed essential." ([PDF](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf))
- **CNIL Délibération 2020-091, "Articles 5 – Sur les traceurs exemptés de consentement", para 49**: the first exempt item is "les traceurs conservant le choix exprimé par les utilisateurs sur le dépôt de traceurs". ([PDF](https://www.cnil.fr/sites/cnil/files/atoms/files/lignes_directrices_de_la_cnil_sur_les_cookies_et_autres_traceurs.pdf)) The citation "art. 5" is correct; the precise pinpoint is para 49.
- **CNIL FAQ Q21**: "il est nécessaire de conserver les choix exprimés par l'utilisateur, qu'il s'agisse de son consentement ou de son refus … une conservation des choix pendant une durée de 6 mois constitue une bonne pratique."
- **WP29 04/2012 §3.6** ("UI customization cookies"): without additional information "only session (or short term) cookies storing such information are exempted"; prominent information "would constitute sufficient information for valid consent to remember the user's preference for a longer duration". ([WP194](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf))
- **ICO (UK)**: "cookies used as part of a cookie consent mechanism, which remember the user's cookie preferences over a period of time (eg 90 days), can be exempt", but "the user must be given sufficient information in a prominent location." ([ICO](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/))
- **Garante**: the banner should not be shown again until, among other conditions, "at least six months have elapsed since the banner was last presented" ([Garante](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876)).

### Inferences
- **localStorage is covered too.** Art. 5(3) is technology-neutral, so the exemption covers a `localStorage` record just as it covers a cookie.
- **The 6-month record is compatible with every source.** The notice already says "Your choice: kept on this device for 6 months" (`../designs/synthesis.md:954`), which supplies the "prominent information" the WP29 and the ICO ask for.
- **Serbia.** ZEK Art. 160 st. 5 exempts storage needed to provide a service the user "izričito zatražio" (expressly requested). A consent record fits that by analogy. There is no Serbian guidance on it (inference).
- **The server log is a separate question.** None of these sources speak to *reading the record's random id and sending it to a server* (the design's §5.6 log). That act is a "gaining of access" (2/2023 paras 53, 63). It is arguably part of the consent mechanism (the ICO's wording), but the exemption should not be assumed to cover logging *refusals* with a device id. See "Other issues" #3.

---

## L4. Consent must be specific to, and name, each controller, so each catalogue needs its own consent naming the business

**Verdict: confirmed.** The citation is slightly mis-attributed (the naming duty comes from "informed", not "specific"), and the "per catalogue" step is a practical consequence rather than a legal mandate.

### Facts
- **GDPR Art. 4(11)**: consent is "any freely given, specific, informed and unambiguous indication of the data subject's wishes by which he or she, by a statement or by a clear affirmative action, signifies agreement". **Recital 42**: "For consent to be informed, the data subject should be aware at least of the identity of the controller and the purposes of the processing". ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679))
- **EDPB 05/2020** ([PDF](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf)), section 3.3.1 "Minimum content requirements for consent to be 'informed'":
  - Para 64: "at least the following information is required for obtaining valid consent: i. the controller's identity …"
  - Para 65: "in a case where the consent sought is to be relied upon by multiple (joint) controllers or if the data is to be transferred to or processed by other controllers who wish to rely on the original consent, these organisations should all be named. Processors do not need to be named as part of the consent requirements, although to comply with Articles 13 and 14 … controllers will need to provide a full list of recipients or categories of recipients including processors."
  - Para 68: information must allow data subjects "to easily identify who the controller is".
  - "Specific" is treated separately, in paras 55-61, as purpose granularity.
- **CNIL FAQ**:
  - Q25: the user must be offered "la liste exhaustive des responsables du traitement".
  - Q26: users must know "l'identité de l'ensemble des responsables du ou des traitements, y compris des responsables conjoints".
  - Q35: one consent may cover several domains only where "l'utilisateur perçoit l'ensemble commun un seul site"; multi-property consent is still under study.
- **ZZPL** Art. 4 t. 12 mirrors Art. 4(11) ("dobrovoljno, određeno, informisano i nedvosmisleno izražavanje volje") ([Paragraf](https://www.paragraf.rs/propisi/zakon_o_zastiti_podataka_o_licnosti.html)).

### Inferences
- Bistro A's consent names Bistro A. Salon B cannot rely on it (para 65), and the visitor was never told about Salon B. One shared consent naming hundreds of businesses would be lawful in theory but useless in practice. So a per-catalogue record keyed by the immutable catalogue id is the right design.
- CNIL Q35 covers one publisher on many domains. Quicktalog is the reverse case, many publishers on one domain, so it points the same way (inference).
- **Google need not be named for validity.** GA4 runs with Google as the business's processor ("on behalf of" (snippet), [Google](https://support.google.com/analytics/answer/6004245)), so naming Google is not needed for consent validity (para 65). It is still required by Google's EUUCP ("clearly identify each party", see L5) and by Art. 13. The design names Google, which is correct.

### Correction
Cite "informed" (Art. 4(11) with Recital 42; EDPB 05/2020 paras 64(i), 65, 68) for naming the controller. Describe per-catalogue storage as the practical consequence, not a separate legal rule.

---

## L5. Google's EU User Consent Policy requires retained records of consent; EDPB 05/2020 para 108 says configuration alone is not sufficient proof

**Verdict: confirmed.** Both quoted statements are accurate. The design's step from these to "a server-side log is a GA gate" rests on Google's contractual minimum more than on the GDPR.

### Facts
- **Google EU user consent policy** (English, fetched today, [Google](https://www.google.com/about/company/user-consent-policy/)):
  - "For Google products used on any site, app or other property that is under your control, or that of your affiliate or your client, the following duties apply for end users in the European Economic Area, the UK and Switzerland. You must obtain end users' legally valid consent to: the use of cookies or other local storage where legally required; and the collection, sharing, and use of personal data for personalization of ads. When seeking consent you must: retain records of consent given by end users; and provide end users with clear instructions for revocation of consent. You must clearly identify each party that may collect, receive, or use end users' personal data as a consequence of your use of a Google product."
- **Google's EUUCP help page** ([Google](https://www.google.com/about/company/user-consent-policy-help/)):
  - "What records do I need to keep? Our policy requires that customers retain records of consent. At a minimum, these should include the text and choices presented to users as part of a consent mechanism and a record of the date and time of the user's affirmative consent."
  - On scope: the policy is incorporated in "Google's ads and measurement products" among others.
- **Google Analytics Terms (US, "Last Updated May 15, 2023") §7**: they do not name the EUUCP. They do require compliance with "all applicable Google Analytics policies", "commercially reasonable efforts to ensure that a User is provided with clear and comprehensive information about, and consents to, the storing and accessing of cookies … where … required by law", and a privacy policy that discloses GA with a link to "How Google uses information from sites or apps that use our services". ([Google](https://marketingplatform.google.com/about/analytics/terms/us/)) That link resolves to `https://policies.google.com/technologies/partner-sites`, title verified today, which settles the open item at `../designs/synthesis.md:959`.
- **EDPB 05/2020 para 108** (verbatim): "For example, in an online context, a controller could retain information on the session in which consent was expressed, together with documentation of the consent workflow at the time of the session, and a copy of the information that was presented to the data subject at that time. It would not be sufficient to merely refer to a correct configuration of the respective website."
  - Para 106: "Controllers are free to develop methods to comply … the duty to demonstrate … should not in itself lead to excessive amounts of additional data processing."
  - Para 107: "The GDPR does not prescribe exactly how this must be done. However, the controller must be able to prove that a data subject in a given case has consented."
- **GDPR Art. 7(1)**: "Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented". ZZPL Art. 15 st. 1 is the same in Serbian law.
- **CNIL Recommendation 2020-092**:
  - Para 47: a contractual clause alone is not enough. The party collecting consent should "mettre à disposition des autres parties la preuve du consentement".
  - Para 48 lists non-exclusive proof methods, all at the level of the mechanism: escrow or a timestamped hash of each code version, a timestamped screenshot "pour chaque version du site", third-party audits, and timestamped CMP configuration history.
- **Microsoft Clarity Terms §4.4(d)** impose the same duty on Clarity users: "for individuals in the European Union, you must obtain consent for your use of cookies or other local storage, retain records of consent, and provide individuals with a clear means to revoke consent." ([Microsoft](https://clarity.microsoft.com/terms))

### Inferences
- **Who carries the duties.** The duty to keep records falls on the business, which is the Google customer and the controller. Quicktalog, as processor, must "make available to the controller all information necessary to demonstrate compliance" (GDPR Art. 28(3)(h)). Without a log the business has nothing: the only per-visitor record sits on the visitor's device.
- **What the GDPR needs vs what Google needs.** The GDPR alone could be met with documentation at the level of the mechanism (CNIL para 48: versioned notice texts and code hashes plus screenshots), combined with per-session evidence. Google's FAQ minimum ("date and time of the user's affirmative consent") is per consent. So the per-event log is justified mainly by Google's contract.
- **What to log.** The log should record *consents*, versioned against the exact notice text shown. Recording refusals is not required by Art. 7(1) or by the EUUCP (see Other issues #3).
- **Territory.** The EUUCP covers only the EEA, the UK and Switzerland. Serbian visitors fall under ZZPL Art. 15 instead.

---

## L6. Loading Google Tag Manager itself requires consent (VG Hannover, 19 Mar 2025, 10 A 5385/22)

**Verdict: partially.** The quotation is accurate. As a statement of law it is one German first-instance court on specific facts. Quicktalog's decision to switch its GTM and Clarity off catalogue pages does not depend on it.

### Facts
- **Headnote 4**: "Der Einsatz des Dienstes Google Tag Manager bedarf einer Einwilligung nach § 25 Abs. 1 TTDSG und Art. 6 Abs. 1 lit. a DSGVO." The operative part reads "Die Klage wird abgewiesen", which upheld the order of the Lower Saxony DPA. ([voris](https://voris.wolterskluwer-online.de/browse/document/230df5cf-d76c-4561-9499-e44445a96f11))
- **The reasoning is based on the facts of the case.**
  - The DPA's lab showed that before any banner interaction "die IP-Adresse und Gerätedaten - an den US-Server www.googletagmanager.com übermittelt und ein Java-Skript namens gtm.js auf dem Endgerät des Nutzers gespeichert wird, welches die Google Tag Manager-ID der Klägerin enthält und Informationen der Nutzer ausliest".
  - No § 25(2) exemption applied, because loading "Tracking-Codes und Skripte insbesondere von Werbedienstleistern" is not a service the user requested.
  - GTM was not needed to collect consent, since the publisher used a separate CMP.
  - Art. 6(1)(f) failed.
  - The site had "über hundert Drittdienstleister".
- **Court and finality.** This is a Verwaltungsgericht (first instance) applying the TTDSG, now renamed the TDDDG. The judgment text says nothing on finality, and a search found no appeal information. Status: **not verified**.

### Inferences
- **Not an EU-wide rule.** Other national authorities' positions on GTM were not checked. EDPB 2/2023 paras 33 and 50-51 make a similar result likely wherever a Google-hosted script is loaded before consent, but the exemption analysis remains national (para 4).
- **The design's choice does not depend on this ruling.** The other reasons for switching Quicktalog's GTM off published catalogues (`../designs/synthesis.md:1107`) stand on their own: consent bleed across data layers, client-id collision, and a remotely editable script channel.
- **Clarity has stronger, vendor-sourced reasons to go off:**
  - Clarity "automatically interprets and honors GCM consent signals, such as ad_storage and analytics_storage" ([Microsoft, updated 2025-09-22](https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-gcm)), so a tenant's Accept would switch Quicktalog's Clarity on.
  - Without consent it still runs in "no-consent mode (with limited tracking)" with "a unique ID per page view" ([Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)). That is still JavaScript-instructed collection under 2/2023.
  - Under the Clarity Terms §4.4(c), "You and Microsoft are independent Controllers" and Microsoft "may use the Personal Data it collects … for any purpose … including … create user profiles for purposes that include advertising" ([Microsoft](https://clarity.microsoft.com/terms)).
  - Enforcement of consent signals for the EEA, UK and CH began on 31 Oct 2025 (same pages).

### Correction
Say "A German administrative court (VG Hannover, 19 Mar 2025, first instance; finality unverified) held that loading GTM requires consent under § 25 TTDSG. EDPB 2/2023 reasoning points the same way elsewhere." In §7, lead the Clarity row with the vendor facts: it honors GCM, and Microsoft acts as independent controller with advertising use.

---

## L7. Quicktalog is each business's Art. 28 processor for rendering tags, the notice and the consent log; the Terms lack processing terms

**Verdict: confirmed.** This holds as long as Quicktalog uses no tenant tag data or consent data for itself.

### Facts
- **GDPR** ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679)):
  - Art. 4(8): "'processor' means a natural or legal person … which processes personal data on behalf of the controller".
  - Art. 28(3): "Processing by a processor shall be governed by a contract or other legal act … that sets out the subject-matter and duration of the processing, the nature and purpose of the processing, the type of personal data and categories of data subjects and the obligations and rights of the controller", with mandatory terms (a)-(h).
  - Art. 28(9): it must be "in writing, including in electronic form".
  - Art. 28(10): a processor that determines purposes and means "shall be considered to be a controller in respect of that processing".
- **EDPB 07/2020 v2.1** ([PDF](https://www.edpb.europa.eu/system/files/2023-10/EDPB_guidelines_202007_controllerprocessor_final_en.pdf)):
  - Para 30, standardised cloud example: a take-it-or-leave-it service provider is a processor "Insofar as [it] does not process the personal data for its own purposes". The controller "has to be presented with a detailed description of the service and must make the final decision to actively approve the way the processing is carried out".
  - Para 40: "'Essential means' … such as the type of personal data …, the duration of the processing …, the categories of recipients … are to be determined by the controller."
  - Paras 65, 67 and footnote 29: a platform provider "can be a joint controller if … the provider participates in the determination of purposes and means. Otherwise, the provider should be considered as a processor."
  - Para 68: no joint controllership "where the provider is a processor in the absence of any purpose of its own".
  - Para 81: a processor "may not carry out processing for its own purpose(s)".
  - Para 103: "the absence thereof [of the written contract] is an infringement of the GDPR. Both the controller and processor are responsible".
  - Para 110: a processor may draft the terms, but changes need the controller's approval, and "mere publication of these modifications on the processor's website is not compliant with Article 28."
- **CNIL Délibération 2020-091 para 40**: "un acteur qui stocke et/ou accède à des informations stockées dans l'équipement terminal d'un utilisateur exclusivement pour le compte d'un tiers doit être considéré comme sous-traitant … le responsable de traitement et le sous-traitant doivent établir un contrat … dans le respect des dispositions de l'article 28 du RGPD." Para 34: the publisher who places trackers is controller "y compris lorsqu'il sous-traite à des tiers la gestion de ces traceurs".
- **Fashion ID, C-40/17**, operative pt 2: a site operator embedding a third-party tool "can be considered to be a controller", limited to "the collection and disclosure by transmission". Pt 4: that operator must obtain consent and inform for those operations. ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0040))
- **IAB Europe, C-604/22**, operative pt 1: a consent-preference string "constitutes personal data … in so far as … those data may, by reasonable means, be associated with an identifier, such as … the IP address". ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62022CJ0604))
- **Serbia, ZZPL**:
  - Art. 4 t. 9: "'obrađivač' … koji obrađuje podatke o ličnosti u ime rukovaoca".
  - Art. 45 st. 3: "Obrada od strane obrađivača mora biti uređena ugovorom ili drugim pravno obavezujućim aktom, koji je zaključen, odnosno usvojen u pismenom obliku, što obuhvata i elektronski oblik".
  - [Paragraf](https://www.paragraf.rs/propisi/zakon_o_zastiti_podataka_o_licnosti.html)
- **Repo (branch `test`)**:
  - The Terms contain no processor, personal-data, GDPR or controller wording. The only data reference is third-party providers "for hosting, authentication, data storage, payment processing" (`src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:409-421`). The governing law and courts are still placeholders: `[JURISDICTION]` and `[CITY / COUNTRY]` (`:503-515`, with a TODO at `:506`).
  - The privacy policy mentions only generic "Service Providers … who perform services on our behalf" (`src/app/(site)/(with-footer)/privacy-policy/page.tsx:101-107`). It has no controller, processor or catalogue-visitor wording (section titles at `:14-239`).
  - No DPA exists anywhere in `src/` (grep for "data processing agreement/addendum/terms" and "sub-processor" found nothing).
  - Catalogue visitors' e-mails are already collected for owners: `src/components/catalogue/view/CatalogueFooter.tsx:39-63` calls `newsletterSignup(newsletterEmail, activeData?.id)` at `:48`.

### Inferences
- **Why the processor framing holds.** The business decides to measure and supplies its own ID, so it is the controller (Fashion ID pt 2; CNIL para 34).
  - Quicktalog serves the tag and the notice, and stores consent events, solely to carry out that decision. That is the processor role (Art. 4(8); EDPB 07/2020 para 30; CNIL para 40).
  - The consent log is personal data: a persistent random device id, arriving with an IP in transit, fits IAB Europe pt 1. So the processor role is not theoretical.
- **The condition.** Processor status ends the moment Quicktalog uses tenant GA settings, consent events or consent rates for its own ends (Art. 28(10); EDPB paras 68, 81). Examples would be product analytics, benchmarking across tenants, or marketing. The design's Phase 2 owner statistic ("64% allowed statistics") is fine because it is shown to that owner only.
- **Quicktalog fixes essential means, so the owner must see and approve them.** These are the 13-month cookie lifetime, 6-month choice lifetime, Google as the only recipient, and log retention "set by counsel" (`../designs/synthesis.md:1069`, `:1082`). EDPB para 40 reserves essential means to the controller. Para 30 allows a standard offering only if the controller is "presented with a detailed description" and approves it. So:
  - the settings card and the DPA must state these values;
  - any later change must be notified to owners and approved by them, not merely published (para 110).
- **The joint-controller risk is real elsewhere on the same pages.** Quicktalog's own PostHog metering and owner dashboards on catalogue pages point to Wirtschaftsakademie (EDPB 07/2020 paras 65-67). That is outside L7 but belongs in the same counsel brief.
- **A launch gate, and also an existing gap.** The written contract is a legal launch gate (EDPB para 103; ZZPL Art. 45 st. 3 for Serbian controllers). The gap already exists today because of newsletter sign-ups, independent of GA.
- **The notice's "hosting" line is consistent with the law.** Processors need not be named for consent validity but must be listed as recipients under Art. 13 (EDPB 05/2020 para 65).

---

## Other issues found (not in the claim list)

1. **Paragraph citations of the Taskforce report are off by one or two in places.** The report has 35 paragraphs.
   - `../designs/synthesis.md:943` cites "taskforce para 33" for a "link placed on a visible and standardized place". That is **para 32**; para 33 is about the GDPR consent definition.
   - `../research/consent.md` §2.4:
     - pre-ticked boxes are para **10**, not 11;
     - the reject link embedded in text is para **14**, not 15-16 (paras 15-19 are colours and contrast);
     - withdrawal is para **32**, not 33;
     - "as easy as consent" is paras **34-35** ("para 36" does not exist).
2. **"No '×' close" (`../designs/synthesis.md:941`) is presented as legally required, and it is not** (see L2).
   - The Garante's guidelines expect an equally visible "X" that keeps the defaults, which means reject.
   - The CNIL (Reco para 33) accepts closing as refusal if the banner says so.
   - Only a close control that *accepts* is invalid (VG Hannover headnote 3).
   - Either choice is lawful. Leaving the "×" out only weakens alignment with the Garante's model for Italian visitors.
3. **The consent log stores refusals with a per-device id** (`../designs/synthesis.md:1010`, `:1027-1030`, `:1070`).
   - Art. 7(1) GDPR and the EUUCP require proof of *consent*. Logging refusals with a persistent random id is not required.
   - Reading that id from storage and sending it is itself a "gaining of access" (EDPB 2/2023 paras 53, 63). The exemption texts (Taskforce para 30; CNIL para 49) speak of *keeping* the choice, not of transmitting it.
   - EDPB 05/2020 para 106 warns against "excessive amounts of additional data processing".
   - **Suggestion (inference):** log accepts with their id. Count refusals only as aggregates with no id, or send nothing on reject. This also keeps the "Reject = zero network" promise (`:1010`) true for Quicktalog's own server, not just for Google.
4. **Clarity's own Terms are a stronger reason for removing it than "session recording is not exempt"** (`:1108`).
   - Microsoft is an independent controller that may build advertising profiles from visitor data (Clarity Terms §4.4(c)).
   - Running Clarity on a business's catalogue would make each business's visitors a data source for Microsoft without that business's knowledge.
5. **The EUUCP covers only the EEA, the UK and Switzerland.** Serbian visitors are governed by ZEK 160(4) and ZZPL. ZEK's penal chapter does not reference Art. 160 (Paragraf text), so the realistic Serbian exposure is under ZZPL. Separately, the Poverenik treats an IP address in a GA context as personal data where it identifies a person (case 073-14-2369/2019-02).
6. **The Taskforce report's own disclaimer limits its weight.** It is a "minimum threshold" and "common denominator" for handling noyb complaints, and its positions "do not constitute stand-alone recommendations". National authorities remain free to be stricter (Spain) or looser (Germany, DSK para 124).
7. **DSK OH Digitale Dienste para 121 is the most direct regulator text supporting basic mode.** It says no scripts with potential device access and no third-party server content while the banner is shown. Consider citing it in §5.1 next to EDPB 2/2023.
8. **The notice link URL is now verified.** `https://policies.google.com/technologies/partner-sites` resolves, and its title is "How Google uses information from sites or apps that use our services". The GA Terms §7 require a prominent link to it (`../designs/synthesis.md:959` can drop "not fetched").

## Not verified
- Whether VG Hannover 10 A 5385/22 is final.
- The Dutch AP's analytics exemption (only a secondary citation in `../research/consent.md`).
- Swiss law (Art. 45c TCA), and US state laws, for "show the notice to every visitor".
- The full official (PIS) text of ZEK and ZZPL. The quotes are from Paragraf's consolidated text, fetched fresh today. The PIS page confirms only the publication data.
