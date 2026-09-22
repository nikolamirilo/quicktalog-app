/**
 * Clerk -> Supabase Auth identity import (PLAN 6.1-6.5, runbook steps at T-3
 * and T-0 step 6).
 *
 *   DRY_RUN=1 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
 *   DRY_RUN=0 ALLOW_PROD=1 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts --delta
 *
 * Operator machine only. Never Vercel, never CI for PROD.
 *
 * The one ordering rule that everything else hangs off: **the uuid is claimed
 * in `migration.clerk_user_map` before `auth.admin.createUser` is called**. The
 * sign-up trigger (M10, PATCH P5) skips a user that is already in the map, and
 * GoTrue only writes `app_metadata` in a later UPDATE — so if the row were
 * written after the create, the trigger would have already given the imported
 * user a second, empty `public.users` row.
 *
 * Idempotence: the claim is an upsert on `clerk_user_id`, creation is skipped
 * when the uuid already exists in `auth.users`, and identities are inserted
 * `on conflict do nothing`. A second run therefore repairs and re-reports; it
 * never creates a duplicate.
 *
 * Secrets: a password digest is read from the CSV into memory, passed to
 * GoTrue or to Postgres as a bound parameter, and fingerprinted as sha256 for
 * V12. It is never printed, never written to a report and never read back out
 * of the database. Emails are masked everywhere except in the map table.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import {
	fail,
	type Guard,
	guard,
	mapWithConcurrency,
	maskEmail,
	maskSub,
	redact,
} from "../lib/guard";

/* -------------------------------------------------------------------------- */
/* Inputs                                                                     */
/* -------------------------------------------------------------------------- */

type Options = {
	delta: boolean;
	allowDelete: boolean;
	csvOnly: boolean;
	only: string[];
	fixture: string | null;
	outDir: string;
	outDirExplicit: boolean;
	concurrency: number;
};

function parseArgs(argv: string[]): Options {
	const only: string[] = [];
	let fixture = process.env.CLERK_FIXTURE ?? null;
	let outDir = process.env.OUT_DIR ?? "cutover-out";
	let outDirExplicit = Boolean(process.env.OUT_DIR);

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--only")
			only.push(...(argv[++i] ?? "").split(",").filter(Boolean));
		else if (arg.startsWith("--only="))
			only.push(...arg.slice(7).split(",").filter(Boolean));
		else if (arg === "--fixture") fixture = argv[++i] ?? null;
		else if (arg.startsWith("--fixture=")) fixture = arg.slice(10);
		else if (arg === "--out") {
			outDir = argv[++i] ?? outDir;
			outDirExplicit = true;
		} else if (arg.startsWith("--out=")) {
			outDir = arg.slice(6);
			outDirExplicit = true;
		} else if (!["--delta", "--allow-delete", "--csv-only"].includes(arg)) {
			throw new Error(`unknown argument ${arg}`);
		}
	}

	return {
		allowDelete: argv.includes("--allow-delete"),
		concurrency: Number(process.env.CONCURRENCY ?? 4) || 4,
		csvOnly: argv.includes("--csv-only"),
		delta: argv.includes("--delta"),
		fixture,
		only,
		outDir,
		outDirExplicit,
	};
}

/* -------------------------------------------------------------------------- */
/* The Clerk CSV export                                                       */
/* -------------------------------------------------------------------------- */

/** Columns the import actually needs. Extra columns are tolerated. */
const REQUIRED_CSV_COLUMNS = [
	"id",
	"primary_email_address",
	"verified_email_addresses",
	"password_digest",
	"password_hasher",
];

/**
 * Columns that are MFA secret material. They are dropped the moment the file is
 * parsed so that nothing downstream — a report, an error, a JSON dump — can
 * carry them.
 */
const DROPPED_CSV_COLUMNS = ["totp_secret", "backup_codes", "web3_wallets"];

type CsvUser = {
	id: string;
	primaryEmail: string | null;
	verifiedEmails: string[];
	/** Never logged, never written to a file. */
	digest: string | null;
	hasher: string | null;
};

function splitEmails(cell: string | undefined): string[] {
	if (!cell) return [];
	return cell
		.split(/[,;\s]+/)
		.map((value) => value.trim().toLowerCase())
		.filter((value) => value.includes("@"));
}

export function loadCsv(path: string): CsvUser[] {
	const rows = parse(readFileSync(path), {
		bom: true,
		columns: true,
		skip_empty_lines: true,
		trim: true,
	}) as Record<string, string>[];

	if (rows.length === 0) throw new Error("the Clerk CSV export has no rows");

	const header = Object.keys(rows[0]);
	const missing = REQUIRED_CSV_COLUMNS.filter(
		(column) => !header.includes(column),
	);
	if (missing.length > 0) {
		throw new Error(
			`the CSV is missing expected columns: ${missing.join(", ")}`,
		);
	}
	const secretColumns = DROPPED_CSV_COLUMNS.filter((column) =>
		header.includes(column),
	);
	if (secretColumns.length > 0) {
		console.log(
			`  CSV carries MFA secret columns (dropped at parse): ${secretColumns.join(", ")}`,
		);
	}

	return rows.map((row) => {
		for (const column of DROPPED_CSV_COLUMNS) delete row[column];
		const primary = row.primary_email_address?.trim().toLowerCase() || null;
		return {
			digest: row.password_digest?.trim() || null,
			hasher: row.password_hasher?.trim().toLowerCase() || null,
			id: row.id?.trim(),
			primaryEmail: primary,
			verifiedEmails: splitEmails(row.verified_email_addresses),
		};
	});
}

/* -------------------------------------------------------------------------- */
/* The Clerk profile snapshot (Backend API or fixture)                        */
/* -------------------------------------------------------------------------- */

type GoogleAccount = {
	sub: string;
	email: string | null;
	verified: boolean;
	imageUrl: string | null;
};

