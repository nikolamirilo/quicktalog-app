"use client";
import { CameraIcon, UploadCloud } from "lucide-react";

interface FileUploadProps {
	isProcessing: boolean;
	isSubmitting: boolean;
	onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUpload = ({
	isProcessing,
	isSubmitting,
	onImageChange,
}: FileUploadProps) => {
	return (
		<>
			<div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-lg">
				<label
					className="w-full sm:w-auto px-4 py-2 rounded-lg bg-product-primary text-product-secondary font-semibold text-center cursor-pointer
                          transition-all duration-300 ease-in-out flex flex-row items-center justify-center gap-2"
				>
					<UploadCloud />
					Upload from Gallery
					<input
						accept="image/*"
						className="hidden"
						disabled={isProcessing || isSubmitting}
						multiple
						onChange={onImageChange}
						type="file"
					/>
				</label>

				<label
					className="w-full sm:w-auto px-4 py-2 rounded-lg bg-product-secondary text-product-primary font-semibold text-center cursor-pointer
                          transition-all duration-300 ease-in-out flex flex-row gap-2 items-center justify-center"
				>
					<CameraIcon /> Open Camera App
					<input
						accept="image/*"
						capture="environment"
						className="hidden"
						disabled={isProcessing || isSubmitting}
						onChange={onImageChange}
						type="file"
					/>
				</label>
			</div>
			<div className="w-full text-base my-4 sm:my-6">
				<span className="text-product-primary font-bold">Hint: </span>
				<span className="text-product-foreground-accent">
					For <b>best results</b>, use <b>high-resolution</b> images in{" "}
					<b>JPEG</b> or <b>PNG</b> format, ensuring the menu or file is{" "}
					<b>clearly visible</b> and <b>unobstructed</b>.
				</span>
			</div>
		</>
	);
};

export default FileUpload;
