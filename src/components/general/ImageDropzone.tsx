"use client";
import { loadImage, processImage } from "@/lib/images/processing";
import { UploadDropzone } from "@/utils/uploadthing";
import * as Sentry from "@sentry/nextjs";
import { UploadCloud, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/ui/cn";

/** Largest file we accept before resizing it in the browser. */
const MAX_INPUT_MB = 50;

/**
 * What the dropzone accepts, as enforced below: any raster image the browser
 * can decode, up to MAX_INPUT_MB. SVG is refused. The file is resized and
 * compressed before upload, so the upload route's own limit is never reached.
 */
const ALLOWED_TEXT = `PNG, JPG or WebP, up to ${MAX_INPUT_MB} MB. We resize it for you.`;

const Spinner = () => (
	<span
		aria-label="Uploading"
		className="h-12 w-12 animate-spin rounded-full border-4 border-product-border-strong border-t-product-primary"
		role="status"
	/>
);

export interface ImageDropzoneProps {
	type?: "default" | "logo" | "qr-editor" | "icon";
	setIsUploading: React.Dispatch<boolean>;
	onUploadComplete: (url: string) => void;
	onError?: (error: Error) => void;
	maxDim?: number;
	targetSizeKB?: number;
	className?: string;
	disabled?: boolean;
	removeImage: () => void;
	image: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
	type = "default",
	setIsUploading,
	removeImage,
	image,
	onUploadComplete,
	onError,
	maxDim = 1024,
	targetSizeKB = 1200,
	className = "",
	disabled = false,
}) => {
	const [isBusy, setIsBusy] = useState(false);

	const handleBeforeUploadBegin = useCallback(
		async (files: File[]): Promise<File[]> => {
			if (disabled || files.length === 0) return [];

			const file = files[0];

			setIsBusy(true);
			setIsUploading?.(true);

			try {
				if (!file.type.startsWith("image/")) {
					throw new Error("Please select a valid image file");
				}

				if (file.size > MAX_INPUT_MB * 1024 * 1024) {
					throw new Error("File is too large. Please select a smaller image");
				}

				if (file.type === "image/svg+xml") {
					// The canvas pipeline below can't reliably decode SVG.
					throw new Error(
						"SVG images aren't supported here. Please upload a PNG or JPG.",
					);
				}

				const img = await loadImage(file);
				const processedFile = await processImage(
					img,
					maxDim,
					targetSizeKB,
					file.name,
				);

				return [processedFile];
			} catch (error) {
				const message = error instanceof Error ? error.message : "";
				// Expected, user-facing validation/decode failures - surface them to
				// the user (below) but don't report as Sentry exceptions.
				const isExpectedValidationError =
					message.startsWith("Failed to load image:") ||
					message.includes("valid image file") ||
					message.includes("too large") ||
					message.includes("exceeds maximum allowed size") ||
					message.includes("SVG images aren't supported");
				if (!isExpectedValidationError) {
					Sentry.captureException(error, {
						level: "warning",
						tags: { area: "image-upload" },
					});
				}
				console.error("Image processing error:", error);

				if (onError) {
					onError(
						error instanceof Error
							? error
							: new Error("Unknown error occurred"),
					);
				} else {
					toast.error(
						error instanceof Error ? error.message : "Failed to process image",
					);
				}

				setIsBusy(false);
				setIsUploading?.(false);
				return [];
			}
		},
		[disabled, maxDim, targetSizeKB, onError, setIsUploading],
	);

	const handleUploadComplete = useCallback(
		(res: any[]) => {
			setIsBusy(false);
			setIsUploading?.(false);
			try {
				if (res && res.length > 0 && res[0]?.url) {
					onUploadComplete(res[0].url);
				} else {
					throw new Error("No URL received from upload service");
				}
			} catch (error) {
				Sentry.captureException(error, {
					tags: { area: "image-upload", phase: "complete" },
				});
				console.error("Upload completion error:", error);
				if (onError) {
					onError(
						error instanceof Error
							? error
							: new Error("Upload completion failed"),
					);
				}
			}
		},
		[onUploadComplete, onError, setIsUploading],
	);

	const handleUploadError = useCallback(
		(error: Error) => {
			setIsBusy(false);
			setIsUploading?.(false);
			console.error("Upload error:", error);
			if (onError) {
				onError(error);
			}
		},
		[onError, setIsUploading],
	);

	return (
		<div className="notranslate font-product-body" translate="no">
			{image && type !== "qr-editor" ? (
				<div
					className={cn(
						"relative mt-1 overflow-hidden rounded-2xl border border-product-border bg-product-card shadow-product",
						type === "default" ? "h-48 w-48" : "inline-flex max-w-full p-2",
					)}
				>
					<img
						alt="Uploaded image preview"
						className={cn(
							"border-none opacity-0 transition-opacity duration-500 ease-in-out",
							type === "default"
								? "h-full w-full object-cover"
								: type === "icon"
									? "my-auto h-auto max-h-32 w-auto max-w-40 rounded-lg"
									: "my-auto h-auto max-h-48 w-auto max-w-full rounded-lg",
						)}
						onLoad={(e) => {
							e.currentTarget.classList.remove("opacity-0");
						}}
						src={image}
					/>
					<button
						aria-label="Remove image"
						className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-product-dark/80 text-white shadow-product transition-colors duration-200 before:absolute before:-inset-1.5 before:content-[''] hover:bg-product-error"
						onClick={removeImage}
						translate="no"
						type="button"
					>
						<X aria-hidden="true" className="h-4 w-4" />
					</button>
				</div>
			) : (
				<div className="relative">
					<UploadDropzone
						appearance={{
							button: "hidden",
							container:
								"m-0 h-40 w-full cursor-pointer gap-1 rounded-2xl border-[1.5px] border-dashed border-product-border-strong bg-product-card px-4 py-6 transition-colors hover:border-product-primary-accent hover:bg-product-primary/5 ut-uploading:cursor-wait focus-within:border-product-primary-accent",
							uploadIcon: "h-auto w-auto",
							label:
								"mt-2 w-auto text-sm font-semibold leading-snug text-product-foreground hover:text-product-primary-ink",
							allowedContent:
								"h-auto text-[12.5px] leading-snug text-product-muted",
						}}
						className={className}
						config={{ mode: "auto", cn }}
						content={{
							label: ({ ready, isUploading }) => {
								if (ready && !isUploading)
									return (
										<span className="notranslate" translate="no">
											Choose a file or drag it here
										</span>
									);
								if (isUploading)
									return (
										<div className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-product-card/90">
											<Spinner />
										</div>
									);
								return (
									<div className="absolute inset-0 flex items-center justify-center">
										<Spinner />
									</div>
								);
							},
							uploadIcon: ({ ready, isUploading }) => {
								if (ready && !isUploading)
									return (
										<span className="flex h-11 w-11 items-center justify-center rounded-full bg-product-primary-soft text-product-primary-ink">
											<UploadCloud aria-hidden="true" className="h-5 w-5" />
										</span>
									);
								return "";
							},
							allowedContent: ({ ready, isUploading }) => {
								if (ready && !isUploading)
									return (
										<span className="notranslate" translate="no">
											{ALLOWED_TEXT}
										</span>
									);
								return "";
							},
						}}
						disabled={disabled}
						endpoint="imageUploader"
						onBeforeUploadBegin={handleBeforeUploadBegin}
						onClientUploadComplete={handleUploadComplete}
						onUploadBegin={() => {
							setIsUploading(true);
						}}
						onUploadError={handleUploadError}
					/>
					{isBusy && (
						<div className="pointer-events-auto absolute inset-0 z-50 flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-product-card/90">
							<Spinner />
						</div>
					)}
				</div>
			)}
		</div>
	);
};
