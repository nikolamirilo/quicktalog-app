"use client";

import type { ReactNode } from "react";
import { ClerkAuthProvider } from "@/components/auth/ClerkAuthProvider";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * The single place the app decides which auth provider is live. It is chosen at
 * build time from `AUTH_PROVIDER`, so both branches cannot be bundled with
 * conflicting session state.
 *
 * Phase 2 adds `SupabaseAuthProvider` next to this one; nothing else in the UI
 * changes, because everything reads `useAuth()`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	if (AUTH_PROVIDER === "supabase") {
		throw new Error(
			"AUTH_PROVIDER=supabase is not implemented yet (Phase 2 of the auth migration)",
		);
	}
	return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}
