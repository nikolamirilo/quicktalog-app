"use client";
import NextImage from "next/image";
import React, { useCallback } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { UploadDropzone } from "@/utils/uploadthing";

const loadImage = (file: File): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		const cleanup = () => URL.revokeObjectURL(url);

		img.onload = () => {
			cleanup();
			resolve(img);
		};

		img.onerror = () => {
			cleanup();
			reject(new Error(`Failed to load image: ${file.name}`));
		};

		img.src = url;
	});
};

const calculateDimensions = (width: number, height: number, maxDim: number) => {
	if (width <= maxDim && height <= maxDim) {
		return { width, height };
	}

	const aspectRatio = width / height;

	if (width > height) {
		return {
			width: maxDim,
			height: Math.round(maxDim / aspectRatio),
		};
	} else {
		return {
			width: Math.round(maxDim * aspectRatio),
			height: maxDim,
		};
	}
};

const canvasToBlob = (
	canvas: HTMLCanvasElement,
	quality: number,
): Promise<Blob> => {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("Failed to convert canvas to blob"));
				}
			},
			"image/webp",
			quality,
		);
	});
};

const processImage = async (
	img: HTMLImageElement,
	maxDim: number,
	targetSizeKB: number = 400,
	fileName: string,
): Promise<File> => {
	const { width, height } = calculateDimensions(img.width, img.height, maxDim);

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d", {
		alpha: false,
		willReadFrequently: false,
		desynchronized: true,
	});

	if (!ctx) {
		throw new Error("Failed to get 2D rendering context");
	}

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";

	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, width, height);

	ctx.drawImage(img, 0, 0, width, height);

	const targetSizeBytes = targetSizeKB * 1024;
	const maxSizeBytes = targetSizeKB * 1024; // Enforce strict 400KB limit

	let minQuality = 0.3;
	let maxQuality = 0.98;
	let bestBlob: Blob | null = null;
	let bestQuality = minQuality;

	let currentBlob = await canvasToBlob(canvas, maxQuality);

	if (currentBlob.size <= targetSizeBytes) {
		bestBlob = currentBlob;
		bestQuality = maxQuality;
	} else {
		let searchMin = minQuality;
		let searchMax = maxQuality;

		for (let i = 0; i < 8; i++) {
			const midQuality = (searchMin + searchMax) / 2;
			const testBlob = await canvasToBlob(canvas, midQuality);

			if (testBlob.size <= targetSizeBytes) {
				if (
					testBlob.size > (bestBlob?.size || 0) ||
					Math.abs(testBlob.size - targetSizeBytes) <
						Math.abs((bestBlob?.size || 0) - targetSizeBytes)
				) {
					bestBlob = testBlob;
					bestQuality = midQuality;
				}
				searchMin = midQuality;
			} else {
				searchMax = midQuality;
			}
		}
	}

	if (!bestBlob) {
		bestBlob = await canvasToBlob(canvas, 0.1);
		bestQuality = 0.1;
	}

	if (bestBlob.size > maxSizeBytes) {
		throw new Error(
			`Processed image size (${Math.round(bestBlob.size / 1024)}KB) exceeds maximum allowed size of ${targetSizeKB}KB`,
		);
	}

	console.log(`Image processing results:
    - Original: ~${Math.round((img.naturalWidth * img.naturalHeight * 4) / 1024)}KB (estimated)
    - Compressed: ${Math.round(bestBlob.size / 1024)}KB
    - Quality: ${Math.round(bestQuality * 100)}%
    - Dimensions: ${width}x${height}
    - Target: ${targetSizeKB}KB`);

	const newFileName = fileName.replace(/\.[^.]+$/, ".webp");

	return new File([bestBlob], newFileName, {
		type: "image/webp",
		lastModified: Date.now(),
	});
};

interface ImageDropzoneProps {
	type?: "default" | "logo";
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

const ImageDropzone: React.FC<ImageDropzoneProps> = ({
	type = "default",
	setIsUploading,
	removeImage,
	image,
	onUploadComplete,
	onError,
	maxDim = 1024,
	targetSizeKB = 400,
	className = "",
	disabled = false,
}) => {
	const handleBeforeUploadBegin = useCallback(
		async (files: File[]): Promise<File[]> => {
			if (disabled || files.length === 0) return [];

			const file = files[0];

			try {
				if (!file.type.startsWith("image/")) {
					throw new Error("Please select a valid image file");
				}

				if (file.size > 50 * 1024 * 1024) {
					throw new Error("File is too large. Please select a smaller image");
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
				console.error("Image processing error:", error);

				if (onError) {
					onError(
						error instanceof Error
							? error
							: new Error("Unknown error occurred"),
					);
				} else {
					alert(
						error instanceof Error ? error.message : "Failed to process image",
					);
				}

				return [];
			}
		},
		[disabled, maxDim, targetSizeKB, onError],
	);

	const handleUploadComplete = useCallback(
		(res: any[]) => {
			try {
				if (res && res.length > 0 && res[0]?.url) {
					onUploadComplete(res[0].url);
				} else {
					throw new Error("No URL received from upload service");
				}
			} catch (error) {
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
		[onUploadComplete, onError],
	);

	const handleUploadError = useCallback(
		(error: Error) => {
			console.error("Upload error:", error);
			if (onError) {
				onError(error);
			}
		},
		[onError],
	);

	return (
		<div className="notranslate" translate="no">
			{image ? (
				<div
					className={`relative mt-2 ${type === "default" ? "w-48 h-48" : "w-fit h-fit"} rounded-lg border-2 border-product-border overflow-hidden bg-product-background shadow-product-shadow`}
				>
					<img
						alt="Uploaded image preview"
						className={`${type === "default" ? "w-full h-full object-cover" : "!w-auto max-h-48 !h-auto max-w-96 my-auto"} opacity-0 transition-opacity duration-500 ease-in-out`}
						onLoad={(e) => {
							e.currentTarget.classList.remove("opacity-0");
						}}
						src={image}
					/>
					<button
						className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full cursor-pointer hover:bg-red-600 transition-colors duration-200 shadow-lg"
						onClick={removeImage}
						translate="no"
					>
						<IoClose size={25} />
					</button>
				</div>
			) : (
				<div className="relative cursor-pointer">
					<UploadDropzone
						appearance={{
							button: "hidden",
							label: "text-gray-600 hover:text-product-primary",
							container: `h-48 w-full`,
						}}
						className={className}
						config={{ mode: "auto" }}
						content={{
							label: ({ ready, isUploading }) => {
								if (ready && !isUploading)
									return (
										<span className="notranslate" translate="no">
											Choose a file or Drag & Drop
										</span>
									);
								if (isUploading)
									return (
										<div className="absolute inset-0 flex items-center justify-center">
											<span className="animate-spin rounded-full h-14 w-14 border-b-2 border-product-primary"></span>
										</div>
									);
								return (
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="animate-spin rounded-full h-14 w-14 border-b-4 border-product-primary"></span>
									</div>
								);
							},
							uploadIcon: ({ ready, isUploading }) => {
								if (ready && !isUploading)
									return <FiUploadCloud color="#ffc017" size={40} />;
								if (isUploading) return "";
								return "";
							},
							allowedContent: ({ ready, isUploading }) => {
								if (ready && !isUploading)
									return (
										<span className="notranslate" translate="no">
											Image (PNG, JPG, WebP, …, max 400KB)
										</span>
									);
								if (isUploading) return "";
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
				</div>
			)}
		</div>
	);
};

export default ImageDropzone;
