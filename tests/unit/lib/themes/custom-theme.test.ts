import { describe, expect, it } from "vitest";
import {
	customThemeColorsEqual,
	deriveCatalogueVars,
	isTextReadableOnCard,
} from "@/lib/themes/custom-theme";

describe("deriveCatalogueVars card text", () => {
	it("uses the Text colour on cards when it reads", () => {
		const vars = deriveCatalogueVars({
			text: "#1d4ed8",
			cardBackground: "#ffffff",
		});
		expect(vars["--catalogue-card-heading"]).toBe("#1d4ed8");
		expect(vars["--catalogue-card-text"]).toBe("#1d4ed8");
	});

	it("nudges an unreadable Text colour toward black on a light card", () => {
		const colors = { text: "#00ff33", cardBackground: "#c8b7b7" };
		const vars = deriveCatalogueVars(colors);
		expect(isTextReadableOnCard(colors)).toBe(false);
		expect(vars["--catalogue-card-text"]).not.toBe("#00ff33");
		expect(vars["--catalogue-card-text"]).not.toBe("#111111");
	});

	it("leaves the page title on the Heading colour", () => {
		const vars = deriveCatalogueVars({ heading: "#ffffff", text: "#000000" });
		expect(vars["--catalogue-heading"]).toBe("#ffffff");
		expect(vars["--catalogue-card-text"]).toBe("#000000");
	});
});

describe("customThemeColorsEqual", () => {
	it("ignores hex case and invalid values", () => {
		expect(
			customThemeColorsEqual(
				{ background: "#FFFFFF", text: "#1A1A1A" },
				{ background: "#ffffff", text: "#1a1a1a" },
			),
		).toBe(true);
		expect(
			customThemeColorsEqual({ text: "#1a1a1a" }, { text: "#1a1a1b" }),
		).toBe(false);
	});
});
