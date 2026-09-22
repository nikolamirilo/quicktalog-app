import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";
import { describe, expect, it } from "vitest";

/**
 * Structural rules that keep the database perimeter intact. They are tests
 * rather than review notes because every one of them describes a mistake that
 * is easy to make and invisible in a diff: importing the admin connection into
 * a server action, switching roles outside the wrapper, or reaching the
 * database through anything but `utils/db`.
 *
 * Import specifiers are resolved (the `@/` alias is expanded and relative paths
 * are made repo-relative) so a rule cannot be dodged by changing the spelling.
 */

const ROOT = resolve(fileURLToPath(new URL("../../../", import.meta.url)));

const SOURCE_GLOBS = [
	"actions/**/*.{ts,tsx}",
	"agent/**/*.{ts,tsx}",
	"app/**/*.{ts,tsx}",
	"components/**/*.{ts,tsx}",
	"context/**/*.{ts,tsx}",
	"helpers/**/*.{ts,tsx}",
	"hooks/**/*.{ts,tsx}",
	"lib/**/*.{ts,tsx}",
	"utils/**/*.{ts,tsx}",
	"scripts/**/*.{ts,tsx}",
	"middleware.ts",
	"instrumentation.ts",
	"instrumentation-client.ts",
	"sentry.*.config.ts",
];

type SourceFile = { path: string; text: string; imports: string[] };

