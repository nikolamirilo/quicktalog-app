// Builds the pre-rls.sql baseline: Supabase stub + the 4 app migrations + legacy seed data.
import {
	Db,
	SUPABASE_BOOTSTRAP,
	readAppMigrations,
	splitSql,
	stripAppStatement,
	errInfo,
} from "./lib.mjs";

export const IDS = {
	A: "user_2aAaaaaaaaaaaaaaaaaaaaa1", // Clerk-style
	B: "user_2bBbbbbbbbbbbbbbbbbbbbb2",
	C: "user_2cCcccccccccccccccccccc3", // Clerk user that is never imported (remap edge case)
	UA: "11111111-1111-4111-8111-111111111111",
	UB: "22222222-2222-4222-8222-222222222222",
	PLAN: "pri_01k27ajepm199twd1x77rpwdrq",
	PRO: "pri_pro_test",
	CAT: {
		aDraft: "aaaaaaaa-0000-4000-8000-000000000001",
		aLive: "aaaaaaaa-0000-4000-8000-000000000002",
		bDraft: "bbbbbbbb-0000-4000-8000-000000000001",
		bLive: "bbbbbbbb-0000-4000-8000-000000000002",
	},
};

export const LEGACY_SEED = `
insert into public.plans (id, name) values ('${IDS.PLAN}', 'Starter'), ('${IDS.PRO}', 'Pro');
insert into public.users (id, email, name, plan_id, customer_id) values
  ('${IDS.A}', 'a@test.dev', 'Alice', '${IDS.PLAN}', null),
  ('${IDS.B}', 'b@test.dev', 'Bob',   '${IDS.PRO}',  'ctm_b'),
  ('${IDS.C}', 'c@test.dev', 'Carol', '${IDS.PLAN}', null);
insert into public.catalogues (id, name, created_by, status, tags, footer, content) values
  ('${IDS.CAT.aDraft}', 'a-draft', '${IDS.A}', 'draft',  '{}', '{"newsletter": true}',  '[]'),
  ('${IDS.CAT.aLive}',  'a-live',  '${IDS.A}', 'active', '{}', '{"newsletter": false}', '[]'),
  ('${IDS.CAT.bDraft}', 'b-draft', '${IDS.B}', 'draft',  '{}', '{"newsletter": true}',  '[]'),
  ('${IDS.CAT.bLive}',  'b-live',  '${IDS.B}', 'active', '{}', '{"newsletter": true}',  '[{"type":"x"}]');
insert into public.user_themes (user_id, name, colors) values ('${IDS.A}', 't1', '{"bg":"#fff"}'), ('${IDS.B}', 't1', '{"bg":"#000"}');
-- qr_configs duplicates for a-live (dedupe keeps most recently updated)
insert into public.qr_configs (id, catalogue, config, updated_at) values
  ('0d000000-0000-4000-8000-000000000001', 'a-live', '{"v":"old-null"}', null),
  ('0d000000-0000-4000-8000-000000000002', 'a-live', '{"v":"newest"}', now()),
  ('0d000000-0000-4000-8000-000000000003', 'a-live', '{"v":"older"}', now() - interval '1 day'),
  ('0d000000-0000-4000-8000-000000000004', 'b-live', '{"v":"b"}', now());
-- newsletter case-variant duplicates (dedupe keeps earliest)
insert into public.newsletter (id, email, catalogue_id, owner_id, created_at) values
  ('0e000000-0000-4000-8000-000000000001', 'Sub@x.io', '${IDS.CAT.bLive}', '${IDS.B}', now() - interval '2 days'),
  ('0e000000-0000-4000-8000-000000000002', 'sub@x.io', '${IDS.CAT.bLive}', '${IDS.B}', now() - interval '1 day'),
  ('0e000000-0000-4000-8000-000000000003', 'fan@x.io', '${IDS.CAT.aLive}', '${IDS.A}', now());
insert into public.product_newsletter (id, email) values
  ('0f000000-0000-4000-8000-000000000002', 'P@x.io'), ('0f000000-0000-4000-8000-000000000001', 'p@x.io'), ('0f000000-0000-4000-8000-000000000003', 'q@x.io');
-- prompts: UNIQUE(catalogue) exists pre-migration, so one per catalogue; one with null user
insert into public.prompts (user_id, catalogue, datetime) values
  ('${IDS.A}', 'a-draft', now()), ('${IDS.B}', 'b-live', now()), (null, 'b-draft', now());
insert into public.ocr (user_id, catalogue) values ('${IDS.A}', 'a-live'), (null, 'a-draft');
insert into public.analytics (date, current_url, pageview_count, unique_visitors, user_id) values
  (date_trunc('month', now()) + interval '1 hour', 'https://q/a-live', 10, 4, '${IDS.A}'),
  (date_trunc('month', now()) + interval '1 hour', 'https://q/b-live', 99, 50, '${IDS.B}'),
  (date_trunc('month', now()) - interval '10 days', 'https://q/a-live', 7, 3, '${IDS.A}');
insert into public.subscriptions (subscription_id, subscription_status, price_id, customer_id) values ('sub_b', 'active', '${IDS.PRO}', 'ctm_b');
insert into public.job_logs (job_name, status) values ('analytics', 'ok');
`;

export async function buildBase(PGlite, report) {
	const db = await Db.create(PGlite, { label: "base" });
	await db.exec(SUPABASE_BOOTSTRAP);
	await db.as("postgres");
	const stripped = [];
	const appErrors = [];
	for (const mig of readAppMigrations()) {
		for (const st of splitSql(mig.text)) {
			const why = stripAppStatement(st);
			if (why) {
				stripped.push({
					file: mig.file,
					line: st.line,
					statement: st.body.slice(0, 120),
					why,
				});
				continue;
			}
			try {
				await db.exec(st.sql);
			} catch (e) {
				appErrors.push({
					file: mig.file,
					line: st.line,
					statement: st.body.slice(0, 300),
					...errInfo(e),
				});
			}
		}
		await db.exec("reset all");
	}
	await db.exec(LEGACY_SEED);
	if (report) {
		report.appMigrationStripped = stripped;
		report.appMigrationErrors = appErrors;
	}
	return db;
}
