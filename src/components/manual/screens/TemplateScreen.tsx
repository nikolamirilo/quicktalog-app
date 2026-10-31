import { Plus, X } from "lucide-react";
import type { ReactNode } from "react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * The Choose a Template dialog, drawn at its real size: a 1024px wide modal with
 * no window chrome around it, because it opens over a builder it hides.
 *
 * The two monitor pictures are traced from the real PNGs in
 * /public/images/templates, pixel for pixel, so they keep the artwork's own
 * palette (near black, white, grey, amber and periwinkle) rather than the
 * product tokens. Everything around them is product chrome and uses the tokens.
 */

const ART_DARK = "#090814";
const ART_AMBER = "#FFC107";
const ART_INDIGO = "#6C63FF";
const ART_GREY = "#E6E6E6";
const ART_FAINT = "#F2F2F2";
const ART_LILAC = "#D6D6E3";
const ART_CARD_LINE = "#DBDBE7";
const ART_PILL_LINE = "#FFEFC1";
const ART_BASE = "#282731";

/** One of the two plain product cards on the Quick Start picture. */
function QuickArtCard({ x }: { x: number }) {
	return (
		<>
			<rect
				fill="#FFFFFF"
				height="55"
				rx="2.5"
				stroke={ART_CARD_LINE}
				width="38"
				x={x}
				y="36.5"
			/>
			<rect
				fill={ART_LILAC}
				height="2.5"
				rx="1.25"
				width="14"
				x={x + 3.5}
				y="40.5"
			/>
			<rect fill={ART_GREY} height="2" rx="1" width="25" x={x + 3.5} y="44.5" />
			<rect fill={ART_GREY} height="2" rx="1" width="25" x={x + 3.5} y="47.6" />
			<text
				fill={ART_DARK}
				fontFamily="inherit"
				fontSize="11"
				fontWeight="700"
				x={x + 3.2}
				y="60.5"
			>
				$
			</text>
			<rect
				fill={ART_DARK}
				height="2.8"
				rx="0.4"
				width="6"
				x={x + 9}
				y="55.4"
			/>
			<rect fill={ART_GREY} height="2" rx="1" width="26" x={x + 8.5} y="65" />
			<rect fill={ART_GREY} height="2" rx="1" width="26" x={x + 8.5} y="70.9" />
			<rect fill={ART_GREY} height="2" rx="1" width="24" x={x + 8.5} y="76.7" />
			<rect
				fill="none"
				height="6"
				rx="3"
				stroke={ART_PILL_LINE}
				width="31"
				x={x + 3}
				y="82.5"
			/>
		</>
	);
}

