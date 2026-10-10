/**
 * Turns sign-ups off before an import and back on after the cutover.
 *
 *   npx tsx scripts/cutover/signups.ts --status
 *   npx tsx scripts/cutover/signups.ts --off
 *   npx tsx scripts/cutover/signups.ts --on
 *
 * Sign-ups have to be closed while the import runs: it claims an email in
 * `migration.clerk_user_map` and then creates the identity, and a real person
 * signing up in between would take that address and lock the imported user out
 * of their own account.
 *
 * Needs `SUPABASE_ACCESS_TOKEN` (a personal access token). `CUTOVER_PROJECT`
 * picks the project, as everywhere else.
 */

import { createInterface } from "node:readline/promises";
import { config, PROJECT_REFS } from "./config";

type AuthConfig = { disable_signup?: boolean };

async function management(
	method: "GET" | "PATCH",
	body?: unknown,
): Promise<AuthConfig> {
	const token = config.supabaseAccessToken;
	if (!token) {
		throw new Error(
			"SUPABASE_ACCESS_TOKEN is not set (supabase.com/dashboard/account/tokens)",
		);
	}
	const ref = PROJECT_REFS[config.project];
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

/** Opening sign-ups on PROD is the step that lets the public back in. */
async function confirmProd(action: string): Promise<void> {
	const ref = PROJECT_REFS.prod;
	if (!process.stdin.isTTY) {
		if (process.env.CONFIRM_REF !== ref) {
			throw new Error(
				`no terminal to confirm on: re-run with CONFIRM_REF=${ref}`,
			);
		}
		return;
	}
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await rl.question(
			`  Type the PROD project ref (${ref}) to turn sign-ups ${action}: `,
		);
		if (answer.trim() !== ref) throw new Error("confirmation did not match");
	} finally {
		rl.close();
	}
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const wantOff = args.includes("--off");
	const wantOn = args.includes("--on");
	if (
		Number(wantOff) + Number(wantOn) + Number(args.includes("--status")) !==
		1
	) {
		throw new Error("pick exactly one of --status | --off | --on");
	}

	const project = config.project;
	const current = await management("GET");
	const open = current.disable_signup !== true;
	console.log(`\n  ${project}: sign-ups are ${open ? "OPEN" : "CLOSED"}`);

	if (!wantOff && !wantOn) return;

	const target = wantOff;
	if (target === current.disable_signup) {
		console.log(`  already ${target ? "closed" : "open"}, nothing to do\n`);
		return;
	}

	if (project === "prod") await confirmProd(wantOff ? "off" : "on");

	const updated = await management("PATCH", { disable_signup: target });
	console.log(
		`  sign-ups are now ${updated.disable_signup === true ? "CLOSED" : "OPEN"}\n`,
	);
}

main().catch((error) => {
	console.error(
		`\n  FAILED: ${error instanceof Error ? error.message : error}\n`,
	);
	process.exit(1);
});
