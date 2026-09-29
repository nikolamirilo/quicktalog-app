import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { renderAuthTemplates } from "@/lib/email/auth-templates";

const templates = await renderAuthTemplates();

describe("Supabase Auth email templates", () => {
	it.each(templates)(
		"$file matches its React Email source",
		async ({ file, html }) => {
			const committed = await readFile(
				new URL(`../../../../${file}`, import.meta.url),
				"utf8",
			);
			expect(
				committed,
				"Run scripts/supabase/render-email-templates.ts after changing an email",
			).toBe(html);
		},
	);

	it.each(templates)(
		"$file links only to the /auth/confirm interstitial",
		({ html }) => {
			expect(html).toContain(
				"{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}",
			);
			expect(html).not.toContain("ConfirmationURL");
			expect(html).not.toContain("<!--");
		},
	);
});
