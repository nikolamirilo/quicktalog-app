import "server-only";
import { schema } from "@quicktalog/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

function make(url: string | undefined, envName: string, max: number) {
	// Created lazily so builds without database env (bundle analysis CI) still work.
	if (!url) throw new Error(`${envName} is not set`);
	return drizzle(
		postgres(url, {
			prepare: false, // Supavisor transaction mode has no prepared statements
			max,
			idle_timeout: 5,
			max_lifetime: 600,
			connect_timeout: 10,
		}),
		{ schema },
	);
}

type Db = ReturnType<typeof make>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

let userDb: Db | undefined;
let adminDb: Db | undefined;

/**
 * Connection for user and visitor traffic. Every query on it runs inside the
 * wrapper in `utils/db/rls.ts`, which switches to `app_user`/`app_public` so
 * RLS applies. Import only through `utils/db`.
 */
export const getUserDb = () =>
	(userDb ??= make(
		process.env.DB_CONNECTION_STRING,
		"DB_CONNECTION_STRING",
		3,
	));

/** Connection for system writes (webhooks, provisioning). Import only through utils/db/admin. */
export const getAdminDb = () =>
	(adminDb ??= make(
		process.env.DB_CONNECTION_STRING,
		"DB_CONNECTION_STRING",
		2,
	));
