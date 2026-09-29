# Plans

Plans, analyses and investigations produced before implementing something. Human documentation of how the app works today lives in [`docs/`](../../docs/README.md).

- New plans go in `active/YYYY-MM-DD-<slug>/` with a `PLAN.md` that starts with a status line (`Status: proposed | approved | in progress | done`). Supporting files (research, verification) go in the same folder.
- When a plan is fully implemented or dropped, move it to `archive/`, update this index, and move any lasting knowledge into `docs/`.

## Active

| Plan | Status |
|---|---|
| [supabase-auth-migration](active/supabase-auth-migration/README.md) | In progress: Clerk to Supabase Auth, user-level RLS, DB access through Drizzle with private roles. Rehearsed on TEST; PROD cutover pending |
| [2026-09-21-ai-credits](active/2026-09-21-ai-credits/PLAN.md) | In progress: `ai_prompts` became a priced credit balance and the free plan got credits. Core shipped in `8799c61`; §5 rollout and §6 open questions unconfirmed |
| [2026-09-25-content-blocks-expansion](active/2026-09-25-content-blocks-expansion/PLAN.md) | In progress: the `category`/`container` merge and the safe P0 fixes shipped 2026-09-26; the 6 new block types, grouped picker and GA4/Pixel tracking are not started |
| [2026-09-29-builder-redesign](active/2026-09-29-builder-redesign/PLAN.md) | Done (awaiting TEST check): builder chrome on the product theme; responsive fixes (rail/panel push/overlay, phone sheet + bar, no overlapping edit controls, drawn layout tiles, chat); catalogue preview unchanged |
| [2026-09-28-app-redesign](active/2026-09-28-app-redesign/PLAN.md) | In progress: implemented (theme, all product screens, cleanup); signed-in screens, PostHog queries and e2e still to verify. See [RESULTS.md](active/2026-09-28-app-redesign/RESULTS.md) |
| [2026-09-29-db-consistency](active/2026-09-29-db-consistency/PLAN.md) | In progress: schema audit; batch 1 (all "Do" items) is one migration plus package, app, worker, scripts and tests, verified locally. Not applied to TEST |
| [2026-09-28-tailwind-v4-migration](active/2026-09-28-tailwind-v4-migration/PLAN.md) | Proposed: Tailwind 3 → 4. Behaviour-neutral: inline the hidden `withMT` theme first (proven by an empty CSS diff), then upgrade with `@theme inline`. Gated on browser share and sequenced after the redesign |
| [2026-09-27-repo-cleanup](active/2026-09-27-repo-cleanup/PLAN.md) | In progress: Tier 1 (dead code) and Tier 3 (structure) done - see [RESULTS.md](active/2026-09-27-repo-cleanup/RESULTS.md). Tier 2 (Clerk dual-path removal) blocked on the cutover |

## Archive

| Plan | Status |
|---|---|
| [2026-09-22-auth-folder-refactor](archive/2026-09-22-auth-folder-refactor/PLAN.md) | Done: `components/auth/` split into `common/`/`forms/`/`session/`; sign-in and sign-up are one card with a mode toggle |
| [ai-agent-plan-mode.md](archive/ai-agent-plan-mode.md) | Done/superseded: Part 1 (plan mode) built; Part 2 (credits) replaced by `2026-09-21-ai-credits` |
| [articles-implementation-plan.md](archive/articles-implementation-plan.md) | Done: `/articles` exists |
| [revalidation-analysis.md](archive/revalidation-analysis.md) | Done: codified in the `data-revalidation` skill |
| [sentry-remediation-plan.md](archive/sentry-remediation-plan.md) | Archived 2026-09-17; whether every fix shipped is unconfirmed |
