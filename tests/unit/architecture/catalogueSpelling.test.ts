import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * One spelling. The product used to say "catalog" in the hero, the create dialog and
 * the page title, and "catalogue" in the plans, the dashboard and every toast.
 *
 * Two places keep the US spelling on purpose, and only those two:
 *
 *   * `src/constants/index.ts`'s keyword list, which is search terms rather than copy;
 *   * `src/content/articles/`, written to be found by people searching "digital
 *     catalog", whose web addresses are already shared.
 *
 * `pg_catalog` is a Postgres schema, not a word.
 */

const ROOT = join(__dirname, "..", "..", "..", "src");

const ALLOWED = [
	join("src", "content", "articles"),
	join("src", "constants", "index.ts"),
];

/** "catalog" or "catalogs" as a whole word; "catalogue" and `pg_catalog` do not match. */
const US_SPELLING = /(?<![A-Za-z_])[Cc]atalogs?(?![A-Za-z])/;

function* sourceFiles(dir: string): Generator<string> {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			yield* sourceFiles(path);
		} else if (path.endsWith(".ts") || path.endsWith(".tsx")) {
			yield path;
		}
	}
}

describe("the product says catalogue", () => {
	it("has no US spelling in UI copy, titles, meta or emails", () => {
		const offenders: string[] = [];

		for (const path of sourceFiles(ROOT)) {
			if (ALLOWED.some((allowed) => path.includes(allowed))) continue;
			const lines = readFileSync(path, "utf8").split("\n");
			lines.forEach((line, index) => {
				if (line.includes("pg_catalog")) return;
				if (US_SPELLING.test(line)) {
					offenders.push(`${path}:${index + 1} ${line.trim()}`);
				}
			});
		}

		expect(offenders).toEqual([]);
	});
});
