// @vitest-environment happy-dom
import { isExecutableScript } from "@/components/catalogue/sections/CustomCode";
import { describe, expect, it } from "vitest";

const script = (type?: string): HTMLScriptElement => {
	const el = document.createElement("script");
	if (type !== undefined) el.setAttribute("type", type);
	return el;
};

describe("isExecutableScript", () => {
	it("treats real script types as code to re-execute", () => {
		expect(isExecutableScript(script())).toBe(true);
		expect(isExecutableScript(script(""))).toBe(true);
		expect(isExecutableScript(script("text/javascript"))).toBe(true);
		expect(isExecutableScript(script("TEXT/JavaScript"))).toBe(true);
		expect(isExecutableScript(script("module"))).toBe(true);
	});

	it("leaves data blocks alone", () => {
		// Re-creating these used to delete the JSON a widget reads its items from,
		// so the widget then threw `null.textContent` and rendered nothing.
		expect(isExecutableScript(script("application/json"))).toBe(false);
		expect(isExecutableScript(script("application/ld+json"))).toBe(false);
		expect(isExecutableScript(script("text/template"))).toBe(false);
		expect(isExecutableScript(script("importmap"))).toBe(false);
	});
});
