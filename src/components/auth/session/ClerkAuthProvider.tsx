"use client";

import { ClerkProvider, useClerk, useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { type AuthState, AuthStateProvider } from "@/context/AuthContext";

/** Translates Clerk's hooks into the app's own auth state. */
function ClerkAuthState({ children }: { children: ReactNode }) {
	const { user, isLoaded, isSignedIn } = useUser();
	const { signOut } = useClerk();

	const value: AuthState = {
		isLoaded,
		isSignedIn: Boolean(isSignedIn),
		user: user
			? {
					id: user.id,
					email: user.primaryEmailAddress?.emailAddress ?? null,
					name:
						[user.firstName, user.lastName].filter(Boolean).join(" ") ||
						user.username ||
						"Account",
					imageUrl: user.imageUrl ?? null,
				}
			: null,
		signOut: async () => {
			await signOut({ redirectUrl: "/" });
		},
		accountHref: "/admin/dashboard?tab=settings",
	};

	return <AuthStateProvider value={value}>{children}</AuthStateProvider>;
}

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider
			afterSignOutUrl="/"
			signInUrl="/auth"
			signUpUrl="/auth?mode=signup"
		>
			<ClerkAuthState>{children}</ClerkAuthState>
		</ClerkProvider>
	);
}
