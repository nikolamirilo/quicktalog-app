"use client";

import ImageDropzone from "@/components/general/ImageDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Image as ImageIcon } from "lucide-react";
import React, { useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { LuCircleMinus } from "react-icons/lu";

export interface LogoControlsProps {
	image: string;
	imageSize: number;
	hideBackgroundDots: boolean;
	onImageChange: (url: string) => void;
	onImageSizeChange: (size: number) => void;
	onHideBackgroundDotsChange: (checked: boolean) => void;
}

export default function LogoControls({
	image,
	imageSize,
	hideBackgroundDots,
	onImageChange,
	onImageSizeChange,
	onHideBackgroundDotsChange,
}: LogoControlsProps) {
	const [isUploading, setIsUploading] = useState(false);

	return (
		<Card className="shadow-product-shadow hover:shadow-product-shadow-hover transition-shadow overflow-hidden">
			<CardHeader className="pb-4">
				<CardTitle className="text-base font-semibold flex items-center gap-2">
					<ImageIcon className="w-4 h-4 text-[var(--product-primary)]" />
					Logo Upload
				</CardTitle>
				<p className="text-xs text-muted-foreground mt-1">
					Add your brand logo to the center of your QR code
				</p>
			</CardHeader>
			<CardContent className="space-y-5 pt-5">
				{image == "" ? (
					<ImageDropzone
						image={image || ""}
						maxDim={512}
						onError={(error) => console.error("Upload error:", error)}
						onUploadComplete={(url) => onImageChange(url)}
						removeImage={() => onImageChange("")}
						setIsUploading={setIsUploading}
						targetSizeKB={200}
						type="qr-editor"
					/>
				) : (
					<div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
						<span className="text-green-700 flex flex-row gap-2 text-sm items-center font-medium">
							<FaCheckCircle size={18} />
							Logo uploaded successfully
						</span>
						<Button
							className="text-red-600 hover:text-red-700 hover:bg-red-50"
							onClick={() => onImageChange("")}
							size="sm"
							variant="outline"
						>
							<LuCircleMinus className="mr-1.5" size={16} />
							Remove
						</Button>
					</div>
				)}

				{image && (
					<>
						<div className="space-y-3 p-4 bg-gray-50 rounded-xl">
							<div className="flex items-center justify-between">
								<Label className="text-sm font-medium">Logo Size</Label>
								<span className="text-base font-bold text-[var(--product-primary)] bg-white px-3 py-1 rounded-md">
									{imageSize.toFixed(1)}x
								</span>
							</div>
							<Slider
								className="cursor-pointer"
								max={1}
								min={0.1}
								onValueChange={([val]) => onImageSizeChange(val)}
								step={0.1}
								value={[imageSize]}
							/>
						</div>

						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
							<div>
								<Label
									className="text-sm font-medium cursor-pointer"
									htmlFor="hide-dots"
								>
									Hide Dots Behind Logo
								</Label>
								<p className="text-xs text-muted-foreground mt-1">
									Clean background for better visibility
								</p>
							</div>
							<Switch
								checked={hideBackgroundDots}
								id="hide-dots"
								onCheckedChange={onHideBackgroundDotsChange}
							/>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
