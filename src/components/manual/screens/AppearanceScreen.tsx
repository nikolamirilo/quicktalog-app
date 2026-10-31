import {
	Check,
	ChevronDown,
	FileText,
	Home,
	Info,
	Layout,
	type LucideIcon,
	Palette,
	Plus,
	X,
} from "lucide-react";
import type { ReactNode } from "react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * The builder's editor panel open on Appearance, drawn at its real 440px width.
 *
 * The panel is not a page and not a dialog: it sits against the left edge of
 * the 72px builder rail, square-cornered, with one 1px left border. So the
 * stage is the panel alone: no window bar, no rail, no catalogue behind it.
 * The body is the beige page colour; only the header and the tab strip are
 * white, and the first rule in the panel is the one under the tab strip.
 *
 * The state drawn is the stock one on a plan that includes advanced
 * appearance: theme Monochrome, font Inter, medium text, 12px corners, low
 * shadow, glass off, background and overlay switched off. That state is what
 * keeps the Custom colours, the background pickers, the overlay input and the
 * fine-tune sliders off the screen; none of them are drawn.
 *
 * The classes are copied from the real components rather than approximated, so
 * the browser lays this out exactly as it lays out the panel itself.
 */

/** The theme tiles echo the catalogue's one chosen font, Inter by default. */
const CATALOGUE_FONT = "Inter, system-ui, sans-serif";

/** The rainbow wheel on the Custom tile, from ThemeSelection. */
const CUSTOM_TILE_GRADIENT =
	"conic-gradient(from 180deg, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #f97316)";

const TABS: { icon: LucideIcon; label: string }[] = [
	{ icon: Home, label: "General" },
	{ icon: Layout, label: "Header" },
	{ icon: FileText, label: "Footer" },
	{ icon: Palette, label: "Appearance" },
];

/**
 * The five standard themes the grid shows at first, in id order, each in its
 * own colours from `styles/themes.css`. Elegant is the only one whose tile is
 * a gradient; Creative and Coffee stay hidden behind the button.
 */
const THEMES: {
	background: string;
	border: string;
	dot: string;
	gradient?: string;
	ink: string;
	label: string;
}[] = [
	{
		background: "#f3f3f3",
		border: "#e0e0e0",
		dot: "#000000",
		ink: "#000000",
		label: "Monochrome",
	},
	{
		background: "#121212",
		border: "#333333",
		dot: "#6699cc",
		gradient: "linear-gradient(to bottom, #1a1a1a, #0f0f0f)",
		ink: "#fafafa",
		label: "Elegant",
	},
	{
		background: "#f5f3ea",
		border: "#d3d0ba",
		dot: "#5c7453",
		ink: "#354834",
		label: "Organic",
	},
	{
		background: "#1a1a2b",
		border: "#404040",
		dot: "#8b6cb3",
		ink: "#ffffff",
		label: "Modern",
	},
	{
		background: "#fff8e7",
		border: "#d9d9d9",
		dot: "#d3af37",
		ink: "#1a1a1a",
		label: "Luxury",
	},
];

const GLASS_PILLS = ["Navbar", "Search bar", "Section headers", "Item cards"];

/** The (i) dot beside a heading or a label. Its popover is always closed. */
function InfoDot() {
	return (
		<span className="grid h-7 w-7 flex-none place-items-center rounded-full text-product-muted">
			<Info aria-hidden="true" className="h-4 w-4" />
		</span>
	);
}

/** One white card in the panel: 22px radius, 16px padding, no shadow. */
function Card({ children, title }: { children: ReactNode; title: string }) {
	return (
		<section className="space-y-4 rounded-product-card border border-product-border bg-product-card p-4">
			<div className="flex min-h-7 items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-1">
					<h3 className="font-product-heading text-[15px] font-bold leading-snug text-product-foreground">
						{title}
					</h3>
					<InfoDot />
				</div>
			</div>
			{children}
		</section>
	);
}

/** The label above a control, at the size the real Label component uses. */
function FieldLabel({ children }: { children: ReactNode }) {
	return (
		<span className="text-[13.5px] font-semibold leading-none text-product-foreground">
			{children}
		</span>
	);
}

/**
 * Label, the value echoed on the right, a 44px hit area around a 6px track,
 * and the marks spread edge to edge under it. `fill` is the position along the
 * track, 0 to 1; the thumb is inset by its own width the way Radix insets it.
 */
