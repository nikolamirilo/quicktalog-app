"use client";

import { Download, Pencil } from "lucide-react";
import Link from "next/link";
import QRCodeStyling from "qr-code-styling";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { defaultQrConfig, toStylingOptions } from "@/lib/qr/design";
import { downloadQr } from "@/lib/qr/export";
import { cn } from "@/lib/ui/cn";

/**
 * The QR code of a just-published catalogue. A catalogue this new has no saved
 * design yet, so it is always the default one. Frame text belongs to the
 * editor: it is never drawn or downloaded here, whatever the design carries.
 */
export function PublishQrPanel({
	className,
	slug,
	url,
}: {
	className?: string;
	slug: string;
	url: string;
}) {
	const holder = useRef<HTMLDivElement>(null);
	const qrCode = useRef<QRCodeStyling | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);

	useEffect(() => {
		const node = holder.current;
		if (!url || !node) return;
		const instance = new QRCodeStyling(toStylingOptions(defaultQrConfig(url)));
		qrCode.current = instance;
		node.innerHTML = "";
		instance.append(node);
		return () => {
			qrCode.current = null;
			node.innerHTML = "";
		};
	}, [url]);

	const download = async () => {
		const instance = qrCode.current;
		if (!instance) return;
		setIsDownloading(true);
		try {
			await downloadQr(instance, "png", `${slug}-qr`, null);
			toast.success("QR code downloaded as PNG.");
		} catch (err) {
			console.error("QR download failed:", err);
			toast.error("The download failed. Please try again.");
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div
			className={cn(
				"flex items-center gap-4 rounded-product-card border border-product-primary/35 bg-product-primary-soft p-3.5 sm:w-[262px] sm:flex-none sm:flex-col sm:items-stretch sm:gap-3.5 sm:p-5",
				className,
			)}
		>
			<div className="flex-none overflow-hidden rounded-[14px] border border-product-border bg-product-card shadow-product sm:w-full sm:rounded-2xl">
				<div
					aria-label="QR code for your catalogue"
					className="w-[148px] leading-[0] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full sm:w-full"
					ref={holder}
					role="img"
				/>
			</div>
			<div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 sm:flex-none">
				<Button
					className="px-3 text-sm sm:px-5 sm:text-[15px]"
					disabled={isDownloading}
					onClick={download}
					variant="outline"
				>
					<Download aria-hidden="true" />
					<span className="sm:hidden">Save PNG</span>
					<span className="hidden sm:inline">Download PNG</span>
				</Button>
				<Button
					asChild
					className="px-3 text-sm sm:px-5 sm:text-[15px]"
					variant="outline"
				>
					<Link href={`/admin/${slug}/qr-editor`}>
						<Pencil aria-hidden="true" />
						Customize
					</Link>
				</Button>
			</div>
		</div>
	);
}
