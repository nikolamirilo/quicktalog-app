"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { type AuthState, AuthStateProvider } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

function toAuthUser(user: User | null) {
	if (!user) return null;
	const metadata = user.user_metadata ?? {};
	return {
		id: user.id,
		email: user.email ?? null,
		name:
			(typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
			(typeof metadata.name === "string" && metadata.name.trim()) ||
			user.email?.split("@")[0] ||
			"Account",
		imageUrl:
			typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
	};
}

/**
 * Client-side session state for Supabase Auth.
 *
 * `onAuthStateChange` fires in every tab, so signing out in one signs out the
 * rest. When the user actually changes, the router is refreshed as well:
 * server components hold the previous user's data until they re-render.
 */
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
	const supabase = useMemo(() => createClient(), []);
	const router = useRouter();
	const [user, setUser] = useState<ReturnType<typeof toAuthUser>>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		let active = true;

		supabase.auth.getUser().then(({ data }) => {
			if (!active) return;
			setUser(toAuthUser(data.user ?? null));
			setIsLoaded(true);
		});

		const { data: subscription } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				if (!active) return;
				const next = toAuthUser(session?.user ?? null);
				setUser((previous) => {
					// A token refresh fires this too; only a different user is worth
					// re-rendering the server components for.
					if (previous?.id !== next?.id) router.refresh();
					return next;
				});
				setIsLoaded(true);
			},
		);

		return () => {
			active = false;
			subscription.subscription.unsubscribe();
		};
	}, [supabase, router]);

	const value: AuthState = {
		isLoaded,
		isSignedIn: Boolean(user),
		user,
		signOut: async () => {
			await supabase.auth.signOut({ scope: "local" });
			router.push("/");
			router.refresh();
		},
		accountHref: "/admin/dashboard?tab=settings",
	};

	return <AuthStateProvider value={value}>{children}</AuthStateProvider>;
}
