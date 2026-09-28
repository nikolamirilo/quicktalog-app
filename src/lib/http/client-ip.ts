import "server-only";
import { headers } from "next/headers";

/**
 * The visitor's IP as seen by Vercel's proxy, for rate-limiting public forms.
 * `x-forwarded-for` can be a list; the first entry is the client. Falls back to
 * a constant so a missing header rate-limits everyone together instead of
 * letting requests through unlimited.
 */
export async function clientIp(): Promise<string> {
	const h = await headers();
	const forwarded = h.get("x-forwarded-for");
	const first = forwarded?.split(",")[0]?.trim();
	return first || h.get("x-real-ip")?.trim() || "unknown";
}
