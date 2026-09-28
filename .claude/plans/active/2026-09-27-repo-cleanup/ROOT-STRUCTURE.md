# Root directory structure — analysis and proposal

Status: **all steps done 2026-09-28**, including Step D (the `src/` move). See RESULTS-SRC below.

See "Implementation checklist" below for what landed; the analysis above is unchanged.

Written 2026-09-27 against `test`, after the Tier 1/Tier 3 cleanup in
[RESULTS.md](./RESULTS.md).

## What is in the root today

**40 entries**, of which 17 are visible directories and 22 are tracked files.

| Group | Count | Entries |
|---|---|---|
| App source dirs | **12** | `actions/` `agent/` `app/` `components/` `constants/` `content/` `context/` `hooks/` `lib/` `styles/` `types/` `utils/` |
| Project dirs | 5 | `docs/` `public/` `scripts/` `supabase/` `tests/` |
| Tooling dirs | 5 | `.claude/` `.github/` `.husky/` `.vscode/` `.next/` (generated) |
| Root files | 22 | see the table below |

The 12 app-source directories are the problem. Everything else at the root is either
conventional (`docs/`, `tests/`, `public/`) or unavoidable.

## Root files, by whether they can move

Verified against the installed `next@15.5.26`, not from memory — the relevant resolution
code is quoted under "Evidence" at the bottom.

| File | Can it move? |
|---|---|
| `package.json` · `package-lock.json` · `tsconfig.json` · `next.config.ts` · `.gitignore` · `.env.example` · `README.md` · `vercel.json` · `next-env.d.ts` | **No** — npm, TypeScript, Next and Vercel all require the project root |
| `postcss.config.mjs` | **No** — Next loads PostCSS config from the project root |
| `middleware.ts` · `instrumentation.ts` | **Only alongside `app/`** — Next computes `rootDir = dirname(appDir)`, so these live wherever `app/` lives |
| `instrumentation-client.ts` | **Yes** — Next probes `src/instrumentation-client` *before* the root one |
| `sentry.server.config.ts` · `sentry.edge.config.ts` | **Yes** — they are plain relative imports from `instrumentation.ts`, no magic path |
| `tailwind.config.ts` · `biome.json` · `components.json` · `playwright.config.ts` · `vitest.config.ts` · `vitest.integration.config.ts` | Technically yes, but every one of these is conventionally root and moving them buys little. **Leave them** |
| `CODEOWNERS` | **Yes** → `.github/CODEOWNERS`. GitHub reads root, `.github/` or `docs/` |
| `drizzle.config.ts` | **Delete** — see below |

## Remove: `drizzle.config.ts` — but move one thing out of it first

Corrected 2026-09-28 after the owner asked how Drizzle keeps working without it. The
answer is that **it never worked through it**, but the file is not purely inert: it holds
one piece of knowledge the repo that actually needs it is missing.

### Drizzle is two separate tools here

| | Reads `drizzle.config.ts`? | Used for |
|---|---|---|
| `drizzle-orm` (runtime query builder) | **No** | every app query |
| `drizzle-kit` (CLI: `pull`/`push`/`generate`/`migrate`/`studio`) | **Yes** | regenerating types |

The runtime client is built in one place, [`src/utils/db/pool.ts:9`](../../../../src/utils/db/pool.ts):

```ts
drizzle(postgres(url, { prepare: false, max, ... }), { schema })
```

Two inputs, neither a config file: `url` from `process.env.DB_CONNECTION_STRING` /
`DB_ADMIN_CONNECTION_STRING`, and `schema` imported from **`@quicktalog/common`**. From
there, `getUserDb()` feeds `utils/db/rls.ts` (`withUser`/`withPublic`) and `getAdminDb()`
feeds `utils/db/admin.ts` (`asAdmin`); nothing else may import `pool.ts`, which
`tests/unit/architecture/db-boundaries.test.ts` enforces.

Grepped `utils/ lib/ actions/ app/ agent/ components/ hooks/ context/`: **nothing** reads
`drizzle.config.ts`. So deleting it cannot change how the app queries the database. The
app consumes the *product* of a `drizzle-kit pull` as an npm import, not the pull itself.

### Why this config is a footgun, not just dead weight

