# Plans

Plans, analyses and investigations produced before implementing something. Human documentation of how the app works today lives in [`docs/`](../docs/README.md).

- New plans go in `active/YYYY-MM-DD-<slug>/` with a `PLAN.md` that starts with a status line (`Status: proposed | approved | in progress | done`). Supporting files (research, verification) go in the same folder.
- When a plan is fully implemented or dropped, move it to `archive/`, update this index, and move any lasting knowledge into `docs/`.

## Active

| Plan | Status |
|---|---|
| [2026-09-17-supabase-auth-migration](active/2026-09-17-supabase-auth-migration/README.md) | Approved, not started: Clerk to Supabase Auth, user-level RLS, DB access through Drizzle with private roles |
| [ai-agent-plan-mode.md](active/ai-agent-plan-mode.md) | In progress: Part 1 (plan mode) built; Part 2 (credits) superseded by 2026-09-21-ai-credits |
| [2026-09-21-ai-credits](active/2026-09-21-ai-credits/PLAN.md) | Proposed: `ai_prompts` becomes a priced credit balance, and the free plan gets credits |

## Archive

| Plan | Status |
|---|---|
| [2026-09-22-auth-folder-refactor](archive/2026-09-22-auth-folder-refactor/PLAN.md) | Done: `components/auth/` split into `common/`/`forms/`/`session/`; sign-in and sign-up are one card with a mode toggle |
| [articles-implementation-plan.md](archive/articles-implementation-plan.md) | Done: `/articles` exists |
| [revalidation-analysis.md](archive/revalidation-analysis.md) | Done: codified in the `data-revalidation` skill |
| [sentry-remediation-plan.md](archive/sentry-remediation-plan.md) | Archived 2026-09-17; whether every fix shipped is unconfirmed |
