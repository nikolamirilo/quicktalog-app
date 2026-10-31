// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	updateCatalogue: vi.fn(),
	push: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("@/actions/catalogue", () => ({
	updateCatalogue: mocks.updateCatalogue,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));

import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";
import { useKeepAiChanges } from "@/hooks/useKeepAiChanges";
import { useSaveDraft } from "@/hooks/useSaveDraft";
import { useUpgrade } from "@/hooks/useUpgrade";

afterEach(cleanup);

const wrapper = ({ children }: { children: ReactNode }) => (
	<CatalogueContextProvider>{children}</CatalogueContextProvider>
);

const useAll = () => ({
	context: useCatalogueContext()!,
	save: useSaveDraft(),
	upgrade: useUpgrade(),
	keep: useKeepAiChanges(),
});

const seeded = () => {
	const hook = renderHook(useAll, { wrapper });
	act(() =>
		hook.result.current.context.seedCatalogue({
			id: "cat-1",
			name: "menu",
			content: [
				{
					id: "drinks",
					order: 0,
					type: "items",
					name: "Drinks",
					showHeading: true,
					isExpanded: true,
					layout: "variant_1",
					items: [],
				},
			],
		} as never),
	);
	return hook;
};

const editByAi = (hook: ReturnType<typeof seeded>) =>
	act(() => {
		hook.result.current.context.applyAiOperations(
			[
				{
					op: "add_items",
					sectionId: "drinks",
					items: [{ id: "latte", name: "Latte", price: 3 }],
				},
			],
			{},
		);
	});

describe("useSaveDraft", () => {
	beforeEach(() => {
		mocks.updateCatalogue.mockReset().mockResolvedValue({ success: true });
		mocks.push.mockReset();
		mocks.toastError.mockReset();
	});

	it("does nothing when nothing is unsaved", async () => {
		const hook = seeded();
		await act(async () => {
			expect(await hook.result.current.save()).toEqual({ ok: true });
		});
		expect(mocks.updateCatalogue).not.toHaveBeenCalled();
	});

	it("saves and marks saved", async () => {
		const hook = seeded();
		editByAi(hook);
		await act(async () => {
			await hook.result.current.save();
		});
		expect(mocks.updateCatalogue).toHaveBeenCalledTimes(1);
		expect(hook.result.current.context.isDirty).toBe(false);
	});

	it("leaves the draft dirty and returns the reason when the save is refused", async () => {
		mocks.updateCatalogue.mockResolvedValue({
			success: false,
			error: "Your plan allows 30 items per catalogue",
		});
		const hook = seeded();
		editByAi(hook);
		let result: unknown;
		await act(async () => {
			result = await hook.result.current.save();
		});
		expect(result).toEqual({
			ok: false,
			error: "Your plan allows 30 items per catalogue",
		});
		expect(hook.result.current.context.isDirty).toBe(true);
	});
});

describe("useKeepAiChanges", () => {
	beforeEach(() => {
		mocks.updateCatalogue.mockReset().mockResolvedValue({ success: true });
	});

	it("Keep saves the AI changes", async () => {
		const hook = seeded();
		editByAi(hook);
		await act(async () => {
			await hook.result.current.keep();
		});
		expect(hook.result.current.context.aiReview).toBeNull();
		expect(mocks.updateCatalogue).toHaveBeenCalledTimes(1);
		expect(hook.result.current.context.isDirty).toBe(false);
	});
});

describe("useUpgrade", () => {
	beforeEach(() => {
		mocks.updateCatalogue.mockReset().mockResolvedValue({ success: true });
		mocks.push.mockReset();
		mocks.toastError.mockReset();
	});

	it("saves before leaving", async () => {
		const hook = seeded();
		editByAi(hook);
		await act(async () => {
			await hook.result.current.upgrade();
		});
		expect(mocks.updateCatalogue).toHaveBeenCalledTimes(1);
		expect(mocks.push).toHaveBeenCalledWith("/pricing");
	});

	it("keeps the builder when the save is refused", async () => {
		mocks.updateCatalogue.mockResolvedValue({
			success: false,
			error: "Over limit",
		});
		const open = vi.spyOn(window, "open").mockReturnValue(null);
		const hook = seeded();
		editByAi(hook);
		await act(async () => {
			await hook.result.current.upgrade();
		});
		expect(mocks.push).not.toHaveBeenCalled();
		expect(open).toHaveBeenCalledWith("/pricing", "_blank", "noopener");
		expect(mocks.toastError).toHaveBeenCalled();
	});

	it("goes straight to pricing when nothing is unsaved", async () => {
		const hook = seeded();
		await act(async () => {
			await hook.result.current.upgrade();
		});
		expect(mocks.updateCatalogue).not.toHaveBeenCalled();
		expect(mocks.push).toHaveBeenCalledWith("/pricing");
	});
});