type ClerkProfile = {
	id: string;
	primaryEmail: string | null;
	verifiedEmails: string[];
	fullName: string;
	googleAccounts: GoogleAccount[];
	cookieConsent: unknown;
	createdAt: Date | null;
	lastSignInAt: Date | null;
	mfaEnabled: boolean;
	banned: boolean;
	passwordLastUpdatedAt: Date | null;
	/** False when Clerk returned no `raw` payload: `--delta` aborts on it. */
	hasRaw: boolean;
};

type ClerkSnapshot = { totalCount: number; profiles: ClerkProfile[] };

const GOOGLE_AVATAR = /^https:\/\/lh[0-9]+\.googleusercontent\.com\//;

function toDate(value: unknown): Date | null {
	if (typeof value === "number" && Number.isFinite(value))
		return new Date(value);
	if (typeof value === "string" && value) {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}
	return null;
}

/** Normalises one `@clerk/backend` User (the fixture uses the same shape). */
export function normaliseProfile(user: Record<string, any>): ClerkProfile {
	const emails: Record<string, any>[] =
		user.emailAddresses ?? user.email_addresses ?? [];
	const primaryId =
		user.primaryEmailAddressId ?? user.primary_email_address_id ?? null;
	const primary =
		emails.find((entry) => entry.id === primaryId) ?? emails[0] ?? null;

	const external: Record<string, any>[] =
		user.externalAccounts ?? user.external_accounts ?? [];
	const googleAccounts = external
		.filter(
			(account) =>
				String(account.provider ?? "").replace("oauth_", "") === "google",
		)
		.filter(
			(account) => (account.verification?.status ?? "verified") === "verified",
		)
		.map((account) => {
			const imageUrl =
				account.imageUrl ?? account.image_url ?? account.avatarUrl ?? null;
			return {
				email:
					(
						account.emailAddress ??
						account.email_address ??
						null
					)?.toLowerCase() ?? null,
				imageUrl:
					typeof imageUrl === "string" && GOOGLE_AVATAR.test(imageUrl)
						? imageUrl
						: null,
				sub: String(account.providerUserId ?? account.provider_user_id ?? ""),
				verified: true,
			};
		})
		.filter((account) => account.sub.length > 0);

	const metadata = user.publicMetadata ?? user.public_metadata ?? {};
	const name = [
		user.firstName ?? user.first_name,
		user.lastName ?? user.last_name,
	]
		.map((part) => (typeof part === "string" ? part.trim() : ""))
		.filter(Boolean)
		.join(" ");

	const raw = user.raw ?? null;

	return {
		banned: Boolean(user.banned ?? user.locked ?? false),
		cookieConsent: metadata?.cookieConsent ?? metadata?.cookie_consent ?? null,
		createdAt: toDate(user.createdAt ?? user.created_at),
		fullName: name.slice(0, 200),
		googleAccounts,
		hasRaw: raw !== null && raw !== undefined,
		id: String(user.id),
		lastSignInAt: toDate(user.lastSignInAt ?? user.last_sign_in_at),
		mfaEnabled:
			Boolean(
				user.totpEnabled ??
					user.totp_enabled ??
					user.backupCodeEnabled ??
					user.backup_code_enabled,
			) || Boolean(user.twoFactorEnabled ?? user.two_factor_enabled),
		passwordLastUpdatedAt: toDate(raw?.password_last_updated_at),
		primaryEmail:
			(
				primary?.emailAddress ??
				primary?.email_address ??
				null
			)?.toLowerCase() ?? null,
		verifiedEmails: emails
			.filter((entry) => (entry.verification?.status ?? null) === "verified")
			.map((entry) =>
				String(entry.emailAddress ?? entry.email_address ?? "").toLowerCase(),
			)
			.filter(Boolean),
	};
}

function loadFixture(path: string): ClerkSnapshot {
	const parsed = JSON.parse(readFileSync(path, "utf8"));
	const users: Record<string, any>[] = Array.isArray(parsed)
		? parsed
		: (parsed.users ?? parsed.data);
	if (!Array.isArray(users)) {
		throw new Error(
			"the fixture must be an array of Clerk users or { totalCount, users: [...] }",
		);
	}
	return {
		profiles: users.map(normaliseProfile),
		totalCount: Array.isArray(parsed)
			? users.length
			: (parsed.totalCount ?? users.length),
	};
}

/** Pages the Clerk Backend API, retrying 429s. Aborts on a short list. */
async function loadFromClerk(secretKey: string): Promise<ClerkSnapshot> {
	const { createClerkClient } = await import("@clerk/backend");
	const clerk = createClerkClient({ secretKey });

	const profiles: ClerkProfile[] = [];
	let totalCount = 0;
	for (let offset = 0; ; offset += 500) {
		let page: { data: Record<string, any>[]; totalCount: number } | null = null;
		for (let attempt = 0; attempt < 5 && !page; attempt++) {
			try {
				page = (await clerk.users.getUserList({
					limit: 500,
					offset,
					orderBy: "+created_at",
				})) as unknown as { data: Record<string, any>[]; totalCount: number };
			} catch (error) {
				const status = (error as { status?: number }).status;
				if (status !== 429 || attempt === 4) throw error;
				await new Promise((resolve) =>
					setTimeout(resolve, 2000 * (attempt + 1)),
				);
			}
		}
		if (!page) throw new Error("the Clerk user list could not be fetched");
		totalCount = page.totalCount;
		profiles.push(...page.data.map(normaliseProfile));
		if (profiles.length >= totalCount || page.data.length === 0) break;
	}

	// A partial list must never look like a set of deletions.
	if (profiles.length !== totalCount) {
		throw new Error(
			`Clerk returned ${profiles.length} users but reports totalCount ${totalCount} — refusing to act on a partial list`,
		);
	}
	return { profiles, totalCount };
}

/* -------------------------------------------------------------------------- */
/* Decisions (pure; unit-testable without a database)                         */
/* -------------------------------------------------------------------------- */

export type EmailChoice = { email: string; verified: boolean } | null;