`docs/guides/drizzle.md` step 4 puts the only sanctioned command in the other repo:
*"Regenerate types in `../quicktalog-packages`: `npx drizzle-kit pull`"*. Its "Never run"
list covers `generate`, `push`, `migrate`, `drop`. `studio` appears nowhere in the repo.

Compare the two configs:

| | app (this repo) | `../quicktalog-packages` |
|---|---|---|
| `out` | `./drizzle/migrations` — **does not exist** | `./src/drizzle/migrations` — exists, holds the generated `schema.ts` |
| `schema` | `./drizzle/schema.ts` — **does not exist** | `./src/drizzle/schema.ts` |
| `schemaFilter` | **absent** | `["public"]` |
| `entities.roles` | **absent** | `false` |

The packages config carries a comment explaining those last two: the app only queries
`public`; `private` is reached through entry-point functions, and roles/policies are owned
by the Supabase CLI migrations, "so they must not be introspected into this package."

The app's config has neither guard. A `drizzle-kit pull` from the app root would therefore
introspect `private` **and** the roles and policies — exactly what `CLAUDE.md` forbids. It
is defused today only because the output lands in a folder nobody reads.

### The one thing worth keeping — and it belongs in the other repo

```ts
// Introspection reads the catalog, which the fail-closed `app_rls` login
// cannot do after M08; prefer the admin connection when it is set.
url: (process.env.DB_ADMIN_CONNECTION_STRING ?? process.env.DB_CONNECTION_STRING)!,
```

`docs/architecture/data-access.md:45` agrees — it lists `drizzle-kit pull` as a
**`DB_ADMIN_CONNECTION_STRING`** consumer, because after M08 `DB_CONNECTION_STRING` becomes
the fail-closed `app_rls` login that owns no privileges and cannot read the catalog.

**`../quicktalog-packages/drizzle.config.ts` uses plain `DB_CONNECTION_STRING` with no
fallback.** So once M08 lands, step 4 of our own Drizzle guide breaks: `drizzle-kit pull`
in the packages repo will fail to introspect. The fix already exists — in the wrong repo,
in the file we are deleting.

This is a real finding independent of the cleanup, and it must be recorded where the
migration will see it (`supabase-auth-migration/TO_DO.md`).

### Order matters

1. Add the `DB_ADMIN_CONNECTION_STRING ?? DB_CONNECTION_STRING` fallback (with the comment)
   to `../quicktalog-packages/drizzle.config.ts`. **Separate repo — needs a release.**
2. Note the post-M08 `pull` dependency in the auth migration's `TO_DO.md`.
3. Only then delete the app's `drizzle.config.ts`, drop the `drizzle-kit` devDependency,
   and touch the comment naming it at `.github/workflows/ci.yaml:127`.

Doing 3 before 1 loses the insight. If touching the packages repo is unwelcome right now,
**leave the app config in place** — it is inert, and premature deletion is the worse
outcome.

## Clean up: four dead `include` entries in `tsconfig.json`

```json
"utils/client.tsx",              // does not exist
"constants/form.ts",             // does not exist
"utils/generateSchema.ts",       // does not exist
"../quicktalog-packages/drizzle.config copy.ts",   // does not exist; a "copy" file, with a space, in another repo
```

All four are gone, and `"**/*.ts"` / `"**/*.tsx"` already cover everything in-repo. The
fourth is the odd one — it reaches into a sibling repository for a file named
`drizzle.config copy.ts`. Delete all four.

---

## The main proposal: move the 12 source dirs into `src/`

Next.js supports `src/app`, and this is the one change that actually fixes the root.

**Root goes from 17 visible directories to 6:**

```
src/          app actions agent components constants content context
              hooks lib styles types utils
              middleware.ts instrumentation.ts instrumentation-client.ts
              sentry.server.config.ts sentry.edge.config.ts
public/
tests/
docs/
scripts/
supabase/
+ ~15 root files (package.json, next.config.ts, tsconfig.json, the tool configs)
```

### Why this is cheap *now* specifically

`tsconfig.json` maps `"@/*": ["./*"]`. Changing that one line to `["./src/*"]` means
**every `@/` import in the codebase keeps working untouched.**

