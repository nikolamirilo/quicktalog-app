"use client";

import { UserProfile } from "@clerk/nextjs";

/**
 * The provider-specific half of the settings page. Clerk ships a whole account
 * UI as one component; Phase 2 replaces this file with Quicktalog's own profile,
 * email, password and identity forms, and nothing around it has to change.
 */
export default function ClerkAccount() {
	return <UserProfile />;
}
