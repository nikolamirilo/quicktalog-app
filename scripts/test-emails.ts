/**
 * Send every Quicktalog transactional email to a single test inbox so a human
 * can eyeball each one (rendering, copy, links, dark-mode handling) without
 * having to trigger the real flow.
 *
 * Covers two sources of truth:
 *   - React Email components in src/components/emails (welcome, cancellation,
 *     contact form) - sent via Resend with the transactional sender address.
 *   - GoTrue templates in supabase/templates (confirmation, recovery,
 *     email-change) - applied via the Management API in production, but sent
 *     here with placeholder substitutions so a human can preview them.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-emails.ts              # sends every email
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/test-emails.ts welcome      # sends just one
 *
 * Available IDs: welcome, cancellation, contact, confirmation, recovery, email-change
 *
 * Required environment:
 *   RESEND_API_KEY    Resend API key (test or live - test sends to the test inbox regardless)
 *   TEST_EMAIL        Defaults to quicktalog@outlook.com (override for QA)
 *   PREVIEW_BASE_URL  Optional. Defaults to https://www.quicktalog.app. Used as
 *                     `{{ .SiteURL }}` / `{{ .RedirectTo }}` placeholder for the
 *                     Supabase templates.
 *
 * The transactional `from` address mirrors `src/lib/email/transactional.ts` so
 * headers, reply-to and footer links look identical to production. The Supabase
 * templates use the same `no-reply@auth.quicktalog.app` sender configured in
 * `scripts/supabase/auth-config.*.json`.
 *
 * Why the `--tsconfig tsconfig.scripts.json` flag? The project's root tsconfig
 * uses `jsx: "preserve"` (the Next.js default). `tsx` keeps JSX as-is under that
 * setting, which leaves `<Section>` literals in the compiled output. The scripts
 * tsconfig switches on the automatic runtime so the email components compile
 * without needing `import React from "react"`.
 */

import { readFile } from "node:fs/promises";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";
import {
	CancellationEmail,
	InformationEmail,
	WelcomeEmail,
} from "../src/components/emails";

const TEST_EMAIL = process.env.TEST_EMAIL ?? "quicktalog@outlook.com";
const PREVIEW_BASE_URL =
	process.env.PREVIEW_BASE_URL ?? "https://www.quicktalog.app";

const TRANSACTIONAL_FROM = "Quicktalog<office@quicktalog.app>";
const AUTH_FROM = "Quicktalog<no-reply@auth.quicktalog.app>";
const REPLY_TO = "quicktalog@outlook.com";

type EmailSpec = {
	id: string;
	label: string;
	subject: string;
	from: string;
	replyTo?: string;
	/** Returns the body. React component for transactional, raw HTML for auth templates. */
	body: () => Promise<{ html: string; text: string }>;
};

/** Substitutes the placeholders GoTrue would normally fill in. */
function fillGoTrue(template: string, vars: Record<string, string>): string {
	return template.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (_, key: string) => {
		const v = vars[key];
		return v == null ? `{{ .${key} }}` : v;
	});
}

/**
 * Strip `<style>` / `<head>` font links and emit a plain-text approximation
 * by collapsing block elements into lines. Good enough for a Gmail text-view
 * preview; not meant to be pretty.
 */
