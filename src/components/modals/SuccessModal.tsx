"use client";
import { IconTile } from "@/components/general/IconTile";
import { AppDialogFooter, AppDialogIcon } from "@/components/modals/AppDialog";
import { PublishQrPanel } from "@/components/modals/PublishQrPanel";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleDownloadHTML } from "@/lib/catalogue/download";
import {
	Check,
	CheckCircle2,
	Code,
	Copy,
	Download,
	ExternalLink,
	LayoutDashboard,
	PartyPopper,
} from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";

export type SuccessModalProps = {
	isOpen: boolean;
	onClose: () => void;
	catalogueUrl: string;
	type?: "regular" | "ai" | "edit" | "ocr";
};

const SuccessModal: React.FC<SuccessModalProps> = ({
	isOpen = false,
	onClose,
	catalogueUrl,
	type = "regular",
}) => {
	const [fullURL, setFullURL] = useState("");
	const [linkCopied, setLinkCopied] = useState(false);

	const handleCopyLink = async () => {
		await navigator.clipboard.writeText(fullURL);
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2000); // reset after 2s
	};

	useEffect(() => {
		setFullURL(`${window.location.origin}${catalogueUrl}`);
	}, [catalogueUrl]);

	const slug = catalogueUrl.split("/")[2];

	const header = (
		<DialogHeader className="order-1 flex-row items-center gap-3 space-y-0 text-left sm:items-start sm:pr-8 sm:text-left">
			<AppDialogIcon tone="green">
				{type === "edit" ? <CheckCircle2 /> : <PartyPopper />}
			</AppDialogIcon>
			<div className="min-w-0">
				<DialogTitle className="text-xl sm:text-[23px]">
					{type === "edit" ? "Changes Saved!" : "Congratulations!"}
				</DialogTitle>
				<DialogDescription className="mt-1 text-sm sm:text-[14.5px]">
					{type === "edit"
						? "Your catalogue has been successfully updated. All changes are now live and visible to your customers."
						: type === "ai"
							? "Your AI-generated Catalogue is now live and ready to share with your customers."
							: "Your Catalogue is now live and ready to share with your customers."}
				</DialogDescription>
			</div>
		</DialogHeader>
	);

	const footer = (
		<AppDialogFooter className="order-5 mt-0 border-t border-product-border pt-3.5">
			<Button
				onClick={() => {
					window.location.href = "/admin/dashboard";
				}}
				variant="outline"
			>
				<LayoutDashboard aria-hidden="true" />
				Dashboard
			</Button>
			<Button onClick={() => window.open(fullURL, "_blank")}>
				<ExternalLink aria-hidden="true" />
				View Catalogue
			</Button>
		</AppDialogFooter>
	);

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			open={isOpen}
		>
			<DialogContent className="flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[720px] flex-col gap-4 p-[18px] sm:p-7">
				{type === "edit" ? (
					<>
						{header}
						{footer}
					</>
				) : (
					<div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
						{/* `contents` lets the header sit above the QR code once the columns stack. */}
						<div className="contents sm:order-2 sm:flex sm:min-w-0 sm:flex-1 sm:flex-col sm:justify-between sm:gap-4">
							{header}

							<div className="order-3 flex flex-col gap-1">
								<Label
									className="sr-only sm:not-sr-only"
									htmlFor="success-link"
								>
									Direct link
								</Label>
								<div className="flex gap-2">
									<Input
										className="min-w-0 flex-1 text-sm md:text-sm"
										id="success-link"
										readOnly
										value={fullURL}
									/>
									<Button
										className="flex-none px-4"
										onClick={handleCopyLink}
										title={linkCopied ? "Copied!" : "Copy link"}
									>
										{linkCopied ? (
											<Check aria-hidden="true" />
										) : (
											<Copy aria-hidden="true" />
										)}
										{linkCopied ? "Copied" : "Copy"}
									</Button>
								</div>
							</div>

							<div className="order-4 flex items-center gap-2.5 rounded-product-card border border-product-border bg-product-background p-2.5 sm:gap-3 sm:p-3.5">
								<IconTile size="sm">
									<Code />
								</IconTile>
								<div className="min-w-0 flex-1">
									<p className="text-[13.5px] font-semibold leading-tight text-product-foreground sm:text-sm">
										Embed on your website
									</p>
									<p className="hidden text-xs leading-relaxed text-product-foreground-accent sm:block">
										A ready-made HTML file, full-screen.
									</p>
								</div>
								<Button
									className="flex-none px-3.5 text-sm"
									onClick={() => handleDownloadHTML(slug, fullURL)}
									variant="outline"
								>
									<Download aria-hidden="true" />
									<span className="sm:hidden">HTML</span>
									<span className="hidden sm:inline">HTML file</span>
								</Button>
							</div>

							{footer}
						</div>

						<PublishQrPanel
							className="order-2 sm:order-1"
							slug={slug}
							url={fullURL}
						/>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default SuccessModal;
