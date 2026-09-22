"use client";

import type { ReactNode } from "react";
import { ClerkAuthProvider } from "@/components/auth/ClerkAuthProvider";
import { SupabaseAuthProvider } from "@/components/auth/SupabaseAuthProvider";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * The single place the app decides which auth provider is live. It is chosen at
 * build time from `AUTH_PROVIDER`, so both branches cannot be bundled with
 * conflicting session state.
 *
 * Nothing else in the UI knows which provider is live, because everything
 * reads `useAuth()`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	if (AUTH_PROVIDER === "supabase") {
		return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
	}
	return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}
