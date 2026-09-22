import { mkdtempSync, writeFileSync } from "node:fs";
import { hashSync } from "bcryptjs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * The Clerk instance the rehearsal imports from.
 *
 * Each fixture is one of the cases plan 5.6 names, and each one exists because
 * it is a decision the import can get wrong in a way that locks somebody out:
 * an unverified address, a digest Supabase cannot take, an account with no
 * password at all, a banned account, MFA, a Clerk user with no row in
 * `public.users`, a `public.users` row whose Clerk user is gone, and a paying
 * user nobody mapped.
 *
 * The bcrypt fixtures carry a digest of `REHEARSAL_PASSWORD` at cost 10, so the
 * rehearsal can prove that an imported user can still sign in afterwards.
 */

export const REHEARSAL_PASSWORD = "CutoverRehearsal!1";

/**
 * Generated rather than pasted. A digest copied from somewhere is a digest
 * nobody has checked, and the sign-in assertion is the whole point of the
 * password fixtures: it proves an imported user can still get in.
 */
const BCRYPT = hashSync(REHEARSAL_PASSWORD, 10);

export type Fixture = {
	id: string;
	email: string;
	verified: boolean;
	digest: string | null;
	hasher: string | null;
	googleSub: string | null;
	banned: boolean;
	mfa: boolean;
	/** A `public.users` row is seeded for this Clerk id. */
	ownsRow: boolean;
	catalogues: number;
	customerId: string | null;
	note: string;
};

export const FIXTURES: Fixture[] = [
	{
		banned: false,
		catalogues: 1,
		customerId: null,
		digest: BCRYPT,
		email: "password@rehearsal.test",
		googleSub: null,
		hasher: "bcrypt",
		id: "user_2rehearsalpassword0001",
		mfa: false,
		note: "the happy path: bcrypt digest, verified, owns data — must be able to sign in afterwards",
		ownsRow: true,
		verified: true,
	},
	{
		banned: false,
		catalogues: 1,
		customerId: null,
		digest: BCRYPT,
		email: "unverified@rehearsal.test",
		googleSub: null,
		hasher: "bcrypt",
		id: "user_2rehearsalunverified02",
		mfa: false,
		note: "unverified address on an account that owns catalogues — skipped, verify-in-clerk",
		ownsRow: true,
		verified: false,
	},
	{
		banned: false,
		catalogues: 0,
		customerId: null,
		digest: "$scrypt$ln=16,r=8,p=1$c2FsdA$aGFzaA",
		email: "scrypt@rehearsal.test",
		googleSub: null,
		hasher: "scrypt",
		id: "user_2rehearsalscrypt000003",
		mfa: false,
		note: "a hasher Supabase cannot take — imported without a password, needs a reset",
		ownsRow: true,
		verified: true,
	},
	{
		banned: false,
		catalogues: 1,
		customerId: null,
		digest: null,
		email: "google@rehearsal.test",
		googleSub: "118000000000000000004",
		hasher: null,
		id: "user_2rehearsalgoogle000004",
		mfa: false,
		note: "Google-only: no digest, one federated identity",
		ownsRow: true,
		verified: true,
	},
	{
		banned: true,
		catalogues: 0,
		customerId: null,
		digest: BCRYPT,
		email: "banned@rehearsal.test",
		googleSub: null,
		hasher: "bcrypt",
		id: "user_2rehearsalbanned000005",
		mfa: false,
		note: "banned in Clerk — the ban must survive the import",
		ownsRow: true,
		verified: true,
	},
	{
		banned: false,
		catalogues: 0,
		customerId: null,
		digest: BCRYPT,
		email: "mfa@rehearsal.test",
		googleSub: null,
		hasher: "bcrypt",
		id: "user_2rehearsalmfa0000000006",
		mfa: true,
		note: "MFA enabled — the password is deliberately not imported (the second factor would be lost)",
		ownsRow: true,
		verified: true,
	},
	{
		banned: false,
		catalogues: 0,
		customerId: null,
		digest: BCRYPT,
		email: "norow@rehearsal.test",
		googleSub: null,
		hasher: "bcrypt",
		id: "user_2rehearsalnorow00000007",
		mfa: false,
		note: "a Clerk user that never got a public.users row — the re-key must not invent one",
		ownsRow: false,
		verified: true,
	},
	{
		banned: false,
		catalogues: 1,
		customerId: "ctm_rehearsal_paying",
		digest: BCRYPT,
		email: "paying@rehearsal.test",
		googleSub: null,
		hasher: "bcrypt",
		id: "user_2rehearsalpaying0000008",
		mfa: false,
		note: "carries a Paddle customer_id — the re-key must refuse while this one is unmapped",
		ownsRow: true,
		verified: true,
	},
];

