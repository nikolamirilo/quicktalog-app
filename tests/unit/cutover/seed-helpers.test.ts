import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readSeedUsers } from "@/scripts/cutover/seed-test-users-from-csv";

/**
 * The CSV → `public.users` mapping. At 2000+ rows nobody reads the output, so
 * the decisions it makes per row are worth pinning down.
 */

const HEADER =
	"id,first_name,last_name,primary_email_address,verified_email_addresses,password_digest,password_hasher,totp_secret";

const write = (body: string) => {
	const path = join(mkdtempSync(join(tmpdir(), "seed-csv-")), "users.csv");
	writeFileSync(path, `${HEADER}\n${body}`);
	return path;
};

describe("readSeedUsers", () => {
	it("keeps the Clerk id as the key, so the re-key has something to re-key", () => {
		const users = readSeedUsers(
			write("user_1,Ana,Ruiz,ana@example.com,ana@example.com,,,\n"),
		);
		expect(users).toEqual([
			{ email: "ana@example.com", id: "user_1", name: "Ana Ruiz" },
		]);
	});

	it("joins the name from both columns", () => {
		const [user] = readSeedUsers(
			write("user_1,Ana,,ana@example.com,ana@example.com,,,\n"),
		);
		expect(user.name).toBe("Ana");
	});

	it("falls back to the email local part when Clerk has no name", () => {
		const [user] = readSeedUsers(
			write("user_1,,,ana.ruiz@example.com,ana.ruiz@example.com,,,\n"),
		);
		expect(user.name).toBe("ana.ruiz");
	});

	it("lowercases the address, matching what the import will look up", () => {
		const [user] = readSeedUsers(
			write("user_1,Ana,Ruiz,Ana@Example.COM,Ana@Example.COM,,,\n"),
		);
		expect(user.email).toBe("ana@example.com");
	});

	it("skips a row with no address rather than inventing one", () => {
		// The import would skip them too, so seeding one guarantees an orphan.
		expect(readSeedUsers(write("user_1,Ana,Ruiz,,,,,\n"))).toEqual([]);
	});

	it("never carries an MFA secret through", () => {
		const users = readSeedUsers(
			write("user_1,Ana,Ruiz,ana@example.com,ana@example.com,,,SECRETTOTP\n"),
		);
		expect(JSON.stringify(users)).not.toContain("SECRETTOTP");
	});

	it("refuses an export missing a required column", () => {
		const path = join(mkdtempSync(join(tmpdir(), "seed-csv-")), "bad.csv");
		writeFileSync(path, "id,first_name\nuser_1,Ana\n");
		expect(() => readSeedUsers(path)).toThrow();
	});
});
