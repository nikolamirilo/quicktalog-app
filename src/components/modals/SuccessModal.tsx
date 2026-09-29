"use client";
import {
	Check,
	CheckCircle2,
	Code,
	Copy,
	Download,
	ExternalLink,
	FileCode2,
	LayoutDashboard,
	Link as LinkIcon,
	Pencil,
	PartyPopper,
	QrCode,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { AppDialogFooter, AppDialogIcon } from "@/components/modals/AppDialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	handleDownloadHTML,
	handleDownloadPng,
} from "@/lib/catalogue/download";
import { cn } from "@/lib/ui/cn";

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
	const [copied, setCopied] = useState(false);
	const [linkCopied, setLinkCopied] = useState(false);

	const handleCopyCode = async () => {
		await navigator.clipboard.writeText(iframeCode);
		setCopied(true);
		setTimeout(() => setCopied(false), 3000); // reset after 3s
	};

	const handleCopyLink = async () => {
		await navigator.clipboard.writeText(fullURL);
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2000); // reset after 2s
	};

	const codeRef = useRef<HTMLDivElement>(null);
	const iframeCode = `<iframe src="${fullURL}" style="width:100vw;height:100vh;border:none;position:fixed;top:0;left:0;z-index:9999;background:white;"></iframe>`;

	useEffect(() => {
		setFullURL(`${window.location.origin}${catalogueUrl}`);
	}, [catalogueUrl]);

	const slug = catalogueUrl.split("/")[2];
	const panel =
		"flex flex-col gap-4 rounded-product-card border border-product-border bg-product-background p-4 sm:p-5";

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			open={isOpen}
		>
			<DialogContent className="flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[560px] flex-col gap-5 p-5 sm:p-7">
				<DialogHeader className="items-center space-y-3 pt-2 text-center sm:text-center">
					<AppDialogIcon tone="green">
						{type === "edit" ? <CheckCircle2 /> : <PartyPopper />}
					</AppDialogIcon>
					<DialogTitle className="text-xl sm:text-2xl">
						{type === "edit" ? "Changes Saved!" : "Congratulations!"}
					</DialogTitle>
					<DialogDescription className="max-w-[420px] text-sm sm:text-[15px]">
						{type === "edit"
							? "Your catalogue has been successfully updated. All changes are now live and visible to your customers."
							: type === "ai"
								? "Your AI-generated Catalogue is now live and ready to share with your customers."
								: "Your Catalogue is now live and ready to share with your customers."}
					</DialogDescription>
				</DialogHeader>

				{type !== "edit" && (
					<Tabs className="w-full" defaultValue="share">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger className="px-2" value="share">
								<LinkIcon aria-hidden="true" />
								Share
							</TabsTrigger>
							<TabsTrigger className="px-2" value="qr">
								<QrCode aria-hidden="true" />
								QR Code
							</TabsTrigger>
							<TabsTrigger className="px-2" value="embed">
								<Code aria-hidden="true" />
								Embed
							</TabsTrigger>
						</TabsList>

						<TabsContent value="share">
							<div className={panel}>
								<div className="space-y-2">
									<Label htmlFor="success-link">Direct Link</Label>
									<div className="flex gap-2">
										<Input
											className="min-w-0 flex-1 text-sm md:text-sm"
											id="success-link"
											readOnly
											value={fullURL}
										/>
										<Button
											aria-label={linkCopied ? "Link copied" : "Copy link"}
											className="h-11 w-11 flex-none"
											onClick={handleCopyLink}
											size="icon"
											title={linkCopied ? "Copied!" : "Copy link"}
											variant="outline"
										>
											{linkCopied ? (
												<Check
													aria-hidden="true"
													className="text-product-success"
												/>
											) : (
												<Copy aria-hidden="true" />
											)}
										</Button>
									</div>
								</div>
								<p className="text-center text-xs leading-relaxed text-product-foreground-accent">
									Share this link directly with your customers via email, social
									media, or messaging apps.
								</p>
							</div>
						</TabsContent>

						<TabsContent value="qr">
							<div className={cn(panel, "items-center")}>
								<p className="text-[13.5px] font-semibold text-product-foreground">
									Scan to View
								</p>
								<div
									className="rounded-[14px] border border-product-border bg-white p-3"
									id="qr-code"
								>
									<QRCodeSVG
										bgColor="white"
										className="h-32 w-32 sm:h-40 sm:w-40"
										fgColor="black"
										size={160}
										title="QR code for your catalogue"
										value={fullURL}
									/>
								</div>
								<div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2">
									<Button
										onClick={() => handleDownloadPng(slug)}
										variant="outline"
									>
										<Download aria-hidden="true" />
										Download
									</Button>
									<Button asChild variant="outline">
										<Link href={`/admin/${slug}/qr-editor`}>
											<Pencil aria-hidden="true" />
											Customize
										</Link>
									</Button>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="embed">
							<div className={panel}>
								<div className="space-y-2">
									<p className="text-[13.5px] font-semibold text-product-foreground">
										Embed Code
									</p>
									<div className="relative">
										<div
											className="custom-scrollbar h-32 overflow-auto rounded-[14px] bg-product-dark p-3 pr-12 font-mono text-xs leading-relaxed text-product-on-dark-muted"
											ref={codeRef}
										>
											<pre className="m-0 whitespace-pre-wrap break-all">
												{iframeCode}
											</pre>
										</div>
										<Button
											aria-label={
												copied ? "Embed code copied" : "Copy embed code"
											}
											className={cn(
												"absolute right-2 top-2 h-8 w-8 text-product-on-dark-muted hover:bg-product-dark-raised hover:text-product-on-dark",
												copied && "text-product-success-on-dark",
											)}
											onClick={handleCopyCode}
											size="icon"
											variant="ghost"
										>
											{copied ? (
												<Check aria-hidden="true" />
											) : (
												<Copy aria-hidden="true" />
											)}
										</Button>
									</div>
								</div>
								<Button
									onClick={() => handleDownloadHTML(slug, fullURL)}
									variant="outline"
								>
									<FileCode2 aria-hidden="true" />
									Download HTML File
								</Button>
							</div>
						</TabsContent>
					</Tabs>
				)}

				<AppDialogFooter className="mt-0 border-t border-product-border pt-4">
					<Button
						onClick={() => {
							window.location.href = "/admin/dashboard";
						}}
						variant="outline"
					>
						<LayoutDashboard aria-hidden="true" />
						Return to Dashboard
					</Button>
					<Button onClick={() => window.open(fullURL, "_blank")}>
						<ExternalLink aria-hidden="true" />
						View Catalogue
					</Button>
				</AppDialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SuccessModal;
