"use client";
import { MAX_CHAT_OCR_IMAGES } from "@/constants/ocr";
import type { ChatScannedImage } from "@/types/ai";
import { AlertTriangle, ImagePlus, Loader2, X } from "lucide-react";

interface AttachButtonProps {
	disabled: boolean;
	onAttach: (files: File[]) => void;
}

/**
 * Sits in the composer next to send. A label wrapping a hidden input rather
 * than a button, so the file picker opens without a click handler.
 */
export const ChatAttachButton = ({ disabled, onAttach }: AttachButtonProps) => (
	<label
		className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-product-foreground-accent transition-colors ${
			disabled
				? "cursor-not-allowed opacity-40"
				: "cursor-pointer hover:bg-product-background-hover hover:text-product-foreground"
		}`}
		title={`Attach photos to read text from, or paste a screenshot (up to ${MAX_CHAT_OCR_IMAGES})`}
	>
		<ImagePlus className="h-[18px] w-[18px]" />
		<span className="sr-only">Attach images</span>
		<input
			accept="image/*"
			className="hidden"
			disabled={disabled}
			multiple
			onChange={(event) => {
				const files = Array.from(event.target.files ?? []);
				if (files.length > 0) onAttach(files);
				// Let the same file be picked again after it was removed.
				event.target.value = "";
			}}
			type="file"
		/>
	</label>
);

interface AttachmentsProps {
	images: ChatScannedImage[];
	notice: string | null;
	disabled: boolean;
	onRemove: (id: string) => void;
}

/**
 * The strip of attached photos above the composer, each showing where its scan
 * got to. An image that could not be read keeps its place with the reason on
 * it, so the user can swap that one out rather than guess why the assistant
 * ignored part of their menu.
 */
const ChatImageAttachments = ({
	images,
	notice,
	disabled,
	onRemove,
}: AttachmentsProps) => {
	if (images.length === 0 && !notice) return null;

	return (
		<div className="mb-2 space-y-1.5">
			{images.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{images.map((image, index) => (
						<div className="relative" key={image.id}>
							<div
								className={`h-14 w-14 overflow-hidden rounded-lg border bg-product-background-hover ${
									image.failure ? "border-amber-300" : "border-product-border"
								}`}
								title={image.failure ?? `Image ${index + 1}`}
							>
								<img
									alt={`Attachment ${index + 1}`}
									className="h-full w-full object-cover"
									src={image.originalUrl}
								/>
								{!image.isProcessed && (
									<span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70">
										<Loader2 className="h-4 w-4 animate-spin text-product-primary" />
									</span>
								)}
								{image.failure && (
									<span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-amber-100/95 py-0.5 text-[9px] font-bold text-amber-700">
										<AlertTriangle className="h-2.5 w-2.5" />
										Unreadable
									</span>
								)}
							</div>
							<button
								aria-label={`Remove image ${index + 1}`}
								className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-product-border bg-white text-product-foreground-accent shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={disabled}
								onClick={() => onRemove(image.id)}
								type="button"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}

			<p className="px-0.5 text-[11px] leading-relaxed text-product-foreground-accent">
				{notice ??
					(images.some((image) => !image.isProcessed)
						? "Reading the text in your images…"
						: "The text in these images goes to the assistant with your message.")}
			</p>
		</div>
	);
};

export default ChatImageAttachments;
