"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/account";
import {
	SettingsEditorActions,
	SettingsRow,
} from "@/components/dashboard/settings/SettingsGroup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileRow({
	initialName,
	onSaved,
	open,
	onOpenChange,
}: {
	initialName: string;
	onSaved: () => Promise<void>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [name, setName] = useState(initialName);
	const [saving, setSaving] = useState(false);

	// The stored name arrives after the first render of the dashboard, and a
	// cancelled edit goes back to it.
	useEffect(() => {
		if (!open) setName(initialName);
	}, [initialName, open]);

	const save = async () => {
		setSaving(true);
		try {
			const result = await updateProfile(name);
			if (!result.success) {
				toast.error(result.error ?? "Could not save your name.");
				return;
			}
			await onSaved();
			onOpenChange(false);
			toast.success("Your name was updated.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<SettingsRow
			editLabel="Edit"
			label="Name"
			onOpenChange={onOpenChange}
			open={open}
			value={initialName.trim() || "Not set"}
		>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="account-name">Name</Label>
				<Input
					autoComplete="name"
					id="account-name"
					maxLength={80}
					onChange={(event) => setName(event.target.value)}
					value={name}
				/>
			</div>
			<p className="text-[13px] text-product-muted">
				Shown in your dashboard and used in emails we send you.
			</p>
			<SettingsEditorActions onCancel={() => onOpenChange(false)}>
				<Button
					disabled={
						saving || name.trim() === initialName.trim() || !name.trim()
					}
					onClick={save}
					size="sm"
				>
					{saving ? "Saving..." : "Save name"}
				</Button>
			</SettingsEditorActions>
		</SettingsRow>
	);
}