/** Quick Start: a monitor showing three cards with the middle one picked. */
function QuickTemplateArt() {
	return (
		<svg
			aria-hidden="true"
			height="150"
			viewBox="0 0 195 150"
			width="195"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Quick Start template preview</title>

			{/* Stand first, so the screen frame crops the notch out of its top. */}
			<rect fill={ART_LILAC} height="32" width="49" x="72.5" y="112.5" />
			<circle cx="97" cy="112.5" fill="#FFFFFF" r="5" />
			<rect fill={ART_BASE} height="2.3" width="49" x="72.5" y="144.5" />
			<rect
				fill={ART_LILAC}
				height="2.4"
				rx="1"
				width="49"
				x="72.5"
				y="146.8"
			/>

			<rect fill={ART_DARK} height="113" rx="2" width="195" x="0" y="0" />
			<rect fill="#FFFFFF" height="104" width="186" x="4.5" y="4.5" />

			{/* The catalogue page inside the screen. */}
			<rect
				fill={ART_AMBER}
				height="5.5"
				rx="2.75"
				width="9.5"
				x="36.5"
				y="7.5"
			/>
			<rect
				fill={ART_GREY}
				height="5.5"
				rx="2.75"
				width="10.5"
				x="124.5"
				y="7.5"
			/>
			<rect
				fill={ART_GREY}
				height="5.5"
				rx="2.75"
				width="10.5"
				x="136"
				y="7.5"
			/>
			<rect
				fill={ART_GREY}
				height="5.5"
				rx="2.75"
				width="10.5"
				x="147.5"
				y="7.5"
			/>
			<rect
				fill={ART_FAINT}
				height="5.5"
				rx="2.75"
				width="52"
				x="36.5"
				y="20.5"
			/>
			<rect
				fill={ART_FAINT}
				height="3.5"
				rx="1.75"
				width="25"
				x="36.5"
				y="26.8"
			/>

			<QuickArtCard x={36.5} />
			<QuickArtCard x={120.5} />

			{/* The middle card, ringed in periwinkle and carrying the amber bits. */}
			<rect
				fill="#FFFFFF"
				height="54"
				rx="3.5"
				stroke={ART_INDIGO}
				strokeWidth="2.5"
				width="38"
				x="78.75"
				y="37.25"
			/>
			<rect fill={ART_AMBER} height="3" rx="1.5" width="13" x="81.5" y="40.3" />
			<rect
				fill={ART_AMBER}
				height="3.6"
				rx="1.8"
				width="10"
				x="102.8"
				y="39.6"
			/>
			<rect fill={ART_GREY} height="2.2" rx="1.1" width="26" x="81" y="44" />
			<rect fill={ART_GREY} height="2.2" rx="1.1" width="26" x="81" y="47.5" />
			<text
				fill={ART_DARK}
				fontFamily="inherit"
				fontSize="11"
				fontWeight="700"
				x="80.7"
				y="60.5"
			>
				$
			</text>
			<rect fill={ART_DARK} height="2.8" rx="0.4" width="6" x="86.5" y="55.4" />
			<rect fill={ART_GREY} height="2" rx="1" width="27" x="86" y="65" />
			<rect fill={ART_GREY} height="2" rx="1" width="27" x="86" y="70.9" />
			<rect fill={ART_GREY} height="2" rx="1" width="25" x="86" y="76.7" />
			<rect fill={ART_AMBER} height="6" rx="3" width="31.5" x="81.5" y="82.5" />
		</svg>
	);
}

/** One pale tile on the Standard Catalog picture. */
function ArtTile({ x, y }: { x: number; y: number }) {
	return (
		<rect fill={ART_GREY} height="30.6" rx="0.5" width="28.8" x={x} y={y} />
	);
}

