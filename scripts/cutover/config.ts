/**
 * Every setting the cutover scripts take.
 *
 * Non-secret values are written out literally below — edit this file rather
 * than exporting variables, and a run needs no environment at all. The scripts
 * keep reading `process.env` by name; `applyConfigDefaults()` puts these there
 * on import, without overwriting anything already set, so an inline override
 * still wins.
 *
 * Secrets are the exception: they are *referenced* from the environment, never
 * stored, because this file is committed. They come from a gitignored
 * `.env.cutover` at the repo root, or failing that `.env.local`.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { config as loadEnvFile } from "dotenv";

export type ProjectName = "test" | "prod";

/* -------------------------------------------------------------------------- */
/* Per project                                                                */
/* -------------------------------------------------------------------------- */

export const PROJECTS = {
	test: {
		ref: "imhinsgyzzyblghwnedk",
		clerkCsv: "~/Downloads/users-test.csv",
		outDir: "~/Downloads/cutover-reports/test",
		/** UTC time that CSV was exported; decides whether a password is still current. */
		exportedAt: "2026-09-22T18:20:32Z",
	},
	prod: {
		ref: "uhfbapjuzvlyzyodxhqn",
		// The encrypted volume, per scripts/README.md: the PROD export carries
		// password digests and totp_secret.
		clerkCsv: "/Volumes/cutover/users.csv",
		outDir: "/Volumes/cutover/reports",
		exportedAt: "",
	},
} as const satisfies Record<
	ProjectName,
	{ ref: string; clerkCsv: string; outDir: string; exportedAt: string }
>;

/* -------------------------------------------------------------------------- */
/* Everything else, literally                                                 */
/* -------------------------------------------------------------------------- */

export const SETTINGS = {
	/** Which block above a run uses. */
	project: "test" as ProjectName,

	/**
	 * Nothing is written while this is true. Left `true` on purpose: a live run
	 * is `DRY_RUN=0 npx tsx …`, so writing stays a decision made at the command
	 * line rather than one inherited from a file edited weeks ago.
	 */
	dryRun: true,

	/** PROD needs this as well as `DRY_RUN=0`, and still prompts for the ref. */
	allowProd: false,

	/** A ref that is neither TEST nor PROD, e.g. a branch database. */
	allowUnknownRef: false,

	/** Users in flight during the import and the rollback push. */
	concurrency: 4,

	/** Ceiling on `purge-dark-test-users` and the Redis cleanup. */
	maxDeletions: 50,

	/** Accounts `purge-dark-test-users` must never touch. */
	keepUserIds: [] as string[],
	keepEmails: [] as string[],

	/** A JSON snapshot instead of the Clerk API, for rehearsals. */
	clerkFixture: null as string | null,

	/** Skips the typed confirmation in the Redis cleanup. Leave false. */
	skipConfirm: false,
};

/* -------------------------------------------------------------------------- */

export const PROJECT_REFS = {
	prod: PROJECTS.prod.ref,
	test: PROJECTS.test.ref,
} as const;

export const SUPABASE_URLS: Record<ProjectName, string> = {
	prod: `https://${PROJECTS.prod.ref}.supabase.co`,
	test: `https://${PROJECTS.test.ref}.supabase.co`,
};

/** Node does not expand `~`, and these paths are written by hand. */
export function expandHome(path: string): string {
	if (path === "~") return homedir();
	if (path.startsWith("~/")) return resolve(homedir(), path.slice(2));
	return path;
}

const env = (name: string): string | undefined =>
	process.env[name]?.trim() || undefined;

function selectedProject(): ProjectName {
	const override = env("CUTOVER_PROJECT");
	if (!override) return SETTINGS.project;
	if (!(override in PROJECTS)) {
		throw new Error(
			`CUTOVER_PROJECT must be one of ${Object.keys(PROJECTS).join(" | ")}, got "${override}"`,
		);
	}
	return override as ProjectName;
}