/**
 * PLAN 6.3 step 1: verified primary; else the single verified secondary; else
 * the unverified primary. Anything else has no usable email.
 */
export function chooseEmail(
	primaryEmail: string | null,
	verifiedEmails: string[],
): EmailChoice {
	const primary = primaryEmail?.trim().toLowerCase() || null;
	const verified = [
		...new Set(verifiedEmails.map((email) => email.trim().toLowerCase())),
	];
	if (primary && verified.includes(primary))
		return { email: primary, verified: true };
	if (verified.length === 1) return { email: verified[0], verified: true };
	if (primary) return { email: primary, verified: false };
	return null;
}

/** Supabase accepts bcrypt and argon2 digests; everything else means a reset. */
export function digestImportable(
	digest: string | null,
	hasher: string | null,
): boolean {
	if (!digest) return false;
	if (/^\$2[aby]\$/.test(digest)) return true;
	if (/^\$argon2[a-z]*\$/.test(digest)) return true;
	const named = (hasher ?? "").toLowerCase();
	return named.startsWith("bcrypt") || named.startsWith("argon2");
}

type Plan = {
	clerkUserId: string;
	email: string | null;
	emailVerified: boolean;
	fullName: string;
	banned: boolean;
	mfaEnabled: boolean;
	ownsData: boolean;
	digest: string | null;
	hasher: string | null;
	importPassword: boolean;
	passwordStale: boolean;
	googleAccounts: GoogleAccount[];
	avatarUrl: string | null;
	cookieConsent: unknown;
	createdAt: Date | null;
	lastSignInAt: Date | null;
	skip: string | null;
};

function buildPlan(
	csv: CsvUser | null,
	profile: ClerkProfile | null,
	ownsData: boolean,
	exportedAt: Date,
): Plan {
	const primaryEmail = profile?.primaryEmail ?? csv?.primaryEmail ?? null;
	const verifiedEmails = profile
		? profile.verifiedEmails
		: (csv?.verifiedEmails ?? []);
	const choice = chooseEmail(primaryEmail, verifiedEmails);

	const mfaEnabled = profile?.mfaEnabled ?? false;
	const importable = digestImportable(csv?.digest ?? null, csv?.hasher ?? null);
	const passwordStale = Boolean(
		profile?.passwordLastUpdatedAt &&
			profile.passwordLastUpdatedAt > exportedAt,
	);

	// 6.3 step 2: an unverified email on an account that owns catalogues or is
	// billed is the one case that must not be imported — a later Google sign-in
	// could otherwise claim the migrated data through GoTrue's handling of an
	// unconfirmed identity.
	let skip: string | null = null;
	if (!choice) skip = "no-email";
	else if (!choice.verified && ownsData) skip = "verify-in-clerk";

	return {
		avatarUrl:
			profile?.googleAccounts.find((account) => account.imageUrl)?.imageUrl ??
			null,
		banned: profile?.banned ?? false,
		clerkUserId: csv?.id ?? profile?.id ?? "",
		cookieConsent: profile?.cookieConsent ?? null,
		createdAt: profile?.createdAt ?? null,
		digest: csv?.digest ?? null,
		email: choice?.email ?? null,
		emailVerified: choice?.verified ?? false,
		fullName: profile?.fullName ?? "",
		googleAccounts: profile?.googleAccounts ?? [],
		hasher: csv?.hasher ?? null,
		// 6.3 step 4 / 6.5: MFA users are imported without a password until
		// Supabase TOTP enrolment exists, and a digest changed after the export
		// would silently roll a password back.
		importPassword: importable && !mfaEnabled && !passwordStale && !skip,
		lastSignInAt: profile?.lastSignInAt ?? null,
		mfaEnabled,
		ownsData,
		passwordStale,
		skip,
	};
}

/* -------------------------------------------------------------------------- */
/* Outcomes and reports                                                       */
/* -------------------------------------------------------------------------- */

type Status = "migrated" | "conflict" | "skipped" | "error" | "deleted";

type Outcome = {
	clerkUserId: string;
	supabaseUserId: string | null;
	status: Status;
	emailMasked: string;
	emailVerified: boolean;
	passwordImported: boolean;
	passwordHasher: string | null;
	googleSubMasked: string;
	mfaEnabled: boolean;
	banned: boolean;
	ownsData: boolean;
	needsReset: boolean;
	detail: string | null;
	actions: string[];
};

