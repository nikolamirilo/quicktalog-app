"use client";

import { createContext, type ReactNode, useContext } from "react";

/**
 * What the app needs to know about who is signed in, in terms that belong to
 * Quicktalog rather than to an auth provider.
 *
 * Every component reads this instead of Supabase's hooks, so the UI does not
 * depend on the auth provider.
 */
export type AuthUser = {
	id: string;
	email: string | null;
	name: string;
	imageUrl: string | null;
};

export type AuthState = {
	/** False until the provider knows whether anyone is signed in. */
	isLoaded: boolean;
	isSignedIn: boolean;
	user: AuthUser | null;
	signOut: () => Promise<void>;
	/** Where the account settings live for this provider. */
	accountHref: string;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Used by `useAuth` when no `AuthStateProvider` is in scope (e.g. a render
 * path that bypasses the root layout, like a `not-found` boundary or a server
 * action response). The shape keeps consumers reading as if the provider were
 * present, so they fall back to their logged-out branches instead of crashing
 * the whole render.
 */
const FALLBACK_AUTH_STATE: AuthState = {
	isLoaded: true,
	isSignedIn: false,
	user: null,
	signOut: async () => {},
	accountHref: "/admin/dashboard?tab=settings",
};

export function useAuth(): AuthState {
	const context = useContext(AuthContext);
	return context ?? FALLBACK_AUTH_STATE;
}

export function AuthStateProvider({
	value,
	children,
}: {
	value: AuthState;
	children: ReactNode;
}) {
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
