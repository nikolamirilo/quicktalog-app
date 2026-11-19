// @vitest-environment happy-dom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { BUSINESS_TYPES, tiers } from "@quicktalog/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	createCatalogue: vi.fn(),
	checkCatalogueName: vi.fn(),
	push: vi.fn(),
	prefetch: vi.fn(),
	refreshUserData: vi.fn(),
	toastError: vi.fn(),
	userData: null as unknown,
}));

vi.mock("@/actions/catalogue", () => ({
	createCatalogue: mocks.createCatalogue,
	checkCatalogueName: mocks.checkCatalogueName,
}));
vi.mock("@/context/UserContext", () => ({
	useUserContext: () => ({
		userData: mocks.userData,
		loading: false,
		refreshUserData: mocks.refreshUserData,
	}),
}));
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mocks.push, prefetch: mocks.prefetch }),
}));
vi.mock("sonner", () => ({
	toast: { error: mocks.toastError, success: vi.fn() },
}));

import {
	CreateCatalogueProvider,
	useCreateCatalogueDialog,
} from "@/components/catalogue/create/CreateCatalogueProvider";
import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";

afterEach(cleanup);

const starter = tiers.find((t) => t.name === "Starter")!;
const signedIn = (catalogues: number) => ({
	currentPlan: starter,
	usage: { catalogues },
});

/** Radix selects need real pointer events, so the probe sets their values. */
let selectValues: () => void = () => {};

const Trigger = () => {
	const dialog = useCreateCatalogueDialog();
	const { updateCatalogue } = useCatalogueContext();
	selectValues = () =>
		updateCatalogue({
			language: "en",
			currency: "EUR",
			businessType: BUSINESS_TYPES[0].value,
		});
	return (
		<button onClick={() => dialog?.openCreateCatalogue()} type="button">
			Create catalogue
		</button>
	);
};

const setup = () =>
	render(
		<CatalogueContextProvider>
			<CreateCatalogueProvider>
				<Trigger />
			</CreateCatalogueProvider>
		</CatalogueContextProvider>,
	);

const open = async () => {
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Create catalogue" }));
	});
};

/** The dialogs are loaded on demand, so they arrive a tick after the click. */
const openCreateDialog = async () => {
	await open();
	await screen.findByText("Create a Catalogue");
};

const submitButton = () =>
	screen.getByRole("button", { name: /^create catalogue$/i });

describe("creating a catalogue", () => {
	beforeEach(() => {
		mocks.userData = signedIn(0);
		mocks.checkCatalogueName.mockResolvedValue({ available: true });
		mocks.refreshUserData.mockResolvedValue(undefined);
	});

	it("fills the dialog, creates the catalogue and opens its builder", async () => {
		mocks.createCatalogue.mockResolvedValue({
			success: true,
			data: { name: "bean-there" },
		});
		setup();
		await openCreateDialog();

		expect(submitButton().hasAttribute("disabled")).toBe(true);

		await act(async () => {
			fireEvent.change(document.getElementById("catalogName")!, {
				target: { value: "Bean There" },
			});
			selectValues();
		});
		expect(submitButton().hasAttribute("disabled")).toBe(false);

		await act(async () => {
			fireEvent.click(submitButton());
		});

		expect(mocks.createCatalogue).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Bean There",
				language: "en",
				currency: "EUR",
			}),
		);
		expect(mocks.push).toHaveBeenCalledWith("/admin/bean-there/builder");
		// The dialog stays up, still loading, until the builder replaces the page:
		// closing it first left the home page on screen with nothing happening.
		expect(screen.queryByText("Create a Catalogue")).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: /creating/i })
				.hasAttribute("disabled"),
		).toBe(true);
		expect(mocks.prefetch).toHaveBeenCalledWith("/admin/bean-there/builder");
	});

	it("keeps the dialog open and shows the server's reason when creation fails", async () => {
		mocks.createCatalogue.mockResolvedValue({
			success: false,
			error: "A catalogue with this name already exists",
		});
		setup();
		await openCreateDialog();
		await act(async () => {
			fireEvent.change(document.getElementById("catalogName")!, {
				target: { value: "Bean There" },
			});
			selectValues();
		});

		await act(async () => {
			fireEvent.click(submitButton());
		});

		expect(mocks.toastError).toHaveBeenCalledWith(
			"A catalogue with this name already exists",
		);
		expect(mocks.push).not.toHaveBeenCalled();
		expect(screen.getByText("Create a Catalogue")).toBeTruthy();
	});

	it("shows the limits dialog instead once the plan is full", async () => {
		mocks.userData = signedIn(starter.features.catalogues);
		setup();
		await open();

		expect(await screen.findByRole("alertdialog")).toBeTruthy();
		expect(screen.queryByText("Create a Catalogue")).toBeNull();
	});

	it("sends a signed-out visitor to sign up", async () => {
		mocks.userData = null;
		setup();
		await open();

		expect(mocks.push).toHaveBeenCalledWith("/auth?mode=signup");
		expect(screen.queryByRole("alertdialog")).toBeNull();
	});
});
