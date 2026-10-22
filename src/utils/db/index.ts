import "server-only";

/**
 * The only entry point for data access. Pick the block that matches who is
 * asking:
 *
 * - `withUser(me, tx => ...)` for a signed-in user: runs as `app_user`, so RLS
 *   limits every statement to their own rows. Keep an owner predicate anyway.
 * - `withPublic(tx => ...)` for visitors, ISR and the sitemap: runs as
 *   `app_public`, which sees only published catalogues.
 * - `asAdmin(op, tx => ...)` for system work with no user: webhooks,
 *   provisioning and scripts. It bypasses RLS, so it is not importable from
 *   ordinary feature code.
 *
 * A query outside these blocks runs as a role with no privileges and fails with
 * 42501; that is deliberate.
 */
// `asAdmin` is deliberately NOT re-exported here: it bypasses RLS, so it must
// be imported from "@/utils/db/admin" by the few system modules that may use
// it, and that import is what the architecture test checks for.
export {
	PUBLIC_CATALOGUE_COLUMNS,
	pickEditable,
	CATALOGUE_EDITABLE_FIELDS,
} from "./columns";
export { isUniqueViolation, pgError } from "./errors";
export { type Tx, withPublic, withUser } from "./rls";
