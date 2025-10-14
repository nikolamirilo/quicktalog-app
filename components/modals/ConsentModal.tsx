"use client";

import Link from "next/link";
import { useState } from "react";
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

interface ConsentModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConsentModal({
	isOpen,
	onConfirm,
	onCancel,
}: ConsentModalProps) {
	const [consents, setConsents] = useState({
		terms: false,
		privacy: false,
		refund: false,
	});

	const handleConsentChange = (
		key: keyof typeof consents,
		checked: boolean,
	) => {
		setConsents((prev) => ({ ...prev, [key]: checked }));
	};

	const allConsentsAccepted =
		consents.terms && consents.privacy && consents.refund;

	const handleConfirm = () => {
		if (allConsentsAccepted) {
			onConfirm();
		}
	};

	return (
		<Dialog onOpenChange={(open) => !open && onCancel()} open={isOpen}>
			<DialogContent className="text-product-foreground max-w-sm md:max-w-md p-6 sm:p-8 bg-product-background border border-product-border shadow-product-shadow rounded-2xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
				<DialogHeader className="space-y-3">
					<DialogTitle className="text-xl font-bold text-product-foreground font-heading">
						Terms & Conditions
					</DialogTitle>
					<DialogDescription className="text-product-foreground-accent text-base leading-relaxed">
						Please review and accept our terms and conditions to continue with
						your account creation.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="flex items-start space-x-3">
						<Checkbox
							checked={consents.terms}
							className="mt-1"
							id="terms"
							onCheckedChange={(checked) =>
								handleConsentChange("terms", checked as boolean)
							}
						/>
						<label
							className="text-sm text-product-foreground-accent leading-relaxed cursor-pointer"
							htmlFor="terms"
						>
							I agree to the{" "}
							<Link
								className="text-product-primary hover:text-product-primary-accent underline"
								href="/terms-and-conditions"
								target="_blank"
							>
								Terms and Conditions
							</Link>
						</label>
					</div>

					<div className="flex items-start space-x-3">
						<Checkbox
							checked={consents.privacy}
							className="mt-1"
							id="privacy"
							onCheckedChange={(checked) =>
								handleConsentChange("privacy", checked as boolean)
							}
						/>
						<label
							className="text-sm text-product-foreground-accent leading-relaxed cursor-pointer"
							htmlFor="privacy"
						>
							I agree to the{" "}
							<Link
								className="text-product-primary hover:text-product-primary-accent underline"
								href="/privacy-policy"
								target="_blank"
							>
								Privacy Policy
							</Link>
						</label>
					</div>

					<div className="flex items-start space-x-3">
						<Checkbox
							checked={consents.refund}
							className="mt-1"
							id="refund"
							onCheckedChange={(checked) =>
								handleConsentChange("refund", checked as boolean)
							}
						/>
						<label
							className="text-sm text-product-foreground-accent leading-relaxed cursor-pointer"
							htmlFor="refund"
						>
							I agree to the{" "}
							<Link
								className="text-product-primary hover:text-product-primary-accent underline"
								href="/refund-policy"
								target="_blank"
							>
								Refund Policy
							</Link>
						</label>
					</div>
				</div>

				<DialogFooter className="flex gap-3 pt-4 border-t border-product-border">
					<Button
						className="bg-product-foreground-accent/10 text-product-foreground-accent hover:bg-product-foreground-accent/20 border border-product-border hover:border-product-foreground-accent/30 transition-colors duration-200"
						onClick={onCancel}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="bg-product-primary text-product-foreground hover:bg-product-primary-accent border border-product-primary hover:border-product-primary-accent transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={!allConsentsAccepted}
						onClick={handleConfirm}
					>
						Accept & Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
