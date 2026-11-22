"use client";
import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { saveAcquisitionSource } from "@/actions/users";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ACQUISITION_SKIPPED,
	ACQUISITION_SOURCE_MAX,
	ACQUISITION_SOURCES,
} from "@/constants/users";
import { useUserContext } from "@/context/UserContext";

/**
 * Asked once, on the dashboard, while `users.self_reported_source` is null: the
 * channel the user came from, in their own words. The tracked first touch
 * (`acquisition_source`) is recorded separately and never replaced by this, because
 * the two answer different questions - tracking never shows word of mouth, and people
 * misremember which link they clicked. Skipping answers it too, so neither path leaves
 * the question open.
 */
export function AcquisitionSourceModal() {
	const { userData, loading, refreshUserData } = useUserContext();
	const [source, setSource] = useState("");
	const [otherText, setOtherText] = useState("");
	const [busy, setBusy] = useState(false);
	// Closes it at once; the saved answer is what keeps it closed from then on.
	const [done, setDone] = useState(false);

	// From the context, not a server-rendered prop: a tab switch remounts this,
	// and only the context copy is refreshed after an answer is saved.
	// The cast goes away once `drizzle-kit pull` puts the column on `User`.
	const answer = (userData as { selfReportedSource?: string | null } | null)
		?.selfReportedSource;

	async function save(value: string) {
		setBusy(true);
		const ok = await saveAcquisitionSource(value);
		setBusy(false);
		if (!ok) {
			toast.error("Could not save that. Please try again.");
			return;
		}
		setDone(true);
		await refreshUserData();
	}

	const isOther = source === "other";
	const canSave = source !== "" && (!isOther || otherText.trim() !== "");

	return (
		<AlertDialog open={!loading && Boolean(userData) && !answer && !done}>
			<AppDialogContent size="sm">
				<AppDialogIcon>
					<MessageCircleQuestion />
				</AppDialogIcon>
				<div className="flex flex-col gap-1.5">
					<AlertDialogTitle>How did you hear about us?</AlertDialogTitle>
					<AlertDialogDescription className="text-sm">
						One question, and it tells us where to keep showing up.
					</AlertDialogDescription>
				</div>

				<Select disabled={busy} onValueChange={setSource} value={source}>
					<SelectTrigger aria-label="How did you hear about us?">
						<SelectValue placeholder="Select an option" />
					</SelectTrigger>
					<SelectContent>
						{ACQUISITION_SOURCES.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{isOther && (
					<Input
						aria-label="Where did you hear about us?"
						disabled={busy}
						maxLength={ACQUISITION_SOURCE_MAX}
						onChange={(e) => setOtherText(e.target.value)}
						placeholder="Where was it?"
						value={otherText}
					/>
				)}

				<AppDialogFooter>
					<Button
						disabled={busy}
						onClick={() => save(ACQUISITION_SKIPPED)}
						variant="outline"
					>
						Skip
					</Button>
					<Button
						disabled={!canSave || busy}
						onClick={() => save(isOther ? otherText : source)}
					>
						Save
					</Button>
				</AppDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
}
