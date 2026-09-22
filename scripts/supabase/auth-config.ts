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

usage: npx tsx scripts/supabase/auth-config.ts --project <test|prod> [--check|--apply]`);
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
	return { project, apply, check };
}

async function loadDesired(project: ProjectName): Promise<AuthConfig> {
	const path = new URL(`./auth-config.${project}.json`, import.meta.url);
	const file = await import("node:fs/promises").then((fs) =>
		fs.readFile(path, "utf8"),
	);
	const desired = JSON.parse(file) as AuthConfig;

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
const show = (field: string, value: unknown) =>
	isSecret(field) ? "«secret»" : JSON.stringify(value);

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
	const { project, apply } = parseArgs();
	const ref = PROJECTS[project];

	const desired = await loadDesired(project);
	const current = await managementApi(ref, "GET");

	const drift = Object.entries(desired).filter(
		([field, value]) =>
			JSON.stringify(current[field]) !== JSON.stringify(value),
	);

	console.log(`Project ${project} (${ref}): ${drift.length} setting(s) differ`);
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
	if (failures.length > 0) {
		console.error("Refusing to apply: the result would be unsafe.");
		for (const failure of failures) console.error(`  - ${failure}`);
		process.exit(1);
	}

	await managementApi(ref, "PATCH", Object.fromEntries(drift));
	console.log(`Applied ${drift.length} setting(s) to ${project}.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
