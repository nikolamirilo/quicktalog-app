"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { getFeatureExplanation, getFeatureTitle } from "@/constants/pricing";
import type { FeatureInfoState } from "@/hooks/useFeatureInfo";

/** Explainer for a plan feature; focus goes back to the "i" button that opened it. */
export function FeatureInfoDialog({
	state: { feature, open, onOpenChange, openerRef },
}: {
	state: FeatureInfoState;
}) {
	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent
				className="max-w-[440px] gap-0 rounded-[24px] p-7"
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					openerRef.current?.focus();
				}}
				showClose={false}
			>
				<DialogTitle className="mb-2.5 pr-0 text-xl font-extrabold">
					{feature ? getFeatureTitle(feature) : ""}
				</DialogTitle>
				<DialogDescription className="text-base leading-[1.65]">
					{feature ? getFeatureExplanation(feature) : ""}
				</DialogDescription>
				<DialogClose asChild>
					<Button className="mt-[22px] w-full">Got it!</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	);
}
