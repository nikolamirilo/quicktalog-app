/**
 * The shared safety rail for the cutover scripts.
 *
 * Every script under `scripts/cutover` starts here, before it opens a
 * connection or touches the Auth admin API. The guard answers four questions
 * and refuses to continue unless all four have a safe answer:
 *
 *  1. Which Supabase project am I about to act on, and is it PROD?
 *  2. Which database am I about to act on, and is it the *same* project?
 *  3. Am I allowed to write at all (`DRY_RUN=0`), and has a human confirmed it?
 *  4. Do the credentials I was handed belong together?
 *
 * The accident this file exists to prevent is a TEST database paired with PROD
 * auth credentials (or the reverse): every row would look fine, and every user
 * identity would be wrong. The environment is therefore derived independently
 * from `NEXT_PUBLIC_SUPABASE_URL` and from `MIGRATION_DATABASE_URL`, the two
 * must agree, and `assertSameInstance()` then proves it against live data
 * rather than against a string.
 *
 * Nothing here ever prints a secret. Emails are masked, and everything that
 * leaves this process through stdout or a report file goes through `mask*` or
 * `redact()` first.
 */

import { createInterface } from "node:readline/promises";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

/** The two real projects. Anything else has to be allowed explicitly. */
export const PROJECT_REFS = {
	prod: "uhfbapjuzvlyzyodxhqn",
	test: "imhinsgyzzyblghwnedk",
} as const;

export type Environment = "prod" | "test" | "local" | "unknown";

export type Sql = ReturnType<typeof postgres>;
export type AuthAdmin = ReturnType<typeof createClient>["auth"]["admin"];

export class GuardError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GuardError";
	}
}

/* -------------------------------------------------------------------------- */
/* Masking                                                                    */
/* -------------------------------------------------------------------------- */

/** `alice@example.com` -> `a***@example.com`. Never log the full address. */
export function maskEmail(email: string | null | undefined): string {
	if (!email) return "(none)";
	const at = email.lastIndexOf("@");
	if (at < 1) return "***";
	return `${email[0]}***${email.slice(at)}`;
}

/** A Google `sub` is an account identifier: keep enough to triage, not to use. */
export function maskSub(sub: string | null | undefined): string {
	if (!sub) return "";
	return sub.length <= 6 ? "***" : `${sub.slice(0, 4)}***${sub.slice(-2)}`;
}

const SECRET_PATTERNS: RegExp[] = [
	/sb_secret_[A-Za-z0-9_-]+/g,
	/sb_publishable_[A-Za-z0-9_-]+/g,
	/sk_(?:live|test)_[A-Za-z0-9]+/g,
	/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g, // JWT
	/\$(?:2[aby]|argon2[a-z]*)\$[^\s"',)]+/g, // password digests
	/postgres(?:ql)?:\/\/[^\s"']+/g,
];

/**
 * Last line of defence for anything that is printed or written to a report: a
 * thrown driver error, a Clerk API body or a GoTrue message can carry a digest,
 * a key or a connection string.
 */
export function redact(value: unknown): string {
	let text =
		value instanceof Error
			? `${value.name}: ${value.message}`
			: typeof value === "string"
				? value
				: JSON.stringify(value);
	if (!text) return "";
	for (const pattern of SECRET_PATTERNS)
		text = text.replace(pattern, "[redacted]");
	return text;
}

/* -------------------------------------------------------------------------- */
/* Environment detection                                                      */
/* -------------------------------------------------------------------------- */

/** `https://<ref>.supabase.co` -> `<ref>`; a local stack -> `local`. */
export function refFromSupabaseUrl(url: string): string | null {
	let host: string;
	try {
		host = new URL(url).hostname;
	} catch {
		return null;
	}
	if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
		return "local";
	}
	const match = /^([a-z0-9]{20})\.supabase\.(co|in|red|green)$/.exec(host);
	return match ? match[1] : null;
}

/**
 * The project ref of a Postgres URL. Supabase spells it two ways: the direct
 * connection puts it in the host (`db.<ref>.supabase.co`) and the poolers put
 * it in the user (`postgres.<ref>@aws-0-....pooler.supabase.com`).
 */
export function refFromDatabaseUrl(url: string): string | null {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}
	const host = parsed.hostname;
	if (host === "localhost" || host === "127.0.0.1") return "local";

	const fromHost = /^db\.([a-z0-9]{20})\.supabase\.(co|in|red|green)$/.exec(
		host,
	);
	if (fromHost) return fromHost[1];

	const user = decodeURIComponent(parsed.username);
	const fromUser = /^[a-z_]+\.([a-z0-9]{20})$/.exec(user);
	if (fromUser && host.includes("pooler.supabase.com")) return fromUser[1];

	return null;
}

