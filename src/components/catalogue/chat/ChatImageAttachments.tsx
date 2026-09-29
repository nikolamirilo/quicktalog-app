"use client";
import { MAX_CHAT_OCR_IMAGES } from "@/constants/ocr";
import { cn } from "@/lib/ui/cn";
import type { ChatScannedImage } from "@/types/ai";
import { AlertTriangle, ImagePlus, Loader2, X } from "lucide-react";

interface AttachButtonProps {
	disabled: boolean;
	onAttach: (files: File[]) => void;
}

/**
 * Sits in the composer next to send. A label wrapping a visually hidden input
 * rather than a button, so the file picker opens without a click handler; the
 * input stays focusable, and the label draws the focus ring for it.
 */
export const ChatAttachButton = ({ disabled, onAttach }: AttachButtonProps) => (
	<label
		className={cn(
			"flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-product-foreground-accent transition-colors focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-product-secondary md:h-10 md:w-10",
			disabled
				? "cursor-not-allowed opacity-50"
				: "cursor-pointer hover:bg-product-background-hero hover:text-product-foreground",
		)}
		title={`Attach photos to read text from, or paste a screenshot (up to ${MAX_CHAT_OCR_IMAGES})`}
	>
		<ImagePlus aria-hidden="true" className="h-[18px] w-[18px]" />
		<span className="sr-only">Attach images</span>
		<input
			accept="image/*"
			className="sr-only"
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
				<div className="flex flex-wrap gap-3 pr-1 pt-1">
					{images.map((image, index) => (
						<div className="relative" key={image.id}>
							<div
								className={cn(
									"relative h-14 w-14 overflow-hidden rounded-xl border bg-product-background-hero",
									image.failure
										? "border-product-warning"
										: "border-product-border",
								)}
								title={image.failure ?? `Image ${index + 1}`}
							>
								<img
									alt={`Attachment ${index + 1}`}
									className="h-full w-full object-cover"
									src={image.originalUrl}
								/>
								{!image.isProcessed && (
									<span className="absolute inset-0 flex items-center justify-center bg-product-card/70">
										<Loader2
											aria-hidden="true"
											className="h-4 w-4 animate-spin text-product-primary-ink motion-reduce:animate-none"
										/>
									</span>
								)}
								{image.failure && (
									<span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-product-primary-soft py-0.5 text-[9px] font-bold text-product-primary-ink">
										<AlertTriangle aria-hidden="true" className="h-2.5 w-2.5" />
										Unreadable
									</span>
								)}
							</div>
							{/* A 24px dot with an invisible 36px hit area around it, so it can be tapped without covering the thumbnail. */}
							<button
								aria-label={`Remove image ${index + 1}`}
								className="group absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
								disabled={disabled}
								onClick={() => onRemove(image.id)}
								type="button"
							>
								<span className="flex h-6 w-6 items-center justify-center rounded-full border border-product-border bg-product-card text-product-foreground-accent shadow-product transition-colors group-hover:border-product-error/30 group-hover:bg-product-error-soft group-hover:text-product-error">
									<X aria-hidden="true" className="h-3 w-3" />
								</span>
							</button>
						</div>
					))}
				</div>
			)}

			<p
				aria-live="polite"
				className="px-0.5 text-xs leading-relaxed text-product-foreground-accent"
			>
				{notice ??
					(images.some((image) => !image.isProcessed)
						? "Reading the text in your images…"
						: "The text in these images goes to the assistant with your message.")}
			</p>
		</div>
	);
};

export default ChatImageAttachments;
