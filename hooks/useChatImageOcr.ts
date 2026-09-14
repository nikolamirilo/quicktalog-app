"use client";
import { buildScannedContext } from "@/agent/attachments";
import { MAX_CHAT_OCR_IMAGES, MIN_OCR_CONFIDENCE } from "@/constants/ocr";
import type { ChatScannedImage } from "@/types/ai";
import { type OcrScan, recognizeImages } from "@/utils/ocr";
import * as Sentry from "@sentry/nextjs";
import { useEffect, useRef, useState } from "react";

/** What an image ends up contributing, or why it contributes nothing. */
const settle = (scan: OcrScan | null): Partial<ChatScannedImage> => {
	if (!scan) {
		return {
			isProcessed: true,
			confidence: 0,
			failure: "Could not be read.",
		};
	}

	const text = scan.text.trim();
	if (scan.confidence < MIN_OCR_CONFIDENCE) {
		return {
			isProcessed: true,
			confidence: scan.confidence,
			failure: "Too blurry - try a sharper photo.",
		};
	}
	if (!text) {
		return {
			isProcessed: true,
			confidence: scan.confidence,
			failure: "No text found.",
		};
	}

	return { isProcessed: true, confidence: scan.confidence, text };
};

/**
 * Images attached to an AI chat turn, and the text read out of them.
 *
 * OCR runs here in the browser rather than on the server: the agent's model is
 * text-only, and Tesseract already ships with the app for the import flow. The
 * scan starts the moment images are attached, so by the time the user has
 * finished typing their request the text is usually ready to go with it.
 *
 * A low-confidence or unreadable image is kept in the list with its reason
 * showing rather than dropped, so the user can swap it out instead of
 * wondering why the assistant ignored half their menu.
 */
export function useChatImageOcr(language?: string) {
	const [images, setImages] = useState<ChatScannedImage[]>([]);
	const [notice, setNotice] = useState<string | null>(null);

	// Revoking on unmount needs the urls, not the render they came from.
	const objectUrls = useRef<string[]>([]);
	useEffect(
		() => () => {
			for (const url of objectUrls.current) URL.revokeObjectURL(url);
		},
		[],
	);

	const scan = async (batch: ChatScannedImage[]) => {
		try {
			await recognizeImages(batch, language, (id, result) => {
				setImages((prev) =>
					prev.map((image) =>
						image.id === id ? { ...image, ...settle(result) } : image,
					),
				);
			});
		} catch (error) {
			// The worker itself failed to start - the language data is missing or
			// the CDN is unreachable - so nothing in the batch will ever land.
			Sentry.captureException(error, { tags: { op: "chatImageOcr" } });
			console.error("Chat image OCR failed:", error);
			const ids = new Set(batch.map((image) => image.id));
			setImages((prev) =>
				prev.map((image) =>
					ids.has(image.id) && !image.isProcessed
						? { ...image, ...settle(null) }
						: image,
				),
			);
		}
	};

	const attach = (files: File[]) => {
		const room = MAX_CHAT_OCR_IMAGES - images.length;
		if (room <= 0) {
			setNotice(`You can attach up to ${MAX_CHAT_OCR_IMAGES} images.`);
			return;
		}

		setNotice(
			files.length > room
				? `Only the first ${room} were added - you can attach up to ${MAX_CHAT_OCR_IMAGES} images.`
				: null,
		);

		const added: ChatScannedImage[] = files.slice(0, room).map((file) => {
			const originalUrl = URL.createObjectURL(file);
			objectUrls.current.push(originalUrl);
			return {
				id: crypto.randomUUID(),
				file,
				originalUrl,
				isProcessed: false,
			};
		});

		setImages((prev) => [...prev, ...added]);
		void scan(added);
	};

	const remove = (id: string) => {
		setImages((prev) => {
			const removed = prev.find((image) => image.id === id);
			if (removed) URL.revokeObjectURL(removed.originalUrl);
			return prev.filter((image) => image.id !== id);
		});
		setNotice(null);
	};

	const clear = () => {
		setImages((prev) => {
			for (const image of prev) URL.revokeObjectURL(image.originalUrl);
			return [];
		});
		setNotice(null);
	};

	return {
		images,
		attach,
		remove,
		clear,
		notice,
		dismissNotice: () => setNotice(null),
		/** A scan is still running, so the turn is not ready to be sent. */
		scanning: images.some((image) => !image.isProcessed),
		/** The block appended to the message, or null when nothing was read. */
		context: buildScannedContext(images),
	};
}
