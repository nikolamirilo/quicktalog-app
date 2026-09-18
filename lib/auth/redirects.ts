const FALLBACK = "/admin/dashboard";

const hasUnsafeChars = (value: string) =>
	[...value].some(
		(ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 || ch === "\\",
	);

/**
 * A same-origin relative path to redirect to after sign-in, or the fallback.
 * Rejects protocol-relative and backslash tricks (`//evil.com`, `/\evil.com`,
 * `/%09/evil.com`) and loops back into /auth.
 */
export function safeNext(
	raw: string | null | undefined,
	origin?: string,
	fallback = FALLBACK,
): string {
	if (typeof raw !== "string" || raw.length > 512 || hasUnsafeChars(raw)) {
		return fallback;
	}
	let decoded: string;
	try {
		decoded = decodeURIComponent(raw);
	} catch {
		return fallback;
	}
	if (hasUnsafeChars(decoded)) return fallback;
	if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;

	const base =
		origin ??
		(typeof window !== "undefined"
			? window.location.origin
			: "http://local.invalid");
	try {
		const url = new URL(raw, base);
		if (url.origin !== new URL(base).origin) return fallback;
		const path = `${url.pathname}${url.search}${url.hash}`;
		return path.startsWith("/auth") && !path.startsWith("/auth/update-password")
			? fallback
			: path;
	} catch {
		return fallback;
	}
}