export const config = {
	get project(): ProjectName {
		return selectedProject();
	},
	get supabaseUrl(): string {
		return env("NEXT_PUBLIC_SUPABASE_URL") ?? SUPABASE_URLS[selectedProject()];
	},
	get clerkCsv(): string {
		return expandHome(env("CLERK_CSV") ?? PROJECTS[selectedProject()].clerkCsv);
	},
	get outDir(): string {
		return expandHome(env("OUT_DIR") ?? PROJECTS[selectedProject()].outDir);
	},
	get exportedAt(): string {
		return env("EXPORTED_AT") ?? PROJECTS[selectedProject()].exportedAt;
	},
	get concurrency(): number {
		return Math.max(1, Number(env("CONCURRENCY") ?? SETTINGS.concurrency) || 1);
	},

	/* Secret: referenced only, never stored. */

	/**
	 * Falls back to the app's own URLs, admin first: after M08
	 * `DB_CONNECTION_STRING` is the `app_rls` login, which owns nothing. `guard()`
	 * checks the role it actually connected as and refuses if it cannot do admin
	 * work.
	 */
	get databaseUrl(): string | undefined {
		return (
			env("MIGRATION_DATABASE_URL") ??
			env("DB_ADMIN_CONNECTION_STRING") ??
			env("DB_CONNECTION_STRING")
		);
	},
	get supabaseSecretKey(): string | undefined {
		return env("SUPABASE_SECRET_KEY");
	},
	get clerkSecretKey(): string | undefined {
		return env("CLERK_SECRET_KEY");
	},
	get supabaseAccessToken(): string | undefined {
		return env("SUPABASE_ACCESS_TOKEN");
	},
} as const;

export const CUTOVER_ENV_FILE = resolve(
	new URL("../..", import.meta.url).pathname,
	".env.cutover",
);
export const APP_ENV_FILE = resolve(
	new URL("../..", import.meta.url).pathname,
	".env.local",
);

/**
 * The only names a dotenv file may supply.
 *
 * `.env.local` is the *app's* configuration and carries its own
 * `NEXT_PUBLIC_SUPABASE_URL`. Letting that through would override
 * `CUTOVER_PROJECT` — a `prod` run would take PROD's CSV path and TEST's
 * project, and try to import production users into the wrong database.
 * Everything public comes from this file; the env files supply credentials.
 */
const SECRET_NAMES = [
	"MIGRATION_DATABASE_URL",
	"DB_ADMIN_CONNECTION_STRING",
	"DB_CONNECTION_STRING",
	"SUPABASE_SECRET_KEY",
	"CLERK_SECRET_KEY",
	"SUPABASE_ACCESS_TOKEN",
] as const;

/** `.env.cutover` first, so it wins over the app's file. */
function loadCutoverEnv(): void {
	for (const file of [CUTOVER_ENV_FILE, APP_ENV_FILE]) {
		if (!existsSync(file)) continue;
		const fromFile: Record<string, string> = {};
		loadEnvFile({ path: file, processEnv: fromFile, quiet: true });
		for (const name of SECRET_NAMES) {
			if (!process.env[name] && fromFile[name]) {
				process.env[name] = fromFile[name];
			}
		}
	}
}

/** Publishes the literals above into `process.env`, leaving anything already set alone. */
export function applyConfigDefaults(): void {
	const resolved: Record<string, string | undefined> = {
		ALLOW_PROD: SETTINGS.allowProd ? "1" : undefined,
		ALLOW_UNKNOWN_REF: SETTINGS.allowUnknownRef ? "1" : undefined,
		CLERK_CSV: config.clerkCsv,
		CLERK_FIXTURE: SETTINGS.clerkFixture ?? undefined,
		CONCURRENCY: String(config.concurrency),
		CUTOVER_PROJECT: config.project,
		// Only ever written as "0"; leaving it unset keeps the dry-run default.
		DRY_RUN: SETTINGS.dryRun ? undefined : "0",
		EXPORTED_AT: config.exportedAt || undefined,
		KEEP_EMAILS: SETTINGS.keepEmails.join(",") || undefined,
		KEEP_USER_IDS: SETTINGS.keepUserIds.join(",") || undefined,
		MAX_DELETIONS: String(SETTINGS.maxDeletions),
		MIGRATION_DATABASE_URL: config.databaseUrl,
		NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
		OUT_DIR: config.outDir,
		SKIP_CONFIRM: SETTINGS.skipConfirm ? "1" : undefined,
	};
	for (const [name, value] of Object.entries(resolved)) {
		if (value !== undefined && !process.env[name]) process.env[name] = value;
	}
}

// On import, so both land before any script body reads process.env: several
// scripts parse their arguments before calling guard().
loadCutoverEnv();
applyConfigDefaults();
