"use client";
import {
	Check,
	Code,
	Copy,
	Download,
	Edit,
	Link as LinkIcon,
	QrCode,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { FaCode } from "react-icons/fa6";
import { FiCheckCircle, FiHome } from "react-icons/fi";
import { IoMdOpen } from "react-icons/io";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleDownloadHTML, handleDownloadPng } from "@/helpers/client";
import { SuccessModalProps } from "@/types/components";

const SuccessModal: React.FC<SuccessModalProps> = ({
	isOpen = false,
	onClose,
	catalogueUrl,
	type = "regular",
}) => {
	const router = useRouter();
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

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			open={isOpen}
		>
			<DialogContent className="max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:max-w-[550px] !p-4 sm:!p-7 bg-white/95 border border-product-border shadow-product-shadow rounded-3xl">
				<DialogHeader className="space-y-2 sm:space-y-3">
					<div className="flex items-center justify-center gap-3">
						<DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-product-foreground font-heading">
							{type === "edit" ? (
								<div className="flex items-center gap-2">
									<FiCheckCircle className="w-6 h-6 text-green-500" />
									Changes Saved!
								</div>
							) : (
								"🎉 Congratulations!"
							)}
						</DialogTitle>
					</div>
					<DialogDescription className="text-center text-product-foreground-accent text-xs sm:text-sm md:text-base font-body">
						{type === "edit"
							? "Your catalogue has been successfully updated. All changes are now live and visible to your customers."
							: type === "ai"
								? "Your AI-generated Catalogue is now live and ready to share with your customers."
								: "Your Catalogue is now live and ready to share with your customers."}
					</DialogDescription>
				</DialogHeader>

				{/* Tabs Layout */}
				<div className={type === "edit" ? "hidden" : "mt-4 font-lora"}>
					<Tabs defaultValue="share" className="w-full">
						<TabsList className="grid w-full grid-cols-3 h-auto p-0 bg-transparent gap-2">
							<TabsTrigger
								value="share"
								className="data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative flex items-center justify-center gap-2"
							>
								<LinkIcon className="w-4 h-4" />
								Share
							</TabsTrigger>
							<TabsTrigger
								value="qr"
								className="data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative flex items-center justify-center gap-2"
							>
								<QrCode className="w-4 h-4" />
								QR Code
							</TabsTrigger>
							<TabsTrigger
								value="embed"
								className="data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative flex items-center justify-center gap-2"
							>
								<Code className="w-4 h-4" />
								Embed
							</TabsTrigger>
						</TabsList>

						<div className="border border-gray-200 rounded-lg rounded-t-none bg-white shadow-product-shadow p-5">
							<TabsContent value="share" className="space-y-4 mt-0">
								<div className="flex flex-col gap-4 p-4 sm:p-6 bg-product-background/50 rounded-xl border border-product-border">
									<div className="space-y-3">
										<Label className="text-sm font-semibold">Direct Link</Label>
										<div className="flex gap-2">
											<Input
												value={fullURL}
												readOnly
												className="bg-white font-medium text-sm"
											/>
											<Button
												size="icon"
												variant="outline"
												onClick={handleCopyLink}
												title={linkCopied ? "Copied!" : "Copy link"}
												className="shrink-0"
											>
												{linkCopied ? (
													<Check className="w-4 h-4 text-green-500" />
												) : (
													<Copy className="w-4 h-4" />
												)}
											</Button>
										</div>
									</div>
									<p className="text-xs text-product-foreground-accent text-center px-4">
										Share this link directly with your customers via email,
										social media, or messaging apps.
									</p>
								</div>
							</TabsContent>

							<TabsContent value="qr" className="space-y-4 mt-0">
								<div className="flex flex-col items-center gap-4 p-4 sm:p-6 bg-product-background/50 rounded-xl border border-product-border">
									<div className="space-y-2 text-center">
										<Label className="text-sm font-semibold">
											Scan to View
										</Label>
										<div
											className="p-3 bg-white rounded-xl shadow-sm border border-product-border mx-auto"
											id="qr-code"
										>
											<QRCodeSVG
												bgColor="white"
												className="w-32 h-32 sm:w-40 sm:h-40"
												fgColor="black"
												size={160}
												value={fullURL}
											/>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-3 w-full">
										<Button
											variant="outline"
											onClick={() =>
												handleDownloadPng(catalogueUrl.split("/")[2])
											}
											className="w-full bg-white"
										>
											<Download className="w-4 h-4 mr-2" />
											Download
										</Button>
										<Link
											href={`/admin/items/${catalogueUrl.split("/")[2]}/qr-editor`}
											passHref
											className="w-full"
										>
											<Button variant="outline" className="w-full bg-white">
												<Edit className="w-4 h-4 mr-2" />
												Customize
											</Button>
										</Link>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="embed" className="space-y-4 mt-0">
								<div className="flex flex-col gap-4 p-4 sm:p-6 bg-product-background/50 rounded-xl border border-product-border">
									<div className="space-y-3">
										<Label className="text-sm font-semibold">Embed Code</Label>
										<div className="relative group">
											<div
												className="bg-gray-900 rounded-xl p-3 text-xs overflow-x-auto font-mono border border-gray-700 text-gray-300 leading-relaxed h-32 custom-scrollbar"
												ref={codeRef}
											>
												<pre className="whitespace-pre-wrap break-all m-0">
													{iframeCode}
												</pre>
											</div>
											<Button
												size="icon"
												variant="ghost"
												className={`absolute top-2 right-2 h-8 w-8 hover:bg-gray-800/80 transition-colors ${
													copied
														? "text-green-500 bg-gray-800/50"
														: "text-gray-400 bg-gray-800/30"
												}`}
												onClick={handleCopyCode}
											>
												{copied ? (
													<Check className="w-4 h-4" />
												) : (
													<Copy className="w-4 h-4" />
												)}
											</Button>
										</div>
									</div>

									<Button
										variant="outline"
										onClick={() =>
											handleDownloadHTML(catalogueUrl.split("/")[2], fullURL)
										}
										className="w-full bg-white"
									>
										<FaCode className="w-4 h-4 mr-2" /> Download HTML File
									</Button>
								</div>
							</TabsContent>
						</div>
					</Tabs>
				</div>

				<DialogFooter className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 md:pt-5 border-t border-product-border">
					<Button
						className="flex-1 w-full md:w-fit text-xs bg-product-background sm:text-sm"
						onClick={() => (window.location.href = "/admin/dashboard")}
						variant="outline"
					>
						<FiHome className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
						Return to Dashboard
					</Button>
					<Button
						className="flex-1 w-full md:w-fit text-xs sm:text-sm"
						onClick={() => window.open(fullURL, "_blank")}
					>
						<IoMdOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> View Catalogue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SuccessModal;
