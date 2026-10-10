/**
 * Which identity provider the app trusts. Inlined at build time from AUTH_PROVIDER
 * (see next.config.ts `env`), so server and client can never disagree.
 * "clerk" until the Supabase Auth cutover.
 */
export const AUTH_PROVIDER: "clerk" | "supabase" =
	process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase" ? "supabase" : "clerk";
