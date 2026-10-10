"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { describeAuthError } from "@/components/dashboard/account/supabase/authErrors";
import { DeleteAccountRow } from "@/components/dashboard/account/supabase/DeleteAccountRow";
import { EmailRow } from "@/components/dashboard/account/supabase/EmailRow";
import { GoogleRow } from "@/components/dashboard/account/supabase/GoogleRow";
import { PasswordRow } from "@/components/dashboard/account/supabase/PasswordRow";
import { ProfileRow } from "@/components/dashboard/account/supabase/ProfileRow";
import { SessionsRow } from "@/components/dashboard/account/supabase/SessionsRow";
import { CookiesRow } from "@/components/dashboard/settings/CookiesRow";
import { SettingsGroup } from "@/components/dashboard/settings/SettingsGroup";
import { useAuth } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";

type EditableRow = "name" | "email" | "password";

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
	// One editor open at a time.
	const [openRow, setOpenRow] = useState<EditableRow | null>(null);
	const rowProps = (row: EditableRow) => ({
		open: openRow === row,
		onOpenChange: (open: boolean) => setOpenRow(open ? row : null),
	});

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<SettingsGroup title="Account">
				<ProfileRow
					initialName={(userData?.name as string) ?? user?.name ?? ""}
					onSaved={refreshUserData}
					{...rowProps("name")}
				/>
				<EmailRow
					currentEmail={user?.email ?? null}
					supabase={supabase}
					{...rowProps("email")}
				/>
				<PasswordRow supabase={supabase} {...rowProps("password")} />
				<GoogleRow supabase={supabase} />
			</SettingsGroup>
			<SettingsGroup title="Privacy and sessions">
				<CookiesRow />
				<SessionsRow
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
			</SettingsGroup>
			<DeleteAccountRow
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