function csvCell(value: unknown): string {
	const text = value === null || value === undefined ? "" : String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsvFile(path: string, header: string[], rows: unknown[][]): void {
	const body = [header, ...rows]
		.map((row) => row.map(csvCell).join(","))
		.join("\n");
	writeFileSync(path, `${body}\n`, "utf8");
}

/* -------------------------------------------------------------------------- */
/* Database helpers                                                           */
/* -------------------------------------------------------------------------- */

type Db = Guard["sql"];

async function assertPreconditions(db: Db): Promise<void> {
	const [map] = await db<{ present: boolean }[]>`
		select to_regclass('migration.clerk_user_map') is not null as present`;
	if (!map.present) {
		throw new Error(
			"migration.clerk_user_map is missing: apply M10 before importing",
		);
	}

	const [trigger] = await db<{ aware: boolean }[]>`
		select coalesce(
			(select pg_get_functiondef(p.oid) like '%clerk_user_map%'
			   from pg_catalog.pg_proc p
			   join pg_catalog.pg_namespace n on n.oid = p.pronamespace
			  where n.nspname = 'private' and p.proname = 'handle_auth_user_created'
			  limit 1), false) as aware`;
	if (!trigger.aware) {
		throw new Error(
			"private.handle_auth_user_created does not consult migration.clerk_user_map: M10 is missing or outdated, and every imported user would get a second public.users row",
		);
	}
}

/** Clerk-id rows in `public.users`, with whether they own anything. */
async function loadOwnership(
	db: Db,
): Promise<Map<string, { ownsData: boolean; billed: boolean }>> {
	const rows = await db<{ id: string; billed: boolean; owns: boolean }[]>`
		select u.id,
		       u.customer_id is not null as billed,
		       (u.customer_id is not null
		        or exists (select 1 from public.catalogues c where c.created_by = u.id)) as owns
		  from public.users u
		 where u.id like 'user\\_%'`;
	return new Map(
		rows.map((row) => [row.id, { billed: row.billed, ownsData: row.owns }]),
	);
}

/**
 * Claims the uuid. The insert is the point of no return for a user: from here
 * the sign-up trigger will skip this identity, so the row must always end in a
 * terminal status, even when the import then decides to skip it.
 */
async function claimUuid(
	db: Db,
	plan: Plan,
): Promise<{ id: string; status: string }> {
	const [row] = await db<{ supabase_user_id: string; status: string }[]>`
		insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, email, status)
		values (${plan.clerkUserId}, gen_random_uuid(), ${plan.email}, 'claimed')
		on conflict (clerk_user_id) do update
			set email = excluded.email, updated_at = now()
		returning supabase_user_id, status`;
	return { id: row.supabase_user_id, status: row.status };
}

async function recordOutcome(
	db: Db,
	plan: Plan,
	status: Status,
	detail: string | null,
): Promise<void> {
	await db`
		update migration.clerk_user_map set
			status                = ${status},
			email                 = ${plan.email},
			email_verified        = ${plan.email ? plan.emailVerified : null},
			password_imported     = ${status === "migrated" && plan.importPassword},
			password_hasher       = ${plan.hasher},
			google_sub            = ${plan.googleAccounts[0]?.sub ?? null},
			avatar_url            = ${plan.avatarUrl},
			cookie_consent        = ${plan.cookieConsent ? JSON.stringify(plan.cookieConsent) : null},
			mfa_enabled           = ${plan.mfaEnabled},
			banned                = ${plan.banned},
			owns_data             = ${plan.ownsData},
			clerk_created_at      = ${plan.createdAt},
			clerk_last_sign_in_at = ${plan.lastSignInAt},
			detail                = ${detail},
			updated_at            = now()
		where clerk_user_id = ${plan.clerkUserId}`;
}

/**
 * Fingerprints for V12. sha256 of a bcrypt digest is not reversible and is
 * never compared to anything but another fingerprint, so verify.sql can prove
 * "every imported password is still the T-0 password" without a digest ever
 * leaving memory.
 */
async function recordDigestFingerprint(
	db: Db,
	uuid: string,
	digest: string | null,
): Promise<void> {
	if (!digest) {
		await db`delete from migration.t0_password_digests where supabase_user_id = ${uuid}::uuid`;
		return;
	}
	const fingerprint = createHash("sha256").update(digest, "utf8").digest("hex");
	await db`
		insert into migration.t0_password_digests (supabase_user_id, digest_sha256)
		values (${uuid}::uuid, ${fingerprint})
		on conflict (supabase_user_id) do update
			set digest_sha256 = excluded.digest_sha256, recorded_at = now()`;
}

async function ensureFingerprintTable(db: Db): Promise<void> {
	await db`
		create table if not exists migration.t0_password_digests (
			supabase_user_id uuid primary key,
			digest_sha256    text not null,
			recorded_at      timestamptz not null default now())`;
	await db`revoke all on table migration.t0_password_digests from public`;
}

/* -------------------------------------------------------------------------- */
/* The import                                                                 */
/* -------------------------------------------------------------------------- */

type Context = {
	guard: Guard;
	options: Options;
	postCutover: boolean;
	exportedAt: Date;
};

async function importUser(context: Context, plan: Plan): Promise<Outcome> {
	const { guard: rail, options } = context;
	const db = rail.sql;
	const actions: string[] = [];

	const outcome: Outcome = {
		actions,
		banned: plan.banned,
		clerkUserId: plan.clerkUserId,
		detail: null,
		emailMasked: maskEmail(plan.email),
		emailVerified: plan.emailVerified,
		googleSubMasked: maskSub(plan.googleAccounts[0]?.sub),
		mfaEnabled: plan.mfaEnabled,
		needsReset: false,
		ownsData: plan.ownsData,
		passwordHasher: plan.hasher,
		passwordImported: false,
		status: "migrated",
		supabaseUserId: null,
	};

	// 1. Claim first, always — even for a skip, so the row has a terminal status.
	let uuid: string;
	if (rail.dryRun) {
		const [existing] = await db<{ supabase_user_id: string }[]>`
			select supabase_user_id from migration.clerk_user_map where clerk_user_id = ${plan.clerkUserId}`;
		uuid = existing?.supabase_user_id ?? "(would claim a new uuid)";
		actions.push(existing ? "uuid already claimed" : "would claim a uuid");
	} else {
		const claimed = await claimUuid(db, plan);
		uuid = claimed.id;
		actions.push(
			claimed.status === "claimed"
				? "claimed a uuid"
				: `map row was ${claimed.status}`,
		);
	}
	outcome.supabaseUserId = uuid;

	// 2. Skips decided before any identity exists.
	if (plan.skip) {
		outcome.status = "skipped";
		outcome.detail = plan.skip;
		if (!rail.dryRun) await recordOutcome(db, plan, "skipped", plan.skip);
		return outcome;
	}

	// 3. Does the identity already exist? (Idempotence, and post-cutover mode.)
	const existing =
		rail.dryRun && uuid.startsWith("(")
			? null
			: ((await rail.auth.getUserById(uuid)).data?.user ?? null);

	if (existing && !options.delta) {
		actions.push("auth user already exists — left untouched");
	} else if (existing && options.delta) {
		const changed = await syncExistingUser(
			context,
			plan,
			uuid,
			outcome,
			actions,
		);
		if (changed === "conflict") return outcome;
	} else {
		const created = await createUser(context, plan, uuid, outcome, actions);
		if (!created) return outcome;
	}

	// 4. Google identities (6.4): a pre-created identity binds the next Google
	// sign-in to this uuid by `sub`, which beats GoTrue's email linking.
	for (const account of plan.googleAccounts) {
		const taken = await db<{ user_id: string }[]>`
			select user_id::text from auth.identities
			 where provider = 'google' and provider_id = ${account.sub}`;
		if (taken.length > 0 && taken[0].user_id !== uuid) {
			outcome.status = "conflict";
			outcome.detail = `google sub ${maskSub(account.sub)} belongs to another user`;
			if (!rail.dryRun)
				await recordOutcome(db, plan, "conflict", outcome.detail);
			return outcome;
		}
		if (taken.length > 0) {
			actions.push("google identity already present");
			continue;
		}
		if (rail.dryRun) {
			actions.push(`would create the google identity ${maskSub(account.sub)}`);
			continue;
		}
		await db`
			insert into auth.identities (id, provider_id, user_id, provider, identity_data, created_at, updated_at)
			values (gen_random_uuid(), ${account.sub}, ${uuid}::uuid, 'google',
				${JSON.stringify({
					email: account.email ?? plan.email,
					email_verified: true,
					provider_id: account.sub,
					sub: account.sub,
				})}::jsonb, now(), now())
			on conflict (provider_id, provider) do nothing`;
		actions.push(`created the google identity ${maskSub(account.sub)}`);
	}

	// 5. Password evidence for V12 and for needs-reset.csv.
	outcome.passwordImported = plan.importPassword;
	outcome.needsReset = !plan.importPassword;
	if (!rail.dryRun) {
		await recordDigestFingerprint(
			db,
			uuid,
			plan.importPassword ? plan.digest : null,
		);
		await recordOutcome(db, plan, "migrated", outcome.detail);
	}
	return outcome;
}

/** Creates the identity. Returns false when the outcome is already decided. */
async function createUser(
	context: Context,
	plan: Plan,
	uuid: string,
	outcome: Outcome,
	actions: string[],
): Promise<boolean> {
	const { guard: rail } = context;
	if (rail.dryRun) {
		actions.push(
			`would create ${outcome.emailMasked} (confirmed=${plan.emailVerified}, password=${plan.importPassword ? (plan.hasher ?? "digest") : "none"}${plan.banned ? ", banned" : ""})`,
		);
		return true;
	}

	const { error } = await rail.auth.createUser({
		app_metadata: { clerk_user_id: plan.clerkUserId },
		ban_duration: plan.banned ? "876000h" : undefined,
		email: plan.email ?? undefined,
		email_confirm: plan.emailVerified,
		id: uuid,
		password_hash: plan.importPassword ? (plan.digest ?? undefined) : undefined,
		user_metadata: plan.fullName ? { full_name: plan.fullName } : {},
	});

	if (error) {
		const message = redact(error);
		const isConflict = /email_exists|already.*registered|duplicate key/i.test(
			message,
		);
		outcome.status = isConflict ? "conflict" : "error";
		outcome.detail = isConflict ? "email_exists" : message.slice(0, 300);
		await recordOutcome(
			context.guard.sql,
			plan,
			outcome.status,
			outcome.detail,
		);
		return false;
	}
	actions.push("created the auth user");

	// Optional fidelity (6.3 step 6): keep the Clerk sign-up date.
	if (plan.createdAt) {
		await context.guard.sql`
			update auth.users set created_at = ${plan.createdAt} where id = ${uuid}::uuid`;
	}
	return true;
}

/**
 * `--delta` at T-0: the identity exists from the T-3 import, and only what
 * changed in Clerk since is carried over. Row DML for the digest, the admin API
 * for everything GoTrue owns.
 */
async function syncExistingUser(
	context: Context,
	plan: Plan,
	uuid: string,
	outcome: Outcome,
	actions: string[],
): Promise<"ok" | "conflict"> {
	const { guard: rail } = context;
	const db = rail.sql;

	// The digest is compared inside Postgres; only a boolean comes back.
	if (plan.importPassword && plan.digest) {
		const [row] = await db<{ matches: boolean }[]>`
			select (encrypted_password is not distinct from ${plan.digest}) as matches
			  from auth.users where id = ${uuid}::uuid`;
		if (!row?.matches) {
			if (rail.dryRun) actions.push("would update the password digest");
			else {
				await db`
					update auth.users set encrypted_password = ${plan.digest}, updated_at = now()
					 where id = ${uuid}::uuid`;
				actions.push("updated the password digest");
			}
		}
	}

	if (!rail.dryRun) {
		const { error } = await rail.auth.updateUserById(uuid, {
			ban_duration: plan.banned ? "876000h" : "none",
			email: plan.email ?? undefined,
			email_confirm: plan.emailVerified,
		});
		if (error) {
			const message = redact(error);
			outcome.status = /email_exists|already.*registered/i.test(message)
				? "conflict"
				: "error";
			outcome.detail = message.slice(0, 300);
			await recordOutcome(db, plan, outcome.status, outcome.detail);
			return "conflict";
		}
		actions.push("synced email, confirmation and ban state");
	} else {
		actions.push("would sync email, confirmation and ban state");
	}

	// Google accounts unlinked in Clerk must not keep a way in here.
	const subs = plan.googleAccounts.map((account) => account.sub);
	const stale = await db<{ provider_id: string }[]>`
		select provider_id from auth.identities
		 where user_id = ${uuid}::uuid and provider = 'google'
		   and provider_id <> all(${subs.length > 0 ? subs : [""]}::text[])`;
	for (const row of stale) {
		if (rail.dryRun) {
			actions.push(
				`would delete the stale google identity ${maskSub(row.provider_id)}`,
			);
			continue;
		}
		await db`
			delete from auth.identities
			 where user_id = ${uuid}::uuid and provider = 'google' and provider_id = ${row.provider_id}`;
		actions.push(
			`deleted the stale google identity ${maskSub(row.provider_id)}`,
		);
	}
	return "ok";
}

/* -------------------------------------------------------------------------- */
/* Destructive cleanup (pre-cutover only)                                     */
/* -------------------------------------------------------------------------- */

async function cleanupDeletedClerkUsers(
	context: Context,
	knownClerkIds: Set<string>,
): Promise<Outcome[]> {
	const { guard: rail, options } = context;
	const db = rail.sql;
	if (!options.allowDelete) return [];
	if (context.postCutover) {
		throw new Error(
			"--allow-delete is refused after the re-key: those uuids now own rows",
		);
	}
	if (options.csvOnly || options.only.length > 0) {
		throw new Error(
			"--allow-delete needs the full Clerk list, so it cannot run with --csv-only or --only",
		);
	}

	const rows = await db<
		{ clerk_user_id: string; supabase_user_id: string; email: string | null }[]
	>`
		select clerk_user_id, supabase_user_id::text, email
		  from migration.clerk_user_map
		 where status <> 'deleted'`;
	const gone = rows.filter((row) => !knownClerkIds.has(row.clerk_user_id));
	if (gone.length === 0) return [];

	const cap = Math.max(3, Math.ceil(knownClerkIds.size * 0.01));
	if (gone.length > cap) {
		throw new Error(
			`${gone.length} mapped users are missing from the Clerk list, over the safety cap of ${cap} — investigate before deleting anything`,
		);
	}

	const outcomes: Outcome[] = [];
	for (const row of gone) {
		const actions: string[] = [];
		if (rail.dryRun)
			actions.push("would delete the auth user (gone from Clerk)");
		else {
			const { error } = await rail.auth.deleteUser(row.supabase_user_id);
			if (error && !/not.*found/i.test(redact(error)))
				throw new Error(redact(error));
			await db`
				update migration.clerk_user_map
				   set status = 'deleted', detail = 'clerk user no longer exists', updated_at = now()
				 where clerk_user_id = ${row.clerk_user_id}`;
			actions.push("deleted the auth user (gone from Clerk)");
		}
		outcomes.push({
			actions,
			banned: false,
			clerkUserId: row.clerk_user_id,
			detail: "clerk user no longer exists",
			emailMasked: maskEmail(row.email),
			emailVerified: false,
			googleSubMasked: "",
			mfaEnabled: false,
			needsReset: false,
			ownsData: false,
			passwordHasher: null,
			passwordImported: false,
			status: "deleted",
			supabaseUserId: row.supabase_user_id,
		});
	}
	return outcomes;
}

/* -------------------------------------------------------------------------- */
/* Reconciliation C1-C8                                                       */
/* -------------------------------------------------------------------------- */

type Check = {
	id: string;
	description: string;
	value: string;
	expected: string;
	pass: boolean;
};

async function reconcile(
	context: Context,
	snapshot: ClerkSnapshot,
	csvUsers: CsvUser[],
	plans: Plan[],
	orphans: string[],
): Promise<Check[]> {
	const db = context.guard.sql;
	const checks: Check[] = [];
	const add = (
		id: string,
		description: string,
		value: unknown,
		expected: unknown,
	) =>
		checks.push({
			description,
			expected: String(expected),
			id,
			pass: String(value) === String(expected),
			value: String(value),
		});

	const createdAfterExport = snapshot.profiles.filter(
		(profile) => profile.createdAt && profile.createdAt > context.exportedAt,
	).length;
	const deletedAfterExport = Number(
		process.env.CLERK_DELETED_AFTER_EXPORT ?? 0,
	);
	add(
		"C1",
		"Clerk totalCount = CSV rows + created after EXPORTED_AT - deleted after it",
		snapshot.totalCount,
		csvUsers.length + createdAfterExport - deletedAfterExport,
	);

	const [counts] = await db<
		{
			total: number;
			migrated: number;
			claimed: number;
			deleted: number;
			password_imported: number;
			google: number;
		}[]
	>`
		select count(*)::int                                          as total,
		       count(*) filter (where status = 'migrated')::int        as migrated,
		       count(*) filter (where status = 'claimed')::int         as claimed,
		       count(*) filter (where status = 'deleted')::int         as deleted,
		       count(*) filter (where password_imported)::int          as password_imported,
		       count(*) filter (where google_sub is not null)::int     as google
		  from migration.clerk_user_map`;

	add(
		"C2",
		"map rows = Clerk totalCount + deleted rows",
		counts.total,
		snapshot.totalCount + counts.deleted,
	);

	const [authRows] = await db<{ mapped: number }[]>`
		select count(*)::int as mapped
		  from auth.users a
		  join migration.clerk_user_map m on m.supabase_user_id = a.id`;
	add(
		"C3",
		"map 'migrated' = auth.users rows that are in the map",
		counts.migrated,
		authRows.mapped,
	);

	add("C4", "no map row is still 'claimed'", counts.claimed, 0);

	const importable = plans.filter((plan) => plan.importPassword).length;
	add(
		"C5",
		"password_imported = importable, non-stale, non-MFA CSV rows",
		counts.password_imported,
		importable,
	);

	const [identities] = await db<{ google: number }[]>`
		select count(*)::int as google from auth.identities where provider = 'google'`;
	add(
		"C6",
		"google identities = map rows with a google_sub",
		identities.google,
		counts.google,
	);

	const [clerkRows] = await db<{ total: number; mapped: number }[]>`
		select count(*)::int as total,
		       count(*) filter (
		         where exists (select 1 from migration.clerk_user_map m where m.clerk_user_id = u.id))::int as mapped
		  from public.users u
		 where u.id like 'user\\_%'`;
	add(
		"C7",
		"public.users Clerk-id rows = mapped rows + listed orphans",
		clerkRows.total,
		clerkRows.mapped + orphans.length,
	);

	checks.push({
		description: "V1-V12 run after the re-key with scripts/cutover/verify.sql",
		expected: "run separately",
		id: "C8",
		pass: true,
		value: "not run here",
	});
	return checks;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));

	const csvPath = process.env.CLERK_CSV;
	if (!csvPath)
		throw new Error(
			"CLERK_CSV is not set (path to the Clerk export on the encrypted volume)",
		);
	const exportedAtRaw = process.env.EXPORTED_AT;
	if (!exportedAtRaw)
		throw new Error(
			"EXPORTED_AT is not set (UTC ISO timestamp of the CSV export)",
		);
	const exportedAt = new Date(exportedAtRaw);
	if (Number.isNaN(exportedAt.getTime()))
		throw new Error("EXPORTED_AT does not parse");
	const exportAge = Date.now() - exportedAt.getTime();
	if (options.delta && exportAge > 24 * 60 * 60 * 1000) {
		throw new Error("--delta needs a CSV exported less than 24 hours ago");
	}
	if (exportAge < 0) throw new Error("EXPORTED_AT is in the future");

	if (process.env.DRY_RUN === "0" && !options.outDirExplicit) {
		throw new Error(
			"set OUT_DIR (or --out) to a directory on the encrypted volume before a live run",
		);
	}

	const csvUsers = loadCsv(csvPath);

	const rail = await guard({
		details: [
			`csv          ${csvUsers.length} rows, exported ${exportedAt.toISOString()}`,
			`mode         ${options.delta ? "delta (T-0)" : "initial (T-3)"}${options.only.length > 0 ? ` --only ${options.only.length} user(s)` : ""}`,
			`reports      ${options.outDir}`,
		],
		intent: "create Supabase Auth identities for Clerk users",
		script: "migrate-clerk-to-supabase",
		writes: true,
	});

	try {
		await rail.assertSameInstance();

		// The Clerk key must belong to the same environment as everything else.
		const clerkKey = process.env.CLERK_SECRET_KEY;
		if (clerkKey?.startsWith("sk_live_") && rail.environment !== "prod") {
			throw new Error(
				"a live Clerk key with a non-PROD Supabase project — refusing",
			);
		}
		if (clerkKey?.startsWith("sk_test_") && rail.environment === "prod") {
			throw new Error(
				"a Clerk development key with the PROD Supabase project — refusing",
			);
		}

		// Sign-ups must be closed, or a real person could take a claimed email
		// between the claim and the create.
		const settings = await fetch(`${rail.supabaseUrl}/auth/v1/settings`, {
			headers: { apikey: process.env.SUPABASE_SECRET_KEY ?? "" },
		});
		if (!settings.ok)
			throw new Error(`GET /auth/v1/settings returned ${settings.status}`);
		const settingsBody = (await settings.json()) as {
			disable_signup?: boolean;
		};
		if (settingsBody.disable_signup !== true) {
			throw new Error(
				"the project still accepts sign-ups: set disable_signup=true before importing",
			);
		}

		await assertPreconditions(rail.sql);

		// Post-cutover mode: uuids already own rows in public.users.
		const [mode] = await rail.sql<{ post_cutover: boolean }[]>`
			select exists (
				select 1 from migration.clerk_user_map m
				  join public.users u on u.id = m.supabase_user_id::text) as post_cutover`;
		if (mode.post_cutover) {
			console.log(
				"  post-cutover mode: no deletes, no recreates, repairs only",
			);
			if (options.allowDelete)
				throw new Error("--allow-delete is refused after the re-key");
		}

		// Profiles: the Clerk API, a fixture, or the CSV alone.
		let snapshot: ClerkSnapshot;
		if (options.fixture) {
			snapshot = loadFixture(options.fixture);
			console.log(
				`  profiles from the fixture ${options.fixture} (${snapshot.profiles.length})`,
			);
		} else if (clerkKey && !options.csvOnly) {
			snapshot = await loadFromClerk(clerkKey);
			console.log(
				`  profiles from the Clerk API (${snapshot.profiles.length} of ${snapshot.totalCount})`,
			);
		} else if (options.csvOnly) {
			snapshot = { profiles: [], totalCount: csvUsers.length };
			console.log(
				"  --csv-only: no Google identities, no consents, no created_at fidelity",
			);
		} else {
			throw new Error(
				"no profile source: set CLERK_SECRET_KEY, pass --fixture, or accept --csv-only",
			);
		}

		// 6.3 delta: `raw` must be present, never assumed absent.
		if (options.delta && snapshot.profiles.some((profile) => !profile.hasRaw)) {
			throw new Error(
				"some Clerk users came back without a raw payload, so password_last_updated_at cannot be read — refusing the delta run",
			);
		}

		if (!rail.dryRun) await ensureFingerprintTable(rail.sql);

		const ownership = await loadOwnership(rail.sql);
		const csvById = new Map(csvUsers.map((user) => [user.id, user]));
		const profileById = new Map(
			snapshot.profiles.map((profile) => [profile.id, profile]),
		);
		const allIds = [...new Set([...csvById.keys(), ...profileById.keys()])];
		const selected =
			options.only.length > 0
				? allIds.filter((id) => options.only.includes(id))
				: allIds;

		const plans = selected
			.map((id) =>
				buildPlan(
					csvById.get(id) ?? null,
					profileById.get(id) ?? null,
					ownership.get(id)?.ownsData ?? false,
					exportedAt,
				),
			)
			.sort(
				(a, b) =>
					(a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
					a.clerkUserId.localeCompare(b.clerkUserId),
			);

		const context: Context = {
			exportedAt,
			guard: rail,
			options,
			postCutover: mode.post_cutover,
		};

		console.log(
			`  processing ${plans.length} Clerk users at concurrency ${options.concurrency}`,
		);
		const outcomes = await mapWithConcurrency(
			plans,
			options.concurrency,
			async (plan) => {
				try {
					return await importUser(context, plan);
				} catch (error) {
					const detail = redact(error).slice(0, 300);
					try {
						if (!rail.dryRun) {
							await recordOutcome(rail.sql, plan, "error", detail);
						}
					} catch {
						// The map write is best effort; the report below is the record.
					}
					return {
						actions: [],
						banned: plan.banned,
						clerkUserId: plan.clerkUserId,
						detail,
						emailMasked: maskEmail(plan.email),
						emailVerified: plan.emailVerified,
						googleSubMasked: "",
						mfaEnabled: plan.mfaEnabled,
						needsReset: true,
						ownsData: plan.ownsData,
						passwordHasher: plan.hasher,
						passwordImported: false,
						status: "error" as Status,
						supabaseUserId: null,
					};
				}
			},
		);

		const knownClerkIds = new Set(allIds);
		const deletions = await cleanupDeletedClerkUsers(context, knownClerkIds);
		const all = [...outcomes, ...deletions];

		// Orphans: a Clerk-id row in public.users that no Clerk user owns.
		const orphanRows = [...ownership.keys()].filter(
			(id) => !knownClerkIds.has(id),
		);
		const billedOrphans = orphanRows.filter((id) => ownership.get(id)?.billed);

		writeReports(context, all, plans, orphanRows, ownership);

		const partial = options.only.length > 0 || options.csvOnly;
		const checks = partial
			? []
			: await reconcile(context, snapshot, csvUsers, plans, orphanRows);

		console.log("");
		for (const line of summarise(all)) console.log(`  ${line}`);
		console.log("");
		for (const check of checks) {
			console.log(
				`  ${check.pass ? "ok  " : "FAIL"} ${check.id} ${check.description}: ${check.value} (expected ${check.expected})`,
			);
		}
		if (partial)
			console.log(
				"  reconciliation skipped: this was a partial run (--only / --csv-only)",
			);
		if (billedOrphans.length > 0) {
			console.log("");
			console.log(
				`  BLOCKER: ${billedOrphans.length} unmapped public.users row(s) carry a Paddle customer_id — remap-user-ids.sql will refuse to run (6.5, 12.6)`,
			);
		}
		if (rail.dryRun) {
			console.log("");
			console.log(
				"  DRY RUN: nothing was written. Re-run with DRY_RUN=0 to apply.",
			);
		}

		const failed = all.filter((outcome) => outcome.status === "error").length;
		const failedChecks = checks.filter((check) => !check.pass).length;
		if (failed > 0 || failedChecks > 0 || billedOrphans.length > 0) {
			process.exitCode = 1;
		}
	} finally {
		await rail.close();
	}
}

