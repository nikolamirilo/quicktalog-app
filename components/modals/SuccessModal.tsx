"use client";
import { QRCodeSVG } from "qrcode.react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { FaCode } from "react-icons/fa6";
import { FiCheckCircle, FiHome } from "react-icons/fi";
import { ImEmbed2 } from "react-icons/im";
import { IoMdCheckmark, IoMdOpen } from "react-icons/io";
import { IoQrCode, IoShareSocialOutline } from "react-icons/io5";
import { MdCheck, MdContentCopy } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { handleDownloadHTML, handleDownloadPng } from "@/helpers/client";
import { SuccessModalProps } from "@/types/components";

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

				{/* Two-column layout for better space usage */}
				<div
					className={`grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 ${type === "edit" ? "hidden" : ""}`}
				>
					{/* QR Code Section */}
					<div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-5 bg-product-background/50 rounded-xl border border-product-border">
						<div className="flex items-center gap-2">
							<IoShareSocialOutline className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-product-primary" />
							<h4 className="text-xs sm:text-sm md:text-base font-semibold text-product-foreground font-body">
								Share instantly
							</h4>
							<button
								className="p-1 hover:bg-product-background rounded transition-colors"
								onClick={async () => {
									await navigator.clipboard.writeText(fullURL);
									setLinkCopied(true);
									setTimeout(() => setLinkCopied(false), 2000); // reset after 2s
								}}
								title={linkCopied ? "Link copied!" : "Copy link"}
							>
								{linkCopied ? (
									<MdCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
								) : (
									<MdContentCopy className="w-3 h-3 sm:w-4 sm:h-4 text-product-foreground-accent hover:text-product-primary" />
								)}
							</button>
						</div>
						<p className="text-xs text-product-foreground-accent text-center font-body">
							Copy the link above
						</p>
						<p className="text-xs text-product-foreground-accent text-center font-body font-semibold">
							OR
						</p>
						<p className="text-xs text-product-foreground-accent text-center font-body">
							Use the QR code below to share your catalog
						</p>
						<div
							className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-product-border"
							id="qr-code"
						>
							<QRCodeSVG
								bgColor="white"
								className="w-24 h-24 sm:w-30 sm:h-30 md:w-36 md:h-36"
								fgColor="black"
								size={100}
								value={fullURL}
							/>
						</div>
						<Button
							className="bg-product-background text-xs"
							onClick={() => handleDownloadPng(catalogueUrl.split("/")[2])}
							size="sm"
							variant="outline"
						>
							<IoQrCode className="w-3 h-3 sm:w-4 sm:h-4" /> Download QR code
						</Button>
					</div>

					{/* Embed Section */}
					<div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-5 bg-product-background/50 rounded-xl border border-product-border">
						<div className="flex items-center gap-2">
							<ImEmbed2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-product-primary" />
							<h4 className="text-xs sm:text-sm md:text-base font-semibold text-product-foreground font-body">
								Embed Anywhere
							</h4>
						</div>
						<p className="text-xs text-product-foreground-accent text-center font-body">
							Copy the code to add to your website
						</p>
						<div className="flex flex-col items-center justify-end flex-1 gap-2 sm:gap-3 md:gap-4">
							<div
								className="bg-gray-900 rounded-xl p-2 sm:p-3 md:p-4 text-xs overflow-x-auto font-mono border border-gray-700 transition-all duration-200 text-gray-300 leading-relaxed max-h-28 sm:max-h-32 md:max-h-44"
								ref={codeRef}
							>
								<pre className="whitespace-pre-wrap break-all relative m-0">
									{iframeCode}
									<button
										className={`absolute -top-2 -right-2 p-1 rounded-lg transition-colors duration-300 ${
											copied
												? "bg-green-500 text-white"
												: "bg-gray-700 text-gray-300 hover:bg-gray-600"
										}`}
										onClick={handleCopyCode}
									>
										{copied ? (
											<IoMdCheckmark className="w-3 h-3 sm:w-4 sm:h-4" />
										) : (
											<MdContentCopy className="w-3 h-3 sm:w-4 sm:h-4" />
										)}
									</button>
								</pre>
							</div>
							<Button
								className="bg-product-background text-xs"
								onClick={() =>
									handleDownloadHTML(catalogueUrl.split("/")[2], fullURL)
								}
								size="sm"
								variant="outline"
							>
								<FaCode className="w-3 h-3 sm:w-4 sm:h-4" /> Download HTML code
							</Button>
						</div>
					</div>
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
						<IoMdOpen className="w-3 h-3 sm:w-4 sm:h-4" /> View Catalogue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SuccessModal;
