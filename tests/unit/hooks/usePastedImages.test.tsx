// @vitest-environment happy-dom
import { usePastedImages } from "@/hooks/usePastedImages";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	cleanup();
	document.body.innerHTML = "";
});

const png = (name = "shot.png") => new File([""], name, { type: "image/png" });

/** happy-dom has no ClipboardEvent, and the real one takes no files anyway. */
const paste = (target: Node, files: File[], text = "") => {
	const event = new Event("paste", { bubbles: true, cancelable: true });
	Object.defineProperty(event, "clipboardData", {
		value: { files, getData: () => text },
	});
	target.dispatchEvent(event);
	return event;
};

const setup = ({ open = true }: { open?: boolean } = {}) => {
	const panel = document.createElement("div");
	const field = document.createElement("textarea");
	panel.append(field);
	const elsewhere = document.createElement("input");
	document.body.append(panel, elsewhere);

	const onImages = vi.fn();
	renderHook(() => usePastedImages({ current: open ? panel : null }, onImages));

	return { panel, field, elsewhere, onImages };
};

describe("usePastedImages", () => {
	it("takes images pasted into the panel", () => {
		const { field, onImages } = setup();
		const file = png();

		paste(field, [file]);

		expect(onImages).toHaveBeenCalledWith([file]);
	});

	// A screenshot is usually pasted the instant the panel opens, before
	// anything in it has been clicked - the event then lands on the body.
	it("takes images pasted with nothing focused", () => {
		const { onImages } = setup();

		paste(document.body, [png()]);

		expect(onImages).toHaveBeenCalledTimes(1);
	});

	it("ignores a paste into another field on the page", () => {
		const { elsewhere, onImages } = setup();

		paste(elsewhere, [png()]);

		expect(onImages).not.toHaveBeenCalled();
	});

	it("ignores pastes while the panel is closed", () => {
		const { field, onImages } = setup({ open: false });

		paste(field, [png()]);

		expect(onImages).not.toHaveBeenCalled();
	});

	it("leaves a plain text paste alone", () => {
		const { field, onImages } = setup();

		const event = paste(field, [], "Add a Desserts section");

		expect(onImages).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});

	it("ignores non-image files", () => {
		const { field, onImages } = setup();

		paste(field, [new File([""], "menu.pdf", { type: "application/pdf" })]);

		expect(onImages).not.toHaveBeenCalled();
	});

	it("swallows the paste when the clipboard is only an image", () => {
		const { field } = setup();

		// Otherwise the browser drops the screenshot's filename into the box.
		expect(paste(field, [png()]).defaultPrevented).toBe(true);
	});

	// Copying a cell or a rich snippet puts the picture and its text on the
	// clipboard together; eating the text would lose half of what they copied.
	it("attaches the image but still lets accompanying text through", () => {
		const { field, onImages } = setup();

		const event = paste(field, [png()], "Espresso 2.50");

		expect(onImages).toHaveBeenCalledTimes(1);
		expect(event.defaultPrevented).toBe(false);
	});

	it("stops listening once unmounted", () => {
		const panel = document.createElement("div");
		document.body.append(panel);
		const onImages = vi.fn();
		const { unmount } = renderHook(() =>
			usePastedImages({ current: panel }, onImages),
		);

		unmount();
		paste(panel, [png()]);

		expect(onImages).not.toHaveBeenCalled();
	});
});
