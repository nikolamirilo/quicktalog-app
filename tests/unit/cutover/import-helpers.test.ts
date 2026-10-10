import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	chooseEmail,
	digestImportable,
	loadCsv,
	normaliseProfile,
} from "@/scripts/cutover/migrate-clerk-to-supabase";

/**
 * The pure decisions inside the identity import. They are worth testing on
 * their own because the import itself cannot be run twice against real users:
 * every one of these answers decides whether a person can still sign in
 * afterwards.
 */

describe("chooseEmail", () => {
	it("prefers the primary address when it is verified", () => {
		expect(
			chooseEmail("Person@Example.com", ["person@example.com", "old@x.test"]),
		).toEqual({ email: "person@example.com", verified: true });
	});

	it("falls back to the only verified address", () => {
		expect(chooseEmail("unverified@example.com", ["only@example.com"])).toEqual(
			{
				email: "only@example.com",
				verified: true,
			},
		);
	});

	it("keeps an unverified primary, marked unverified", () => {
		expect(chooseEmail("person@example.com", [])).toEqual({
			email: "person@example.com",
			verified: false,
		});
	});

	it("will not guess between several verified addresses", () => {
		expect(chooseEmail(null, ["a@example.com", "b@example.com"])).toBeNull();
	});

	it("has nothing to work with when there is no address at all", () => {
		expect(chooseEmail(null, [])).toBeNull();
	});
});

describe("digestImportable", () => {
	it("accepts bcrypt and argon2 digests", () => {
		expect(digestImportable("$2b$10$abcdefghijklmnopqrstuv", null)).toBe(true);
		expect(digestImportable("$2a$10$abcdefghijklmnopqrstuv", null)).toBe(true);
		expect(
			digestImportable("$argon2id$v=19$m=65536,t=3,p=4$salt$hash", null),
		).toBe(true);
	});

	it("accepts a digest named by the hasher column", () => {
		expect(digestImportable("opaque-value", "bcrypt")).toBe(true);
		expect(digestImportable("opaque-value", "argon2id")).toBe(true);
	});

	it("refuses an unknown hasher, so the user is asked to reset instead", () => {
		expect(digestImportable("opaque-value", "scrypt")).toBe(false);
		expect(digestImportable("opaque-value", null)).toBe(false);
	});

	it("refuses a missing digest", () => {
		expect(digestImportable(null, "bcrypt")).toBe(false);
		expect(digestImportable("", "bcrypt")).toBe(false);
	});
});

describe("loadCsv", () => {
	const write = (contents: string) => {
		const path = join(mkdtempSync(join(tmpdir(), "clerk-csv-")), "users.csv");
		writeFileSync(path, contents);
		return path;
	};

	const header =
		"id,first_name,last_name,primary_email_address,verified_email_addresses,password_digest,password_hasher,totp_secret,backup_codes";

	it("drops MFA secrets at parse time so nothing downstream can carry them", () => {
		const path = write(
			`${header}\nuser_1,Ana,Ruiz,ana@example.com,ana@example.com,$2b$10$x,bcrypt,SECRETTOTP,backup-1\n`,
		);
		const [row] = loadCsv(path);
		expect(JSON.stringify(row)).not.toContain("SECRETTOTP");
		expect(JSON.stringify(row)).not.toContain("backup-1");
		expect(row.id).toBe("user_1");
	});

	it("refuses an export that is missing a required column", () => {
		const path = write("id,first_name\nuser_1,Ana\n");
		expect(() => loadCsv(path)).toThrow();
	});

	it("refuses an empty export rather than importing nobody", () => {
		expect(() => loadCsv(write(`${header}\n`))).toThrow();
	});
});

describe("normaliseProfile", () => {
	it("reads both the camelCase and snake_case shapes Clerk returns", () => {
		const camel = normaliseProfile({
			id: "user_1",
			primaryEmailAddressId: "idn_1",
			emailAddresses: [
				{
					id: "idn_1",
					emailAddress: "ana@example.com",
					verification: { status: "verified" },
				},
			],
			externalAccounts: [{ provider: "oauth_google", providerUserId: "g-1" }],
			firstName: "Ana",
			lastName: "Ruiz",
		});
		const snake = normaliseProfile({
			id: "user_1",
			primary_email_address_id: "idn_1",
			email_addresses: [
				{
					id: "idn_1",
					email_address: "ana@example.com",
					verification: { status: "verified" },
				},
			],
			external_accounts: [
				{ provider: "oauth_google", provider_user_id: "g-1" },
			],
			first_name: "Ana",
			last_name: "Ruiz",
		});

		expect(camel.id).toBe("user_1");
		expect(snake.id).toBe("user_1");
		expect(camel.primaryEmail).toBe(snake.primaryEmail);
		expect(camel.googleAccounts).toEqual(snake.googleAccounts);
	});
});
