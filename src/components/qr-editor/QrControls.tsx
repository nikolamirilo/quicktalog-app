"use client";

import {
	Image as ImageIcon,
	type LucideIcon,
	Palette,
	Shapes,
	SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { ColorControls } from "@/components/qr-editor/controls/ColorControls";
import { LogoControls } from "@/components/qr-editor/controls/LogoControls";
import { SettingsControls } from "@/components/qr-editor/controls/SettingsControls";
import { ShapeControls } from "@/components/qr-editor/controls/ShapeControls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQr } from "@/context/QRContext";
import { colorsOf, DEFAULT_FRAME_TEXT, type QrColors } from "@/lib/qr/design";
import type { ScanRisk } from "@/lib/qr/scan-risk";

const TABS: { value: string; label: string; icon: LucideIcon }[] = [
	{ value: "colors", label: "Colors", icon: Palette },
	{ value: "style", label: "Style", icon: Shapes },
	{ value: "logo", label: "Logo", icon: ImageIcon },
	{ value: "settings", label: "Settings", icon: SlidersHorizontal },
];

const PANEL = "mt-0 px-2 pb-2.5 pt-5 sm:px-3.5 sm:pb-3 sm:pt-[22px]";

export function QrControls({ risk }: { risk: ScanRisk }) {
	const { options, updateOptions } = useQr();
	const [tab, setTab] = useState(TABS[0].value);
	const index = TABS.findIndex((t) => t.value === tab);

	const setColors = (colors: Partial<QrColors>) =>
		updateOptions({
			...(colors.dots && { dotsOptions: { color: colors.dots } }),
			...(colors.background && {
				backgroundOptions: { color: colors.background },
			}),
			...(colors.cornerFrames && {
				cornersSquareOptions: { color: colors.cornerFrames },
			}),
			...(colors.cornerDots && {
				cornersDotOptions: { color: colors.cornerDots },
			}),
		});

	return (
		<div className="rounded-product-card border border-product-border bg-product-card p-2.5 shadow-product sm:p-3">
			<Tabs onValueChange={setTab} value={tab}>
				<TabsList
					aria-label="QR settings"
					className="relative grid h-auto w-full grid-cols-4 gap-0 rounded-[15px] bg-product-background-hero p-1"
				>
					<span
						aria-hidden="true"
						className="absolute bottom-1 left-1 top-1 w-[calc((100%-8px)/4)] rounded-[11px] bg-product-card shadow-[0_1px_2px_rgb(var(--product-foreground-rgb)/0.08),0_4px_10px_-2px_rgb(var(--product-foreground-rgb)/0.08)] transition-transform duration-300 ease-[cubic-bezier(.3,.9,.3,1)] after:absolute after:bottom-[-1px] after:left-1/2 after:h-[3px] after:w-[26px] after:-translate-x-1/2 after:rounded-t-[3px] after:bg-product-primary"
						style={{ transform: `translateX(${index * 100}%)` }}
					/>
					{TABS.map(({ value, label, icon: Icon }) => (
						<TabsTrigger
							className="relative z-10 h-10 min-w-0 gap-[7px] rounded-[11px] px-1.5 text-[13.5px] text-product-muted hover:text-product-foreground data-[state=active]:bg-transparent data-[state=active]:text-product-foreground data-[state=active]:shadow-none [&_svg]:hidden min-[380px]:[&_svg]:block data-[state=active]:[&_svg]:text-product-primary-ink"
							key={value}
							value={value}
						>
							<Icon aria-hidden="true" />
							{label}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent className={PANEL} value="colors">
					<ColorControls
						colors={colorsOf(options)}
						onChange={setColors}
						risk={risk}
					/>
				</TabsContent>

				<TabsContent className={PANEL} value="style">
					<ShapeControls
						cornersDotType={options.cornersDotOptions?.type ?? "square"}
						cornersSquareType={options.cornersSquareOptions?.type ?? "square"}
						dotsType={options.dotsOptions?.type ?? "square"}
						onCornersDotTypeChange={(type) =>
							updateOptions({ cornersDotOptions: { type } })
						}
						onCornersSquareTypeChange={(type) =>
							updateOptions({ cornersSquareOptions: { type } })
						}
						onDotsTypeChange={(type) =>
							updateOptions({ dotsOptions: { type } })
						}
					/>
				</TabsContent>

				{/* Stays mounted so an upload in progress survives a tab switch. */}
				<TabsContent
					className={`${PANEL} data-[state=inactive]:hidden`}
					forceMount
					value="logo"
				>
					<LogoControls
						hideBackgroundDots={
							options.imageOptions?.hideBackgroundDots ?? false
						}
						image={options.image ?? ""}
						imageSize={options.imageOptions?.imageSize ?? 0.4}
						onHideBackgroundDotsChange={(hideBackgroundDots) =>
							updateOptions({ imageOptions: { hideBackgroundDots } })
						}
						onImageChange={(image) =>
							updateOptions({ image, ...(image && { showLogo: true }) })
						}
						onImageSizeChange={(imageSize) =>
							updateOptions({ imageOptions: { imageSize } })
						}
						onShowLogoChange={(showLogo) => updateOptions({ showLogo })}
						showLogo={options.showLogo !== false}
					/>
				</TabsContent>

				<TabsContent className={PANEL} value="settings">
					<SettingsControls
						errorCorrectionLevel={
							options.qrOptions?.errorCorrectionLevel ?? "Q"
						}
						frameText={
							options.frameText ?? { show: false, text: DEFAULT_FRAME_TEXT }
						}
						margin={options.margin ?? 0}
						onErrorCorrectionChange={(errorCorrectionLevel) =>
							updateOptions({ qrOptions: { errorCorrectionLevel } })
						}
						onFrameTextChange={(frameText) => updateOptions({ frameText })}
						onMarginChange={(margin) => updateOptions({ margin })}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
