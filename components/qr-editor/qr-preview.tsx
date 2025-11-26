"use client";

import { ArrowLeft, Check, Download } from "lucide-react";
import Link from "next/link";
import QRCodeStyling, { Options } from "qr-code-styling";
import React, { useEffect, useRef, useState } from "react";
import { FiSave } from "react-icons/fi";
import { upsertQrConfig } from "@/actions/qr-configs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQr } from "@/context/QRContext";
import InformModal from "../modals/InformModal";
import { NavigationGuard } from "@/hooks/useBeforeUnload";

export default function QrPreview({ name }: { name: string }) {
	const { options, setQrCodeInstance } = useQr();
	const ref = useRef<HTMLDivElement>(null);
	const qrCode = useRef<QRCodeStyling | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDirty, setIsDirty] = useState(false);
	const isInitializedRef = useRef(false);

	// Initialize QR code instance once
	useEffect(() => {
		if (!qrCode.current) {
			qrCode.current = new QRCodeStyling(options);
			setQrCodeInstance(qrCode.current);
		}
	}, [setQrCodeInstance]);

	// Update QR code when options change (only mark dirty after initialization)
	useEffect(() => {
		if (qrCode.current) {
			qrCode.current.update(options);
			// Only mark as dirty if this is not the initial setup
			if (isInitializedRef.current) {
				setIsDirty(true);
			}
		}
	}, [options]);

	// Append QR code to DOM once
	useEffect(() => {
		if (ref.current && qrCode.current) {
			ref.current.innerHTML = "";
			qrCode.current.append(ref.current);
			// Mark initialization as complete after a short delay
			// This ensures the initial options load doesn't trigger isDirty
			setTimeout(() => {
				isInitializedRef.current = true;
			}, 100);
		}
	}, []);

	const handleDownload = (extension: "png" | "jpeg" | "svg" | "webp") => {
		if (qrCode.current) {
			// Ensure the QR code is updated with the latest options before downloading
			qrCode.current.update(options);
			// Use a small timeout to ensure the update is applied before download
			setTimeout(() => {
				qrCode.current?.download({ extension });
			}, 100);
		}
	};

	const handleSaveConfiguration = async () => {
		setIsSaving(true);
		try {
			const result = await upsertQrConfig(name, options);

			if (result.success) {
				toast({
					title: "Success!",
					description: "QR code configuration saved successfully.",
					variant: "default",
				});
			} else {
				toast({
					title: "Error",
					description: result.error || "Failed to save configuration.",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "An unexpected error occurred.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
			setIsDirty(false);
		}
	};

	return (
		<>
			<NavigationGuard isDirty={isDirty} />
			<div className="flex flex-col items-center justify-center gap-6 p-6 w-full">
				<Card className="p-4 bg-gradient-to-br from-background via-background to-muted/30 shadow-product-shadow flex items-center justify-center relative overflow-visible">
					<div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none rounded-lg"></div>
					<div className="relative z-10">
						<div ref={ref} />
					</div>
				</Card>

				<div className="flex flex-col gap-3 w-full">
					<DropdownMenu
						onOpenChange={(open) => {
							if (open) {
								setIsModalOpen(true);
							}
						}}
					>
						<DropdownMenuTrigger asChild>
							<Button className="w-full shadow-lg cursor-pointer" size="lg">
								<Download className="mr-2 h-5 w-5" /> Download QR Code
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="center"
							className="w-[200px] bg-product-background"
						>
							<DropdownMenuItem
								className="cursor-pointer text-product-foreground !hover:bg-product-hover-background"
								onClick={() => handleDownload("png")}
							>
								<span className="!w-full">Download as PNG</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer text-product-foreground !hover:bg-product-hover-background"
								onClick={() => handleDownload("svg")}
							>
								<span className="w-full">Download as SVG</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer text-product-foreground !hover:bg-product-hover-background"
								onClick={() => handleDownload("jpeg")}
							>
								<span className="w-full">Download as JPEG</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Link href="/admin/items">
						<Button
							className="w-full gap-2 font-medium hover:border-[var(--product-primary)] hover:bg-[var(--product-hover-background)] transition-all"
							size="lg"
							variant="outline"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Dashboard
						</Button>
					</Link>
				</div>
			</div>
			<InformModal
				isOpen={isModalOpen}
				message=""
				onCancel={() => {
					setIsModalOpen(false);
				}}
				onConfirm={() => {
					setIsModalOpen(false);
					handleSaveConfiguration();
				}}
				title="Would you like to save this QR configuration for future use?"
				confirmText="Yes"
				cancelText="No"
			/>
		</>
	);
}
