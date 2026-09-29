"use client";

import { Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { deleteAccount } from "@/actions/account";
import {
	SettingsGroup,
	SettingsRow,
} from "@/components/dashboard/settings/SettingsGroup";
import {
	AppDialogContent,
	AppDialogFooter,
	AppDialogIcon,
} from "@/components/modals/AppDialog";
import {
	AlertDialog,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** "Delete account" row and its type-DELETE confirmation dialog. */
export function DeleteAccountRow({
	onDeleted,
}: {
	onDeleted: () => Promise<void>;
}) {
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
		<SettingsGroup title="Danger zone" tone="danger">
			<SettingsRow
				action={
					<Button onClick={() => setOpen(true)} size="sm" variant="destructive">
						<Trash2 aria-hidden="true" /> Delete account
					</Button>
				}
				description="Cancels your subscription and permanently removes your catalogues and their public pages. This cannot be undone."
				label="Delete account"
				tone="danger"
			/>
			<AlertDialog
				onOpenChange={(next) => {
					if (!deleting) setOpen(next);
				}}
				open={open}
			>
				<AppDialogContent size="sm">
					<AppDialogIcon tone="red">
						<TriangleAlert />
					</AppDialogIcon>
					<div className="flex flex-col gap-1.5">
						<AlertDialogTitle>Delete your account?</AlertDialogTitle>
						<AlertDialogDescription className="text-sm">
							Your active subscription is cancelled first, then your account and
							every catalogue you own are deleted. Published pages stop working
							immediately. There is no way back.
						</AlertDialogDescription>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="account-delete-confirm">
							Type <b>DELETE</b> to confirm
						</Label>
						<Input
							autoCapitalize="characters"
							autoComplete="off"
							id="account-delete-confirm"
							onChange={(event) => setTyped(event.target.value)}
							spellCheck={false}
							value={typed}
						/>
					</div>

					<AppDialogFooter>
						<Button
							disabled={deleting}
							onClick={() => setOpen(false)}
							variant="outline"
						>
							Keep my account
						</Button>
						<Button
							aria-busy={deleting || undefined}
							disabled={deleting || typed !== "DELETE"}
							onClick={remove}
							variant="destructive"
						>
							{deleting ? "Deleting..." : "Delete permanently"}
						</Button>
					</AppDialogFooter>
				</AppDialogContent>
			</AlertDialog>
		</SettingsGroup>
	);
}
