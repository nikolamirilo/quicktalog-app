"use client";

import {
	SliderField,
	SwitchField,
} from "@/components/catalogue/inputs/sidebar/panel";
import { ImageDropzone } from "@/components/general/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	BACKGROUND_COLORS,
	BACKGROUND_FADE,
	BACKGROUND_GRADIENTS,
	backgroundIsDark,
	normalizeBackground,
} from "@/lib/catalogue/background";
import { isDarkBackground } from "@/lib/themes/custom-theme";
import { cn } from "@/lib/ui/cn";
import type {
	CatalogueBackground,
	CatalogueBackgroundType,
} from "@quicktalog/common";
import { AlertCircle, Check, Droplet, Image, Palette } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

const TYPES: {
	key: CatalogueBackgroundType;
	label: string;
	icon: React.ElementType;
}[] = [
	{ key: "image", label: "Photo", icon: Image },
	{ key: "gradient", label: "Gradient", icon: Droplet },
	{ key: "color", label: "Colour", icon: Palette },
];

const hintClass = "text-[12.5px] leading-snug text-product-muted";
const HEX = /^#[0-9a-f]{6}$/i;

interface BackgroundConfigurationProps {
	background: CatalogueBackground | undefined;
	/** Whether the theme's text is light; picks which gradients suit it. */
	themeIsDark: boolean;
	onChange: (background: CatalogueBackground) => void;
}

