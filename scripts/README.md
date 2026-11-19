# Scripts

Operator scripts, run by hand from a developer machine. None of them run on
Vercel or in CI. Each file's header comment has the full usage.

| Script | What it does |
|---|---|
| `supabase/auth-config.ts` | Supabase Auth settings as code. `--check` reports drift between `auth-config.<env>.json` and the project, `--apply` applies it. Needs `SUPABASE_ACCESS_TOKEN`; SMTP and captcha secrets come from the environment. |
| `supabase/render-email-templates.ts` | Renders `supabase/templates/*.html` from the React Email components, then apply them with `auth-config.ts` (TEST first). |
| `redis/delete-legacy-keys.ts` | One-off: drops the unprefixed draft-cache keys from before Phase 1. Dry run unless `DRY_RUN=0`. |
| `redis/migrate-drafts-to-db.ts` | One-off: copies the builder drafts left in Redis into `public.catalogue_drafts`, which replaced the cache. Run per environment **after** it is on the new code and before deleting the keys. Never overwrites a draft the database already holds. Dry run unless `DRY_RUN=0`. |
| `supabase/backfill-acquisition.ts` | One-off: fills `users.acquisition_source` for accounts that signed up before first-touch tracking, from PostHog's `$initial_utm_source` and `$initial_referring_domain`, through the app's own channel mapping. Never overwrites a channel that is already there. Dry run unless `DRY_RUN=0`. |
| `paddle/rewrite-legacy-custom-data.ts` | One-off: rewrites the Clerk ids that pre-cutover checkouts left in Paddle subscription `custom_data` to the user's uuid, re-signed. Run per environment before `drop_clerk_migration_schema`, which deletes the map it reads. Dry run unless `DRY_RUN=0`. |
| `test-emails.ts` | Sends every transactional and auth email to one test inbox for a visual check. |
| `images/build-hero.ts` | Rebuilds the home hero's served images from `assets/marketing/hero-source.png`: trims the transparent padding, then writes AVIF and WebP at 760/1100/1520 px into `public/images/marketing/`. `npm run images:hero`. Run it after changing the hero artwork and commit the output - `images.unoptimized` is on outside localhost, so nothing resizes at request time. |

Never use `supabase config push` against a hosted project; it overwrites every
setting, including ones `auth-config.ts` does not manage.
