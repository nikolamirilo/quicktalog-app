import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Author-supplied HTML runs in an iframe. `sandbox="allow-scripts"` without
 * `allow-same-origin` is the whole isolation: with both, the frame shares our
 * origin and can read cookies and localStorage, and can even remove its own
 * sandbox attribute.
 *
 * A source-level test because the risk is a one-word edit, and nothing else
 * would notice it.
 */
const source = readFileSync(
	fileURLToPath(
		new URL(
			"../../../components/catalogue/sections/CustomCode.tsx",
			import.meta.url,
		),
	),
	"utf8",
);

describe("custom code sandbox", () => {
	it("runs author code with scripts but not same-origin", () => {
		expect(source).toContain('sandbox="allow-scripts"');
	});

	it("never grants allow-same-origin", () => {
		expect(source).not.toMatch(/sandbox="[^"]*allow-same-origin/);
	});
});
