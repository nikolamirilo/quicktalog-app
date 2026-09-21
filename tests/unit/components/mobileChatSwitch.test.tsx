// @vitest-environment happy-dom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }));

/**
 * next/font only runs inside Next's compiler. The sidebar reaches it through
 * the Appearance tab, so stub every font this or any future tab asks for.
 */
// vi.mock is hoisted, so the stub is built inside the factory. A Proxy is not
// accepted as a module namespace, so the loaders fonts/index.ts uses are listed.
vi.mock("next/font/google", () => {
	const font = () => ({
		className: "font-stub",
		style: {},
		variable: "--stub",
	});
	return Object.fromEntries(
		[
			"Crimson_Text",
			"DM_Sans",
			"Inter",
			"Josefin_Sans",
			"Lato",
			"Lora",
			"Merriweather",
			"Montserrat",
			"Nunito",
			"Open_Sans",
			"Oswald",
			"Playfair_Display",
			"Poppins",
			"Raleway",
			"Roboto",
			"Roboto_Slab",
			"Source_Sans_3",
			"Work_Sans",
		].map((name) => [name, font]),
	);
});

// The bar's action buttons reach for app-wide context, data and server
// actions. None of that is what these tests are about.
vi.mock("@/context/UserContext", () => ({
	useUserContext: () => ({ refreshUserData: vi.fn() }),
}));
vi.mock("@/hooks/useDashboardData", () => ({
	useDashboardData: () => ({ refreshAll: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/actions/catalogue", () => ({
	publishCatalogue: vi.fn(),
	updateCatalogue: vi.fn(),
}));
// The General tab mounts an UploadThing dropzone, which calls its own route
// on mount and floods the run with ECONNREFUSED traces.
vi.mock("@/utils/uploadthing", () => ({
	UploadDropzone: () => null,
	UploadButton: () => null,
	Uploader: () => null,
}));
// Otherwise the Appearance tab fetches the theme library on mount and the run
// fills with ECONNREFUSED noise from a server that isn't there.
vi.mock("@/hooks/useSavedThemes", () => ({
	useSavedThemes: () => ({
		themes: [],
		loading: false,
		error: null,
		save: vi.fn(),
		remove: vi.fn(),
		refresh: vi.fn(),
	}),
}));

import BuilderSidebar from "@/components/catalogue/inputs/sidebar";
import {
	CatalogueContextProvider,
	useCatalogueContext,
} from "@/context/CatalogueContext";
import type { UserData } from "@quicktalog/common";

// Nothing here should reach the network; anything that tries gets an empty
// payload rather than an ECONNREFUSED trace across the run.
beforeEach(() => {
	vi.spyOn(globalThis, "fetch").mockResolvedValue(
		new Response("[]", { status: 200 }),
	);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

const userData = {
	currentPlan: { features: { branding: true } },
} as unknown as UserData;

/** Renders the bar inside the real provider and hands back its context. */
const setup = () => {
	const context: { current: ReturnType<typeof useCatalogueContext> | null } = {
		current: null,
	};
	const Probe = () => {
		context.current = useCatalogueContext();
		return null;
	};
	const { container } = render(
		<CatalogueContextProvider>
			<Probe />
			<BuilderSidebar userData={userData} />
		</CatalogueContextProvider>,
	);
	return {
		context,
		aside: () => container.querySelector("aside") as HTMLElement,
	};
};

const classesOf = (el: HTMLElement) => el.className.split(/\s+/);

describe("the builder bar and the AI chat share one thumb zone", () => {
	it("shows the bar while the chat is closed", () => {
		const { aside } = setup();

		expect(classesOf(aside())).toContain("flex");
		expect(classesOf(aside())).not.toContain("hidden");
	});

	it("steps aside on a phone once the chat is open, and returns on close", () => {
		const { context, aside } = setup();

		act(() => context.current?.setIsChatOpen(true));
		expect(classesOf(aside())).toContain("hidden");
		// ...but only on a phone: the desktop layout keeps both on screen.
		expect(classesOf(aside())).toContain("md:flex");

		act(() => context.current?.setIsChatOpen(false));
		expect(classesOf(aside())).toContain("flex");
		expect(classesOf(aside())).not.toContain("hidden");
	});

	/**
	 * withMT (material-tailwind) replaces Tailwind's screens, which stops every
	 * `max-*` variant from compiling - `max-md:hidden` silently does nothing in
	 * this project. Guard the fix against being "tidied" back into one.
	 */
	it("never reaches for a max-* variant, which does not compile here", () => {
		const { context, aside } = setup();

		act(() => context.current?.setIsChatOpen(true));

		expect(aside().className).not.toMatch(/\bmax-(sm|md|lg|xl):/);
	});

	/**
	 * A colour of its own made Ask AI look like the selected tab on a bar where
	 * nothing is selected until it is tapped.
	 */
	it("gives no bar item a selected look before anything is tapped", () => {
		setup();
		// Scoped to the phone bar: the desktop row renders the same actions, and
		// happy-dom applies no media queries, so both are in the document.
		const bar = within(
			screen.getByRole("toolbar", { name: "Builder actions" }),
		);

		for (const label of ["Ask AI", "Save", "Templates", "Preview"]) {
			const item = bar.getByRole("button", { name: label });
			expect(item.className).not.toMatch(/text-product-primary/);
		}
	});

	it("toggles the editor panel from the button in the bar", () => {
		const { context } = setup();

		act(() => screen.getByLabelText("Open editor panel").click());
		expect(context.current?.isSidebarOpen).toBe(true);

		act(() => screen.getByLabelText("Close editor panel").click());
		expect(context.current?.isSidebarOpen).toBe(false);
	});

	it("opens the chat and closes the editor panel from one tap", () => {
		const { context } = setup();
		act(() => context.current?.setIsSidebarOpen(true));

		act(() => screen.getByLabelText("Ask AI").click());

		expect(context.current?.isChatOpen).toBe(true);
		expect(context.current?.isSidebarOpen).toBe(false);
	});
});
