"use server";
import { createServerClient } from "@supabase/ssr";

export async function createClient(isUsingCookies: boolean = true) {
	if (!isUsingCookies) {
		// Return a basic Supabase client without cookies for build-time usage
		return createServerClient(
			process.env.SUPABASE_URL!,
			process.env.SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return [];
					},
					setAll() {
						// No-op when not using cookies
					},
				},
			},
		);
	}

	// Original implementation with cookies
	const { cookies } = await import("next/headers");
	const cookieStore = await cookies();
	return createServerClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
			},
		},
	);
}
