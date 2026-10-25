# Testing

All tests run on Vitest. There is no browser e2e suite: user flows such as
creating a catalogue are tested as components and server actions with their
boundaries (auth, database, Redis, router) mocked.

```sh
npm test                  # unit tests, tests/unit - no network, no database
npm run test:integration  # tests/integration - needs a real database
```

## Unit tests (`tests/unit`)

`vitest.config.ts`. Files default to the `node` environment; a file that renders
React opts into the DOM with `// @vitest-environment happy-dom` on its first line.

The folders mirror `src/`: `agent`, `ai`, `components`, `context`, `hooks`,
`lib`, `server_actions`, `paddle`, `api`, `scripts`. Two kinds are worth knowing:

- **Server actions** (`tests/unit/server_actions`) mock `@/lib/auth/identity`
  and `@/utils/db`, and run the real entitlement code. They check what the
  server decides: who is calling, which owner is written, which plan limit applies.
- **Architecture** (`tests/unit/architecture/db-boundaries.test.ts`) scans the
  source and fails when code reaches the database outside `withUser` /
  `withPublic` / `asAdmin`, imports the admin connection from the wrong place,
  or queries data through supabase-js.

What earns a test: security and data boundaries, plan limits and billing,
anything that changes stored data, and behaviour a user would notice breaking.
Not worth one: constants, class names and exact layout, or a second test of
something another test already covers.

## Integration tests (`tests/integration`)

`vitest.integration.config.ts`. Files run one at a time because they share a
database.

- `auth/signup.test.ts` - the sign-up triggers against a real GoTrue. Runs only
  against a local stack (`supabase start`) and skips otherwise.
- `db/forgotten-wrapper.test.ts` - a query outside the RLS wrappers is refused
  with `42501`. Point `DB_RLS_CONNECTION_STRING` at the `app_rls` login, or the
  assertions skip. Refuses the PROD project.

Each file's header has the exact environment it needs. The `db-tests` job in
`.github/workflows/ci.yaml` (commented out) runs both against the local stack.
