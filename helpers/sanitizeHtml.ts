import sanitize from "sanitize-html";

/**
 * Allowlist for the markup that reaches a published catalogue.
 *
 * Three sinks render author-supplied HTML straight into the page through
 * `HtmlContent`: a text section's `content`, the catalogue `heading`, and an
 * embedding block's `code`. All three can be written by the AI editor, which
 * means all three can be written under the influence of text it did not get
 * from the user - a fetched web page, or the OCR of a photo someone handed
 * them to scan. `<img src=x onerror=...>` is enough, and a published catalogue
 * is served from the same origin as the signed-in app.
 *
 * So the markup is filtered where it is rendered rather than where it is
 * written: that covers the AI, the builder, imported catalogues and rows that
 * predate any of this, in one place.
 *
 * Allowlist, never a blocklist. Anything not named here is dropped, which is
 * what makes `on*` handlers, `<script>`, `<form>` and `<svg>` a non-issue
 * without enumerating them.
 */

/** Hosts an `embedding` block may point an iframe at. */
const EMBED_HOSTS = [
	// Maps
	"google.com",
	"maps.google.com",
	"bing.com",
	"mapbox.com",
	"openstreetmap.org",
	"yandex.com",
	// Media
	"youtube.com",
	"youtube-nocookie.com",
	"youtu.be",
	"vimeo.com",
	"dailymotion.com",
	"twitch.tv",
	"soundcloud.com",
	"spotify.com",
	"mixcloud.com",
	// Booking and scheduling
	"calendly.com",
	"booking.com",
	"expedia.com",
	"hotels.com",
	"airbnb.com",
	"tripadvisor.com",
	"hrs.de",
	"agoda.com",
	// Commerce
	"stripe.com",
	"paypal.com",
	"gumroad.com",
	"lemonsqueezy.com",
	"ko-fi.com",
	"buymeacoffee.com",
	"paddle.com",
	// Social
	"facebook.com",
	"instagram.com",
	"twitter.com",
	"x.com",
	"tiktok.com",
	"linkedin.com",
	"reddit.com",
];

const TEXT_TAGS = [
	"p",
	"br",
	"hr",
	"div",
	"span",
	"section",
	"article",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"strong",
	"b",
	"em",
	"i",
	"u",
	"s",
	"small",
	"sub",
	"sup",
	"mark",
	"ul",
	"ol",
	"li",
	"dl",
	"dt",
	"dd",
	"blockquote",
	"figure",
	"figcaption",
	"a",
	"img",
	"table",
	"thead",
	"tbody",
	"tfoot",
	"tr",
	"th",
	"td",
	"caption",
	"pre",
	"code",
];

/** What an embed adds on top of prose. No `<script>`: see `sanitizeEmbed`. */
const EMBED_TAGS = [...TEXT_TAGS, "iframe", "video", "audio", "source"];

const COMMON_ATTRIBUTES: sanitize.IOptions["allowedAttributes"] = {
	// `style` carries no script in any browser still shipping, and embeds and
	// pasted rich text both lean on it heavily.
	"*": ["class", "style", "dir", "lang", "title", "aria-label", "role"],
	a: ["href", "target", "rel", "name"],
	img: ["src", "srcset", "alt", "width", "height", "loading", "decoding"],
	td: ["colspan", "rowspan"],
	th: ["colspan", "rowspan", "scope"],
};

const BASE: sanitize.IOptions = {
	allowedSchemes: ["http", "https", "mailto", "tel"],
	// An inline image is data the page already holds; a data: URL anywhere else
	// is a way to smuggle a document in.
	allowedSchemesByTag: { img: ["http", "https", "data"] },
	allowedSchemesAppliedToAttributes: ["href", "src", "srcset"],
	// A link that opens a new tab hands the opener over without this.
	transformTags: {
		a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }, true),
	},
	disallowedTagsMode: "discard",
};

const TEXT_OPTIONS: sanitize.IOptions = {
	...BASE,
	allowedTags: TEXT_TAGS,
	allowedAttributes: COMMON_ATTRIBUTES,
};

const EMBED_OPTIONS: sanitize.IOptions = {
	...BASE,
	allowedTags: EMBED_TAGS,
	allowedAttributes: {
		...COMMON_ATTRIBUTES,
		iframe: [
			"src",
			"width",
			"height",
			"allow",
			"allowfullscreen",
			"frameborder",
			"scrolling",
			"loading",
			"referrerpolicy",
			"sandbox",
		],
		video: ["src", "poster", "controls", "muted", "loop", "playsinline"],
		audio: ["src", "controls", "loop"],
		source: ["src", "type", "srcset", "media"],
	},
	// Matches the host itself and anything under it, so `player.vimeo.com` and
	// `www.youtube.com` pass while `youtube.com.evil.example` does not - the
	// check is a `.domain` suffix, not a substring.
	allowedIframeDomains: EMBED_HOSTS,
	allowIframeRelativeUrls: false,
	// A rejected src is only deleted, which would leave an empty frame sitting
	// in the page. Drop the whole element instead.
	exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
};

export type HtmlProfile = "text" | "embed";

/**
 * Filter author HTML down to what is safe to render.
 *
 * `text` is prose: headings, links, images, tables. `embed` adds the iframe
 * and media tags an embedding block needs, restricted to `EMBED_HOSTS`.
 */
export function sanitizeCatalogueHtml(
	html: string | undefined | null,
	profile: HtmlProfile = "text",
): string {
	if (!html) return "";
	return sanitize(html, profile === "embed" ? EMBED_OPTIONS : TEXT_OPTIONS);
}

/** Exported for the tests, so the list cannot drift without one failing. */
export const EMBED_IFRAME_HOSTS = EMBED_HOSTS;
