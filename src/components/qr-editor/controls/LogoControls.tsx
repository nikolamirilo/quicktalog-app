"use client";

import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageDropzone } from "@/components/general/ImageDropzone";
import { PanelHeading } from "@/components/qr-editor/controls/PanelHeading";
import {
	Rows,
	SliderRow,
	ToggleRow,
} from "@/components/qr-editor/controls/rows";

export function LogoControls({
	image,
	showLogo,
	imageSize,
	hideBackgroundDots,
	onImageChange,
	onShowLogoChange,
	onImageSizeChange,
	onHideBackgroundDotsChange,
}: {
	image: string;
	showLogo: boolean;
	imageSize: number;
	hideBackgroundDots: boolean;
	onImageChange: (url: string) => void;
	onShowLogoChange: (show: boolean) => void;
	onImageSizeChange: (size: number) => void;
	onHideBackgroundDotsChange: (hide: boolean) => void;
}) {
	const [isUploading, setIsUploading] = useState(false);
	const noLogo = !image;

	return (
		<>
			<PanelHeading
				description="Add your brand logo to the center of your QR code."
				title="Logo upload"
			/>

			{noLogo ? (
				<div aria-busy={isUploading}>
					<ImageDropzone
						className="rounded-[18px] border-[1.5px] border-dashed border-product-border-strong bg-product-background transition-colors hover:border-product-primary-accent hover:bg-product-primary-soft"
						image=""
						maxDim={512}
						onError={(error) =>
							toast.error(error.message || "Logo upload failed.")
						}
						onUploadComplete={(url) => {
							onImageChange(url);
							toast.success("Logo uploaded successfully");
						}}
						removeImage={() => onImageChange("")}
						setIsUploading={setIsUploading}
						targetSizeKB={200}
						type="qr-editor"
					/>
					<p className="mt-2 text-center text-[12.5px] text-product-muted">
						PNG or JPG · resized to max 512 px and 200 KB
					</p>
				</div>
			) : (
				<div className="flex items-center gap-3 rounded-2xl border border-product-success/25 bg-product-success-soft p-2.5">
					<img
						alt="Your logo"
						className="h-12 w-12 shrink-0 rounded-xl bg-product-card object-contain shadow-[inset_0_0_0_1px_var(--product-border)]"
						src={image}
					/>
					<span className="flex min-w-0 flex-1 flex-col gap-[3px]">
						<b className="flex items-center gap-1.5 text-[13.5px] font-semibold leading-tight text-product-success">
							<Check
								aria-hidden="true"
								className="h-[15px] w-[15px]"
								strokeWidth={3}
							/>
							Logo uploaded successfully
						</b>
						<small className="truncate text-[12.5px] text-product-muted">
							Shown in the centre of your code
						</small>
					</span>
					<button
						className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[10px] border border-product-border-strong bg-product-card px-3 text-[13px] font-semibold text-product-error transition-colors hover:border-product-error/30 hover:bg-product-error-soft"
						onClick={() => onImageChange("")}
						type="button"
					>
						<Trash2 aria-hidden="true" className="h-[15px] w-[15px]" />
						Remove
					</button>
				</div>
			)}

			<Rows>
				<ToggleRow
					checked={!noLogo && showLogo}
					disabled={noLogo}
					hint={
						noLogo
							? "Upload a logo to show it in the code."
							: "Turn off to keep the logo without printing it."
					}
					onCheckedChange={onShowLogoChange}
					title="Show logo"
				/>
				<SliderRow
					disabled={noLogo}
					format={(v) => `${v.toFixed(2).replace(/0$/, "")}×`}
					hint="From 0.1× to 1.0×"
					max={1}
					min={0.1}
					onChange={onImageSizeChange}
					step={0.05}
					title="Logo size"
					value={imageSize}
				/>
				<ToggleRow
					checked={hideBackgroundDots}
					disabled={noLogo}
					hint="Clean background for better visibility."
					onCheckedChange={onHideBackgroundDotsChange}
					title="Hide dots behind logo"
				/>
			</Rows>
		</>
	);
}
