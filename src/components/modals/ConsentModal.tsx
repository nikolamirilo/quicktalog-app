"use client";

import { FileCheck2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { IconTile } from "@/components/general/IconTile";
import { textLinkClass } from "@/components/general/TextLink";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { type LegalDocumentKey, legalDocuments } from "@/constants/legal";

interface ConsentModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConsentModal({
	isOpen,
	onConfirm,
	onCancel,
}: ConsentModalProps) {
	const [consents, setConsents] = useState<Record<LegalDocumentKey, boolean>>({
		terms: false,
		privacy: false,
		refund: false,
	});

	const allConsentsAccepted =
		consents.terms && consents.privacy && consents.refund;

	const handleConfirm = () => {
		if (allConsentsAccepted) {
			onConfirm();
		}
	};

	return (
		<Dialog onOpenChange={(open) => !open && onCancel()} open={isOpen}>
			<DialogContent className="max-w-[calc(100%-2rem)] gap-5 sm:max-w-[440px]">
				<DialogHeader className="space-y-3 text-left sm:text-left">
					<IconTile>
						<FileCheck2 />
					</IconTile>
					<DialogTitle>Terms & Conditions</DialogTitle>
					<DialogDescription>
						Please review and accept our terms and conditions to continue with
						your account creation.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-2">
					{legalDocuments.map(({ key, href, name }) => (
						<div
							className="flex items-start gap-3 rounded-[14px] border border-product-border bg-product-background px-4 py-3"
							key={key}
						>
							<Checkbox
								checked={consents[key]}
								className="mt-0.5"
								id={`consent-${key}`}
								onCheckedChange={(checked) =>
									setConsents((prev) => ({ ...prev, [key]: checked === true }))
								}
							/>
							<label
								className="cursor-pointer text-[14.5px] leading-normal text-product-foreground-accent"
								htmlFor={`consent-${key}`}
							>
								I agree to the{" "}
								<Link className={textLinkClass} href={href} target="_blank">
									{name}
								</Link>
							</label>
						</div>
					))}
				</div>

				<DialogFooter className="gap-2.5 border-t border-product-border pt-5 sm:space-x-0">
					<Button onClick={onCancel} variant="ghost">
						Cancel
					</Button>
					<Button disabled={!allConsentsAccepted} onClick={handleConfirm}>
						Accept & Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
