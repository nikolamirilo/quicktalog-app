"use client";

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
import Link from "next/link";
import { useState } from "react";

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
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
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
							id="terms"
							checked={consents.terms}
							onCheckedChange={(checked) =>
								handleConsentChange("terms", checked as boolean)
							}
							className="mt-1"
						/>
						<label
							htmlFor="terms"
							className="text-sm text-product-foreground-accent leading-relaxed cursor-pointer"
						>
							I agree to the{" "}
							<Link
								href="/terms-and-conditions"
								target="_blank"
								className="text-product-primary hover:text-product-primary-accent underline"
							>
								Terms and Conditions
							</Link>
						</label>
					</div>

					<div className="flex items-start space-x-3">
						<Checkbox
							id="privacy"
							checked={consents.privacy}
							onCheckedChange={(checked) =>
								handleConsentChange("privacy", checked as boolean)
							}
							className="mt-1"
						/>
						<label
							htmlFor="privacy"
							className="text-sm text-product-foreground-accent leading-relaxed cursor-pointer"
						>
							I agree to the{" "}
							<Link
								href="/privacy-policy"
								target="_blank"
								className="text-product-primary hover:text-product-primary-accent underline"
							>
								Privacy Policy
							</Link>
						</label>
					</div>

					<div className="flex items-start space-x-3">
						<Checkbox
							id="refund"
							checked={consents.refund}
							onCheckedChange={(checked) =>
								handleConsentChange("refund", checked as boolean)
							}
							className="mt-1"
						/>
						<label
							htmlFor="refund"
							className="text-sm text-product-foreground-accent leading-relaxed cursor-pointer"
						>
							I agree to the{" "}
							<Link
								href="/refund-policy"
								target="_blank"
								className="text-product-primary hover:text-product-primary-accent underline"
							>
								Refund Policy
							</Link>
						</label>
					</div>
				</div>

				<DialogFooter className="flex gap-3 pt-4 border-t border-product-border">
					<Button
						onClick={onCancel}
						variant="outline"
						className="bg-product-foreground-accent/10 text-product-foreground-accent hover:bg-product-foreground-accent/20 border border-product-border hover:border-product-foreground-accent/30 transition-colors duration-200"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!allConsentsAccepted}
						className="bg-product-primary text-product-foreground hover:bg-product-primary-accent border border-product-primary hover:border-product-primary-accent transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Accept & Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
