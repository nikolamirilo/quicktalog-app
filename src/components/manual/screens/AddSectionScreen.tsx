import {
	ChevronsUpDown,
	Globe,
	Heading,
	LayoutGrid,
	type LucideIcon,
	SeparatorHorizontal,
	Sparkles,
	Type,
	X,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * The Add section dialog as it really opens on a desktop screen: an 880x600
 * alert dialog with a beige 224px type rail on the left and the Items form on
 * the white right pane. The builder behind it is deliberately left out.
 */

const cardArt = "fill-product-card stroke-product-border-strong";
const imageArt = "fill-product-primary/70";
const lineArt = "fill-product-muted/60";

/** The drawn thumbnails the layout tiles show, copied from the real picker. */
const GLYPHS = {
	sideImage: (
		<>
			<rect className={cardArt} height="14" rx="2.5" width="42" x="3" y="3" />
			<rect className={imageArt} height="10" rx="1.5" width="10" x="5" y="5" />
			<rect className={lineArt} height="2.5" rx="1" width="18" x="18" y="6.5" />
			<rect className={lineArt} height="2" rx="1" width="24" x="18" y="11" />
			<rect className={cardArt} height="14" rx="2.5" width="42" x="3" y="20" />
			<rect className={imageArt} height="10" rx="1.5" width="10" x="5" y="22" />
			<rect
				className={lineArt}
				height="2.5"
				rx="1"
				width="18"
				x="18"
				y="23.5"
			/>
			<rect className={lineArt} height="2" rx="1" width="24" x="18" y="28" />
		</>
	),
	topImage: (
		<>
			<rect className={cardArt} height="30" rx="2.5" width="20" x="3" y="3" />
			<rect className={imageArt} height="13" rx="1.5" width="16" x="5" y="5" />
			<rect className={lineArt} height="2.5" rx="1" width="12" x="5" y="21" />
			<rect className={lineArt} height="2" rx="1" width="16" x="5" y="26" />
			<rect className={cardArt} height="30" rx="2.5" width="20" x="25" y="3" />
			<rect className={imageArt} height="13" rx="1.5" width="16" x="27" y="5" />
			<rect className={lineArt} height="2.5" rx="1" width="12" x="27" y="21" />
			<rect className={lineArt} height="2" rx="1" width="16" x="27" y="26" />
		</>
	),
	textOnly: (
		<>
			<rect className={cardArt} height="14" rx="2.5" width="42" x="3" y="3" />
			<rect className={lineArt} height="2.5" rx="1" width="20" x="6" y="6.5" />
			<rect className={lineArt} height="2" rx="1" width="28" x="6" y="11" />
			<rect className={imageArt} height="2.5" rx="1" width="6" x="36" y="6.5" />
			<rect className={cardArt} height="14" rx="2.5" width="42" x="3" y="20" />
			<rect className={lineArt} height="2.5" rx="1" width="20" x="6" y="23.5" />
			<rect className={lineArt} height="2" rx="1" width="28" x="6" y="28" />
			<rect
				className={imageArt}
				height="2.5"
				rx="1"
				width="6"
				x="36"
				y="23.5"
			/>
		</>
	),
	carousel: (
		<>
			<rect className={cardArt} height="22" rx="2.5" width="10" x="-4" y="5" />
			<rect className={cardArt} height="22" rx="2.5" width="10" x="42" y="5" />
			<rect className={cardArt} height="26" rx="2.5" width="28" x="10" y="3" />
			<rect className={imageArt} height="12" rx="1.5" width="24" x="12" y="5" />
			<rect className={lineArt} height="2.5" rx="1" width="14" x="12" y="20" />
			<rect className={lineArt} height="2" rx="1" width="20" x="12" y="24.5" />
			<circle className="fill-product-primary" cx="20" cy="33" r="1.5" />
			<circle className={lineArt} cx="24" cy="33" r="1.5" />
			<circle className={lineArt} cx="28" cy="33" r="1.5" />
		</>
	),
} as const;

/** One layout tile: thumbnail plate, label, and the check badge when picked. */
function LayoutTile({
	glyph,
	label,
	selected,
}: {
	glyph: keyof typeof GLYPHS;
	label: string;
	selected?: boolean;
}) {
	return (
		<div
			className={cn(
				"relative flex min-w-0 flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-product-border bg-product-card px-1.5 pb-2.5 pt-2 text-[12.5px] font-semibold leading-tight text-product-foreground-accent",
				selected &&
					"border-product-primary-accent text-product-foreground shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)]",
			)}
		>
			<span
				className={cn(
					"grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[10px] bg-product-background-hero",
					selected && "bg-product-primary-soft",
				)}
			>
				<svg
					aria-hidden="true"
					className="h-auto w-[78%] max-w-[88px] overflow-visible"
					viewBox="0 0 48 36"
				>
					<g strokeWidth="0.75">{GLYPHS[glyph]}</g>
				</svg>
			</span>
			<span className="text-center">{label}</span>
			{selected ? (
				<span className="absolute -right-[7px] -top-[7px] grid h-5 w-5 place-items-center rounded-full bg-product-primary shadow-[0_0_0_2px_var(--product-card)]">
					<svg
						aria-hidden="true"
						className="h-3 w-3"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={3.4}
						viewBox="0 0 24 24"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</span>
			) : null}
		</div>
	);
}

/** One on/off option card: amber icon tile, title, hint and a 44px switch. */
function OptionCard({
	icon: Icon,
	title,
	hint,
}: {
	icon: LucideIcon;
	title: string;
	hint: string;
}) {
	return (
		<div className="flex min-h-14 items-center gap-3 rounded-[14px] border-[1.5px] border-product-border bg-product-card px-3 py-2.5">
			<span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] border border-product-primary/40 bg-product-primary-soft text-product-primary-ink">
				<Icon className="h-4 w-4" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-semibold leading-[18px] text-product-foreground">
					{title}
				</span>
				<span className="mt-0.5 block text-[12.5px] leading-4 text-product-muted">
					{hint}
				</span>
			</span>
			<span className="flex h-[26px] w-11 flex-none items-center justify-end rounded-full border-[3px] border-transparent bg-product-primary-accent">
				<span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(22,20,15,0.25)]" />
			</span>
		</div>
	);
}

