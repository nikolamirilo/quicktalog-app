"use client";

import {
	AlertCircle,
	Circle,
	CircleDot,
	Image as ImageIcon,
	Info,
	Palette,
	QrCode,
	RectangleEllipsis,
	Settings,
	Sparkles,
	Square,
	SquareDot,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { LuCircleMinus } from "react-icons/lu";
import ImageDropzone from "@/components/common/ImageDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQr } from "@/context/QRContext";

const ColorPicker = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (val: string) => void;
}) => (
	<div className="flex items-center justify-between gap-3 py-1">
		<Label className="text-sm font-medium">{label}</Label>
		<div className="flex items-center gap-2">
			<div className="h-8 w-8 rounded-lg overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
				<input
					className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
					onChange={(e) => onChange(e.target.value)}
					type="color"
					value={value}
				/>
			</div>
			<Input
				className="w-24 h-8 font-mono text-xs"
				onChange={(e) => onChange(e.target.value)}
				value={value}
			/>
		</div>
	</div>
);

// Helper function to calculate color distance
const getColorDistance = (color1: string, color2: string): number => {
	const hexToRgb = (hex: string) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
			: { r: 0, g: 0, b: 0 };
	};

	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);

	// Calculate Euclidean distance in RGB space
	return Math.sqrt(
		Math.pow(rgb1.r - rgb2.r, 2) +
		Math.pow(rgb1.g - rgb2.g, 2) +
		Math.pow(rgb1.b - rgb2.b, 2),
	);
};

