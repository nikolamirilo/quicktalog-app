"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertQrConfig } from "@/actions/qr-configs";
import { useQr } from "@/context/QRContext";
import { colorsOf, visibleFrameText } from "@/lib/qr/design";
import { downloadQr, type QrExtension } from "@/lib/qr/export";

/**
 * Save and download for the QR editor: the design goes to the server action,
 * downloads go through `lib/qr/export` with the frame bar composed in.
 */
export function useQrActions(name: string, hasSavedDesign: boolean) {
	const { options, markSaved, qrCodeInstance } = useQr();
	const [isSaving, setIsSaving] = useState(false);
	const [downloading, setDownloading] = useState<QrExtension | null>(null);
	const [everSaved, setEverSaved] = useState(hasSavedDesign);

	const download = async (extension: QrExtension) => {
		if (!qrCodeInstance) return;
		const colors = colorsOf(options);
		const text = visibleFrameText(options);
		setDownloading(extension);
		try {
			await downloadQr(
				qrCodeInstance,
				extension,
				`${name}-qr`,
				text
					? { text, barColor: colors.dots, textColor: colors.background }
					: null,
			);
			toast.success(`QR code downloaded as ${extension.toUpperCase()}.`);
		} catch (err) {
			console.error("QR download failed:", err);
			toast.error("The download failed. Please try again.");
		} finally {
			setDownloading(null);
		}
	};

	const save = async () => {
		setIsSaving(true);
		const snapshot = options;
		try {
			const result = await upsertQrConfig(name, snapshot);
			if (result.success) {
				markSaved(snapshot);
				setEverSaved(true);
				toast.success("QR code configuration saved successfully.");
			} else {
				toast.error(result.error || "Failed to save configuration.");
			}
		} catch {
			toast.error("An unexpected error occurred.");
		} finally {
			setIsSaving(false);
		}
	};

	return { save, download, isSaving, downloading, everSaved };
}
