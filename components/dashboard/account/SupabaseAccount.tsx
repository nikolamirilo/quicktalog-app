"use client";

import type { AuthError, UserIdentity } from "@supabase/supabase-js";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import {
	FiAlertTriangle,
	FiLink,
	FiLock,
	FiLogOut,
	FiMail,
	FiTrash2,
	FiUser,
} from "react-icons/fi";
import { toast } from "sonner";
import { deleteAccount, updateProfile } from "@/actions/account";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useUserContext } from "@/context/UserContext";
import { createClient } from "@/utils/supabase/client";

/** Where a linked identity comes back to. Must be inside the redirect allow-list. */
const ACCOUNT_PATH = "/admin/dashboard?tab=settings";

/**
 * GoTrue's error codes turned into something a person can act on. Anything not
 * listed keeps the server's own message, which is already user-facing.
 */
function describe(error: AuthError | null, fallback: string): string {
	switch (error?.code) {
		case "invalid_credentials":
			return "That password is not correct.";
		case "same_password":
			return "The new password has to be different from the current one.";
		case "weak_password":
			return "That password is too weak. Use at least 8 characters with letters and digits.";
		case "email_exists":
		case "user_already_exists":
			return "That email address is already in use.";
		case "email_address_invalid":
			return "That email address is not valid.";
		case "over_email_send_rate_limit":
			return "Too many emails were sent. Please wait a few minutes.";
		case "over_request_rate_limit":
			return "Too many attempts. Please wait a few minutes.";
		case "manual_linking_disabled":
			return "Connecting accounts is not available yet.";
		case "identity_already_exists":
			return "That Google account is already connected to an account.";
		case "single_identity_not_deletable":
			return "This is your only sign-in method, so it cannot be disconnected.";
		case "email_conflict_identity_not_deletable":
			return "Disconnecting this would leave your account without its email address.";
		case "reauthentication_not_valid":
			return "That code is not valid. Request a new one.";
		default:
			return error?.message || fallback;
	}
}

/**
 * The Supabase half of the settings page: everything Clerk's hosted `UserProfile`
 * used to cover, as the app's own forms. Credential calls run in the browser
 * client on purpose - Supabase rate limits them per end-user IP, and a server
 * would present one shared Vercel egress IP for everybody. Deleting the
 * account is the exception (cancels billing, uses the admin key), so it's a
 * server action deriving the user from the session.
 */
export default function SupabaseAccount() {
	const supabase = useMemo(() => createClient(), []);
	const router = useRouter();
	const { user, signOut } = useAuth();
	const { userData, refreshUserData } = useUserContext();

	return (
		<div className="space-y-4">
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
						toast.error(describe(error, "Could not sign out everywhere."));
						return;
					}
					router.replace("/");
					router.refresh();
				}}
			/>
			<DangerCard
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

type Supabase = ReturnType<typeof createClient>;

function Section({
	title,
	description,
	icon,
	children,
	tone = "default",
}: {
	title: string;
	description: string;
	icon: ReactNode;
	children: ReactNode;
	tone?: "default" | "danger";
}) {
	return (
		<Card
			className={tone === "danger" ? "border-red-300" : undefined}
			type="form"
		>
			<CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-2">
				<CardTitle className="flex items-center gap-2 text-product-foreground font-heading text-sm sm:text-base">
					<span
						className={
							tone === "danger" ? "text-red-500" : "text-product-primary"
						}
					>
						{icon}
					</span>
					{title}
				</CardTitle>
				<CardDescription className="text-xs text-product-foreground-accent">
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
				{children}
			</CardContent>
		</Card>
	);
}

