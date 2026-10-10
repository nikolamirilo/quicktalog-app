import { SCANNED_TEXT_MARKER, buildScannedContext } from "@/agent/attachments";
import type { ChatScannedImage } from "@/types/ai";
import { describe, expect, it } from "vitest";

const image = (overrides: Partial<ChatScannedImage>): ChatScannedImage => ({
	id: crypto.randomUUID(),
	file: new File([], "menu.png"),
	originalUrl: "blob:menu",
	isProcessed: true,
	...overrides,
});

describe("buildScannedContext", () => {
	it("opens with the marker the model and the bubble both key off", () => {
		const block = buildScannedContext([image({ text: "Espresso 2.50" })]);

		expect(block?.startsWith(SCANNED_TEXT_MARKER)).toBe(true);
		expect(block).toContain("Espresso 2.50");
	});

	it("numbers the scans so the model can name the image it skipped", () => {
		const block = buildScannedContext([
			image({ text: "page one" }),
			image({ text: "page two" }),
		]);

		expect(block).toContain("--- Image 1 ---\npage one");
		expect(block).toContain("--- Image 2 ---\npage two");
	});

	// An unreadable photo stays in the strip so the user can swap it out, but
	// sending its label with nothing under it would read as "this page was
	// blank" - which is a different claim from "we could not read it".
	it("leaves out images that produced no usable text", () => {
		const block = buildScannedContext([
			image({ failure: "Too blurry - try a sharper photo." }),
			image({ text: "  Latte 3.00  " }),
			image({ text: "   " }),
		]);

		expect(block).toContain("Latte 3.00");
		// Numbered by where it sits in the strip, not by how many made the cut:
		// "I could not read image 1" then points at the thumbnail the user sees.
		expect(block?.match(/--- Image \d+ ---/g)).toEqual(["--- Image 2 ---"]);
	});

	it("returns null when nothing was read, so the turn sends as plain text", () => {
		expect(buildScannedContext([])).toBeNull();
		expect(
			buildScannedContext([image({ failure: "Could not be read." })]),
		).toBe(null);
	});
});
