# Scripts

Operator scripts, run by hand from a developer machine. None of them run on
Vercel or in CI. Each file's header comment has the full usage.

| Script | What it does |
|---|---|
| `supabase/auth-config.ts` | Supabase Auth settings as code. `--check` reports drift between `auth-config.<env>.json` and the project, `--apply` applies it. Needs `SUPABASE_ACCESS_TOKEN`; SMTP and captcha secrets come from the environment. |
| `supabase/render-email-templates.ts` | Renders `supabase/templates/*.html` from the React Email components, then apply them with `auth-config.ts` (TEST first). |
| `redis/delete-legacy-keys.ts` | One-off: drops the unprefixed draft-cache keys from before Phase 1. Dry run unless `DRY_RUN=0`. |
| `paddle/rewrite-legacy-custom-data.ts` | One-off: rewrites the Clerk ids that pre-cutover checkouts left in Paddle subscription `custom_data` to the user's uuid, re-signed. Run per environment before `drop_clerk_migration_schema`, which deletes the map it reads. Dry run unless `DRY_RUN=0`. |
| `test-emails.ts` | Sends every transactional and auth email to one test inbox for a visual check. |

Never use `supabase config push` against a hosted project; it overwrites every
setting, including ones `auth-config.ts` does not manage.