/** Standard Catalog: a monitor showing a six tile grid under an amber bar. */
function StandardTemplateArt() {
	return (
		<svg
			aria-hidden="true"
			height="158"
			viewBox="0 0 200 158"
			width="200"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Standard Catalog template preview</title>

			<rect fill={ART_LILAC} height="33.5" width="50" x="74.5" y="118.5" />
			<circle cx="99.5" cy="118.5" fill="#FFFFFF" r="5" />
			<rect fill={ART_BASE} height="2.3" width="50" x="74.5" y="152" />
			<rect
				fill={ART_LILAC}
				height="2.4"
				rx="1"
				width="50"
				x="74.5"
				y="154.3"
			/>

			<rect fill={ART_DARK} height="119" rx="2" width="200" x="0" y="0" />
			<rect fill="#FFFFFF" height="109.5" width="190" x="4.5" y="4.5" />

			{/* Amber top bar with its three window dots. */}
			<rect
				fill={ART_AMBER}
				height="6.5"
				rx="1"
				width="153.5"
				x="22.5"
				y="10.5"
			/>
			<circle cx="27" cy="13.8" fill="#FFFFFF" r="1.5" />
			<circle cx="31.8" cy="13.8" fill="#FFFFFF" r="1.5" />
			<circle cx="36.4" cy="13.8" fill="#FFFFFF" r="1.5" />

			{/* Grey frame with the white grid inside it. */}
			<rect
				fill={ART_GREY}
				height="91.5"
				rx="1.5"
				width="154"
				x="22.5"
				y="17.5"
			/>
			<rect fill="#FFFFFF" height="80.5" width="145.5" x="26.5" y="22.5" />

			<ArtTile x={44.5} y={28.7} />
			<ArtTile x={84.9} y={28.7} />
			<ArtTile x={125.3} y={28.7} />
			<ArtTile x={44.5} y={65.3} />
			<ArtTile x={84.9} y={65.3} />
			<ArtTile x={125.3} y={65.3} />

			{/* Six clothing silhouettes. Two of them are amber, the rest cut out. */}
			<path
				d="M54 33 L64.5 34.5 L65.5 56 L61.5 56 L59.5 44 L57 56 L53 56 Z"
				fill="#FFFFFF"
			/>
			<path
				d="M95 34 L96.5 38 L102 38 L103.5 34 L105 35.5 L103.5 41 L107 56 L92 56 L95.5 41 L94 35.5 Z"
				fill={ART_AMBER}
			/>
			<path
				d="M133.5 33 L145.5 33 L144 56 L140.5 56 L139.5 42 L138 56 L134.5 56 Z"
				fill="#FFFFFF"
			/>
			<path
				d="M55 70.5 L63 70.5 L67 73.5 L65.5 78 L63.5 77 L63.5 91.5 L54.5 91.5 L54.5 77 L52.5 78 L51 73.5 Z"
				fill="#FFFFFF"
			/>
			<path
				d="M90.5 70.5 L95.5 70.5 L95 85 L98.5 86 L97.5 90.5 L90.5 89 Z"
				fill="#FFFFFF"
			/>
			<path
				d="M99 70.5 L104 70.5 L103.5 85 L107 86 L106 90.5 L99 89 Z"
				fill="#FFFFFF"
			/>
			<path
				d="M134 72 L143 72 L148 75.5 L146 80.5 L144 79.5 L144 88 L133 88 L133 79.5 L131 80.5 L129 75.5 Z"
				fill={ART_AMBER}
			/>
		</svg>
	);
}

/** One template card. All three are the same height because the grid stretches. */
function TemplateCard({
	children,
	description,
	details,
	recommended,
	scratch,
	selected,
	spot,
	title,
	titleSpot,
}: {
	/** The picture in the middle of the card. */
	children: ReactNode;
	description: ReactNode;
	details: string[];
	recommended?: boolean;
	/** Start from Scratch: dashed edge, and its name under the picture. */
	scratch?: boolean;
	selected?: boolean;
	/** Marks the whole card. */
	spot?: number;
	title: string;
	/** Marks the name above the picture instead of the whole card. */
	titleSpot?: number;
}) {
	return (
		<div
			className={cn(
				"relative flex h-full flex-col items-center justify-between gap-4 rounded-product-card border-[1.5px] bg-product-card p-6 text-center",
				selected
					? "border-product-primary-accent shadow-[0_0_0_3px_rgb(var(--product-primary-rgb)/0.25)]"
					: "border-product-border",
				scratch && !selected && "border-dashed border-product-border-strong",
			)}
		>
			{spot ? <SpotMarker n={spot} /> : null}

			{recommended ? (
				<span className="absolute right-3 top-3 z-20 inline-flex h-6 items-center whitespace-nowrap rounded-full bg-product-primary px-2.5 text-[11.5px] font-bold text-product-foreground">
					Recommended
				</span>
			) : null}

			{scratch ? (
				<span className="block pt-4" />
			) : (
				<span className="relative mx-auto block w-fit pt-4 font-product-heading text-lg font-bold text-product-foreground">
					{titleSpot ? (
						<SpotMarker className="-right-2.5 -top-1 left-auto" n={titleSpot} />
					) : null}
					{title}
				</span>
			)}

			<span className="flex w-10/12 flex-grow items-center justify-center">
				{children}
			</span>

			<span className="flex flex-none flex-col gap-3 py-1">
				{scratch ? (
					<span className="font-product-heading text-lg font-bold text-product-foreground">
						{title}
					</span>
				) : null}
				<span className="text-sm font-medium leading-relaxed text-product-foreground-accent">
					{description}
				</span>
				<span className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-product-muted">
					{details.map((detail, index) => (
						<span className="flex items-center gap-2" key={detail}>
							{index > 0 ? (
								<span className="h-1 w-1 rounded-full bg-product-border-strong" />
							) : null}
							{detail}
						</span>
					))}
				</span>
			</span>
		</div>
	);
}