/**
 * A `public.users` row whose Clerk user no longer exists (12.6 orphan triage),
 * carrying a Paddle `customer_id`. That combination is the go/no-go blocker:
 * the import exits non-zero and the re-key refuses to start, because a paying
 * user left behind on a Clerk id can never be updated again once the NOT VALID
 * check lands. The rehearsal triages it and re-runs, the way an operator would.
 */
export const ORPHAN = {
	catalogues: 1,
	customerId: "ctm_rehearsal_orphan",
	email: "orphan@rehearsal.test",
	id: "user_2rehearsalorphan000009",
};

const CSV_HEADER = [
	"id",
	"first_name",
	"last_name",
	"primary_email_address",
	"verified_email_addresses",
	"password_digest",
	"password_hasher",
	"totp_secret",
	"backup_codes",
];

function csvCell(value: unknown): string {
	const text = value === null || value === undefined ? "" : String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Writes the two files the import reads: the dashboard CSV (the only self-serve
 * source of digests) and the Backend API snapshot. Returns the directory.
 */
export function writeFixtureFiles(exportedAt: Date): {
	dir: string;
	csvPath: string;
	fixturePath: string;
} {
	const dir = mkdtempSync(join(tmpdir(), "cutover-rehearsal-"));

	const rows = FIXTURES.map((fixture) => [
		fixture.id,
		"Test",
		"Person",
		fixture.email,
		fixture.verified ? fixture.email : "",
		fixture.digest ?? "",
		fixture.hasher ?? "",
		fixture.mfa ? "JBSWY3DPEHPK3PXP" : "",
		fixture.mfa ? "11111111,22222222" : "",
	]);
	const csvPath = join(dir, "users.csv");
	writeFileSync(
		csvPath,
		`${[CSV_HEADER, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`,
		"utf8",
	);

	const fixturePath = join(dir, "clerk.json");
	writeFileSync(
		fixturePath,
		JSON.stringify(
			{
				totalCount: FIXTURES.length,
				users: FIXTURES.map((fixture) => ({
					banned: fixture.banned,
					createdAt: new Date("2026-01-01T00:00:00Z").getTime(),
					emailAddresses: [
						{
							emailAddress: fixture.email,
							id: `idn_${fixture.id}`,
							verification: {
								status: fixture.verified ? "verified" : "unverified",
							},
						},
					],
					externalAccounts: fixture.googleSub
						? [
								{
									emailAddress: fixture.email,
									imageUrl: "https://lh3.googleusercontent.com/a/rehearsal",
									provider: "oauth_google",
									providerUserId: fixture.googleSub,
									verification: { status: "verified" },
								},
							]
						: [],
					firstName: "Test",
					id: fixture.id,
					lastName: "Person",
					lastSignInAt: new Date("2026-09-01T00:00:00Z").getTime(),
					primaryEmailAddressId: `idn_${fixture.id}`,
					publicMetadata: {},
					// `raw` must be present or a --delta run refuses; the digest here has
					// not changed since the export.
					raw: {
						password_last_updated_at: new Date(
							exportedAt.getTime() - 86_400_000,
						).toISOString(),
					},
					totpEnabled: fixture.mfa,
					twoFactorEnabled: fixture.mfa,
				})),
			},
			null,
			"\t",
		),
		"utf8",
	);

	return { csvPath, dir, fixturePath };
}
