import { describe, expect, it } from "vitest";
import {
	baseFrameLayout,
	framedSvgMarkup,
	frameLayout,
	SVG_FONT_STACK,
} from "@/lib/qr/export";

const frame = {
	text: `<script>alert("x")</script> & 'co'`,
	barColor: "#16140F",
	textColor: `#FFF" onload="alert(1)`,
};

describe("framedSvgMarkup", () => {
	it("escapes the frame text and colours", () => {
		const svg = framedSvgMarkup({
			inner: "<svg/>",
			width: 300,
			height: 300,
			frame,
			layout: { bar: 45, fontSize: 17, textWidth: 200 },
		});
		expect(svg).not.toContain("<script>");
		expect(svg).toContain(
			"&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &apos;co&apos;",
		);
		expect(svg).not.toContain('onload="');
		expect(svg).toContain(`fill="#FFF&quot; onload=&quot;alert(1)"`);
	});

	it("stacks the bar under the code and pins the measured width", () => {
		const svg = framedSvgMarkup({
			inner: "<svg/>",
			width: 300,
			height: 300,
			frame: { ...frame, text: "Scan me" },
			layout: { bar: 45, fontSize: 17, textWidth: 123.456 },
		});
		expect(svg).toContain('height="345" viewBox="0 0 300 345"');
		expect(svg).toContain(
			'textLength="123.46" lengthAdjust="spacingAndGlyphs"',
		);
		expect(svg).toContain("Plus Jakarta Sans");
		expect(SVG_FONT_STACK).toMatch(/sans-serif$/);
	});

	it("leaves the width to the viewer when the text was not measured", () => {
		const svg = framedSvgMarkup({
			inner: "<svg/>",
			width: 300,
			height: 300,
			frame: { ...frame, text: "Scan me" },
			layout: baseFrameLayout(300),
		});
		expect(svg).not.toContain("textLength");
	});
});

describe("frameLayout", () => {
	it("uses the shared ratios without a canvas (server render)", () => {
		expect(frameLayout("Scan for our menu", 300)).toEqual({
			bar: 45,
			fontSize: 17,
			textWidth: null,
		});
	});
});