That only holds because the Tier 3.5 sweep already converted all 61 cross-folder `../`
imports to `@/`, and the new Biome rule keeps them that way. Before that sweep this move
would have broken 61 imports across 34 files. It is a genuinely good moment to do it.

### What actually has to change

| Change | Effort |
|---|---|
| `git mv` the 12 dirs + 5 root `.ts` files into `src/` | one command |
| `tsconfig.json`: `"@/*": ["./src/*"]` | one line |
| `tailwind.config.ts`: prefix the 4 `content` globs with `./src/` | 4 lines |
| `components.json`: `"css": "src/app/globals.css"` | one line |
| `biome.json` `overrides.includes`: `utils/db/pool.ts` → `src/utils/db/pool.ts` | one line |
| `tests/unit/architecture/db-boundaries.test.ts`: prefix its 13 `SOURCE_GLOBS` with `src/` (keep `scripts/**` at root) | 13 lines |
| `.github/workflows/*` | **none** — checked all 6; the only mention is a comment at `ci.yaml:127` |
| `tests/**` imports | **none** — they all use `@/` |

The architecture guard deserves a note, because it looks worse than it is. It expands the
alias by string — `if (specifier.startsWith("@/")) return specifier.slice(2)` — so its ~25
**rule** paths (`utils/db/pool`, `app/api/paddle/**`, `lib/users/provision`, …) compare
against the *alias* text, which does not change when the files move. Only its 13
filesystem `SOURCE_GLOBS` need the `src/` prefix.

`app/globals.css` does `@import url("../styles/index.css")`. Since `app/` and `styles/`
move together, that relative path still resolves (`src/app/` → `src/styles/`). It only
breaks if the two are split, so they must move in the same step.

### What must NOT move into `src/`

- **`public/`** — Next serves static assets from the project root only.
- **`tests/`** — conventionally outside the source tree; `vitest.config.ts` and
  `playwright.config.ts` point at `tests/**` and `./tests/e2e`.
- **`supabase/`** — the Supabase CLI expects `supabase/` at the repo root.
- **`docs/`**, **`scripts/`**, **`.claude/`** — not application source.

### The honest cost

- **Every source file moves.** The diff is ~470 renames. `git log --follow` and
  `git blame` still work (Git detects renames by content), but PR review is noisy and any
  open branch will conflict on every file it touches.
- **Do it on a quiet branch**, as a single commit that contains *only* the move plus the
  config edits, so the rename detection is clean and the commit is trivially reviewable.
- The auth migration is mid-flight. If `scripts/cutover/**` or a PROD runbook step is
  about to run, **do this after the cutover**, not before — a cutover under a moved tree
  is an avoidable risk.

### If you would rather not

The smaller subset, still worth doing on its own:

1. Delete the 4 dead `tsconfig.json` `include` entries. **Zero risk** — all four paths are
   missing files.
2. Move `CODEOWNERS` → `.github/CODEOWNERS`. **Zero risk.**
3. The `drizzle.config.ts` removal, in the 3-step order above — the only step that reaches
   outside this repo.

That takes the root from 22 files to 19. It does **not** fix the 12-source-directory
problem, which is what actually makes the root hard to scan.

---

## Already fixed while analysing

Two leftovers from the Tier 3 refactor, both found while reading configs for this analysis:

1. **`components.json`** still pointed shadcn's `utils` alias at `@/helpers/client`, which
   Tier 3 deleted. Any future `npx shadcn add` would have generated a component importing
   `cn` from a nonexistent module. Repointed to `@/lib/ui/cn`.
2. **`tests/unit/architecture/db-boundaries.test.ts`** still listed `helpers/**/*.{ts,tsx}`
   in `SOURCE_GLOBS`. Harmless (it matched nothing) but misleading in the file that
   documents the source perimeter. Removed; the test still passes, 14/14.

## Implementation checklist — status

**A, B and C are done (2026-09-28).** D is deferred. Each step was independently revertible.

### Step A — tsconfig include ✅ done

Remove 4 entries from `tsconfig.json` `include`; `**/*.ts` already covers the tree.

```diff
-    "utils/client.tsx",
-    "constants/form.ts",
-    "utils/generateSchema.ts",
-    "../quicktalog-packages/drizzle.config copy.ts",
```

Gate: `npx tsc --noEmit` must stay clean, and the file count it checks must not drop.

