"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/account";
import { AccountSection } from "@/components/dashboard/account/supabase/AccountSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileCard({
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
		<AccountSection
			description="The name shown in your dashboard and used in emails we send you."
			footer={
				<Button
					disabled={
						saving || name.trim() === initialName.trim() || !name.trim()
					}
					onClick={save}
					size="sm"
				>
					{saving ? "Saving..." : "Save name"}
				</Button>
			}
			title="Profile"
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
		</AccountSection>
	);
}