function SliderField({
	fill,
	info,
	label,
	marks,
	valueText,
}: {
	fill: number;
	/** Draws the (i) dot after the label, which makes the row 28px tall. */
	info?: boolean;
	label: string;
	marks?: string[];
	valueText: string;
}) {
	return (
		<div className="space-y-1">
			<div className="flex items-baseline justify-between gap-3">
				<span className="flex items-center gap-1">
					<FieldLabel>{label}</FieldLabel>
					{info ? <InfoDot /> : null}
				</span>
				<span className="text-[13px] font-semibold capitalize tabular-nums text-product-foreground-accent">
					{valueText}
				</span>
			</div>
			<div className="flex h-11 w-full items-center">
				<div className="relative h-1.5 w-full rounded-full bg-product-border-strong">
					{fill > 0 ? (
						<span
							className="absolute inset-y-0 left-0 rounded-full bg-product-primary-accent"
							style={{ width: `${fill * 100}%` }}
						/>
					) : null}
					<span
						className="absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full border-2 border-product-primary bg-white shadow-[0_2px_6px_rgba(22,20,15,0.18)]"
						style={{ left: `calc(${fill * 100}% - ${fill * 22}px)` }}
					/>
				</div>
			</div>
			{/* The real marks row carries -mt-2, which space-y-1 outranks, so the
			    marks sit just under the hit area. Copied as it is, dead class and
			    all, so this lands where the product lands. */}
			{marks ? (
				<div className="-mt-2 flex justify-between text-xs text-product-muted">
					{marks.map((mark) => (
						<span key={mark}>{mark}</span>
					))}
				</div>
			) : null}
		</div>
	);
}

/** The 44px on/off row Background and Overlay each show on their own. */
function SwitchField({ label }: { label: string }) {
	return (
		<div className="flex min-h-11 items-center justify-between gap-3">
			<div className="min-w-0">
				<span className="text-[13.5px] font-semibold leading-snug text-product-foreground">
					{label}
				</span>
			</div>
			<span className="inline-flex h-[26px] w-11 flex-none items-center rounded-full border-[3px] border-transparent bg-product-border-strong">
				<span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(22,20,15,0.25)]" />
			</span>
		</div>
	);
}

/** One "Use glass on" pill: ticked, but dimmed while the level is Off. */
function GlassPill({ label }: { label: string }) {
	return (
		<span className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-product-primary-accent bg-product-primary-soft pl-2.5 pr-3.5 text-[13.5px] font-semibold text-product-foreground opacity-50">
			<span className="grid h-4 w-4 flex-none place-items-center rounded-[5px] border-[1.5px] border-product-primary bg-product-primary text-product-foreground">
				<Check aria-hidden="true" className="h-3 w-3" strokeWidth={3.2} />
			</span>
			{label}
		</span>
	);
}

