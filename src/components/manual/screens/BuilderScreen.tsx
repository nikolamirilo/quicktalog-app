import {
	ArrowLeft,
	Eye,
	LayoutTemplate,
	type LucideIcon,
	Mail,
	MoreHorizontal,
	Pencil,
	Plus,
	QrCode,
	Rocket,
	Save,
	SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";

import { QuickAiMark } from "@/components/catalogue/chat/QuickAiMark";
import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	ItemPhoto,
	type ItemPhotoName,
} from "@/components/manual/screens/ItemPhoto";
import { cn } from "@/lib/ui/cn";

/**
 * The builder at 1280 x 900. There is no product navbar on this route: the only
 * chrome above the catalogue is the catalogue's own floating navbar. The 72px
 * rail is pinned to the right edge and the catalogue is padded out of its way,
 * so the page is centred on x 604 rather than on the middle of the stage.
 */

/** One rail tile: a 20px icon over an 11px label, 60px wide and 54px tall. */
function RailItem({
	children,
	icon: Icon,
	label,
	primary,
}: {
	children?: ReactNode;
	icon: LucideIcon;
	label: string;
	/** Publish, the one filled tile in the rail. */
	primary?: boolean;
}) {
	return (
		<div
			className={cn(
				"relative flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-2 text-center text-[11px] font-semibold leading-tight",
				primary
					? "mt-1 bg-product-primary text-product-foreground"
					: "text-product-foreground-accent",
			)}
		>
			{children}
			<Icon className="h-5 w-5" />
			<span>{label}</span>
		</div>
	);
}

/** The 40px hairline between groups of rail tiles. */
function RailDivider() {
	return <span className="my-1 h-px w-10 flex-none bg-product-border" />;
}

/**
 * An item card in the Side Image layout: a 4:3 picture down the left at 40% of
 * the card, text on the right. The card is catalogue-themed, so it keeps the
 * theme's 12px radius and plain black and white.
 */
function ItemCard({
	description,
	menu,
	name,
	photo,
	price,
}: {
	description: string;
	/** The card menu is hover-only, so it is drawn on one card, never on all. */
	menu?: boolean;
	name: string;
	photo: ItemPhotoName;
	price: string;
}) {
	return (
		<div className="relative flex min-h-[150px] overflow-hidden rounded-[12px] border border-[#e0e0e0] bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.1),0_1px_2px_-1px_rgb(0_0_0/0.1)]">
			{menu ? (
				<span className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-product-border bg-product-card font-product-body text-product-foreground-accent shadow-product">
					<MoreHorizontal className="h-4 w-4" strokeWidth={3} />
				</span>
			) : null}
			<ItemPhoto
				className="aspect-[4/3] w-[40%] min-w-[120px] flex-shrink-0"
				name={photo}
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
				<p className="truncate pr-11 text-[20px] font-normal leading-tight text-black">
					{name}
				</p>
				<p className="text-[16px] leading-snug text-[#333333]">{description}</p>
				<p className="mt-auto pt-1 text-[20px] font-semibold text-black">
					{price}
				</p>
			</div>
		</div>
	);
}

