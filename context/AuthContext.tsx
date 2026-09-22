"use client";

import { createContext, type ReactNode, useContext } from "react";

/**
 * What the app needs to know about who is signed in, in terms that belong to
 * Quicktalog rather than to an auth provider.
 *
 * Every component reads this instead of Clerk's or Supabase's hooks, so the
 * cutover switches one provider component rather than rewriting the UI.
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

export function useAuth(): AuthState {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used inside <AuthProvider>");
	}
	return context;
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
