import "server-only";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { getUserDb, type Tx } from "./pool";

type AppRole = "app_user" | "app_public";

// SET ROLE does not apply the role's own ALTER ROLE settings, so the limits are
// set per transaction instead.
const LIMITS = {
	app_user: { statement: "8s", lock: "3s", idle: "10s" },
	app_public: { statement: "3s", lock: "1s", idle: "5s" },
} as const;

async function inRole<T>(
	role: AppRole,
	claims: { sub?: string; session_id?: string },
	fn: (tx: Tx) => Promise<T>,
): Promise<T> {
	// Never derived from input, but checked anyway: this string ends up in a
	// role switch.
	if (role !== "app_user" && role !== "app_public") {
		throw new Error("invalid app role");
	}
	const limits = LIMITS[role];
	return getUserDb().transaction(async (tx) => {
		// One statement, bound parameters, all transaction-local. `search_path`
		// keeps `pg_temp` last so a temp table planted on a pooled backend cannot
		// shadow the unqualified table names Drizzle emits.
		await tx.execute(sql`select
			pg_catalog.set_config('role', ${role}, true),
			pg_catalog.set_config('request.jwt.claims', ${JSON.stringify({ ...claims, role })}, true),
			pg_catalog.set_config('search_path', 'public, pg_temp', true),
			pg_catalog.set_config('statement_timeout', ${limits.statement}, true),
			pg_catalog.set_config('lock_timeout', ${limits.lock}, true),
			pg_catalog.set_config('idle_in_transaction_session_timeout', ${limits.idle}, true)`);
		return fn(tx);
	});
	// No reset afterwards: COMMIT/ROLLBACK discards transaction-local settings,
	// and a reset inside an aborted transaction would throw 25P02.
}

/**
 * One block per server action or route handler. Everything inside runs as the
 * signed-in user under RLS.
 *
 * Never hold it open across Redis calls, fetches, `revalidate*`, model calls or
 * streaming: the transaction pins a pooled connection.
 */
export function withUser<T>(
	me: VerifiedIdentity,
	fn: (tx: Tx) => Promise<T>,
): Promise<T> {
	return inRole(
		"app_user",
		{ sub: me.userId, ...(me.sessionId ? { session_id: me.sessionId } : {}) },
		fn,
	);
}

/** Visitors, build, ISR and public signups. Takes no identity and never reads cookies. */
export function withPublic<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
	return inRole("app_public", {}, fn);
}

export type { Tx };
