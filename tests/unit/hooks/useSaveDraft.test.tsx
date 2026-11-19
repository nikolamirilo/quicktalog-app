// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

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

import { BuilderStatusProvider } from "@/context/BuilderStatusContext";
import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";
import { useAutosave } from "@/hooks/useAutosave";
import { useKeepAiChanges } from "@/hooks/useKeepAiChanges";
import { useSaveDraft } from "@/hooks/useSaveDraft";
import { useUpgrade } from "@/hooks/useUpgrade";

// The builder flushes anything still unsaved when it unmounts, through the draft
// route. Nothing here is testing that request, and a unit test must not make one.
beforeAll(() => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response("{}")),
	);
	Object.defineProperty(navigator, "sendBeacon", {
		configurable: true,
		value: vi.fn(() => true),
	});
});
afterAll(() => vi.unstubAllGlobals());

afterEach(cleanup);

/** The builder's autosave, which is the one save path these hooks go through. */
const Autosave = ({ children }: { children: ReactNode }) => {
	const status = useAutosave({ draftUpdatedAt: null, unpublished: false });
	return (
		<BuilderStatusProvider value={status}>{children}</BuilderStatusProvider>
	);
};

const wrapper = ({ children }: { children: ReactNode }) => (
	<CatalogueContextProvider>
		<Autosave>{children}</Autosave>
	</CatalogueContextProvider>
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

const editByHand = (hook: ReturnType<typeof seeded>) =>
	act(() => {
		hook.result.current.context.addItem("drinks", {
			id: "latte",
			name: "Latte",
			price: 3,
		} as never);
	});

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
		mocks.updateCatalogue.mockReset().mockResolvedValue({
			success: true,
			draftUpdatedAt: "2026-11-19T10:00:00Z",
		});
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
		editByHand(hook);
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
		editByHand(hook);
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

	// A proposal is not the owner's work until they press Keep, so saving it would
	// make Reject put back something that was already stored.
	it("leaves a Quick AI proposal unsaved", async () => {
		const hook = seeded();
		editByAi(hook);
		await act(async () => {
			expect(await hook.result.current.save()).toEqual({ ok: true });
		});
		expect(mocks.updateCatalogue).not.toHaveBeenCalled();
		expect(hook.result.current.context.isDirty).toBe(true);
	});
});

describe("useKeepAiChanges", () => {
	beforeEach(() => {
		mocks.updateCatalogue.mockReset().mockResolvedValue({
			success: true,
			draftUpdatedAt: "2026-11-19T10:00:00Z",
		});
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
		mocks.updateCatalogue.mockReset().mockResolvedValue({
			success: true,
			draftUpdatedAt: "2026-11-19T10:00:00Z",
		});
		mocks.push.mockReset();
		mocks.toastError.mockReset();
	});

	it("saves before leaving", async () => {
		const hook = seeded();
		editByHand(hook);
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
		editByHand(hook);
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
