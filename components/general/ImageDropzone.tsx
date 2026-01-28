"use client";
import { loadImage, processImage } from "@/helpers/imageProccessing";
import { ImageDropzoneProps } from "@/types/components";
import { UploadDropzone } from "@/utils/uploadthing";
import React, { useCallback } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

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
			{image && type != "qr-editor" ? (
				<div
					className={`relative mt-2 ${type === "default" ? "w-48 h-48" : "w-fit h-fit"} rounded-lg overflow-hidden bg-product-background shadow-product-shadow`}
				>
					<img
						alt="Uploaded image preview"
						className={`${type === "default" ? "w-full h-full object-cover" : type === "icon" ? "max-h-32 h-auto w-auto my-auto max-w-40" : "!w-auto max-h-48 !h-auto max-w-96 my-auto"} opacity-0 transition-opacity duration-500 ease-in-out border-none`}
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
							container: type === "icon" ? `h-48 w-full` : `h-48 w-full`,
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
											Image (PNG, JPG, SVG, etc.)
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
