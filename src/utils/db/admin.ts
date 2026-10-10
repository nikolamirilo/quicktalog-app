import "server-only";
import { sql } from "drizzle-orm";
import { getAdminDb, type Tx } from "./pool";

export type { Tx };

/**
 * Runs system writes (Paddle webhook, Clerk user sync) in one transaction on the
 * admin connection, which bypasses RLS. Only webhooks, provisioning, scripts and
 * tests may import this. `op` labels the connection for logs and pg_stat_activity.
 */
export async function asAdmin<T>(
	op: string,
	fn: (tx: Tx) => Promise<T>,
): Promise<T> {
	if (!/^[a-z][a-z0-9:._-]{0,62}$/.test(op)) {
		throw new Error("invalid admin op label");
	}
	return getAdminDb().transaction(async (tx) => {
		await tx.execute(
			sql`select pg_catalog.set_config('statement_timeout', '15s', true),
				pg_catalog.set_config('application_name', ${`admin:${op}`}, true)`,
		);
		return fn(tx);
	});
}
