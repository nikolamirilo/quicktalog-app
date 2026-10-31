// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useSeedCatalogue } from "@/components/catalogue/builder/useSeedCatalogue";
import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";

afterEach(cleanup);

const stored = (id: string, sectionName = "Drinks") =>
	({
		id,
		name: id,
		content: [
			{
				id: "drinks",
				order: 0,
				type: "items",
				name: sectionName,
				showHeading: true,
				isExpanded: true,
				layout: "variant_1",
				items: [],
			},
		],
	}) as never;

describe("builder seeding", () => {
	const mount = (item: unknown) =>
		renderHook(
			({ item }) => {
				const context = useCatalogueContext();
				useSeedCatalogue(item as never);
				return context;
			},
			{
				initialProps: { item },
				wrapper: ({ children }: { children: ReactNode }) => (
					<CatalogueContextProvider>{children}</CatalogueContextProvider>
				),
			},
		);

	it("keeps unsaved AI edits across a remount of the same catalogue", () => {
		const hook = mount(stored("menu"));
		act(() => {
			hook.result.current!.applyAiOperations(
				[{ op: "update_section", sectionId: "drinks", name: "Coffee" }],
				{},
			);
		});
		hook.rerender({ item: stored("menu") });
		expect(hook.result.current!.catalogue.content[0].name).toBe("Coffee");
	});

	it("loads a different catalogue on a new id", () => {
		const hook = mount(stored("menu"));
		act(() => {
			hook.result.current!.applyAiOperations(
				[{ op: "update_section", sectionId: "drinks", name: "Coffee" }],
				{},
			);
		});
		hook.rerender({ item: stored("other", "Teas") });
		expect(hook.result.current!.catalogue.content[0].name).toBe("Teas");
	});

	it("takes the server copy when the draft has nothing unsaved", () => {
		const hook = mount(stored("menu"));
		hook.rerender({ item: stored("menu", "Renamed elsewhere") });
		expect(hook.result.current!.catalogue.content[0].name).toBe(
			"Renamed elsewhere",
		);
	});
});