function summarise(outcomes: Outcome[]): string[] {
	const byStatus = new Map<string, number>();
	for (const outcome of outcomes) {
		byStatus.set(outcome.status, (byStatus.get(outcome.status) ?? 0) + 1);
	}
	return [
		`users processed: ${outcomes.length}`,
		...[...byStatus.entries()].map(
			([status, count]) => `  ${status}: ${count}`,
		),
		`passwords imported: ${outcomes.filter((outcome) => outcome.passwordImported).length}`,
		`need a reset: ${outcomes.filter((outcome) => outcome.needsReset && outcome.status === "migrated").length}`,
	];
}

function writeReports(
	context: Context,
	outcomes: Outcome[],
	plans: Plan[],
	orphans: string[],
	ownership: Map<string, { ownsData: boolean; billed: boolean }>,
): void {
	const { outDir } = context.options;
	mkdirSync(outDir, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const planById = new Map(plans.map((plan) => [plan.clerkUserId, plan]));

	writeFileSync(
		join(outDir, `clerk-supabase-map.${stamp}.json`),
		`${JSON.stringify(
			{
				dryRun: context.guard.dryRun,
				environment: context.guard.environment,
				exportedAt: context.exportedAt.toISOString(),
				generatedAt: new Date().toISOString(),
				options: {
					...context.options,
					fixture: context.options.fixture ? "(set)" : null,
				},
				outcomes,
				projectRef: context.guard.projectRef,
			},
			null,
			2,
		)}\n`,
		"utf8",
	);

	const row = (outcome: Outcome) => [
		outcome.clerkUserId,
		outcome.supabaseUserId ?? "",
		outcome.emailMasked,
		outcome.detail ?? "",
	];
	const header = [
		"clerk_user_id",
		"supabase_user_id",
		"email_masked",
		"detail",
	];

	writeCsvFile(
		join(outDir, "needs-reset.csv"),
		[...header, "reason"],
		outcomes
			.filter((outcome) => outcome.status === "migrated" && outcome.needsReset)
			.map((outcome) => {
				const plan = planById.get(outcome.clerkUserId);
				const reason = plan?.passwordStale
					? "password changed after the export"
					: plan?.mfaEnabled
						? "mfa enabled: no password imported"
						: plan?.digest
							? `unsupported hasher: ${plan.hasher ?? "unknown"}`
							: "no password in Clerk";
				return [...row(outcome), reason];
			}),
	);

	writeCsvFile(
		join(outDir, "conflicts.csv"),
		header,
		outcomes.filter((outcome) => outcome.status === "conflict").map(row),
	);
	writeCsvFile(
		join(outDir, "skipped.csv"),
		header,
		outcomes.filter((outcome) => outcome.status === "skipped").map(row),
	);
	writeCsvFile(
		join(outDir, "errors.csv"),
		header,
		outcomes.filter((outcome) => outcome.status === "error").map(row),
	);
	writeCsvFile(
		join(outDir, "mfa-users.csv"),
		header,
		outcomes.filter((outcome) => outcome.mfaEnabled).map(row),
	);
	writeCsvFile(
		join(outDir, "orphans.csv"),
		["clerk_user_id", "owns_data", "has_customer_id"],
		orphans.map((id) => [
			id,
			ownership.get(id)?.ownsData ?? false,
			ownership.get(id)?.billed ?? false,
		]),
	);

	console.log(`  reports written to ${outDir}`);
}

/**
 * Runs only when this file is the one that was executed, so the pure helpers
 * above can be imported by unit tests. `import.meta` is deliberately not used:
 * the repo has no `"type": "module"`, so tsx compiles this to CJS.
 */
function isEntryPoint(): boolean {
	const entry = process.argv[1] ?? "";
	return entry
		.replace(/\.[cm]?[jt]s$/, "")
		.endsWith("migrate-clerk-to-supabase");
}

if (isEntryPoint()) main().catch(fail);
