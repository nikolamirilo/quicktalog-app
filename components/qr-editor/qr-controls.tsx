"use client";

import React, { useState } from "react";
import { useQr } from "@/context/qr-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Palette,
	QrCode,
	Image as ImageIcon,
	Settings,
	Check,
} from "lucide-react";
import ImageDropzone from "@/components/common/ImageDropzone";
import { FaCheckCircle } from "react-icons/fa";

// Helper for color input
const ColorPicker = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (val: string) => void;
}) => (
	<div className="flex items-center justify-between gap-4">
		<Label className="text-sm font-medium text-muted-foreground">{label}</Label>
		<div className="flex items-center gap-2">
			<div className="h-8 w-8 rounded-full border border-input overflow-hidden relative">
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
				/>
			</div>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-24 h-8 font-mono text-xs"
			/>
		</div>
	</div>
);

export default function QrControls() {
	const { options, updateOptions } = useQr();
	const [isUploading, setIsUploading] = useState(false);

	const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateOptions({ data: e.target.value });
	};

	return (
		<div className="h-full flex flex-col gap-6">
			{/* Content Section */}
			<Card className="bg-gradient-to-br from-background to-muted/20 border-2">
				<CardHeader>
					<CardTitle className="text-xl font-bold flex items-center gap-2">
						<QrCode className="w-5 h-5" />
						QR Content
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Label htmlFor="qr-content" className="text-base font-semibold">
						Website URL or Text
					</Label>
					<Input
						id="qr-content"
						placeholder="https://example.com"
						value={options.data}
						onChange={handleDataChange}
						className="h-12 text-base border-2 focus-visible:ring-2"
					/>
				</CardContent>
			</Card>

			<Tabs defaultValue="design" className="w-full">
				<TabsList className="w-full grid grid-cols-4 h-14 bg-muted p-1.5 rounded-xl">
					<TabsTrigger
						value="design"
						className="data-[state=active]:bg-product-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 ease-in-out"
					>
						<Palette className="w-4 h-4 mr-2" /> Colors
					</TabsTrigger>
					<TabsTrigger
						value="shapes"
						className="data-[state=active]:bg-product-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 ease-in-out"
					>
						<QrCode className="w-4 h-4 mr-2" /> Style
					</TabsTrigger>
					<TabsTrigger
						value="logo"
						className="data-[state=active]:bg-product-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 ease-in-out"
					>
						<ImageIcon className="w-4 h-4 mr-2" /> Logo
					</TabsTrigger>
					<TabsTrigger
						value="settings"
						className="data-[state=active]:bg-product-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 ease-in-out"
					>
						<Settings className="w-4 h-4 mr-2" /> More
					</TabsTrigger>
				</TabsList>

				<ScrollArea className="max-h-[calc(100vh-420px)] pr-4 mt-6">
					{/* Colors Tab */}
					<TabsContent value="design" className="space-y-6 mt-0">
						<Card className="border-2">
							<CardHeader className="pb-4">
								<CardTitle className="text-base font-semibold">
									QR Code Colors
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5">
								<ColorPicker
									label="Dots Color"
									value={options.dotsOptions?.color || "#000000"}
									onChange={(color) =>
										updateOptions({
											dotsOptions: { ...options.dotsOptions, color },
										})
									}
								/>
								<ColorPicker
									label="Background"
									value={options.backgroundOptions?.color || "#ffffff"}
									onChange={(color) =>
										updateOptions({
											backgroundOptions: {
												...options.backgroundOptions,
												color,
											},
										})
									}
								/>
								<ColorPicker
									label="Corner Squares"
									value={options.cornersSquareOptions?.color || "#000000"}
									onChange={(color) =>
										updateOptions({
											cornersSquareOptions: {
												...options.cornersSquareOptions,
												color,
											},
										})
									}
								/>
								<ColorPicker
									label="Corner Dots"
									value={options.cornersDotOptions?.color || "#000000"}
									onChange={(color) =>
										updateOptions({
											cornersDotOptions: {
												...options.cornersDotOptions,
												color,
											},
										})
									}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Shapes Tab */}
					<TabsContent value="shapes" className="space-y-6 mt-0">
						<Card className="border-2">
							<CardHeader className="pb-4">
								<CardTitle className="text-base font-semibold">
									Dots Pattern
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-3">
									{[
										"square",
										"dots",
										"rounded",
										"extra-rounded",
										"classy",
										"classy-rounded",
									].map((type) => (
										<Button
											key={type}
											variant={
												options.dotsOptions?.type === type
													? "default"
													: "outline"
											}
											className="h-20 flex flex-col gap-2 capitalize border-2"
											onClick={() =>
												updateOptions({
													dotsOptions: {
														...options.dotsOptions,
														type: type as any,
													},
												})
											}
										>
											<div
												className={`w-6 h-6 bg-current ${type === "rounded" ? "rounded-full" : type === "extra-rounded" ? "rounded-xl" : ""}`}
											/>
											<span className="text-xs font-medium">
												{type.replace("-", " ")}
											</span>
										</Button>
									))}
								</div>
							</CardContent>
						</Card>

						<Card className="border-2">
							<CardHeader className="pb-4">
								<CardTitle className="text-base font-semibold">
									Corner Squares
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-3">
									{["square", "dot", "extra-rounded"].map((type) => (
										<Button
											key={type}
											variant={
												options.cornersSquareOptions?.type === type
													? "default"
													: "outline"
											}
											className="h-20 flex flex-col gap-2 capitalize border-2"
											onClick={() =>
												updateOptions({
													cornersSquareOptions: {
														...options.cornersSquareOptions,
														type: type as any,
													},
												})
											}
										>
											<div
												className={`w-6 h-6 border-4 border-current ${type === "dot" ? "rounded-full" : type === "extra-rounded" ? "rounded-xl" : ""}`}
											/>
											<span className="text-xs font-medium">
												{type.replace("-", " ")}
											</span>
										</Button>
									))}
								</div>
							</CardContent>
						</Card>

						<Card className="border-2">
							<CardHeader className="pb-4">
								<CardTitle className="text-base font-semibold">
									Corner Dots
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-3">
									{["square", "dot"].map((type) => (
										<Button
											key={type}
											variant={
												options.cornersDotOptions?.type === type
													? "default"
													: "outline"
											}
											className="h-20 flex flex-col gap-2 capitalize border-2"
											onClick={() =>
												updateOptions({
													cornersDotOptions: {
														...options.cornersDotOptions,
														type: type as any,
													},
												})
											}
										>
											<div
												className={`w-4 h-4 bg-current ${type === "dot" ? "rounded-full" : ""}`}
											/>
											<span className="text-xs font-medium">{type}</span>
										</Button>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Logo Tab */}
					<TabsContent value="logo" className="space-y-6 mt-0">
						<Card className="border-2">
							<CardHeader className="pb-4">
								<CardTitle className="text-base font-semibold">
									Logo Upload
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5">
								{options.image == "" ? (
									<ImageDropzone
										type="qr-editor"
										setIsUploading={setIsUploading}
										onUploadComplete={(url) => updateOptions({ image: url })}
										onError={(error) => console.error("Upload error:", error)}
										removeImage={() => updateOptions({ image: "" })}
										image={options.image || ""}
										maxDim={512}
										targetSizeKB={200}
									/>
								) : (
									<span className="text-green-500 flex flex-row gap-2 text-base items-center justify-start">
										<FaCheckCircle className="text-green-500" />
										Image uploaded successfully!
									</span>
								)}

								{options.image && (
									<>
										<div className="space-y-3">
											<div className="flex items-center justify-between">
												<Label className="text-sm font-semibold">
													Logo Size
												</Label>
												<span className="text-sm font-bold text-product-primary">
													{(options.imageOptions?.imageSize || 0.4).toFixed(1)}x
												</span>
											</div>
											<Slider
												min={0.1}
												max={1}
												step={0.1}
												value={[options.imageOptions?.imageSize || 0.4]}
												onValueChange={([val]) =>
													updateOptions({
														imageOptions: {
															...options.imageOptions,
															imageSize: val,
														},
													})
												}
												className="py-1"
											/>
										</div>

										<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
											<Label
												htmlFor="hide-dots"
												className="text-sm font-semibold cursor-pointer"
											>
												Hide Dots Behind Logo
											</Label>
											<Switch
												id="hide-dots"
												checked={options.imageOptions?.hideBackgroundDots}
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

					{/* Settings Tab */}
					<TabsContent value="settings" className="space-y-6 mt-0">
						<Card className="border-2">
							<CardHeader className="pb-4">
								<CardTitle className="text-base font-semibold">
									QR Code Settings
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5">
								<div className="space-y-3">
									<Label className="text-sm font-semibold">
										Error Correction Level
									</Label>
									<Select
										value={options.qrOptions?.errorCorrectionLevel}
										onValueChange={(val: any) =>
											updateOptions({
												qrOptions: {
													...options.qrOptions,
													errorCorrectionLevel: val,
												},
											})
										}
									>
										<SelectTrigger className="h-11 border-2">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="L">Low (7%)</SelectItem>
											<SelectItem value="M">Medium (15%)</SelectItem>
											<SelectItem value="Q">Quartile (25%)</SelectItem>
											<SelectItem value="H">High (30%)</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										Higher levels allow more damage tolerance
									</p>
								</div>

								<div className="space-y-4 pt-2">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-semibold">
											Margin (Padding)
										</Label>
										<span className="text-sm font-bold text-primary">
											{options.margin || 0}px
										</span>
									</div>
									<Slider
										min={0}
										max={50}
										step={1}
										value={[options.margin || 0]}
										onValueChange={([val]) => updateOptions({ margin: val })}
										className="py-2"
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</ScrollArea>
			</Tabs>

			<div className="pt-4">
				<Button
					size="lg"
					className="w-full h-12 text-base font-semibold shadow-lg"
					onClick={() => {
						console.log("QR Code Configuration:", options);
					}}
				>
					<Check className="w-5 h-5 mr-2" />
					Save Configuration
				</Button>
			</div>
		</div>
	);
}
