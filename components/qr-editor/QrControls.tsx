"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQr } from "@/context/QRContext";
import {
	Image as ImageIcon,
	Info,
	Palette,
	QrCode,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import ColorControls from "./controls/ColorControls";
import LogoControls from "./controls/LogoControls";
import SettingsControls from "./controls/SettingsControls";
import ShapeControls from "./controls/ShapeControls";

const TAB_TRIGGER_CLASS =
	"data-[state=active]:bg-[var(--product-primary)] data-[state=active]:text-white data-[state=active]:border-[var(--product-primary)] data-[state=active]:border-t data-[state=active]:border-l data-[state=active]:border-r data-[state=active]:border-b-[var(--product-primary)] data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:pb-[2px] bg-gray-50 hover:bg-gray-100 rounded-t-lg font-medium text-sm transition-all border border-gray-300 border-b-gray-200 h-11 relative";

export default function QrControls({ name }: { name: string }) {
	const { options, updateOptions } = useQr();

	useEffect(() => {
		updateOptions({
			data: `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${name}`,
		});
	}, []);

	return (
		<div className="h-full flex flex-col gap-5 font-lora">
			{/* CatalogueURL Reference Card */}
			<Card className="bg-gradient-to-br from-[var(--product-primary)]/5 to-[var(--product-background-hover)] shadow-product-shadow">
				<CardHeader className="pb-3">
					<CardTitle className="text-base font-semibold flex items-center gap-2 text-[var(--product-foreground)]">
						<Info className="w-4 h-4 text-[var(--product-primary)]" />
						Your CatalogueURL
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
					<TabsTrigger className={TAB_TRIGGER_CLASS} value="design">
						<Palette className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Colors</span>
					</TabsTrigger>
					<TabsTrigger className={TAB_TRIGGER_CLASS} value="shapes">
						<QrCode className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Style</span>
					</TabsTrigger>
					<TabsTrigger className={TAB_TRIGGER_CLASS} value="logo">
						<ImageIcon className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Logo</span>
					</TabsTrigger>
					<TabsTrigger className={TAB_TRIGGER_CLASS} value="settings">
						<Settings className="w-4 h-4 mr-1.5" />
						<span className="hidden sm:inline">Settings</span>
					</TabsTrigger>
				</TabsList>

				<div className="border border-gray-200 rounded-lg rounded-t-none bg-white shadow-product-shadow p-5">
					<ScrollArea className="pr-3">
						<TabsContent className="space-y-5 mt-0 pt-0" value="design">
							<ColorControls
								backgroundColor={options.backgroundOptions?.color || "#ffffff"}
								cornerDotColor={options.cornersDotOptions?.color || "#000000"}
								cornerFrameColor={
									options.cornersSquareOptions?.color || "#000000"
								}
								dotsColor={options.dotsOptions?.color || "#000000"}
								onBackgroundColorChange={(color) =>
									updateOptions({
										backgroundOptions: { ...options.backgroundOptions, color },
									})
								}
								onCornerDotColorChange={(color) =>
									updateOptions({
										cornersDotOptions: { ...options.cornersDotOptions, color },
									})
								}
								onCornerFrameColorChange={(color) =>
									updateOptions({
										cornersSquareOptions: {
											...options.cornersSquareOptions,
											color,
										},
									})
								}
								onDotsColorChange={(color) =>
									updateOptions({
										dotsOptions: { ...options.dotsOptions, color },
									})
								}
							/>
						</TabsContent>

						<TabsContent className="space-y-5 mt-0 pt-0" value="shapes">
							<ShapeControls
								cornersDotType={options.cornersDotOptions?.type || "square"}
								cornersSquareType={
									options.cornersSquareOptions?.type || "square"
								}
								dotsType={options.dotsOptions?.type || "square"}
								onCornersDotTypeChange={(type) =>
									updateOptions({
										cornersDotOptions: {
											...options.cornersDotOptions,
											type: type as any,
										},
									})
								}
								onCornersSquareTypeChange={(type) =>
									updateOptions({
										cornersSquareOptions: {
											...options.cornersSquareOptions,
											type: type as any,
										},
									})
								}
								onDotsTypeChange={(type) =>
									updateOptions({
										dotsOptions: { ...options.dotsOptions, type: type as any },
									})
								}
							/>
						</TabsContent>

						<TabsContent className="space-y-5 mt-0 pt-0" value="logo">
							<LogoControls
								hideBackgroundDots={
									options.imageOptions?.hideBackgroundDots || false
								}
								image={options.image || ""}
								imageSize={options.imageOptions?.imageSize || 0.4}
								onHideBackgroundDotsChange={(checked) =>
									updateOptions({
										imageOptions: {
											...options.imageOptions,
											hideBackgroundDots: checked,
										},
									})
								}
								onImageChange={(url) => updateOptions({ image: url })}
								onImageSizeChange={(size) =>
									updateOptions({
										imageOptions: { ...options.imageOptions, imageSize: size },
									})
								}
							/>
						</TabsContent>

						<TabsContent className="space-y-5 mt-0 pt-0" value="settings">
							<SettingsControls
								errorCorrectionLevel={
									options.qrOptions?.errorCorrectionLevel || "Q"
								}
								margin={options.margin || 0}
								onErrorCorrectionChange={(val) =>
									updateOptions({
										qrOptions: {
											...options.qrOptions,
											errorCorrectionLevel: val as any,
										},
									})
								}
								onMarginChange={(val) => updateOptions({ margin: val })}
							/>
						</TabsContent>
					</ScrollArea>
				</div>
			</Tabs>
		</div>
	);
}