function ProfileCard({
	initialName,
	onSaved,
}: {
	initialName: string;
	onSaved: () => Promise<void>;
}) {
	const [name, setName] = useState(initialName);
	const [saving, setSaving] = useState(false);

	// The stored name arrives after the first render of the dashboard.
	useEffect(() => {
		setName(initialName);
	}, [initialName]);

	const save = async () => {
		setSaving(true);
		try {
			const result = await updateProfile(name);
			if (!result.success) {
				toast.error(result.error ?? "Could not save your name.");
				return;
			}
			await onSaved();
			toast.success("Your name was updated.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Section
			description="The name shown in your dashboard and used in emails we send you."
			icon={<FiUser className="w-5 h-5" />}
			title="Profile"
		>
			<div className="space-y-1.5 max-w-md">
				<Label htmlFor="account-name">Name</Label>
				<Input
					autoComplete="name"
					id="account-name"
					maxLength={80}
					onChange={(event) => setName(event.target.value)}
					value={name}
				/>
			</div>
			<Button
				disabled={saving || name.trim() === initialName.trim() || !name.trim()}
				onClick={save}
			>
				{saving ? "Saving..." : "Save name"}
			</Button>
		</Section>
	);
}

function EmailCard({
	currentEmail,
	supabase,
}: {
	currentEmail: string | null;
	supabase: Supabase;
}) {
	const [email, setEmail] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);

	const requestChange = async () => {
		setSending(true);
		try {
			const { error } = await supabase.auth.updateUser(
				{ email: email.trim().toLowerCase() },
				// Exactly the origin, with no path and no query: the email template
				// appends its own `/auth/confirm?token_hash=...` to it.
				{ emailRedirectTo: window.location.origin },
			);
			if (error) {
				toast.error(describe(error, "Could not start the email change."));
				return;
			}
			setSent(true);
			setEmail("");
			toast.success("Confirmation links sent.");
		} finally {
			setSending(false);
		}
	};

	return (
		<Section
			description="Changing your email takes two confirmations, one from the current address and one from the new one. Nothing changes until both links are opened."
			icon={<FiMail className="w-5 h-5" />}
			title="Email address"
		>
			<p className="text-sm text-product-foreground-accent">
				Current address:{" "}
				<span className="font-medium text-product-foreground">
					{currentEmail ?? "unknown"}
				</span>
			</p>
			<div className="space-y-1.5 max-w-md">
				<Label htmlFor="account-new-email">New email address</Label>
				<Input
					autoComplete="email"
					id="account-new-email"
					onChange={(event) => setEmail(event.target.value)}
					type="email"
					value={email}
				/>
			</div>
			{sent && (
				<p className="text-sm text-product-foreground-accent">
					Check both inboxes. The change is applied only after both links are
					confirmed.
				</p>
			)}
			<Button
				disabled={sending || !email.includes("@")}
				onClick={requestChange}
			>
				{sending ? "Sending..." : "Send confirmation links"}
			</Button>
		</Section>
	);
}

function PasswordCard({ supabase }: { supabase: Supabase }) {
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	// Only filled when the project asks for a second factor on password change;
	// the code is emailed by `reauthenticate()`.
	const [nonce, setNonce] = useState("");
	const [nonceNeeded, setNonceNeeded] = useState(false);
	const [saving, setSaving] = useState(false);

	const reset = () => {
		setCurrent("");
		setNext("");
		setConfirm("");
		setNonce("");
		setNonceNeeded(false);
	};

	const change = async () => {
		if (next !== confirm) {
			toast.error("The two new passwords do not match.");
			return;
		}
		setSaving(true);
		try {
			const { error } = await supabase.auth.updateUser({
				current_password: current,
				password: next,
				...(nonce ? { nonce } : {}),
			});

			// "Secure password change" is on: GoTrue wants a code it emailed, on top
			// of the current password. Ask for it and keep the form as it is.
			if (
				error?.code === "reauthentication_needed" ||
				error?.code === "reauth_nonce_missing"
			) {
				setNonceNeeded(true);
				const sent = await supabase.auth.reauthenticate();
				toast.info(
					sent.error
						? describe(sent.error, "Could not send the confirmation code.")
						: "We emailed you a confirmation code. Enter it below.",
				);
				return;
			}
			if (error) {
				toast.error(describe(error, "Could not change your password."));
				return;
			}

			// The new password is in place; every other device keeps a refresh token
			// minted with the old one until it is revoked.
			const { error: signOutError } = await supabase.auth.signOut({
				scope: "others",
			});
			reset();
			toast.success(
				signOutError
					? "Password changed. Other devices may stay signed in."
					: "Password changed. Other devices were signed out.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Section
			description="Changing your password signs out every other device. This one stays signed in."
			icon={<FiLock className="w-5 h-5" />}
			title="Password"
		>
			<div className="grid gap-3 max-w-md">
				<div className="space-y-1.5">
					<Label htmlFor="account-current-password">Current password</Label>
					<Input
						autoComplete="current-password"
						id="account-current-password"
						onChange={(event) => setCurrent(event.target.value)}
						type="password"
						value={current}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="account-new-password">New password</Label>
					<Input
						autoComplete="new-password"
						id="account-new-password"
						onChange={(event) => setNext(event.target.value)}
						type="password"
						value={next}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="account-confirm-password">Repeat new password</Label>
					<Input
						autoComplete="new-password"
						id="account-confirm-password"
						onChange={(event) => setConfirm(event.target.value)}
						type="password"
						value={confirm}
					/>
				</div>
				{nonceNeeded && (
					<div className="space-y-1.5">
						<Label htmlFor="account-nonce">Emailed confirmation code</Label>
						<Input
							autoComplete="one-time-code"
							id="account-nonce"
							inputMode="numeric"
							onChange={(event) => setNonce(event.target.value.trim())}
							value={nonce}
						/>
					</div>
				)}
			</div>
			<Button
				disabled={saving || !current || next.length < 8 || !confirm}
				onClick={change}
			>
				{saving ? "Changing..." : "Change password"}
			</Button>
		</Section>
	);
}

function IdentitiesCard({ supabase }: { supabase: Supabase }) {
	const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
	const [busy, setBusy] = useState(false);

	const load = async () => {
		const { data, error } = await supabase.auth.getUserIdentities();
		setIdentities(error ? [] : (data?.identities ?? []));
	};

	// Once, on mount: the client is stable for the life of the component.
	useEffect(() => {
		load();
	}, []);

	const google = identities?.find((identity) => identity.provider === "google");

	const connect = async () => {
		setBusy(true);
		try {
			const next = encodeURIComponent(ACCOUNT_PATH);
			const { error } = await supabase.auth.linkIdentity({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
				},
			});
			if (error) toast.error(describe(error, "Could not connect Google."));
		} finally {
			setBusy(false);
		}
	};

	const disconnect = async (identity: UserIdentity) => {
		setBusy(true);
		try {
			const { error } = await supabase.auth.unlinkIdentity(identity);
			if (error) {
				toast.error(describe(error, "Could not disconnect Google."));
				return;
			}
			await load();
			toast.success("Google was disconnected.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<Section
			description="Sign in with Google instead of a password."
			icon={<FiLink className="w-5 h-5" />}
			title="Connected accounts"
		>
			<div className="flex flex-col sm:flex-row sm:items-center gap-2">
				<span className="flex items-center gap-2 text-sm text-product-foreground">
					<FcGoogle className="w-5 h-5" />
					Google
					<span className="text-product-foreground-accent">
						{identities === null
							? "checking..."
							: google
								? `connected${google.identity_data?.email ? ` as ${google.identity_data.email}` : ""}`
								: "not connected"}
					</span>
				</span>
				{identities !== null &&
					(google ? (
						<Button
							// The last identity cannot be removed; GoTrue refuses it too.
							disabled={busy || identities.length < 2}
							onClick={() => disconnect(google)}
							variant="outline"
						>
							Disconnect
						</Button>
					) : (
						<Button disabled={busy} onClick={connect} variant="outline">
							Connect Google
						</Button>
					))}
			</div>
		</Section>
	);
}

function SessionsCard({
	onSignOut,
	onSignOutEverywhere,
}: {
	onSignOut: () => Promise<void>;
	onSignOutEverywhere: () => Promise<void>;
}) {
	const [busy, setBusy] = useState(false);

	const run = async (action: () => Promise<void>) => {
		setBusy(true);
		try {
			await action();
		} finally {
			setBusy(false);
		}
	};

	return (
		<Section
			description="Signing out everywhere ends every session on every device, including this one."
			icon={<FiLogOut className="w-5 h-5" />}
			title="Sessions"
		>
			<div className="flex flex-col sm:flex-row gap-2">
				<Button
					disabled={busy}
					onClick={() => run(onSignOut)}
					variant="outline"
				>
					<FiLogOut className="w-4 h-4" /> Sign out
				</Button>
				<Button
					disabled={busy}
					onClick={() => run(onSignOutEverywhere)}
					variant="destructive"
				>
					<FiLogOut className="w-4 h-4" /> Sign out everywhere
				</Button>
			</div>
		</Section>
	);
}

function DangerCard({ onDeleted }: { onDeleted: () => Promise<void> }) {
	const [open, setOpen] = useState(false);
	const [typed, setTyped] = useState("");
	const [deleting, setDeleting] = useState(false);

	const remove = async () => {
		setDeleting(true);
		try {
			// No argument: the server derives the account from the session and
			// re-checks it against the auth service before it deletes anything.
			const result = await deleteAccount();
			if (!result.success) {
				toast.error(result.error ?? "Could not delete your account.");
				return;
			}
			setOpen(false);
			toast.success("Your account was deleted.");
			await onDeleted();
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Section
			description="Deleting your account cancels your subscription and permanently removes your catalogues, their public pages and everything else stored with them. This cannot be undone."
			icon={<FiAlertTriangle className="w-5 h-5" />}
			title="Delete account"
			tone="danger"
		>
			<Button onClick={() => setOpen(true)} variant="destructive">
				<FiTrash2 className="w-4 h-4" /> Delete my account
			</Button>

			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent className="bg-product-background border border-product-border">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-product-foreground font-heading">
							<FiAlertTriangle className="text-red-500 w-6 h-6" />
							Delete your account?
						</DialogTitle>
						<DialogDescription className="text-product-foreground-accent">
							Your active subscription is cancelled first, then your account and
							every catalogue you own are deleted. Published pages stop working
							immediately. There is no way back.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-1.5">
						<Label htmlFor="account-delete-confirm">
							Type DELETE to confirm
						</Label>
						<Input
							autoComplete="off"
							id="account-delete-confirm"
							onChange={(event) => setTyped(event.target.value)}
							value={typed}
						/>
					</div>

					<DialogFooter className="pt-4 border-t border-product-border">
						<Button
							disabled={deleting}
							onClick={() => setOpen(false)}
							variant="outline"
						>
							Keep my account
						</Button>
						<Button
							disabled={deleting || typed !== "DELETE"}
							onClick={remove}
							variant="destructive"
						>
							{deleting ? "Deleting..." : "Delete permanently"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Section>
	);
}
