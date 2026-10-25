// @vitest-environment happy-dom
import type { Catalogue } from "@quicktalog/common";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/newsletter", () => ({ newsletterSignup: vi.fn() }));
vi.mock("@/context/CatalogueContext", () => ({
	useCatalogueContext: () => null,
}));

import CatalogueFooter from "@/components/catalogue/view/CatalogueFooter";

afterEach(cleanup);

const data = {
	name: "acme",
	legal: { legalName: "Acme Studio" },
	footer: { type: "custom" },
	partners: [],
} as unknown as Catalogue;

describe("CatalogueFooter brand", () => {
	it("keeps the legal name in a custom footer without a logo", () => {
		render(<CatalogueFooter data={data} logo="" type="custom" />);
		expect(
			screen.getByRole("heading", { level: 3, name: "Acme Studio" }),
		).toBeTruthy();
	});
});