/** Photo, gradient or colour behind the catalogue, replacing the theme background. */
const BackgroundConfiguration = ({
	background,
	themeIsDark,
	onChange,
}: BackgroundConfigurationProps) => {
	const [, setIsUploading] = useState(false);
	// The hex field keeps what is typed; only a full hex reaches the catalogue.
	const [colorDraft, setColorDraft] = useState<string | null>(null);
	const bg = normalizeBackground(background);
	const set = (patch: Partial<CatalogueBackground>) =>
		onChange({ ...bg, ...patch });
	const textIsDark = !themeIsDark;
	const bgDark = bg.isEnabled ? backgroundIsDark(bg) : null;
	const clash = bgDark !== null && bgDark === textIsDark;
	// The group that suits the theme comes first; a group with no gradients is skipped.
	const groups = (textIsDark ? [false, true] : [true, false]).filter((dark) =>
		BACKGROUND_GRADIENTS.some((g) => g.dark === dark),
	);
	const textTone = textIsDark ? "dark" : "light";
	const otherTone = textIsDark ? "light" : "dark";
	// A clash is only fixable in place when a gradient of the other tone exists.
	const canRepick =
		bg.type !== "gradient" ||
		BACKGROUND_GRADIENTS.some((g) => g.dark !== textIsDark);

	const onTypeKeys = (e: KeyboardEvent<HTMLDivElement>) => {
		const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
			e.key
		];
		if (!step) return;
		e.preventDefault();
		const i = TYPES.findIndex((t) => t.key === bg.type);
		const next = TYPES[(i + step + TYPES.length) % TYPES.length].key;
		set({ type: next });
		const group = e.currentTarget;
		requestAnimationFrame(() =>
			group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(),
		);
	};

	return (
		<div className="space-y-5">
			<SwitchField
				checked={bg.isEnabled}
				id="bg-enabled"
				label="Customize background"
				onCheckedChange={(isEnabled) => set({ isEnabled })}
			/>

			{bg.isEnabled && (
				<>
					<div
						aria-label="Background type"
						className="grid grid-cols-3 gap-1 rounded-[14px] border border-product-border bg-product-background-hero p-1"
						onKeyDown={onTypeKeys}
						role="radiogroup"
					>
						{TYPES.map(({ key, label, icon: Icon }) => {
							const on = bg.type === key;
							return (
								<button
									aria-checked={on}
									className={cn(
										"inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold text-product-foreground-accent transition-colors hover:text-product-foreground",
										on &&
											"bg-product-card text-product-foreground shadow-[0_1px_2px_rgba(22,20,15,0.1),0_0_0_1px_rgb(var(--product-border-rgb))]",
									)}
									key={key}
									onClick={() => set({ type: key })}
									role="radio"
									tabIndex={on ? 0 : -1}
									type="button"
								>
									<Icon aria-hidden="true" className="h-4 w-4" />
									{label}
								</button>
							);
						})}
					</div>

					{clash && (
						<p
							className="flex gap-2 rounded-xl border border-product-border bg-product-background-hero px-3 py-2 text-[13px] leading-snug text-product-foreground-accent"
							role="status"
						>
							<AlertCircle
								aria-hidden="true"
								className="mt-px h-4 w-4 shrink-0 text-product-primary-ink"
							/>
							Your theme's text is {textTone}, so it will be hard to read on
							this {textTone} background.{" "}
							{canRepick
								? `Pick a ${otherTone} one, or a ${textTone} theme.`
								: `Pick a ${textTone} theme.`}
						</p>
					)}

					{bg.type === "image" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
									Photo
								</p>
								<p className={hintClass}>
									Landscape photos at least 1600 px wide look best.
								</p>
								<ImageDropzone
									className="w-full"
									image={bg.image ?? ""}
									maxDim={1600}
									onUploadComplete={(image) => set({ image })}
									removeImage={() => set({ image: null })}
									setIsUploading={setIsUploading}
								/>
							</div>
							<div>
								<SliderField
									label="Fade"
									marks={["Photo", "Theme colour"]}
									max={BACKGROUND_FADE.max}
									min={BACKGROUND_FADE.min}
									onValueChange={(fade) => set({ fade })}
									step={5}
									value={bg.fade}
									valueText={`${bg.fade}%`}
								/>
								<p className={cn(hintClass, "mt-1.5")}>
									Blends the photo into the theme background so text stays
									readable.
								</p>
							</div>
						</div>
					)}

					{bg.type === "gradient" &&
						groups.map((dark) => {
							const labelId = `bg-gradients-${dark ? "dark" : "light"}`;
							return (
								<div className="space-y-2" key={labelId}>
									<ul
										aria-labelledby={labelId}
										className="grid grid-cols-[repeat(auto-fill,minmax(82px,1fr))] gap-2.5"
									>
										{BACKGROUND_GRADIENTS.filter((g) => g.dark === dark).map(
											(g) => {
												const on = bg.gradient === g.key;
												return (
													<li key={g.key}>
														<button
															aria-pressed={on}
															className="group flex w-full flex-col gap-1.5 text-left focus-visible:outline-none"
															onClick={() => set({ gradient: g.key })}
															type="button"
														>
															<span
																className={cn(
																	"flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-product-border-strong transition-transform group-hover:-translate-y-px group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-product-secondary",
																	on &&
																		"shadow-[0_0_0_2px_rgb(var(--product-card-rgb)),0_0_0_4px_rgb(var(--product-primary-accent-rgb))]",
																)}
																style={{ background: g.css }}
															>
																{on && (
																	<Check
																		aria-hidden="true"
																		className={cn(
																			"h-[18px] w-[18px] stroke-[3]",
																			g.dark ? "text-white" : "text-[#2a1f14]",
																		)}
																	/>
																)}
															</span>
															<span className="truncate text-xs font-medium text-product-foreground-accent">
																{g.name}
															</span>
														</button>
													</li>
												);
											},
										)}
									</ul>
								</div>
							);
						})}

					{bg.type === "color" && (
						<div className="space-y-2">
							<Label htmlFor="bg-color">Colour</Label>
							<div className="flex flex-wrap items-center gap-2.5">
								<span
									aria-hidden="true"
									className="h-11 w-11 shrink-0 rounded-xl border border-product-border-strong"
									style={{ background: bg.color }}
								/>
								<Input
									className="h-11 w-[104px] px-3 font-mono text-sm uppercase"
									id="bg-color"
									maxLength={7}
									onBlur={() => setColorDraft(null)}
									onChange={(e) => {
										setColorDraft(e.target.value);
										if (HEX.test(e.target.value))
											set({ color: e.target.value });
									}}
									spellCheck={false}
									value={colorDraft ?? bg.color}
								/>
								<label className="flex items-center gap-2 text-[13px] font-semibold text-product-foreground-accent">
									Any colour
									<input
										aria-label="Background: any colour"
										className="h-7 w-9 cursor-pointer rounded-lg border border-product-border-strong bg-transparent p-0"
										onChange={(e) => set({ color: e.target.value })}
										type="color"
										value={bg.color}
									/>
								</label>
							</div>
							<ul
								aria-label="Quick picks"
								className="grid grid-cols-6 gap-1.5 pt-1"
							>
								{BACKGROUND_COLORS.map((color) => {
									const on = color === bg.color;
									return (
										<li key={color}>
											<button
												aria-label={`Use ${color}`}
												aria-pressed={on}
												className="flex aspect-square w-full items-center justify-center rounded-lg border border-product-border-strong transition-transform hover:scale-105"
												onClick={() => set({ color })}
												style={{ background: color }}
												type="button"
											>
												{on && (
													<Check
														aria-hidden="true"
														className={cn(
															"h-3.5 w-3.5 stroke-[3]",
															isDarkBackground(color)
																? "text-white"
																: "text-black",
														)}
													/>
												)}
											</button>
										</li>
									);
								})}
							</ul>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default BackgroundConfiguration;
