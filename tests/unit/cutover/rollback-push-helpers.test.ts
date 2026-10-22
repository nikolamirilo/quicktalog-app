import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	type AuthUserRow,
	bcryptDigest,
	decidePush,
	fingerprint,
} from "@/scripts/cutover/push-supabase-users-to-clerk";

/**
 * The decisions the rollback push makes about real people. Each one either
 * carries somebody back to Clerk or leaves them locked out, and the script
 * itself can only be exercised during an incident, so they are tested here.
 */

const row = (overrides: Partial<AuthUserRow> = {}): AuthUserRow => ({
	banned_until: null,
	deleted_at: null,
	email: "person@example.com",
	email_confirmed_at: new Date("2026-09-20T10:00:00Z"),
	encrypted_password: "$2a$10$abcdefghijklmnopqrstuv",
	id: "11111111-1111-4111-8111-111111111111",
	...overrides,
});

const NOW = new Date("2026-09-22T12:00:00Z");

describe("decidePush", () => {
	it("pushes a confirmed, unbanned user", () => {
		expect(decidePush(row(), NOW)).toEqual({ push: true });
	});

	it("will not push an unconfirmed address, which nobody has proven they own", () => {
		expect(decidePush(row({ email_confirmed_at: null }), NOW)).toEqual({
			push: false,
			reason: "unconfirmed",
		});
	});

	it("will not push a banned user, because the new Clerk account would be unbanned", () => {
		expect(
			decidePush(row({ banned_until: new Date("2027-01-01T00:00:00Z") }), NOW),
		).toEqual({ push: false, reason: "banned" });
	});

	it("pushes a user whose ban has already expired", () => {
		expect(
			decidePush(row({ banned_until: new Date("2026-09-01T00:00:00Z") }), NOW),
		).toEqual({ push: true });
	});

	it("will not push a soft-deleted user", () => {
		expect(decidePush(row({ deleted_at: NOW }), NOW)).toEqual({
			push: false,
			reason: "deleted",
		});
	});

	it("has nothing to create an account from without an email", () => {
		expect(decidePush(row({ email: null }), NOW)).toEqual({
			push: false,
			reason: "no-email",
		});
	});

	it("checks deletion before anything else, so a deleted user is never pushed", () => {
		expect(
			decidePush(
				row({ deleted_at: NOW, email: null, email_confirmed_at: null }),
				NOW,
			),
		).toEqual({ push: false, reason: "deleted" });
	});
});

describe("bcryptDigest", () => {
	it("accepts the digests GoTrue writes", () => {
		expect(bcryptDigest("$2a$10$abcdefghijklmnopqrstuv")).toBe(
			"$2a$10$abcdefghijklmnopqrstuv",
		);
		expect(bcryptDigest("$2b$10$abcdefghijklmnopqrstuv")).not.toBeNull();
		expect(bcryptDigest("$2y$12$abcdefghijklmnopqrstuv")).not.toBeNull();
	});

	it("refuses anything Clerk cannot be handed, so the user resets instead", () => {
		expect(bcryptDigest("$argon2id$v=19$m=65536,t=3,p=4$salt$hash")).toBeNull();
		expect(bcryptDigest("$2a$xx$notacostfactor")).toBeNull();
		expect(bcryptDigest("plaintext")).toBeNull();
		expect(bcryptDigest(null)).toBeNull();
		expect(bcryptDigest("")).toBeNull();
	});
});

describe("fingerprint", () => {
	it("matches the sha256 the import records, so drift can be detected", () => {
		const digest = "$2a$10$abcdefghijklmnopqrstuv";
		expect(fingerprint(digest)).toBe(
			createHash("sha256").update(digest, "utf8").digest("hex"),
		);
	});

	it("differs once the password has been changed", () => {
		expect(fingerprint("$2a$10$before")).not.toBe(fingerprint("$2a$10$after"));
	});

	it("never returns the digest itself", () => {
		expect(fingerprint("$2a$10$abcdefghijklmnopqrstuv")).not.toContain("$2a$");
	});
});
