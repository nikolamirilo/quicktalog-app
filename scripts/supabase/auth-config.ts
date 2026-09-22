/**
 * Supabase Auth settings as code.
 *
 * The dashboard is the usual way to change these, and that is the problem: a
 * setting flipped by hand in one project and not the other is invisible until
 * a user hits it. This reads the desired state from a JSON file per project and
 * either reports the drift (`--check`) or applies it (`--apply`).
 *
 *   npx tsx scripts/supabase/auth-config.ts --project test --check
 *   npx tsx scripts/supabase/auth-config.ts --project test --apply
 *
 * Needs SUPABASE_ACCESS_TOKEN (a personal access token, Management API).
 * SMTP credentials and the captcha secret come from the environment, never from
 * the JSON, so nothing secret is committed.
 *
 * Never use `supabase config push` against a hosted project: it would overwrite
 * every setting from the local file, including ones this file does not manage.
 */

const PROJECTS = {
	test: "imhinsgyzzyblghwnedk",
	prod: "uhfbapjuzvlyzyodxhqn",
} as const;

type ProjectName = keyof typeof PROJECTS;

type AuthConfig = Record<string, string | number | boolean | null>;

/** Settings whose value is a secret: taken from env, never printed or committed. */
const SECRET_FIELDS: Record<string, string> = {
	smtp_pass: "SUPABASE_SMTP_PASS",
	security_captcha_secret: "SUPABASE_CAPTCHA_SECRET",
	external_google_secret: "SUPABASE_GOOGLE_SECRET",
	external_google_client_id: "SUPABASE_GOOGLE_CLIENT_ID",
};

function usage(message: string): never {
	console.error(`${message}

usage: npx tsx scripts/supabase/auth-config.ts --project <test|prod> [--check|--apply]
                                              [--only a,b] [--skip a,b]

  --only  apply (or report) just these settings
  --skip  apply (or report) everything except these

Use them to land a change in stages. Some settings are only safe once
something else is in place — captcha needs the site key deployed in the app
first, or every sign-in is rejected — and the Management API applies the whole
batch or none of it, so one unsafe field blocks the rest.`);
	process.exit(2);
}

function parseArgs() {
	const args = process.argv.slice(2);
	const project = args[args.indexOf("--project") + 1] as ProjectName;
	if (!args.includes("--project") || !(project in PROJECTS)) {
		usage("Pick a project: --project test | prod");
	}
	const apply = args.includes("--apply");
	const check = args.includes("--check") || !apply;

	const list = (flag: string): string[] => {
		const index = args.indexOf(flag);
		if (index === -1) return [];
		const value = args[index + 1];
		if (!value || value.startsWith("--"))
			usage(`${flag} needs a comma-separated list`);
		return value
			.split(",")
			.map((field) => field.trim())
			.filter(Boolean);
	};
	const only = list("--only");
	const skip = list("--skip");
	for (const field of only) {
		if (skip.includes(field)) usage(`${field} is in both --only and --skip`);
	}
	return { project, apply, check, only, skip };
}

/**
 * `"file:supabase/templates/x.html"` loads that file, relative to the repo root.
 *
 * Email templates are HTML and belong in .html files where they can be read and
 * diffed, not escaped into a single JSON string. They are also the one setting
 * with a security argument attached — they must point at the app's own
 * /auth/confirm rather than GoTrue's verify endpoint — so they need to be
 * reviewable.
 */
async function resolveFileRefs(config: AuthConfig): Promise<AuthConfig> {
	const fs = await import("node:fs/promises");
	const resolved: AuthConfig = { ...config };

	for (const [field, value] of Object.entries(config)) {
		if (typeof value !== "string" || !value.startsWith("file:")) continue;
		const relative = value.slice("file:".length);
		const path = new URL(`../../${relative}`, import.meta.url);
		try {
			resolved[field] = await fs.readFile(path, "utf8");
		} catch {
			throw new Error(`${field}: cannot read ${relative}`);
		}
	}
	return resolved;
}

