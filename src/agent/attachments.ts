import type { ChatScannedImage } from "@/types/ai";

/**
 * Opens the block of scanned text appended to a user's turn. The model's
 * instructions, the chat bubble and the tests all key off this exact string.
 */
export const SCANNED_TEXT_MARKER = "[Text scanned from uploaded images]";

const PREAMBLE =
	"This is raw OCR output from images the user uploaded. Use it as the source material for their request above.";

/** One scan per image, kept in upload order so "image 2" means what it says. */
export function buildScannedContext(
	images: readonly ChatScannedImage[],
): string | null {
	const scans = images
		.map((image, index) => ({ label: index + 1, text: image.text?.trim() }))
		.filter((scan): scan is { label: number; text: string } => !!scan.text)
		.map(({ label, text }) => `--- Image ${label} ---\n${text}`);

	if (scans.length === 0) return null;

	return [SCANNED_TEXT_MARKER, PREAMBLE, "", ...scans].join("\n");
}
