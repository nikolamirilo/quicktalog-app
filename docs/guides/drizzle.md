# Drizzle and database changes

Drizzle is the app's query layer. It does not own the schema or migrations.

## Where things live

| What | Where |
|---|---|
| Migrations (tables, RLS policies, grants, functions, triggers) | `supabase/migrations/*.sql`, managed with the Supabase CLI |
| Drizzle schema and types used by the app | `@quicktalog/common` (`../quicktalog-packages/src/drizzle/migrations/schema.ts`), generated with `drizzle-kit pull` |

## Changing the database

1. Create a migration: `supabase migration new <name>`, then write the SQL in the new file.
2. Test it locally before it touches a hosted project:
   - `npm run test:db` applies every migration on an in-memory Postgres (17 and 18) and runs the RLS scenarios. It needs no Docker. When the migration belongs to the auth/RLS plan, add it to `PHASE_MIGRATIONS` in `tests/db-pglite/lib.mjs` (see that folder's README).
   - `supabase start` then `supabase test db` runs the pgTAP tests in `supabase/tests/database/` against the real Postgres image.
3. Apply it to TEST first: `supabase link --project-ref imhinsgyzzyblghwnedk`, then `supabase db push`.
4. Regenerate types in `../quicktalog-packages`: `npx drizzle-kit pull` (with `DB_CONNECTION_STRING` pointing at TEST), and review the diff.
5. Release the package (`npm run release` in `../quicktalog-packages`) and bump `@quicktalog/common` in the app.
6. When the change is ready for production, repeat step 3 against PROD (`uhfbapjuzvlyzyodxhqn`).

## Never run

- `drizzle-kit generate`, `drizzle-kit push`, `drizzle-kit migrate`, `drizzle-kit drop`: they would create a second migration history or change the live schema outside `supabase/migrations`.
- `supabase db reset` against a hosted project.
- Edits to a migration that is already committed or applied: add a new migration instead.
