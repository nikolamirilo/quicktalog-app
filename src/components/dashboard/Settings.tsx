"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { lazy, Suspense } from "react";

import { AppTitle } from "@/components/dashboard/common/AppHeadings";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

// The account forms are provider-specific and heavy, so they load separately.
// `AUTH_PROVIDER` is inlined at build time, so only the live provider's forms
// end up in the bundle.
const Account = lazy(() =>
	AUTH_PROVIDER === "supabase"
		? import("@/components/dashboard/account/supabase/SupabaseAccount").then(
				(m) => ({ default: m.SupabaseAccount }),
			)
		: import("@/components/dashboard/account/ClerkAccount").then((m) => ({
				default: m.ClerkAccount,
			})),
);

export const Settings = () => (
	<div>
		<AppTitle icon={<SettingsIcon />}>Settings</AppTitle>
		<Suspense
			fallback={
				<div className="h-32 w-full animate-pulse rounded-product-card bg-product-background-hero" />
			}
		>
			<Account />
		</Suspense>
	</div>
);
