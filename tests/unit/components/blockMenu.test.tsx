// @vitest-environment happy-dom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BlockControls from "@/components/catalogue/cards/common/BlockControls";
import { BlockMenu } from "@/components/catalogue/cards/common/BlockMenu";
import SectionHeader from "@/components/catalogue/sections/common/SectionHeader";

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

/** Radix opens its menu on a primary-button pointerdown, not on click. */
const openMenu = async (name: RegExp) => {
	await act(async () => {
		fireEvent.pointerDown(screen.getByRole("button", { name }), {
			button: 0,
			ctrlKey: false,
		});
	});
};

const choose = async (name: RegExp) => {
	await act(async () => {
		fireEvent.click(screen.getByRole("menuitem", { name }));
	});
};

describe("BlockMenu", () => {
	const setup = (props: Partial<Parameters<typeof BlockMenu>[0]> = {}) => {
		const handlers = {
			onEdit: vi.fn(),
			onMoveUp: vi.fn(),
			onMoveDown: vi.fn(),
			onDelete: vi.fn(),
			onLayoutChange: vi.fn(),
		};
		render(
			<BlockMenu
				currentLayout="variant_1"
				name="Breakfast"
				{...handlers}
				{...props}
			/>,
		);
		return handlers;
	};

	it("names its trigger after the section", () => {
		setup();
		expect(
			screen.getByRole("button", { name: "Breakfast options" }),
		).toBeTruthy();
	});

	it("keeps the trigger visible without hover", () => {
		setup();
		const trigger = screen.getByRole("button", { name: "Breakfast options" });
		expect(trigger.className).not.toContain("opacity-0");
	});

	it("edits the section", async () => {
		const { onEdit } = setup();
		await openMenu(/Breakfast options/);
		await choose(/Edit section/);
		expect(onEdit).toHaveBeenCalledOnce();
	});

	it("moves the section down", async () => {
		const { onMoveDown } = setup();
		await openMenu(/Breakfast options/);
		await choose(/Move down/);
		expect(onMoveDown).toHaveBeenCalledOnce();
	});

	it("disables Move up on the first section", async () => {
		setup({ isFirst: true });
		await openMenu(/Breakfast options/);
		expect(
			screen
				.getByRole("menuitem", { name: /Move up/ })
				.getAttribute("aria-disabled"),
		).toBe("true");
	});

	it("changes the layout from the tile row", async () => {
		const { onLayoutChange } = setup();
		await openMenu(/Breakfast options/);
		const current = screen.getByRole("menuitemradio", { checked: true });
		expect(current.getAttribute("aria-label")).toBe("Side Image");
		await act(async () => {
			fireEvent.click(screen.getByRole("menuitemradio", { name: "Carousel" }));
		});
		expect(onLayoutChange).toHaveBeenCalledWith("variant_4");
	});

	it("leaves out the layout row when the section has no layouts", async () => {
		setup({ onLayoutChange: undefined });
		await openMenu(/Breakfast options/);
		expect(screen.queryAllByRole("menuitemradio")).toHaveLength(0);
	});

	it("keeps the section when delete is not confirmed", async () => {
		const confirm = vi.fn(() => false);
		vi.stubGlobal("confirm", confirm);
		const { onDelete } = setup();
		await openMenu(/Breakfast options/);
		await choose(/Delete section/);
		expect(confirm).toHaveBeenCalledOnce();
		expect(onDelete).not.toHaveBeenCalled();
	});

	it("deletes the section once confirmed", async () => {
		vi.stubGlobal(
			"confirm",
			vi.fn(() => true),
		);
		const { onDelete } = setup();
		await openMenu(/Breakfast options/);
		await choose(/Delete section/);
		expect(onDelete).toHaveBeenCalledOnce();
	});
});

describe("BlockControls", () => {
	it("shows Done instead of the edit entry while editing inline", async () => {
		const onEdit = vi.fn();
		render(<BlockControls isEditing label="Text" onEdit={onEdit} />);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Done" }));
		});
		expect(onEdit).toHaveBeenCalledOnce();

		await openMenu(/Text options/);
		expect(screen.queryByRole("menuitem", { name: /Edit/ })).toBeNull();
	});
});

describe("SectionHeader", () => {
	const header = (mode: "edit" | "view", onRename = vi.fn()) => {
		render(
			<SectionHeader
				code="s-1"
				isExpanded
				mode={mode}
				onDelete={vi.fn()}
				onRename={onRename}
				onToggle={vi.fn()}
				title="Breakfast"
			/>,
		);
		return onRename;
	};

	const startRename = async () => {
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Breakfast" }));
		});
		return screen.getByRole("textbox", { name: "Section heading" });
	};

	const type = async (input: HTMLElement, value: string) => {
		await act(async () => {
			fireEvent.change(input, { target: { value } });
		});
	};

	const press = async (input: HTMLElement, key: string) => {
		await act(async () => {
			fireEvent.keyDown(input, { key });
		});
	};

	it("puts the section menu in the header in edit mode", () => {
		header("edit");
		expect(
			screen.getByRole("button", { name: "Breakfast options" }),
		).toBeTruthy();
	});

	it("renders no menu in view mode", () => {
		header("view");
		expect(
			screen.queryByRole("button", { name: "Breakfast options" }),
		).toBeNull();
	});

	it("renames the section from the heading on Enter", async () => {
		const onRename = header("edit");
		const input = await startRename();
		await type(input, "Brunch");
		await press(input, "Enter");
		expect(onRename).toHaveBeenCalledWith("Brunch");
		expect(screen.queryByRole("textbox")).toBeNull();
	});

	it("saves the heading when the owner clicks away", async () => {
		const onRename = header("edit");
		const input = await startRename();
		await type(input, "  Brunch  ");
		await act(async () => {
			fireEvent.blur(input);
		});
		expect(onRename).toHaveBeenCalledWith("Brunch");
	});

	it("reverts the heading on Escape", async () => {
		const onRename = header("edit");
		const input = await startRename();
		await type(input, "Brunch");
		await press(input, "Escape");
		expect(onRename).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Breakfast" })).toBeTruthy();
	});

	it("keeps the old heading when the name is emptied", async () => {
		const onRename = header("edit");
		const input = await startRename();
		await type(input, "   ");
		await press(input, "Enter");
		expect(onRename).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Breakfast" })).toBeTruthy();
	});

	it("commits once when Enter is followed by the blur it causes", async () => {
		const onRename = header("edit");
		const input = await startRename();
		await type(input, "Brunch");
		await press(input, "Enter");
		await act(async () => {
			fireEvent.blur(input);
		});
		expect(onRename).toHaveBeenCalledTimes(1);
	});

	it("leaves the heading read-only in view mode", () => {
		render(
			<SectionHeader
				code="s-2"
				isExpanded
				mode="view"
				onRename={vi.fn()}
				onToggle={vi.fn()}
				title="Breakfast"
			/>,
		);
		expect(
			screen.getByRole("button", { name: /Collapse Breakfast section/ }),
		).toBeTruthy();
		expect(screen.queryByTitle("Rename this section")).toBeNull();
	});
});
