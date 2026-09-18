import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of a provided secret (header, bearer token) with the
 * expected one. Returns false when the expected secret is not configured.
 */
export function secretMatches(
	provided: string | null | undefined,
	expected: string | undefined,
): boolean {
	if (!provided || !expected) return false;
	// Hash both sides so lengths match and the comparison leaks nothing about length.
	const a = createHash("sha256").update(provided).digest();
	const b = createHash("sha256").update(expected).digest();
	return timingSafeEqual(a, b);
}