export function environmentForRef(ref: string | null): Environment {
	if (ref === PROJECT_REFS.prod) return "prod";
	if (ref === PROJECT_REFS.test) return "test";
	if (ref === "local") return "local";
	return "unknown";
}

/** `aws-1-eu-central-1.pooler.supabase.com:5432/postgres` — host only, no credentials. */
function describeDatabase(url: string): string {
	try {
		const parsed = new URL(url);
		return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}`;
	} catch {
		return "(unparseable MIGRATION_DATABASE_URL)";
	}
}

/* -------------------------------------------------------------------------- */
/* The guard                                                                  */
/* -------------------------------------------------------------------------- */

export type GuardOptions = {
	/** Script name, printed in the banner and used as the connection label. */
	script: string;
	/** One-line description of what the script is about to do. */
	intent: string;
	/** True when the script can write. Writes require `DRY_RUN=0`. */
	writes: boolean;
	/** Set false for a script that only needs the Auth admin API. */
	needsDatabase?: boolean;
	/** Set false for a script that only needs the database. */
	needsAuthAdmin?: boolean;
	/** Scripts that must never run against PROD, not even with `ALLOW_PROD=1`. */
	prodForbidden?: boolean;
	/** Extra banner lines (inputs, modes, file paths). */
	details?: string[];
};

export type Guard = {
	environment: Environment;
	projectRef: string;
	supabaseUrl: string;
	databaseLabel: string;
	/** True unless `DRY_RUN=0`. Nothing may be written while this is true. */
	dryRun: boolean;
	sql: Sql;
	auth: AuthAdmin;
	/** Proves the database and the Supabase project are the same instance. */
	assertSameInstance: () => Promise<void>;
	close: () => Promise<void>;
};

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new GuardError(`${name} is not set`);
	return value;
}

function isTruthy(value: string | undefined): boolean {
	return value === "1" || value === "true" || value === "yes";
}

/**
 * Asks for confirmation on the terminal, and on a non-interactive machine
 * accepts `CONFIRM_REF=<ref>` instead — the same amount of typing, and still
 * impossible to satisfy by accident with the wrong project.
 */
async function confirmTarget(
	ref: string,
	environment: Environment,
): Promise<void> {
	const expected = ref;
	if (!process.stdin.isTTY) {
		const given = process.env.CONFIRM_REF;
		if (given !== expected) {
			throw new GuardError(
				`no terminal to confirm on: re-run with CONFIRM_REF=${expected} (got ${given ? "a different ref" : "nothing"})`,
			);
		}
		console.log(`  confirmed by CONFIRM_REF=${expected}`);
		return;
	}
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await rl.question(
			`  Type the ${environment.toUpperCase()} project ref (${expected}) to continue: `,
		);
		if (answer.trim() !== expected) {
			throw new GuardError("confirmation did not match the target project ref");
		}
	} finally {
		rl.close();
	}
}

/**
 * Runs every check, prints the target, asks for confirmation, and only then
 * hands back the connections. A caller that skips this function has no
 * business holding either credential.
 */
export async function guard(options: GuardOptions): Promise<Guard> {
	const needsDatabase = options.needsDatabase !== false;
	const needsAuthAdmin = options.needsAuthAdmin !== false;

	const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
	const secretKey = needsAuthAdmin ? requireEnv("SUPABASE_SECRET_KEY") : "";
	const databaseUrl = needsDatabase ? requireEnv("MIGRATION_DATABASE_URL") : "";

	// 1. Where does each credential point?
	const projectRef = refFromSupabaseUrl(supabaseUrl);
	if (!projectRef) {
		throw new GuardError(
			"NEXT_PUBLIC_SUPABASE_URL is not a Supabase project URL",
		);
	}
	const projectEnv = environmentForRef(projectRef);

	const databaseRef = needsDatabase
		? refFromDatabaseUrl(databaseUrl)
		: projectRef;
	if (needsDatabase && !databaseRef) {
		throw new GuardError(
			"MIGRATION_DATABASE_URL does not carry a project ref (expected db.<ref>.supabase.co or postgres.<ref>@...pooler.supabase.com)",
		);
	}
	const databaseEnv = environmentForRef(databaseRef);

	// 2. The accident that matters: two environments in one run.
	if (databaseRef !== projectRef) {
		throw new GuardError(
			`the database (${databaseEnv}, ref ${databaseRef}) and the Supabase project (${projectEnv}, ref ${projectRef}) are different projects — refusing`,
		);
	}
	if (projectEnv === "unknown" && !isTruthy(process.env.ALLOW_UNKNOWN_REF)) {
		throw new GuardError(
			`project ref ${projectRef} is neither TEST nor PROD; set ALLOW_UNKNOWN_REF=1 if this is deliberate`,
		);
	}

	// 3. PROD needs an explicit opt-in, and some scripts may never see it.
	if (projectEnv === "prod") {
		if (options.prodForbidden) {
			throw new GuardError(
				`${options.script} must never run against PROD — there is no flag for this`,
			);
		}
		if (!isTruthy(process.env.ALLOW_PROD)) {
			throw new GuardError("refusing to touch PROD without ALLOW_PROD=1");
		}
	}

	// 4. Writes are opt-in, always: unset or anything but "0" means dry run.
	const dryRun = process.env.DRY_RUN !== "0";
	if (!options.writes && !dryRun) {
		throw new GuardError(
			`${options.script} never writes; DRY_RUN=0 is meaningless here`,
		);
	}

	const databaseLabel = needsDatabase
		? describeDatabase(databaseUrl)
		: "(not used)";

	console.log("");
	console.log("  ────────────────────────────────────────────────────────────");
	console.log(`  script       ${options.script}`);
	console.log(`  intent       ${options.intent}`);
	console.log(`  environment  ${projectEnv.toUpperCase()}`);
	console.log(`  project      ${projectRef} (${supabaseUrl})`);
	console.log(`  database     ${databaseLabel}`);
	console.log(
		`  mode         ${dryRun ? "DRY RUN — nothing will be written" : "LIVE — this run writes"}`,
	);
	for (const line of options.details ?? []) console.log(`  ${line}`);
	console.log("  ────────────────────────────────────────────────────────────");

	if (!dryRun && options.writes) {
		await confirmTarget(projectRef, projectEnv);
	}
	console.log("");

	const sql = needsDatabase
		? postgres(databaseUrl, {
				connection: { application_name: `cutover:${options.script}` },
				idle_timeout: 20,
				max: 4,
				onnotice: () => {},
				prepare: false,
			})
		: (undefined as unknown as Sql);

	const auth = needsAuthAdmin
		? createClient(supabaseUrl, secretKey, {
				auth: { autoRefreshToken: false, persistSession: false },
			}).auth.admin
		: (undefined as unknown as AuthAdmin);

	return {
		assertSameInstance: () =>
			assertSameInstance(sql, auth, needsDatabase && needsAuthAdmin),
		auth,
		close: async () => {
			if (needsDatabase) await sql.end({ timeout: 5 });
		},
		databaseLabel,
		dryRun,
		environment: projectEnv,
		projectRef,
		sql,
		supabaseUrl,
	};
}

/**
 * String checks can only prove that two URLs *say* the same ref. This proves
 * it: a user the Auth API can see must exist in the database this process is
 * connected to, and an empty project must pair with an empty `auth.users`.
 */
async function assertSameInstance(
	sql: Sql,
	auth: AuthAdmin,
	enabled: boolean,
): Promise<void> {
	if (!enabled) return;
	const listed = await auth.listUsers({ page: 1, perPage: 1 });
	if (listed.error) {
		throw new GuardError(`Auth admin API unreachable: ${redact(listed.error)}`);
	}
	const [row] = await sql<{ total: number }[]>`
		select count(*)::int as total from auth.users`;

	const sample = listed.data.users[0];
	if (!sample) {
		if (row.total > 0) {
			throw new GuardError(
				`the Auth API reports no users but the database holds ${row.total} — the key and the connection string are not the same project`,
			);
		}
		console.log(
			"  instance check: both sides empty (nothing to cross-check yet)",
		);
		return;
	}
	const [match] = await sql<{ present: boolean }[]>`
		select exists (select 1 from auth.users where id = ${sample.id}::uuid) as present`;
	if (!match.present) {
		throw new GuardError(
			"a user from the Auth API does not exist in the connected database — the secret key and MIGRATION_DATABASE_URL point at different projects",
		);
	}
	console.log(
		"  instance check: the Auth API and the database are the same project",
	);
}

/* -------------------------------------------------------------------------- */
/* Small shared helpers                                                       */
/* -------------------------------------------------------------------------- */

/** Prefix for a line that describes a write that did not happen. */
export function would(dryRun: boolean, message: string): string {
	return dryRun ? `would ${message}` : message;
}

/** Runs `worker` over `items` with at most `limit` in flight, in order. */
export async function mapWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let next = 0;
	const runners = Array.from(
		{ length: Math.max(1, Math.min(limit, items.length)) },
		async () => {
			while (true) {
				const index = next++;
				if (index >= items.length) return;
				results[index] = await worker(items[index], index);
			}
		},
	);
	await Promise.all(runners);
	return results;
}

/** Exits with 1 and a redacted message. Used by every script's top-level catch. */
export function fail(error: unknown): never {
	console.error("");
	console.error(`  FAILED: ${redact(error)}`);
	console.error("");
	process.exit(1);
}
