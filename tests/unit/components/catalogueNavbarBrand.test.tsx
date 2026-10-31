// @vitest-environment happy-dom
import type { Catalogue } from "@quicktalog/common";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/context/CatalogueContext", () => ({
	useCatalogueContext: () => null,
}));

import CatalogueHeader from "@/components/catalogue/view/CatalogueHeader";

afterEach(cleanup);

const data = (header: Record<string, unknown>, website = "acme.com") =>
	({
		name: "acme",
		contact: { website },
		header: { logoSize: { width: 100, height: 100 }, ...header },
	}) as unknown as Catalogue;

describe("CatalogueHeader brand", () => {
	it("sends our logo to Quicktalog once the navbar is back to default", () => {
		render(
			<CatalogueHeader
				data={data({ type: "default" })}
				logo="/images/brand/logo.svg"
				type="default"
			/>,
		);
		const link = screen.getByRole("link", { name: /Quicktalog homepage/ });
		expect(link.getAttribute("href")).toBe("/");
	});

	it("sends the owner's logo to the owner's website", () => {
		render(
			<CatalogueHeader
				data={data({ type: "custom" })}
				logo="/uploads/acme.png"
				type="custom"
			/>,
		);
		const link = screen.getByRole("link", { name: /homepage/ });
		expect(link.getAttribute("href")).toBe("https://acme.com");
	});

	it("links nowhere when a custom navbar has no website", () => {
		render(
			<CatalogueHeader
				data={data({ type: "custom" }, "")}
				logo="/uploads/acme.png"
				type="custom"
			/>,
		);
		expect(screen.queryByRole("link", { name: /homepage/ })).toBeNull();
		expect(screen.getByAltText("Company logo")).toBeTruthy();
	});

	it("draws a custom logo at its share of what the navbar allows", () => {
		render(
			<CatalogueHeader
				data={data({ type: "custom", logoScale: 50 })}
				logo="/uploads/acme.png"
				type="custom"
			/>,
		);
		const style = screen.getByAltText("Company logo").getAttribute("style");
		expect(style).toContain("height: 28px");
		expect(style).not.toContain("width");
	});

	it("fills the navbar at 100%, and treats older data as full size", () => {
		render(
			<CatalogueHeader
				data={data({ type: "custom", logoScale: 100 })}
				logo="/uploads/acme.png"
				type="custom"
			/>,
		);
		expect(screen.getByAltText("Company logo").getAttribute("style")).toContain(
			"height: 56px",
		);
		cleanup();

		render(
			<CatalogueHeader
				data={data({ type: "custom" })}
				logo="/uploads/acme.png"
				type="custom"
			/>,
		);
		expect(screen.getByAltText("Company logo").getAttribute("style")).toContain(
			"height: 56px",
		);
	});

	it("rounds the logo to a circle at 100%", () => {
		render(
			<CatalogueHeader
				data={data({ type: "custom", logoRadius: 100 })}
				logo="/uploads/acme.png"
				type="custom"
			/>,
		);
		expect(screen.getByAltText("Company logo").getAttribute("style")).toContain(
			"border-radius: 50%",
		);
	});

	it("never rounds or rescales our own logo", () => {
		render(
			<CatalogueHeader
				data={data({ type: "default", logoRadius: 100, logoScale: 10 })}
				logo="/images/brand/logo.svg"
				type="default"
			/>,
		);
		const style = screen.getByAltText("Quicktalog logo").getAttribute("style");
		expect(style).toContain("width: 160px");
		expect(style).not.toContain("border-radius");
		expect(style).not.toContain("height");
	});
});
