// @vitest-environment happy-dom
import type { Catalogue } from "@quicktalog/common";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LogoSection from "@/components/catalogue/inputs/sidebar/logo/LogoSection";

afterEach(cleanup);

const catalogue = (logo: string) =>
	({
		logo,
		header: { type: "custom", logoSize: { width: 160, height: 100 } },
		footer: { type: "custom", logoSize: { width: 160, height: 100 } },
	}) as unknown as Catalogue;

const SHORTCUT = "Upload a logo";

describe("LogoSection", () => {
	it("offers the upload shortcut and holds the sliders inert without a logo", () => {
		render(
			<LogoSection
				catalogue={catalogue("")}
				handleChange={vi.fn()}
				onOpenLogo={vi.fn()}
				scope="header"
			/>,
		);
		const shortcut = screen.getByRole("button", { name: SHORTCUT });
		expect(shortcut).toBeTruthy();
		expect(
			screen.getByRole("slider", { name: "Logo size" }).closest("[inert]"),
		).toBeTruthy();
	});

	it("drops the shortcut and frees the sliders once a logo is uploaded", () => {
		render(
			<LogoSection
				catalogue={catalogue("/uploads/acme.png")}
				handleChange={vi.fn()}
				onOpenLogo={vi.fn()}
				scope="header"
			/>,
		);
		expect(screen.queryByRole("button", { name: SHORTCUT })).toBeNull();
		expect(
			screen.getByRole("slider", { name: "Logo size" }).closest("[inert]"),
		).toBeNull();
	});

	it("takes the reader to the upload", async () => {
		const onOpenLogo = vi.fn();
		render(
			<LogoSection
				catalogue={catalogue("")}
				handleChange={vi.fn()}
				onOpenLogo={onOpenLogo}
				scope="footer"
			/>,
		);
		screen.getByRole("button", { name: SHORTCUT }).click();
		expect(onOpenLogo).toHaveBeenCalledOnce();
	});

	it("names the rounding control and starts square", () => {
		render(
			<LogoSection
				catalogue={catalogue("/uploads/acme.png")}
				handleChange={vi.fn()}
				onOpenLogo={vi.fn()}
				scope="footer"
			/>,
		);
		expect(
			screen.getByRole("slider", { name: "Corner rounding" }),
		).toBeTruthy();
		expect(screen.getByText("Square")).toBeTruthy();
	});
});