const IMPORT_RE =
	/(?:import\s[^;]*?from\s*|import\s*|export\s[^;]*?from\s*|require\()\s*["']([^"']+)["']/g;

/**
 * `import type` is erased at build time, so it cannot carry a connection into a
 * bundle. Counting it would make sharing a `Tx` type look like importing the
 * admin client.
 */
const TYPE_ONLY_RE = /^(?:import|export)\s+type\s/;

/** Repo-relative module path for an import, or the bare specifier for a package. */
function resolveSpecifier(fromFile: string, specifier: string): string {
	if (specifier.startsWith("@/")) return specifier.slice(2);
	if (specifier.startsWith(".")) {
		const dir = join(fromFile, "..");
		return relative(ROOT, resolve(ROOT, dir, specifier));
	}
	return specifier;
}

const files: SourceFile[] = fg
	.sync(SOURCE_GLOBS, { cwd: ROOT, dot: false })
	.map((path) => {
		const text = readFileSync(join(ROOT, path), "utf8");
		const imports: string[] = [];
		for (const match of text.matchAll(IMPORT_RE)) {
			const statement = text.slice(match.index ?? 0, (match.index ?? 0) + 40);
			if (TYPE_ONLY_RE.test(statement)) continue;
			imports.push(resolveSpecifier(path, match[1]));
		}
		return { path, text, imports };
	});

const importsOf = new Map(files.map((f) => [f.path, f.imports]));

const matches = (path: string, patterns: string[]) =>
	patterns.some((pattern) =>
		pattern.endsWith("**")
			? path.startsWith(pattern.slice(0, -2))
			: path === pattern ||
				path === `${pattern}.ts` ||
				path === `${pattern}.tsx`,
	);

/** Files importing `module`, excluding those explicitly allowed to. */
function importersOf(module: string, allowed: string[]): string[] {
	return files
		.filter(
			(f) =>
				f.imports.some((i) => i === module || i.startsWith(`${module}/`)) &&
				!matches(f.path, allowed),
		)
		.map((f) => f.path);
}

describe("database boundaries", () => {
	it("scans a meaningful number of files", () => {
		// A broken glob would make every rule below pass silently.
		expect(files.length).toBeGreaterThan(100);
	});

	it("nothing imports the deleted pre-RLS client", () => {
		expect(importersOf("utils/drizzle", [])).toEqual([]);
	});

	it("only the wrapper and the admin helper open a connection pool", () => {
		expect(
			importersOf("utils/db/pool", ["utils/db/rls", "utils/db/admin"]),
		).toEqual([]);
	});

	it("only system code imports the RLS-bypassing admin connection", () => {
		expect(
			importersOf("utils/db/admin", [
				"utils/db/index",
				"utils/db/pool",
				"utils/paddle/**",
				"app/api/paddle/**",
				"app/api/clerk/**",
				"lib/paddle/resolve-user",
				"lib/paddle/customer",
				"lib/users/provision",
				"lib/entitlements/catalogue",
				"scripts/**",
			]),
		).toEqual([]);
	});

	it("only the pool imports the raw postgres driver", () => {
		for (const module of ["postgres", "drizzle-orm/postgres-js"]) {
			expect(importersOf(module, ["utils/db/pool", "scripts/**"])).toEqual([]);
		}
	});

	it("only the identity module and the Clerk webhook use Clerk on the server", () => {
		expect(
			importersOf("@clerk/nextjs/server", [
				"lib/auth/identity",
				"lib/users/provision",
				"middleware",
				"app/api/clerk/**",
			]),
		).toEqual([]);
	});

	it("only the wrapper switches database roles", () => {
		const offenders = files.filter(
			(f) =>
				/set_config\(|SET\s+(SESSION\s+)?ROLE|RESET\s+(ROLE|ALL)/i.test(
					f.text,
				) && !matches(f.path, ["utils/db/rls", "utils/db/admin"]),
		);
		expect(offenders.map((f) => f.path)).toEqual([]);
	});

	it("only the account action and scripts can act as any user", () => {
		expect(
			importersOf("utils/supabase/auth-admin", [
				"actions/account",
				"scripts/**",
			]),
		).toEqual([]);
	});

	it("only the auth callbacks use the forwarded-IP auth client", () => {
		expect(
			importersOf("utils/supabase/server-forwarded", [
				"app/auth/callback/**",
				"app/auth/confirm/**",
				"utils/supabase/middleware",
			]),
		).toEqual([]);
	});

	it("the secret key is read only where a user IP must be forwarded", () => {
		// It skips captcha and carries auth.admin, so every reader is reviewed.
		const offenders = files.filter(
			(f) =>
				f.text.includes("SUPABASE_SECRET_KEY") &&
				!matches(f.path, [
					"utils/supabase/server-forwarded",
					"utils/supabase/middleware",
					"utils/supabase/auth-admin",
					"app/auth/callback/**",
					"app/auth/confirm/**",
					"scripts/**",
				]),
		);
		expect(offenders.map((f) => f.path)).toEqual([]);
	});

	it("no application code queries data through supabase-js", () => {
		const offenders = files.filter(
			(f) =>
				/supabase[A-Za-z]*\s*(\.|\n\s*\.)\s*(from|rpc|schema)\(/.test(f.text) &&
				!matches(f.path, ["scripts/**"]),
		);
		expect(offenders.map((f) => f.path)).toEqual([]);
	});

	it("no server action takes an owner id as its first parameter", () => {
		const offenders: string[] = [];
		for (const f of files) {
			if (!/^["']use server["']/m.test(f.text)) continue;
			const signature = /export\s+async\s+function\s+\w+\s*\(\s*(\w+)\s*:/g;
			for (const match of f.text.matchAll(signature)) {
				if (["userId", "ownerId", "createdBy"].includes(match[1])) {
					offenders.push(`${f.path}:${match[1]}`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});

	it("only reviewed server actions can reach the admin connection", () => {
		// Transitive: an action that imports a helper that imports asAdmin is just
		// as dangerous as importing it directly.
		const reaches = (start: string, seen = new Set<string>()): boolean => {
			if (seen.has(start)) return false;
			seen.add(start);
			for (const dep of importsOf.get(start) ?? []) {
				if (dep === "utils/db/admin") return true;
				for (const candidate of [
					dep,
					`${dep}.ts`,
					`${dep}.tsx`,
					`${dep}/index.ts`,
				]) {
					if (importsOf.has(candidate) && reaches(candidate, seen)) return true;
				}
			}
			return false;
		};

		const allowed = ["lib/paddle/checkout", "actions/account", "actions/users"];
		const offenders = files
			.filter((f) => /^["']use server["']/m.test(f.text))
			.filter((f) => !matches(f.path, allowed))
			.filter((f) => reaches(f.path))
			.map((f) => f.path);
		expect(offenders).toEqual([]);
	});

	it("every owner-scoped write in actions names the owner column", () => {
		// Heuristic but cheap: RLS already limits the rows, and the explicit
		// predicate is the second lock. A write without one is either a bug or a
		// deliberate exception that belongs in a reviewed lib module.
		const offenders: string[] = [];
		for (const f of files.filter((f) => f.path.startsWith("actions/"))) {
			const lines = f.text.split("\n");
			lines.forEach((line, index) => {
				if (!/\btx\s*\n?\s*\.(update|delete)\(/.test(line)) return;
				const window = lines.slice(index, index + 20).join("\n");
				if (!/createdBy|userId|ownerId|me\.userId/.test(window)) {
					offenders.push(`${f.path}:${index + 1}`);
				}
			});
		}
		expect(offenders).toEqual([]);
	});
});