function htmlToText(html: string): string {
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<head[\s\S]*?<\/head>/gi, "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

async function readTemplate(relativePath: string): Promise<string> {
	const url = new URL(`../${relativePath}`, import.meta.url);
	return readFile(url, "utf8");
}

function buildEmails(): EmailSpec[] {
	const sampleName = "Nikola";
	const sampleFrom = "alex.morgan@example.com";
	const sampleMessage =
		"Hi team! 👋\n\nI just discovered Quicktalog and I'm impressed so far. I'd love to know whether you support custom domains and if there are any discounts for non-profits.\n\nThanks!\nAlex";

	const sampleToken = "vFAhXJbQyV4w3K1d_g3QZw";
	const sampleTypeEmail = "email";
	const sampleTypeRecovery = "recovery";
	const sampleTypeEmailChange = "email_change";

	const authVarsBase = {
		SiteURL: PREVIEW_BASE_URL,
		RedirectTo: PREVIEW_BASE_URL,
		Email: sampleFrom,
	};

	const renderReact = (
		element: React.ReactElement,
	): Promise<{ html: string; text: string }> =>
		Promise.all([
			render(element, { pretty: true }),
			render(element, { plainText: true }),
		]).then(([html, text]) => ({ html, text }));

	const renderGoTrue = async (
		relativePath: string,
		vars: Record<string, string>,
	): Promise<{ html: string; text: string }> => {
		const template = await readTemplate(relativePath);
		const html = fillGoTrue(template, vars);
		return { html, text: htmlToText(html) };
	};

	return [
		// React Email / transactional
		{
			id: "welcome",
			label: "Welcome (new sign-up)",
			subject: "Welcome to Quicktalog, your account is ready",
			from: TRANSACTIONAL_FROM,
			body: () => renderReact(WelcomeEmail({ name: sampleName })),
		},
		{
			id: "cancellation",
			label: "Subscription canceled",
			subject: "Your Quicktalog subscription has ended",
			from: TRANSACTIONAL_FROM,
			body: () =>
				renderReact(
					CancellationEmail({ name: sampleName, unpublished: ["lux-watches"] }),
				),
		},
		{
			id: "contact",
			label: "Contact form (to support)",
			subject: "Question about custom domains and non-profit pricing",
			from: TRANSACTIONAL_FROM,
			replyTo: sampleFrom,
			body: () =>
				renderReact(
					InformationEmail({
						email: sampleFrom,
						name: "Alex Morgan",
						subject: "Question about custom domains and non-profit pricing",
						message: sampleMessage,
					}),
				),
		},
		// GoTrue / Supabase Auth
		{
			id: "confirmation",
			label: "Supabase Auth - Confirm email",
			subject: "Confirm your Quicktalog email",
			from: AUTH_FROM,
			body: () =>
				renderGoTrue("supabase/templates/confirmation.html", {
					...authVarsBase,
					TokenHash: sampleToken,
					Type: sampleTypeEmail,
				}),
		},
		{
			id: "recovery",
			label: "Supabase Auth - Reset password",
			subject: "Reset your Quicktalog password",
			from: AUTH_FROM,
			body: () =>
				renderGoTrue("supabase/templates/recovery.html", {
					...authVarsBase,
					TokenHash: sampleToken,
					Type: sampleTypeRecovery,
				}),
		},
		{
			id: "email-change",
			label: "Supabase Auth - Email change",
			subject: "Confirm your new Quicktalog email",
			from: AUTH_FROM,
			body: () =>
				renderGoTrue("supabase/templates/email-change.html", {
					...authVarsBase,
					TokenHash: sampleToken,
					Type: sampleTypeEmailChange,
					NewEmail: "alex.morgan+new@example.com",
				}),
		},
	];
}

function getResend(): Resend {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		console.error(
			"\nRESEND_API_KEY is not set. Export it before running this script:\n\n  export RESEND_API_KEY=re_xxx\n",
		);
		process.exit(1);
	}
	return new Resend(apiKey);
}

async function sendOne(
	resend: Resend,
	spec: EmailSpec,
): Promise<{ ok: boolean; id?: string; error?: string }> {
	const { html, text } = await spec.body();

	const result = await resend.emails.send({
		from: spec.from,
		to: TEST_EMAIL,
		replyTo: spec.replyTo ?? REPLY_TO,
		subject: `[TEST] ${spec.label} - ${spec.subject}`,
		html,
		text,
		tags: [{ name: "test", value: spec.id }],
	});

	if (result.error) {
		return { ok: false, error: result.error.message ?? String(result.error) };
	}
	return { ok: true, id: result.data?.id };
}

async function main() {
	const filter = process.argv[2];
	const specs = buildEmails().filter((s) => (filter ? s.id === filter : true));

	if (specs.length === 0) {
		console.error(
			`No email matches "${filter}". Available: welcome, cancellation, contact, confirmation, recovery, email-change`,
		);
		process.exit(1);
	}

	const resend = getResend();

	console.log(
		`\n→ Sending ${specs.length} email${specs.length === 1 ? "" : "s"} to ${TEST_EMAIL}\n`,
	);

	let failures = 0;
	for (const spec of specs) {
		process.stdout.write(`  • ${spec.label.padEnd(38)} `);
		try {
			const res = await sendOne(resend, spec);
			if (res.ok) {
				console.log(`✓ sent (id: ${res.id})`);
			} else {
				failures++;
				console.log(`✗ failed: ${res.error}`);
			}
		} catch (err) {
			failures++;
			console.log(
				`✗ threw: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	console.log(
		`\n${failures === 0 ? "✓ Done" : `✗ ${failures} failed`}. Check ${TEST_EMAIL}.\n`,
	);
	process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
	console.error("Unexpected error:", err);
	process.exit(1);
});