export default function QrControls({ name }: { name: string }) {
	const { options, updateOptions } = useQr();
	const [isUploading, setIsUploading] = useState(false);

	// Check for low contrast between background and any QR code elements
	const hasLowContrast = useMemo(() => {
		const bgColor = options.backgroundOptions?.color || "#ffffff";
		const dotColor = options.dotsOptions?.color || "#000000";
		const cornerFrameColor = options.cornersSquareOptions?.color || "#000000";
		const cornerDotColor = options.cornersDotOptions?.color || "#000000";

		const dotDistance = getColorDistance(bgColor, dotColor);
		const cornerFrameDistance = getColorDistance(bgColor, cornerFrameColor);
		const cornerDotDistance = getColorDistance(bgColor, cornerDotColor);

		// Threshold of 50 is quite strict - colors need to be very similar to trigger
		// Return true if ANY element has low contrast with background
		return (
			dotDistance < 50 || cornerFrameDistance < 50 || cornerDotDistance < 50
		);
	}, [
		options.backgroundOptions?.color,
		options.dotsOptions?.color,
		options.cornersSquareOptions?.color,
		options.cornersDotOptions?.color,
	]);

	const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateOptions({ data: e.target.value });
	};

	useEffect(() => {
		updateOptions({
			data: `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${name}`,
		});
	}, []);

	return (
		<div className="h-full flex flex-col gap-5 font-lora">
			{/* Catalog URL Reference Card */}
			<Card className="bg-gradient-to-br from-[var(--product-primary)]/5 to-[var(--product-hover-background)] shadow-product-shadow">
				<CardHeader className="pb-3">
					<CardTitle className="text-base font-semibold flex items-center gap-2 text-[var(--product-foreground)]">
						<Info className="w-4 h-4 text-[var(--product-primary)]" />
						Your Catalog URL
					</CardTitle>
					<p className="text-xs text-muted-foreground mt-1">
						This QR code links to your catalog. The URL cannot be changed.
					</p>
				</CardHeader>
				<CardContent>
					<div className="bg-white/80 rounded-lg p-3">
						<Link
							className="text-sm font-mono text-product-primary break-all underline"
							href={options.data}
						>
							{options.data}
						</Link>
					</div>
				</CardContent>
			</Card>

			<Tabs className="w-full" defaultValue="design">
				<TabsList className="w-full grid grid-cols-4 gap-2 h-auto p-0 bg-transparent">
					<TabsTrigger
						className="data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative"
						value="design"
					>
						<Palette className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Colors</span>
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative"
						value="shapes"
					>
						<QrCode className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Style</span>
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative"
						value="logo"
					>
						<ImageIcon className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Logo</span>
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative"
						value="settings"
					>
						<Settings className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Settings</span>
					</TabsTrigger>
				</TabsList>

				<div className="border border-gray-200 rounded-lg rounded-t-none bg-white shadow-product-shadow p-5">
					<ScrollArea className="pr-3">
						<TabsContent className="space-y-5 mt-0 pt-0" value="design">
							<Card className="shadow-product-shadow hover:shadow-product-hover-shadow transition-shadow overflow-hidden">
								<CardHeader className="pb-4">
									<CardTitle className="text-base font-semibold flex items-center gap-2">
										<Palette className="w-4 h-4 text-[var(--product-primary)]" />
										Color Palette
									</CardTitle>
									<p className="text-xs text-muted-foreground mt-1">
										Customize your QR code colors
									</p>
								</CardHeader>
								<CardContent className="space-y-4 pt-5">
									<ColorPicker
										label="QR Dots"
										onChange={(color) =>
											updateOptions({
												dotsOptions: { ...options.dotsOptions, color },
											})
										}
										value={options.dotsOptions?.color || "#000000"}
									/>
									<ColorPicker
										label="Background"
										onChange={(color) =>
											updateOptions({
												backgroundOptions: {
													...options.backgroundOptions,
													color,
												},
											})
										}
										value={options.backgroundOptions?.color || "#ffffff"}
									/>

									<div className="h-px bg-gray-200 my-4" />

									<ColorPicker
										label="Corner Frames"
										onChange={(color) =>
											updateOptions({
												cornersSquareOptions: {
													...options.cornersSquareOptions,
													color,
												},
											})
										}
										value={options.cornersSquareOptions?.color || "#000000"}
									/>
									<ColorPicker
										label="Corner Dots"
										onChange={(color) =>
											updateOptions({
												cornersDotOptions: {
													...options.cornersDotOptions,
													color,
												},
											})
										}
										value={options.cornersDotOptions?.color || "#000000"}
									/>

									{hasLowContrast && (
										<div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mt-4">
											<AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
											<div>
												<p className="text-sm font-medium text-black">
													Low Contrast Warning
												</p>
												<p className="text-xs text-black mt-1">
													Your QR code may be hard to scan. Try increasing the
													contrast between colors.
												</p>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent className="space-y-5 mt-0 pt-0" value="shapes">
							<Card className="shadow-product-shadow hover:shadow-product-hover-shadow transition-shadow overflow-hidden">
								<CardHeader className="pb-4">
									<CardTitle className="text-base font-semibold flex items-center gap-2">
										<Circle className="w-4 h-4 text-[var(--product-primary)]" />
										Dots Pattern
									</CardTitle>
									<p className="text-xs text-muted-foreground mt-1">
										Choose the style for your QR code dots
									</p>
								</CardHeader>
								<CardContent className="pt-5">
									<div className="grid grid-cols-2 gap-3">
										{[
											{ type: "square", icon: Square, label: "Square" },
											{ type: "dots", icon: Circle, label: "Dots" },
											{
												type: "rounded",
												icon: RectangleEllipsis,
												label: "Rounded",
											},
											{
												type: "extra-rounded",
												icon: CircleDot,
												label: "Extra",
											},
											{ type: "classy", icon: Sparkles, label: "Classy" },
											{
												type: "classy-rounded",
												icon: Sparkles,
												label: "Classy+",
											},
										].map(({ type, icon: Icon, label }) => (
											<Button
												className={`h-11 gap-2 font-medium transition-all ${options.dotsOptions?.type === type
													? "bg-[var(--product-primary)] hover:bg-[var(--product-primary-accent)] text-white shadow-md"
													: "bg-gray-100 hover:bg-gray-200 hover:border-[var(--product-primary)]/50"
													}`}
												key={type}
												onClick={() =>
													updateOptions({
														dotsOptions: {
															...options.dotsOptions,
															type: type as any,
														},
													})
												}
												size="sm"
												variant={
													options.dotsOptions?.type === type
														? "default"
														: "outline"
												}
											>
												<Icon className="w-4 h-4" />
												<span className="text-sm">{label}</span>
											</Button>
										))}
									</div>
								</CardContent>
							</Card>

							<Card className="shadow-product-shadow hover:shadow-product-hover-shadow transition-shadow overflow-hidden">
								<CardHeader className="pb-4">
									<CardTitle className="text-base font-semibold flex items-center gap-2">
										<Square className="w-4 h-4 text-[var(--product-primary)]" />
										Corner Frames
									</CardTitle>
									<p className="text-xs text-muted-foreground mt-1">
										Style the frame around corner markers
									</p>
								</CardHeader>
								<CardContent className="pt-5">
									<div className="grid grid-cols-3 gap-3">
										{[
											{ type: "square", icon: Square, label: "Square" },
											{ type: "dot", icon: Circle, label: "Dot" },
											{
												type: "extra-rounded",
												icon: RectangleEllipsis,
												label: "Rounded",
											},
										].map(({ type, icon: Icon, label }) => (
											<Button
												className={`h-11 gap-2 font-medium transition-all ${options.cornersSquareOptions?.type === type
													? "bg-[var(--product-primary)] hover:bg-[var(--product-primary-accent)] text-white shadow-md"
													: "bg-gray-100 hover:bg-gray-200 hover:border-[var(--product-primary)]/50"
													}`}
												key={type}
												onClick={() =>
													updateOptions({
														cornersSquareOptions: {
															...options.cornersSquareOptions,
															type: type as any,
														},
													})
												}
												size="sm"
												variant={
													options.cornersSquareOptions?.type === type
														? "default"
														: "outline"
												}
											>
												<Icon className="w-4 h-4" />
												<span className="text-sm">{label}</span>
											</Button>
										))}
									</div>
								</CardContent>
							</Card>

							<Card className="shadow-product-shadow hover:shadow-product-hover-shadow transition-shadow overflow-hidden">
								<CardHeader className="pb-4">
									<CardTitle className="text-base font-semibold flex items-center gap-2">
										<CircleDot className="w-4 h-4 text-[var(--product-primary)]" />
										Corner Dots
									</CardTitle>
									<p className="text-xs text-muted-foreground mt-1">
										Style the dot inside corner markers
									</p>
								</CardHeader>
								<CardContent className="pt-5">
									<div className="grid grid-cols-2 gap-3">
										{[
											{ type: "square", icon: SquareDot, label: "Square" },
											{ type: "dot", icon: CircleDot, label: "Dot" },
										].map(({ type, icon: Icon, label }) => (
											<Button
												className={`h-11 gap-2 font-medium transition-all ${options.cornersDotOptions?.type === type
													? "bg-[var(--product-primary)] hover:bg-[var(--product-primary-accent)] text-white shadow-md"
													: "bg-gray-100 hover:bg-gray-200 hover:border-[var(--product-primary)]/50"
													}`}
												key={type}
												onClick={() =>
													updateOptions({
														cornersDotOptions: {
															...options.cornersDotOptions,
															type: type as any,
														},
													})
												}
												size="sm"
												variant={
													options.cornersDotOptions?.type === type
														? "default"
														: "outline"
												}
											>
												<Icon className="w-4 h-4" />
												<span className="text-sm">{label}</span>
											</Button>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent className="space-y-5 mt-0 pt-0" value="logo">
							<Card className="shadow-product-shadow hover:shadow-product-hover-shadow transition-shadow overflow-hidden">
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
									{options.image == "" ? (
										<ImageDropzone
											image={options.image || ""}
											maxDim={512}
											onError={(error) => console.error("Upload error:", error)}
											onUploadComplete={(url) => updateOptions({ image: url })}
											removeImage={() => updateOptions({ image: "" })}
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
												onClick={() => updateOptions({ image: "" })}
												size="sm"
												variant="outline"
											>
												<LuCircleMinus className="mr-1.5" size={16} />
												Remove
											</Button>
										</div>
									)}

									{options.image && (
										<>
											<div className="space-y-3 p-4 bg-gray-50 rounded-xl">
												<div className="flex items-center justify-between">
													<Label className="text-sm font-medium">
														Logo Size
													</Label>
													<span className="text-base font-bold text-[var(--product-primary)] bg-white px-3 py-1 rounded-md">
														{(options.imageOptions?.imageSize || 0.4).toFixed(
															1,
														)}
														x
													</span>
												</div>
												<Slider
													className="cursor-pointer"
													max={1}
													min={0.1}
													onValueChange={([val]) =>
														updateOptions({
															imageOptions: {
																...options.imageOptions,
																imageSize: val,
															},
														})
													}
													step={0.1}
													value={[options.imageOptions?.imageSize || 0.4]}
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
													checked={options.imageOptions?.hideBackgroundDots}
													id="hide-dots"
													onCheckedChange={(checked) =>
														updateOptions({
															imageOptions: {
																...options.imageOptions,
																hideBackgroundDots: checked,
															},
														})
													}
												/>
											</div>
										</>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent className="space-y-5 mt-0 pt-0" value="settings">
							<Card className="shadow-product-shadow hover:shadow-product-hover-shadow transition-shadow overflow-hidden">
								<CardHeader className="pb-4">
									<CardTitle className="text-base font-semibold flex items-center gap-2">
										<Settings className="w-4 h-4 text-[var(--product-primary)]" />
										Advanced Settings
									</CardTitle>
									<p className="text-xs text-muted-foreground mt-1">
										Fine-tune your QR code's technical properties
									</p>
								</CardHeader>
								<CardContent className="space-y-5 pt-5">
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											Error Correction Level
										</Label>
										<Select
											onValueChange={(val: any) =>
												updateOptions({
													qrOptions: {
														...options.qrOptions,
														errorCorrectionLevel: val,
													},
												})
											}
											value={options.qrOptions?.errorCorrectionLevel}
										>
											<SelectTrigger className="h-10 font-medium">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="L">Low (7%)</SelectItem>
												<SelectItem value="M">Medium (15%)</SelectItem>
												<SelectItem value="Q">Quartile (25%)</SelectItem>
												<SelectItem value="H">High (30%)</SelectItem>
											</SelectContent>
										</Select>
										<div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
											<Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
											<p className="text-xs text-blue-700">
												Higher correction levels allow the QR code to be scanned
												even if partially damaged or obscured
											</p>
										</div>
									</div>

									<div className="space-y-3 p-4 bg-gray-50 rounded-xl">
										<div className="flex items-center justify-between">
											<Label className="text-sm font-medium">
												Margin (Padding)
											</Label>
											<span className="text-base font-bold text-[var(--product-primary)] bg-white px-3 py-1 rounded-md">
												{options.margin || 0}px
											</span>
										</div>
										<Slider
											className="cursor-pointer"
											max={50}
											min={0}
											onValueChange={([val]) => updateOptions({ margin: val })}
											step={1}
											value={[options.margin || 0]}
										/>
										<p className="text-xs text-muted-foreground">
											Add space around the QR code for better scanning
										</p>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</ScrollArea>
				</div>
			</Tabs>
		</div>
	);
}
