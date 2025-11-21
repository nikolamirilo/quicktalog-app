"use client";

import {
	Check,
	Circle,
	CircleDot,
	Image as ImageIcon,
	Palette,
	QrCode,
	RectangleEllipsis,
	Settings,
	Sparkles,
	Square,
	SquareDot,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaRegTrashAlt } from "react-icons/fa";
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
	<div className="flex items-center justify-between gap-3">
		<Label className="text-sm">{label}</Label>
		<div className="flex items-center gap-2">
			<div className="h-7 w-7 rounded border overflow-hidden relative">
				<input
					className="absolute -top-2 -left-2 w-11 h-11 p-0 border-0 cursor-pointer"
					onChange={(e) => onChange(e.target.value)}
					type="color"
					value={value}
				/>
			</div>
			<Input
				className="w-20 h-7 font-mono text-xs"
				onChange={(e) => onChange(e.target.value)}
				value={value}
			/>
		</div>
	</div>
);

export default function QrControls({ name }: { name: string }) {
	const { options, updateOptions } = useQr();
	const [isUploading, setIsUploading] = useState(false);

	const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		updateOptions({ data: e.target.value });
	};

	useEffect(() => {
		updateOptions({
			data: `${process.env.NEXT_PUBLIC_APP_URL || "https://quicktalog.com"}/catalogues/${name}`,
		});
	}, []);

	return (
		<div className="h-full flex flex-col gap-4">
			<Card className="bg-gradient-to-br from-background to-muted/20 border-2">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg font-bold flex items-center gap-2">
						<QrCode className="w-4 h-4" />
						Catalogue URL
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Input
						className="h-10 text-sm border-2"
						disabled={true}
						id="qr-content"
						onChange={handleDataChange}
						placeholder={`https://www.quicktalog.com/catalogues/${name}`}
						value={options.data}
					/>
				</CardContent>
			</Card>

			<Tabs className="w-full" defaultValue="design">
				<TabsList className="w-full grid grid-cols-4 gap-4 h-11 bg-muted p-1 rounded-lg">
					<TabsTrigger
						className="data-[state=active]:bg-product-primary data-[state=active]:text-product-foreground rounded-lg border border-gray-800/50 ring-1 ring-white/10"
						value="design"
					>
						<Palette className="w-3.5 h-3.5 mr-1.5" /> Colors
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-product-primary data-[state=active]:text-product-foreground rounded-lg border border-gray-800/50 ring-1 ring-white/10"
						value="shapes"
					>
						<QrCode className="w-3.5 h-3.5 mr-1.5" /> Style
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-product-primary data-[state=active]:text-product-foreground rounded-lg border border-gray-800/50 ring-1 ring-white/10"
						value="logo"
					>
						<ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Logo
					</TabsTrigger>
					<TabsTrigger
						className="data-[state=active]:bg-product-primary data-[state=active]:text-product-foreground rounded-lg border border-gray-800/50 ring-1 ring-white/10"
						value="settings"
					>
						<Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
					</TabsTrigger>
				</TabsList>

				<ScrollArea className="pr-3 mt-4">
					<TabsContent className="space-y-4 mt-0" value="design">
						<Card className="border-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold">Colors</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<ColorPicker
									label="Dots"
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
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-4 mt-0" value="shapes">
						<Card className="border-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold">Dots Pattern</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-2">
									{[
										{ type: "square", icon: Square, label: "Square" },
										{ type: "dots", icon: Circle, label: "Dots" },
										{ type: "rounded", icon: RectangleEllipsis, label: "Rounded" },
										{ type: "extra-rounded", icon: CircleDot, label: "Extra" },
										{ type: "classy", icon: Sparkles, label: "Classy" },
										{ type: "classy-rounded", icon: Sparkles, label: "Classy+" },
									].map(({ type, icon: Icon, label }) => (
										<Button
											className="h-10 gap-1.5 capitalize focus:border-none "
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
											<Icon className="w-3.5 h-3.5" />
											<span className="text-xs">{label}</span>
										</Button>
									))}
								</div>
							</CardContent>
						</Card>

						<Card className="border-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold">Corner Frames</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-2">
									{[
										{ type: "square", icon: Square, label: "Square" },
										{ type: "dot", icon: Circle, label: "Dot" },
										{ type: "extra-rounded", icon: RectangleEllipsis, label: "Rounded" },
									].map(({ type, icon: Icon, label }) => (
										<Button
											className="h-10 gap-1.5 capitalize focus:border-none "
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
											<Icon className="w-3.5 h-3.5" />
											<span className="text-xs">{label}</span>
										</Button>
									))}
								</div>
							</CardContent>
						</Card>

						<Card className="border-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold">Corner Dots</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-2">
									{[
										{ type: "square", icon: SquareDot, label: "Square" },
										{ type: "dot", icon: CircleDot, label: "Dot" },
									].map(({ type, icon: Icon, label }) => (
										<Button
											className="h-10 gap-1.5 capitalize focus:border-none"
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
											<Icon className="w-3.5 h-3.5" />
											<span className="text-xs">{label}</span>
										</Button>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-4 mt-0" value="logo">
						<Card className="border-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold">Logo Upload</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
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
									<div className="flex sm:flex-row sm:justify-between sm:items-center flex-col gap-2">
										<span className="text-green-500 flex flex-row gap-2 text-sm items-center">
											<FaCheckCircle size={16} />
											Image uploaded
										</span>
										<button
											className="text-red-500 flex flex-row gap-2 text-sm items-center"
											onClick={() => updateOptions({ image: "" })}
										>
											<LuCircleMinus size={16} />
											Remove
										</button>
									</div>
								)}

								{options.image && (
									<>
										<div className="space-y-2">
											<div className="flex items-center justify-between">
												<Label className="text-sm">Logo Size</Label>
												<span className="text-sm font-bold text-product-primary">
													{(options.imageOptions?.imageSize || 0.4).toFixed(1)}x
												</span>
											</div>
											<Slider
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

										<div className="flex items-center justify-between p-2.5 bg-muted/50 rounded">
											<Label className="text-sm cursor-pointer" htmlFor="hide-dots">
												Hide Dots Behind Logo
											</Label>
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

					<TabsContent className="space-y-4 mt-0" value="settings">
						<Card className="border-2">
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-semibold">Settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label className="text-sm">Error Correction Level</Label>
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
										<SelectTrigger className="h-9 border-2">
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

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label className="text-sm">Margin (Padding)</Label>
										<span className="text-sm font-bold text-primary">
											{options.margin || 0}px
										</span>
									</div>
									<Slider
										max={50}
										min={0}
										onValueChange={([val]) => updateOptions({ margin: val })}
										step={1}
										value={[options.margin || 0]}
										className="cursor-pointer"
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</ScrollArea>
			</Tabs>
		</div>
	);
}