/** The builder: the catalogue in edit mode, the tool rail on the right. */
export function BuilderScreen() {
	return (
		<Screen
			caption="The builder shows the catalogue itself in edit mode, with the 72px tool rail pinned to the right edge and the amber Quick AI pill floating in the bottom left corner."
			height={930}
			legend={[
				"Editor opens the 440px editing panel beside the catalogue",
				"The heading is edited in place, and every dashed outline marks an editable area",
				"Click the section name to rename it. The round button holds layout, move and delete",
				"Publish is the only filled tile. Save, Templates, Preview and QR code sit above it",
				"Adds another item to this section. These cards use the Side Image layout",
				"Quick AI takes any change in words and edits the draft you are looking at",
			]}
			title="quicktalog.app/admin/brightside-cafe-menu/builder"
			width={1280}
		>
			<div className="absolute inset-0 overflow-hidden bg-[#f3f3f3]">
				{/* The catalogue keeps 72px clear on the right for the rail. */}
				<div className="absolute inset-y-0 left-0 right-[72px]">
					{/* The catalogue's own floating navbar, 9px down from the top. */}
					<div className="px-3 pt-[9px]">
						<div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 rounded-full border border-black/10 bg-white pl-[18px] pr-2.5 shadow-[0_1px_2px_rgba(22,20,15,0.04)]">
							{/* Until you buy a plan the navbar carries our wordmark. */}
							<span className="flex w-[160px] items-center gap-2">
								<span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-product-primary font-product-heading text-[15px] font-extrabold text-product-foreground">
									Q
								</span>
								<span className="font-product-heading text-[20px] font-extrabold tracking-[-0.02em] text-black">
									Quicktalog
								</span>
							</span>
							<span className="flex items-center gap-2">
								<span className="grid h-10 w-10 place-items-center rounded-full border border-black/[0.14] text-black">
									<Mail className="h-[18px] w-[18px]" />
								</span>
								<span className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.14] bg-white px-4 text-[14px] font-semibold leading-none text-black">
									<Plus className="h-4 w-4" />
									Create Your Catalog
								</span>
							</span>
						</div>
					</div>

					{/* The heading, always a dashed box in edit mode. */}
					<div className="w-full px-4 pt-16 text-center">
						<div className="mb-4 w-full">
							<div className="relative mx-auto grid w-fit min-w-[30%] max-w-[60%] rounded-product-card border-2 border-dashed border-product-border-strong px-6 py-2 text-center text-[48px] font-normal leading-none text-black">
								<SpotMarker n={2} />
								Brightside Cafe
							</div>
						</div>
					</div>

					<div className="mx-auto w-full max-w-7xl px-8">
						<div className="mx-auto max-w-6xl px-4">
							<div className="mb-5">
								{/* Section header. No chevron and no shadow in edit mode. */}
								<div className="relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-[12px] border border-[#e0e0e0] bg-[linear-gradient(135deg,#ffffff_0%,#f3f3f3_100%)] py-3 pl-3 pr-14 text-[30px] font-semibold leading-9 text-[#1a1a1a]">
									<span className="inline-flex min-w-0 items-center gap-2 border-b-2 border-dashed border-black/80">
										<span className="truncate">Breakfast</span>
										<Pencil className="h-[15px] w-[15px] flex-none opacity-60" />
									</span>
									{/* A section menu is always on show; a card menu is not. */}
									<span className="absolute right-2.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-product-border bg-product-card font-product-body text-product-foreground-accent shadow-product">
										<SpotMarker n={3} />
										<MoreHorizontal
											className="h-[18px] w-[18px]"
											strokeWidth={3}
										/>
									</span>
								</div>

								<div className="mb-2 mt-4">
									<div className="my-1 grid grid-cols-2 gap-3 px-1">
										<ItemCard
											description="Thick cut sourdough, salted butter and a spoon of seasonal jam."
											menu
											name="Sourdough toast"
											photo="toast"
											price="4.50 €"
										/>
										<ItemCard
											description="Two eggs baked in tomato with feta, chilli oil and warm bread."
											name="Baked eggs"
											photo="eggs"
											price="7 €"
										/>
										<ItemCard
											description="House granola, thick yoghurt, berries and local honey."
											name="Granola bowl"
											photo="granola"
											price="5.50 €"
										/>
										{/* Builder chrome inside the catalogue: product type and radius. */}
										<div className="relative flex min-h-[150px] w-full flex-col items-center justify-center gap-3 rounded-product-card border-2 border-dashed border-product-border-strong p-4 font-product-body">
											<SpotMarker n={5} />
											<span className="flex h-11 w-11 items-center justify-center rounded-full border border-product-border bg-product-card text-product-foreground shadow-product">
												<Plus className="h-5 w-5" />
											</span>
											<span className="rounded-full bg-product-card px-3 py-1.5 text-sm font-semibold leading-none text-product-foreground-accent">
												Add New Item
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* The Add Section tile takes the catalogue's own colours. */}
						<div className="mx-auto max-w-6xl px-4">
							<div className="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-[#1a1a1a]/30 bg-white/60 px-4 py-10 text-center">
								<span className="grid h-12 w-12 place-items-center rounded-full bg-black text-white">
									<Plus className="h-6 w-6" strokeWidth={2.5} />
								</span>
								<span className="flex flex-col items-center gap-1">
									<span className="text-[18px] font-bold leading-[1.2] text-black">
										Add Section
									</span>
									<span className="text-[14px] leading-[1.4] text-[#1a1a1a]/70">
										Items, text, a divider, an embed or a custom visual
									</span>
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* The rail: 72px wide, its hairline on the left edge. */}
				<div className="absolute inset-y-0 right-0 flex w-[72px] flex-col items-center gap-1 border-l border-product-border bg-product-card px-1.5 py-3 font-product-body">
					<RailItem icon={SlidersHorizontal} label="Editor">
						<SpotMarker className="-left-1 -top-1" n={1} />
					</RailItem>
					<RailDivider />
					<RailItem icon={Save} label="Save" />
					<RailItem icon={LayoutTemplate} label="Templates" />
					<RailItem icon={Eye} label="Preview" />
					<RailItem icon={QrCode} label="QR code" />
					<RailItem icon={Rocket} label="Publish" primary>
						<SpotMarker className="-left-1 -top-1" n={4} />
					</RailItem>
					<span className="flex-1" />
					<RailDivider />
					<RailItem icon={ArrowLeft} label="Dashboard" />
				</div>

				{/* Quick AI floats over the bottom left corner of the Add Section tile. */}
				<div className="absolute bottom-6 left-6">
					<span className="relative inline-flex h-11 items-center gap-2 rounded-full bg-product-primary px-[22px] font-product-body text-[15px] font-semibold leading-none text-product-foreground shadow-product-primary">
						<SpotMarker n={6} />
						<QuickAiMark className="size-[1.1em]" />
						Quick AI
					</span>
				</div>
			</div>
		</Screen>
	);
}