/** The Choose a Template dialog, which opens by itself on an empty catalogue. */
export function TemplateScreen() {
	return (
		<Screen
			caption="The Choose a Template dialog, which opens by itself the first time a catalogue has no content. It fills the screen on its own, with the builder hidden behind it."
			height={584}
			legend={[
				"The title and the line under it, both lined up 24px in from the left edge.",
				"The only way to close the dialog. It sits a little higher than the title.",
				"Quick Start is already chosen for you: an amber edge and a soft amber glow. There is no tick and no radio dot.",
				"On a wide screen the first two cards put their name above the picture, not under it.",
				"Start from Scratch has a dashed edge, no name at the top, and names itself under the plus.",
				"The amber button, 56px tall, on the right. No bar and no line above it.",
			]}
			width={1024}
		>
			<div className="absolute inset-0 flex flex-col rounded-product-panel border border-product-border bg-product-card">
				{/* Header: text on the left, close button pulled up and out. */}
				<div className="flex flex-none items-start justify-between gap-3 px-6 pb-4 pt-6">
					<div className="relative min-w-0 w-fit space-y-1 text-left">
						<SpotMarker className="-right-2.5 -top-2 left-auto" n={1} />
						<p className="font-product-heading text-2xl font-bold leading-tight tracking-[-0.02em] text-product-foreground">
							Choose a Template
						</p>
						<p className="text-[15px] leading-relaxed text-product-foreground-accent">
							Start with a pre-made layout or build from scratch
						</p>
					</div>
					<span className="relative -mr-2 -mt-1 grid h-10 w-10 flex-none place-items-center rounded-full border-[1.5px] border-transparent text-product-foreground-accent">
						<SpotMarker n={2} />
						<X aria-hidden="true" className="h-5 w-5" />
					</span>
				</div>

				{/* Body: the three cards, then the button. No footer bar at this width. */}
				<div className="min-h-0 flex-1 pb-6 pt-1">
					<div className="flex w-full flex-col gap-6 px-6 font-product-body">
						<div className="grid w-full grid-cols-3 gap-3">
							<TemplateCard
								description={
									<>
										Everything you need to start selling
										<br />
										right away
									</>
								}
								details={["2 categories", "6 items"]}
								recommended
								selected
								spot={3}
								title="Quick Start"
							>
								<QuickTemplateArt />
							</TemplateCard>

							<TemplateCard
								description={
									<>
										A flexible layout that works for
										<br />
										everyone
									</>
								}
								details={["4 categories", "15 items"]}
								title="Standard Catalog"
								titleSpot={4}
							>
								<StandardTemplateArt />
							</TemplateCard>

							<TemplateCard
								description={
									<>
										Build your catalog exactly the way you
										<br />
										want it
									</>
								}
								details={["Blank Catalogue"]}
								scratch
								spot={5}
								title="Start from Scratch"
							>
								<Plus
									aria-hidden="true"
									className="h-16 w-16 text-product-muted"
									strokeWidth={2}
								/>
							</TemplateCard>
						</div>

						<div className="flex justify-end">
							<span className="relative">
								<SpotMarker n={6} />
								<Btn className="h-14 px-8 text-[17px]">Select template</Btn>
							</span>
						</div>
					</div>
				</div>
			</div>
		</Screen>
	);
}
