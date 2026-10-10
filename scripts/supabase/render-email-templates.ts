/**
 * Writes supabase/templates/*.html from the React Email components in
 * src/components/emails/AuthEmails.tsx, so auth emails share the app's email shell.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/supabase/render-email-templates.ts
 *
 * Then apply them with scripts/supabase/auth-config.ts (TEST first).
 */
import { writeFile } from "node:fs/promises";
import { renderAuthTemplates } from "@/lib/email/auth-templates";

async function main() {
	for (const { file, html } of await renderAuthTemplates()) {
		await writeFile(new URL(`../../${file}`, import.meta.url), html);
		console.log(`wrote ${file}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