### Step B — CODEOWNERS ✅ done

`CODEOWNERS` → `.github/CODEOWNERS`, content unchanged (`* @nikolamirilo`). GitHub reads
root, `.github/` or `docs/`; nothing in the repo references the path.

### Step C — drizzle ✅ done

| | Where | Change |
|---|---|---|
| C1 | `../quicktalog-packages/drizzle.config.ts` | `url: (process.env.DB_ADMIN_CONNECTION_STRING ?? process.env.DB_CONNECTION_STRING)!` + the M08 comment. **Needs a package release to matter** |
| C2 | `.claude/plans/active/supabase-auth-migration/TO_DO.md` | record that after M08, `drizzle-kit pull` needs the admin connection |
| C3 | this repo | delete `drizzle.config.ts`; `npm uninstall drizzle-kit`; reword the comment at `.github/workflows/ci.yaml:127` |
| C4 | `docs/guides/drizzle.md` | state that the config lives in `../quicktalog-packages`, not here |

Gate after C3: `npx tsc --noEmit`, `npm test`, `npm run build`. None of them touch
`drizzle-kit`, so all three should be unchanged — if any moves, stop.

**C3 must not land before C1.** C1 was done by the owner directly, as a straight swap to
`DB_ADMIN_CONNECTION_STRING` rather than the `??` fallback originally proposed — which is
correct, and better: `../quicktalog-packages/.env` holds `DB_ADMIN_CONNECTION_STRING` and no
`DB_CONNECTION_STRING`, so the old config was reading a variable that does not exist there. No
fallback is needed, and the swap fixes a latent break. C3 followed.

### Step D — the `src/` move ✅ done 2026-09-28

Executed at the owner's request. 478 files moved, byte-identical (sha256-verified before and
after). Route surface, middleware size and generated CSS all unchanged.

Deviations from the plan as written:

- **`@/scripts/*` needed its own tsconfig mapping.** The plan missed that 6 scripts and 4
  tests import `@/scripts/...`; with `@/*` remapped to `src/`, those break. Added
  `"@/scripts/*": ["./scripts/*"]` ahead of `"@/*"` (longer prefix wins), so `scripts/`
  stays at the root and its imports keep working. Scripts import no app source, so nothing
  else crossed the boundary.
- **The architecture guard was normalised, not rewritten.** The plan said to prefix its 13
  `SOURCE_GLOBS`. That alone would have broken it: `f.path` gains `src/` while `@/x` still
  expands to `x`, so the ~25 allowlist paths and the relative-import resolution would stop
  lining up. Added a `stripSrc()` applied to both sides instead, leaving every rule path
  untouched.
- **One test read source off disk.** `custom-code-sandbox.test.ts` does `readFileSync` on
  `CustomCode.tsx` rather than importing it, so no import scan would have caught it. The
  test suite did.

The PROD-cutover caution in "The honest cost" still stands for anyone rebasing: every
source file moved, so open branches will conflict broadly.

## Noticed, not structural

`.husky/pre-commit` runs `npm run format` **and `npm run build`**. A full production build
on every commit is a heavy hook — `npm run check && npm test` is the usual split, with the
build left to CI (`.github/workflows/ci.yaml` already runs it). Your call; it is a
workflow preference, not a correctness issue.

## Evidence

From `node_modules/next/dist/lib/find-pages-dir.js`:

```js
function findDir(dir, name) {
    // prioritize ./${name} over ./src/${name}
    let curDir = path.join(dir, name);
    if (fs.existsSync(curDir)) return curDir;
    curDir = path.join(dir, 'src', name);
    if (fs.existsSync(curDir)) return curDir;
    return null;
}
```

From `node_modules/next/dist/build/index.js` — middleware and instrumentation are found as
siblings of the app directory, which is why they must travel with it:

```js
const rootDir = path.join(pagesDir || appDir, '..');
const includes = [middlewareDetectionRegExp, instrumentationHookDetectionRegExp];
```

From `node_modules/next/dist/build/create-compiler-aliases.js` — `src/` wins for the
client instrumentation hook:

```js
'private-next-instrumentation-client': [
    path.join(dir, 'src', 'instrumentation-client'),
    path.join(dir, 'instrumentation-client'),
    'private-next-empty-module'
],
```
