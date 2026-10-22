import { render } from "@react-email/render";
import type { ReactElement } from "react";
import {
	ConfirmationEmail,
	EmailChangeEmail,
	RecoveryEmail,
} from "@/components/emails";

const SITE_URL = "{{ .SiteURL }}";

// `type` must be one that app/auth/confirm/route.ts accepts.
const confirmUrl = (type: "email" | "recovery" | "email_change") =>
	`{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}`;

const TEMPLATES: { file: string; element: ReactElement }[] = [
	{
		file: "supabase/templates/confirmation.html",
		element: ConfirmationEmail({
			siteUrl: SITE_URL,
			confirmUrl: confirmUrl("email"),
		}),
	},
	{
		file: "supabase/templates/recovery.html",
		element: RecoveryEmail({
			siteUrl: SITE_URL,
			confirmUrl: confirmUrl("recovery"),
		}),
	},
	{
		file: "supabase/templates/email-change.html",
		element: EmailChangeEmail({
			siteUrl: SITE_URL,
			confirmUrl: confirmUrl("email_change"),
			currentEmail: "{{ .Email }}",
			newEmail: "{{ .NewEmail }}",
		}),
	},
];

const BLOCK_TAG =
	/>(?=<\/?(?:html|head|body|meta|link|style|table|tbody|tr|td|p|h1|h2|hr|div)\b)/g;

/**
 * Line breaks go only between block tags: a pretty-printer would wrap text and
 * can split a `{{ .TokenHash }}` placeholder across lines.
 */
function tidy(html: string): string {
	return `${html
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<link rel="preload" as="image"[^>]*>/g, "")
		.replace(BLOCK_TAG, ">\n")
		.trim()}\n`;
}

/** The Supabase Auth templates as GoTrue receives them; it sends them verbatim. */
export async function renderAuthTemplates(): Promise<
	{ file: string; html: string }[]
> {
	return Promise.all(
		TEMPLATES.map(async ({ file, element }) => ({
			file,
			html: tidy(await render(element)),
		})),
	);
}
