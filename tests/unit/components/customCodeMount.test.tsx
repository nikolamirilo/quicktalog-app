// @vitest-environment happy-dom
import CustomCodeBlockComponent, {
	buildWidgetDocument,
	WIDGET_MESSAGE,
} from "@/components/catalogue/sections/CustomCode";
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const block = {
	id: "b1",
	order: 0,
	type: "custom_code" as const,
	name: "Spin the Wheel",
	code: '<div class="w"><canvas class="c"></canvas></div><script type="application/json" class="d">[1,2]</script><script>window.x=1;</script>',
};

const frameOf = (container: HTMLElement) =>
	container.querySelector("iframe") as HTMLIFrameElement;

/** The id the reporter inside the document posts back under. */
const frameIdOf = (frame: HTMLIFrameElement): string => {
	const match = frame.getAttribute("srcdoc")?.match(/id: ("(?:[^"\\]|\\.)*")/);
	if (!match) throw new Error("no frame id in the widget document");
	return JSON.parse(match[1]);
};

describe("CustomCodeBlockComponent", () => {
	describe("isolation", () => {
		it("runs the widget in a sandboxed frame", () => {
			const { container } = render(
				<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
			);

			expect(frameOf(container)).toBeTruthy();
			expect(frameOf(container).getAttribute("sandbox")).toBe("allow-scripts");
		});

		it("never grants same-origin, which would undo the sandbox", () => {
			// With allow-same-origin AND allow-scripts, the frame can reach out and
			// strip its own sandbox attribute. The pair must never both be set.
			const { container } = render(
				<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
			);

			expect(frameOf(container).getAttribute("sandbox")).not.toContain(
				"allow-same-origin",
			);
		});

		it("puts the markup in the frame, not in the page", () => {
			const { container } = render(
				<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
			);

			// The page itself must hold none of it - that was the old behaviour.
			expect(container.querySelector("canvas.c")).toBeNull();
			expect(container.querySelector("script")).toBeNull();
			expect(frameOf(container).getAttribute("srcdoc")).toContain("canvas");
		});
	});

	describe("the document a widget is handed", () => {
		const html = buildWidgetDocument(block.code, "frame-1");

		it("carries the fragment through untouched", () => {
			// Nothing is escaped or stripped: the markup is meant to run. The
			// sandbox is what makes that safe, not a filter.
			expect(html).toContain(
				'<div class="w"><canvas class="c"></canvas></div>',
			);
			expect(html).toContain("window.x=1;");
		});

		it("keeps the JSON data tag a widget reads its items from", () => {
			expect(html).toContain('<script type="application/json" class="d">[1,2]');
		});

		it("is a whole document, so scripts run natively", () => {
			// No re-creating script nodes by hand any more - a parsed document
			// executes them itself.
			expect(html.startsWith("<!doctype html>")).toBe(true);
			expect(html).toContain('<meta charset="utf-8">');
		});

		it("carries the catalogue font across, since the frame inherits nothing", () => {
			expect(buildWidgetDocument("", "f", "Lora, serif")).toContain(
				"font-family: Lora, serif",
			);
			expect(buildWidgetDocument("", "f")).toContain("system-ui");
		});

		it("reports its height back under the frame's own id", () => {
			expect(html).toContain(WIDGET_MESSAGE);
			expect(html).toContain('"frame-1"');
			expect(html).toContain("ResizeObserver");
		});
	});

	describe("sizing", () => {
		it("starts at a sane height before the widget reports one", () => {
			const { container } = render(
				<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
			);

			expect(frameOf(container).style.height).toBe("200px");
		});

		it("grows to the height its own frame reports", () => {
			const { container } = render(
				<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
			);
			const frame = frameOf(container);
			const id = frameIdOf(frame);

			act(() => {
				window.dispatchEvent(
					new MessageEvent("message", {
						data: {
							type: WIDGET_MESSAGE,
							id,
							height: 640,
						},
						source: frame.contentWindow,
					}),
				);
			});

			expect(frame.style.height).toBe("640px");
		});

		it("refuses a height that would make an endless page", () => {
			const { container } = render(
				<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
			);
			const frame = frameOf(container);
			const id = frameIdOf(frame);

			act(() => {
				window.dispatchEvent(
					new MessageEvent("message", {
						data: {
							type: WIDGET_MESSAGE,
							id,
							height: 900000,
						},
						source: frame.contentWindow,
					}),
				);
			});

			expect(frame.style.height).toBe("5000px");
		});

		it("ignores a height message from anywhere but its own frame", () => {
			// `event.source` is the only trustworthy identity here: a sandboxed
			// frame posts with origin "null", so origin cannot be checked.
			const { container } = render(
				<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
			);

			act(() => {
				window.dispatchEvent(
					new MessageEvent("message", {
						data: { type: WIDGET_MESSAGE, id: "anything", height: 4321 },
						source: window,
					}),
				);
			});

			expect(frameOf(container).style.height).toBe("200px");
		});
	});

	it("uses the block name as the section's accessible name", () => {
		const { container } = render(
			<CustomCodeBlockComponent block={block} mode="view" slug="s" />,
		);

		expect(container.querySelector("section")?.getAttribute("aria-label")).toBe(
			"Spin the Wheel",
		);
		expect(frameOf(container).getAttribute("title")).toBe("Spin the Wheel");
	});
});
