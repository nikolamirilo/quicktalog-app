"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

import { describeAuthError } from "@/components/dashboard/account/supabase/authErrors";
import { DeleteAccountCard } from "@/components/dashboard/account/supabase/DeleteAccountCard";
import { EmailCard } from "@/components/dashboard/account/supabase/EmailCard";
import { IdentitiesCard } from "@/components/dashboard/account/supabase/IdentitiesCard";
import { PasswordCard } from "@/components/dashboard/account/supabase/PasswordCard";
import { ProfileCard } from "@/components/dashboard/account/supabase/ProfileCard";
import { SessionsCard } from "@/components/dashboard/account/supabase/SessionsCard";
import { useAuth } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";

/**
 * The Supabase half of the settings page: everything Clerk's hosted `UserProfile`
 * used to cover, as the app's own forms. Credential calls run in the browser
 * client on purpose - Supabase rate limits them per end-user IP, and a server
 * would present one shared Vercel egress IP for everybody. Deleting the
 * account is the exception (cancels billing, uses the admin key), so it's a
 * server action deriving the user from the session.
 */
export function SupabaseAccount() {
	const supabase = useMemo(() => createClient(), []);
	const router = useRouter();
	const { user, signOut } = useAuth();
	const { userData, refreshUserData } = useUserContext();

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<ProfileCard
				initialName={(userData?.name as string) ?? user?.name ?? ""}
				onSaved={refreshUserData}
			/>
			<EmailCard currentEmail={user?.email ?? null} supabase={supabase} />
			<PasswordCard supabase={supabase} />
			<IdentitiesCard supabase={supabase} />
			<SessionsCard
				onSignOut={signOut}
				onSignOutEverywhere={async () => {
					const { error } = await supabase.auth.signOut({ scope: "global" });
					if (error) {
						toast.error(
							describeAuthError(error, "Could not sign out everywhere."),
						);
						return;
					}
					router.replace("/");
					router.refresh();
				}}
			/>
			<DeleteAccountCard
				onDeleted={async () => {
					// The account is gone; this only clears the cookies this browser
					// still holds. The access token itself is dead either way.
					await supabase.auth.signOut({ scope: "local" }).catch(() => {});
					// Hard navigation, not router.replace + refresh: this page is still
					// mounted on /admin/dashboard, and a refresh fired before the replace
					// settles re-runs its data load with the now-deleted user's session,
					// crashing getUserData instead of landing cleanly on home.
					window.location.href = "/";
				}}
			/>
		</div>
	);
}
