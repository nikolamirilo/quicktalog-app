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
	contact: { website: "acme.com" },
	partners: [],
} as unknown as Catalogue;

const withFooterType = (type: string) =>
	({ ...data, footer: { ...data.footer, type } }) as unknown as Catalogue;

describe("CatalogueFooter brand", () => {
	it("keeps the legal name in a custom footer without a logo", () => {
		render(<CatalogueFooter data={data} logo="" type="custom" />);
		expect(
			screen.getByRole("heading", { level: 3, name: "Acme Studio" }),
		).toBeTruthy();
	});

	it("sends our logo to Quicktalog once the footer is back to default", () => {
		render(
			<CatalogueFooter
				data={withFooterType("default")}
				logo="/images/brand/logo.svg"
				type="default"
			/>,
		);
		const link = screen.getByRole("link", { name: /Quicktalog homepage/ });
		expect(link.getAttribute("href")).toBe("/");
	});

	it("sends the owner's logo to the owner's website", () => {
		render(
			<CatalogueFooter data={data} logo="/uploads/acme.png" type="custom" />,
		);
		const link = screen.getByRole("link", { name: /Acme Studio homepage/ });
		expect(link.getAttribute("href")).toBe("https://acme.com");
	});
});