/** The Appearance tab of the builder's editor panel, in its stock state. */
export function AppearanceScreen() {
	return (
		<Screen
			caption="The builder's editor panel open on the Appearance tab, where the owner picks a theme tile and then sets font, corner radius, shadow and the glass effect."
			height={1680}
			legend={[
				"The Appearance tab, tinted amber while it is open.",
				"Start a custom theme and pick every colour yourself.",
				"The amber ring marks the theme this catalogue uses.",
				"Two more themes are hidden until you ask for them.",
				"Font style: each option is drawn in its own typeface.",
				"Glass is off, so its surface pills stay greyed out.",
			]}
			width={440}
		>
			<div className="absolute inset-0 flex flex-col border-l border-product-border bg-product-background font-product-body text-product-foreground">
				{/* The header carries a border colour but no border width, so there
				    is no rule under it. The first rule is under the tabs. */}
				<header className="flex shrink-0 items-center gap-2 bg-product-card px-4 py-3">
					<div className="min-w-0 flex-1">
						<h2 className="truncate font-product-heading text-base font-bold leading-tight text-product-foreground">
							Edit catalogue
						</h2>
						<p className="truncate text-xs leading-snug text-product-muted">
							Name, header, footer and appearance
						</p>
					</div>
					<span className="grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent">
						<X aria-hidden="true" className="h-[17.6px] w-[17.6px]" />
					</span>
				</header>

				<div className="shrink-0 border-b border-product-border bg-product-card px-4 py-3">
					<div className="grid grid-cols-4 gap-1 rounded-2xl border border-product-border bg-product-background-hero p-1">
						{TABS.map(({ icon: Icon, label }) => {
							const active = label === "Appearance";
							return (
								<div
									className={cn(
										"relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-1 py-2 text-xs font-semibold text-product-foreground-accent",
										// An amber tint with an amber outline, never a solid
										// amber chip, and no shadow.
										active &&
											"border-product-primary bg-product-primary-soft text-product-foreground",
									)}
									key={label}
								>
									{active ? <SpotMarker n={1} /> : null}
									<Icon aria-hidden="true" className="h-4 w-4" />
									<span className="max-w-full truncate">{label}</span>
								</div>
							);
						})}
					</div>
				</div>

				<div className="min-h-0 flex-1 overflow-hidden p-4">
					<div className="space-y-4">
						<Card title="Themes">
							<div className="space-y-3">
								{/* auto-fill at 92px minimum lands on three 118px columns
								    in the card's 374px box. */}
								<ul className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2.5">
									<li>
										<div className="relative flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-product-border-strong bg-product-card p-3 text-product-foreground-accent">
											<SpotMarker n={2} />
											<span
												aria-hidden="true"
												className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-sm"
												style={{ background: CUSTOM_TILE_GRADIENT }}
											>
												<Plus
													className="h-4 w-4 text-white drop-shadow"
													strokeWidth={3}
												/>
											</span>
											<span className="text-xs font-semibold">Custom</span>
										</div>
									</li>

									{THEMES.map(
										({ background, border, dot, gradient, ink, label }) => {
											const selected = label === "Monochrome";
											return (
												<li key={label}>
													{/* The ring sits outside the tile with a white
													    gap, so the tile keeps the theme's own look. */}
													<div
														className={cn(
															"relative flex h-24 w-full flex-col items-center justify-center rounded-2xl border p-3",
															selected &&
																"ring-[2.5px] ring-product-primary-accent ring-offset-2 ring-offset-product-card",
														)}
														style={{
															backgroundColor: background,
															backgroundImage: gradient,
															borderColor: border,
															color: ink,
														}}
													>
														{selected ? <SpotMarker n={3} /> : null}
														<span
															aria-hidden="true"
															className="mb-2 h-8 w-8 rounded-full border-2"
															style={{
																backgroundColor: dot,
																borderColor: ink,
															}}
														/>
														<span
															className="max-w-full truncate text-xs font-normal"
															style={{ color: ink, fontFamily: CATALOGUE_FONT }}
														>
															{label}
														</span>
													</div>
												</li>
											);
										},
									)}
								</ul>

								<Btn className="relative w-full" variant="outline">
									<SpotMarker n={4} />
									Show more themes
								</Btn>
							</div>
						</Card>

						<Card title="Background">
							{/* Switched off, so the photo, gradient and colour pickers
							    are not on the screen at all. */}
							<SwitchField label="Customize background" />
						</Card>

						<Card title="Style">
							<div className="space-y-5">
								<div className="space-y-5">
									<div className="space-y-2">
										<FieldLabel>Font style</FieldLabel>
										<span className="relative flex h-11 w-full items-center justify-between gap-2 rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card px-4 text-[15px] text-product-foreground">
											<SpotMarker n={5} />
											<span style={{ fontFamily: CATALOGUE_FONT }}>Inter</span>
											<ChevronDown
												aria-hidden="true"
												className="h-4 w-4 shrink-0 text-product-muted"
											/>
										</span>
									</div>

									<SliderField
										fill={1 / 2}
										label="Content font size"
										marks={["Small", "Medium", "Large"]}
										valueText="Medium"
									/>
									<SliderField
										fill={12 / 16}
										label="Corner radius"
										valueText="12px"
									/>
									<SliderField
										fill={1 / 3}
										label="Shadow"
										marks={["None", "High"]}
										valueText="Low"
									/>
								</div>

								<div className="space-y-5 border-t border-product-border pt-4">
									<div className="relative space-y-5">
										<SpotMarker
											className="-right-2 left-auto top-[44px]"
											n={6}
										/>
										<SliderField
											fill={0}
											info
											label="Glass effect"
											marks={["Off", "Clear", "Semi", "Frosted"]}
											valueText="Off"
										/>

										<fieldset className="space-y-2">
											<legend className="mb-2 text-[13.5px] font-semibold leading-none text-product-foreground">
												Use glass on
											</legend>
											{/* All four stay ticked while the level is Off; the
											    whole group is simply dimmed. */}
											<div className="flex flex-wrap gap-2">
												{GLASS_PILLS.map((label) => (
													<GlassPill key={label} label={label} />
												))}
											</div>
										</fieldset>
									</div>

									<p className="flex gap-2 rounded-xl border border-product-border bg-product-background-hero px-3 py-2 text-[13px] leading-snug text-product-foreground-accent">
										<Info
											aria-hidden="true"
											className="mt-px h-4 w-4 shrink-0 text-product-primary-ink"
										/>
										Off keeps every surface solid.
									</p>

									<div>
										{/* Collapsed and switched off: no chevron turn, and no
										    Opacity, Frost or Splay sliders under it. */}
										<div className="flex min-h-11 w-full items-center gap-3 border-t border-product-border px-0.5 text-left text-[13.5px] font-semibold text-product-foreground opacity-50">
											Fine-tune
											<small className="ml-auto truncate text-[12.5px] font-medium text-product-muted">
												Opacity 100% &middot; Frost 0px &middot; Splay 0px
											</small>
											<ChevronDown
												aria-hidden="true"
												className="h-4 w-4 shrink-0 text-product-muted"
											/>
										</div>
									</div>
								</div>
							</div>
						</Card>

						<Card title="Overlay">
							{/* Switched off, so the icon box and its emoji hint are not
							    drawn. */}
							<SwitchField label="Enable overlay" />
						</Card>
					</div>
				</div>
			</div>
		</Screen>
	);
}