const TYPES: { icon: LucideIcon; label: string }[] = [
	{ icon: LayoutGrid, label: "Items" },
	{ icon: Type, label: "Text" },
	{ icon: SeparatorHorizontal, label: "Divider" },
	{ icon: Globe, label: "External content" },
	{ icon: Sparkles, label: "Custom visual" },
];

/** The Add section dialog, open on Items with nothing typed yet. */
export function AddSectionScreen() {
	return (
		<Screen
			caption="The Add section dialog as it opens. The kinds of section run down the beige rail on the left, with Items already picked, and the settings for an items section fill the white pane on the right."
			height={640}
			legend={[
				"The dialog title. It reads Edit section when you reopen a section you already added.",
				"Pick what the section holds. Items is picked for you when the dialog opens.",
				"The kind you picked is named here, with one line saying what it does.",
				"The only thing you must fill in. It is the heading your customers read above the items.",
				"Whether the title bar is drawn, and whether the section starts open.",
				"How the items are arranged. Side Image is the one you start with.",
			]}
			width={920}
		>
			<div className="absolute left-5 top-5 flex h-[600px] w-[880px] overflow-hidden rounded-product-panel border border-product-border bg-product-card shadow-product-hover">
				{/* The section type rail: beige from md, 224px wide, no close button. */}
				<div className="flex w-56 flex-none flex-col border-r border-product-border bg-product-background-hero px-3.5 pb-4 pt-5">
					<div className="relative px-1.5">
						<SpotMarker className="-right-2 left-auto" n={1} />
						<p className="font-product-heading text-lg font-bold leading-tight tracking-[-0.02em] text-product-foreground">
							Add section
						</p>
					</div>

					<div className="mt-4 flex flex-col gap-1">
						{TYPES.map(({ icon: Icon, label }) => {
							const selected = label === "Items";
							return (
								<div
									className={cn(
										"relative flex h-10 items-center gap-[7px] rounded-[12px] border-[1.5px] border-transparent px-3 text-sm font-semibold text-product-foreground-accent",
										selected &&
											"border-product-primary-accent bg-product-primary-soft font-bold text-product-foreground",
									)}
									key={label}
								>
									{selected ? <SpotMarker n={2} /> : null}
									<Icon
										className={cn(
											"h-4 w-4 flex-none",
											selected && "text-product-primary-ink",
										)}
									/>
									<span className="flex-1 text-left">{label}</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* The form pane: fixed header, the form, fixed footer. */}
				<div className="flex min-w-0 flex-1 flex-col">
					<div className="flex flex-none items-start justify-between gap-3 border-b border-product-border px-6 pb-4 pt-5">
						<div className="relative min-w-0">
							<SpotMarker className="-left-5 top-0" n={3} />
							<p className="font-product-heading text-base font-bold leading-tight text-product-foreground">
								Items
							</p>
							<p className="mt-1 text-[13px] leading-[18px] text-product-foreground-accent">
								A group of items. With a heading it can collapse; without one it
								is a plain grid.
							</p>
						</div>
						<span className="-mr-2 -mt-1 grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent">
							<X className="h-5 w-5" />
						</span>
					</div>

					<div className="flex min-h-0 flex-1 flex-col gap-5 px-6 py-5">
						<div className="flex max-w-md flex-col gap-1.5">
							<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
								Heading
								<span className="ml-1 text-product-error">*</span>
							</p>
							<span className="relative flex h-10 items-center rounded-[12px] border-[1.5px] border-product-border-strong bg-product-card px-3 text-[15px] text-product-muted">
								<SpotMarker className="-left-2 top-[10px]" n={4} />
								e.g. Breakfast
							</span>
						</div>

						<div className="relative grid grid-cols-2 gap-3">
							<SpotMarker n={5} />
							<OptionCard
								hint="Title bar above the items"
								icon={Heading}
								title="Show heading"
							/>
							<OptionCard
								hint="Open when the page loads"
								icon={ChevronsUpDown}
								title="Auto-expand"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
								Layout
							</p>
							<div className="relative grid max-w-[560px] grid-cols-4 gap-2">
								<SpotMarker className="-left-2 top-1" n={6} />
								<LayoutTile glyph="sideImage" label="Side Image" selected />
								<LayoutTile glyph="topImage" label="Top Image" />
								<LayoutTile glyph="textOnly" label="Text Only" />
								<LayoutTile glyph="carousel" label="Carousel" />
							</div>
						</div>
					</div>

					<div className="flex flex-none justify-end gap-2 border-t border-product-border bg-product-card px-6 py-4">
						<Btn className="h-11 px-[22px] text-[15px]" variant="outline">
							Cancel
						</Btn>
						{/* Switched off until a heading is typed. */}
						<Btn className="h-11 px-[22px] text-[15px] opacity-50">
							Add section
						</Btn>
					</div>
				</div>
			</div>
		</Screen>
	);
}
