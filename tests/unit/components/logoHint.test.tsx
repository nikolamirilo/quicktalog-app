// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LogoHint } from "@/components/catalogue/inputs/sidebar/general/LogoHint";
import { catalogueLogos } from "@/lib/catalogue/logo";

afterEach(cleanup);

const HINT = /Your logo shows in a custom header or footer/;

describe("LogoHint", () => {
	it("shows the custom header hint when a logo is set but header and footer are default", () => {
		render(<LogoHint footerType="default" headerType="default" logo="x.png" />);
		expect(screen.getByText(HINT)).toBeTruthy();
	});

	it("hides the hint when the header is custom", () => {
		render(<LogoHint footerType="default" headerType="custom" logo="x.png" />);
		expect(screen.queryByText(HINT)).toBeNull();
	});

	it("hides the hint when the footer is custom", () => {
		render(<LogoHint footerType="custom" headerType="default" logo="x.png" />);
		expect(screen.queryByText(HINT)).toBeNull();
	});

	it("hides the hint when there is no logo", () => {
		render(<LogoHint footerType="default" headerType="default" logo="" />);
		expect(screen.queryByText(HINT)).toBeNull();
	});
});

describe("catalogueLogos", () => {
	it("shows the user's logo in a custom footer even when the header is default", () => {
		expect(
			catalogueLogos(
				{ logo: "x.png", headerType: "default", footerType: "custom" },
				"/default.svg",
			),
		).toEqual({ header: "/default.svg", footer: "x.png" });
	});

	it("keeps the default logo in a default footer under a custom header", () => {
		expect(
			catalogueLogos(
				{ logo: "x.png", headerType: "custom", footerType: "default" },
				"/default.svg",
			),
		).toEqual({ header: "x.png", footer: "/default.svg" });
	});
});
