import "server-only";

/**
 * The Postgres error behind a Drizzle error. drizzle-orm wraps postgres-js errors
 * in DrizzleQueryError, with the original under `.cause`.
 */
export function pgError(
	error: unknown,
): { code: string; constraint?: string } | null {
	let current: unknown = error;
	for (
		let depth = 0;
		current && typeof current === "object" && depth < 5;
		depth++
	) {
		const candidate = current as { code?: unknown; constraint_name?: unknown };
		if (
			typeof candidate.code === "string" &&
			/^[0-9A-Z]{5}$/.test(candidate.code)
		) {
			return {
				code: candidate.code,
				constraint:
					typeof candidate.constraint_name === "string"
						? candidate.constraint_name
						: undefined,
			};
		}
		current = (current as { cause?: unknown }).cause;
	}
	return null;
}

export const isUniqueViolation = (error: unknown) =>
	pgError(error)?.code === "23505";
