// @vitest-environment happy-dom
import AddContentModal from "@/components/catalogue/modals/AddContentModal";
import { useSectionDialog } from "@/components/catalogue/view/useSectionDialog";
import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";
import type { ContentBlock, UserData } from "@quicktalog/common";
import {
	act,
	cleanup,
	fireEvent,
	render,
	renderHook,
	screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

const section = (id: string, name: string): ContentBlock =>
	({
		id,
		order: 0,
		type: "items",
		name,
		showHeading: true,
		isExpanded: true,
		layout: "variant_1",
		items: [],
	}) as ContentBlock;

/** No plan limits in the way; this is about which section an edit lands on. */
const userData = {
	currentPlan: { features: {} },
} as unknown as UserData;

const wrapper = ({ children }: { children: ReactNode }) => (
	<CatalogueContextProvider>{children}</CatalogueContextProvider>
);

describe("the section dialog's target", () => {
	it("forgets the section it edited once the dialog closes", () => {
		const { result } = renderHook(() => useSectionDialog());
		const block = section("tea", "Tea");

		act(() => result.current.openEdit(block));
		expect(result.current.editingBlock).toBe(block);

		// Saving closes through here, which is what used to be skipped.
		act(() => result.current.close());
		expect(result.current.editingBlock).toBeNull();
		expect(result.current.isOpen).toBe(false);
	});

	it("opens to add with no target, even straight after an edit", () => {
		const { result } = renderHook(() => useSectionDialog());

		act(() => result.current.openEdit(section("tea", "Tea")));
		act(() => result.current.openAdd());

		expect(result.current.editingBlock).toBeNull();
		expect(result.current.isOpen).toBe(true);
	});
});

describe("AddContentModal", () => {
	const mount = (
		editingBlock: ContentBlock | null,
		content: ContentBlock[],
	) => {
		const onClose = vi.fn();
		let context: ReturnType<typeof useCatalogueContext> = null;
		const Harness = () => {
			context = useCatalogueContext();
			return (
				<AddContentModal
					editingBlock={editingBlock}
					isOpen
					onClose={onClose}
					userData={userData}
				/>
			);
		};
		const view = render(<Harness />, { wrapper });
		act(() => {
			context?.seedCatalogue({ id: "c1", name: "menu", content } as never);
		});
		return { onClose, context: () => context, view };
	};

	const nameField = () =>
		document.querySelector("#items-name-input") as HTMLInputElement;
	const save = (label: RegExp) =>
		act(() => {
			fireEvent.click(screen.getByRole("button", { name: label }));
		});

	it("adds a section without touching the ones already there", () => {
		const content = [section("coffee", "Coffee"), section("tea", "Tea")];
		const { onClose, context } = mount(null, content);

		act(() => {
			fireEvent.change(nameField(), { target: { value: "Pastries" } });
		});
		save(/add section/i);

		expect(context()?.catalogue.content.map((block) => block.name)).toEqual([
			"Coffee",
			"Tea",
			"Pastries",
		]);
		expect(onClose).toHaveBeenCalled();
	});

	it("edits the section it was opened on, by id", () => {
		const content = [section("coffee", "Coffee"), section("tea", "Tea")];
		const { onClose, context } = mount(content[1], content);

		act(() => {
			fireEvent.change(nameField(), { target: { value: "Teas" } });
		});
		save(/save section/i);

		expect(context()?.catalogue.content.map((block) => block.name)).toEqual([
			"Coffee",
			"Teas",
		]);
		expect(onClose).toHaveBeenCalled();
	});

	it("keeps the items a section gained while the dialog was open", () => {
		const content = [section("coffee", "Coffee")];
		const { context } = mount(content[0], content);

		act(() => {
			context()?.applyAiOperations(
				[
					{
						op: "add_items",
						sectionId: "coffee",
						items: [{ id: "latte", name: "Latte", price: 3 }],
					},
				],
				{},
			);
		});
		act(() => {
			fireEvent.change(nameField(), { target: { value: "Coffees" } });
		});
		save(/save section/i);

		const block = context()?.catalogue.content[0] as ContentBlock & {
			items: { id: string }[];
		};
		expect(block.name).toBe("Coffees");
		expect(block.items.map((item) => item.id)).toEqual(["latte"]);
	});
});
