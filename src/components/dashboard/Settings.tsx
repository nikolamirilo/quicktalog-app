"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { lazy, Suspense } from "react";

import { AppTitle } from "@/components/dashboard/common/AppHeadings";

// The account forms are heavy, so they load separately.
const Account = lazy(() =>
	import("@/components/dashboard/account/supabase/SupabaseAccount").then(
		(m) => ({ default: m.SupabaseAccount }),
	),
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