async function loadDesired(project: ProjectName): Promise<AuthConfig> {
	const path = new URL(`./auth-config.${project}.json`, import.meta.url);
	const file = await import("node:fs/promises").then((fs) =>
		fs.readFile(path, "utf8"),
	);
	const desired = await resolveFileRefs(JSON.parse(file) as AuthConfig);

	for (const [field, envName] of Object.entries(SECRET_FIELDS)) {
		const value = process.env[envName];
		if (value) desired[field] = value;
	}
	return desired;
}

async function managementApi(
	ref: string,
	method: "GET" | "PATCH",
	body?: unknown,
): Promise<AuthConfig> {
	const token = process.env.SUPABASE_ACCESS_TOKEN;
	if (!token) usage("SUPABASE_ACCESS_TOKEN is not set");

	const response = await fetch(
		`https://api.supabase.com/v1/projects/${ref}/config/auth`,
		{
			method,
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: body ? JSON.stringify(body) : undefined,
		},
	);
	if (!response.ok) {
		throw new Error(
			`Management API ${method} failed: ${response.status} ${await response.text()}`,
		);
	}
	return (await response.json()) as AuthConfig;
}

const isSecret = (field: string) => field in SECRET_FIELDS;
const show = (field: string, value: unknown) => {
	if (isSecret(field)) return "«secret»";
	const text = JSON.stringify(value);
	// Email template bodies are hundreds of characters; the drift list is meant
	// to be read.
	return text && text.length > 120 ? `${text.slice(0, 117)}…` : text;
};

/** The settings that must hold before any project is allowed to accept sign-ups. */
function goNoGo(config: AuthConfig): string[] {
	const failures: string[] = [];
	if (config.mailer_autoconfirm !== false) {
		failures.push("mailer_autoconfirm must be false (confirm email is on)");
	}
	if (config.mailer_secure_email_change_enabled !== true) {
		failures.push("mailer_secure_email_change_enabled must be true");
	}
	if (config.external_anonymous_users_enabled === true) {
		failures.push("anonymous sign-ins must be off");
	}
	if (config.security_captcha_enabled !== true) {
		failures.push("captcha must be on");
	}
	if (config.security_update_password_require_reauthentication !== true) {
		failures.push("secure password change must be on");
	}
	return failures;
}

async function main() {
	const { project, apply, only, skip } = parseArgs();
	const ref = PROJECTS[project];

	const desired = await loadDesired(project);
	const current = await managementApi(ref, "GET");

	const allDrift = Object.entries(desired).filter(
		([field, value]) =>
			JSON.stringify(current[field]) !== JSON.stringify(value),
	);
	const drift = allDrift.filter(
		([field]) =>
			(only.length === 0 || only.includes(field)) && !skip.includes(field),
	);
	const held = allDrift.length - drift.length;

	console.log(
		`Project ${project} (${ref}): ${allDrift.length} setting(s) differ` +
			(held > 0 ? `, ${held} held back by --only/--skip` : ""),
	);
	for (const [field, value] of drift) {
		console.log(
			`  ${field}: ${show(field, current[field])} -> ${show(field, value)}`,
		);
	}

	if (!apply) {
		const failures = goNoGo({ ...current, ...Object.fromEntries(drift) });
		if (failures.length > 0) {
			console.log("\nGo/no-go problems with the DESIRED state:");
			for (const failure of failures) console.log(`  - ${failure}`);
		}
		process.exitCode = drift.length === 0 ? 0 : 1;
		return;
	}

	if (drift.length === 0) {
		console.log("Nothing to apply.");
		return;
	}

	const failures = goNoGo({ ...current, ...Object.fromEntries(drift) });
	const staged = only.length > 0 || skip.length > 0;
	if (failures.length > 0 && !staged) {
		console.error("Refusing to apply: the result would be unsafe.");
		for (const failure of failures) console.error(`  - ${failure}`);
		process.exit(1);
	}

	await managementApi(ref, "PATCH", Object.fromEntries(drift));
	console.log(`Applied ${drift.length} setting(s) to ${project}.`);

	if (failures.length > 0) {
		// A staged apply is allowed to leave the project short of the safe state,
		// but never quietly: this is the list that has to be empty before the
		// project may accept sign-ups.
		console.error("\nStill NOT safe to accept sign-ups:");
		for (const failure of failures) console.error(`  - ${failure}`);
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
