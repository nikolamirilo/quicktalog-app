import {
	ChartColumn,
	ChevronRight,
	Code,
	Copy,
	EllipsisVertical,
	LayoutGrid,
	type LucideIcon,
	Pencil,
	QrCode,
	RefreshCw,
	Share2,
	Trash2,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn, SectionTitle, StatusPill } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * One row of the actions menu: 40px tall, 12px corners, a 16px icon and a 14px
 * label. Rows butt against each other, with no gap and no highlight, because a
 * menu opened with the mouse has no row picked out.
 */
function MenuRow({
	icon: Icon,
	label,
	danger,
	submenu,
	spot,
}: {
	icon: LucideIcon;
	label: string;
	/** Delete is the only red row. */
	danger?: boolean;
	/** Change Status is the only row that opens a side list. */
	submenu?: boolean;
	spot?: number;
}) {
	return (
		<div
			className={cn(
				"relative flex min-h-10 items-center rounded-[12px] px-3 py-2 text-sm font-medium",
				// The row that opens the side list sits 2px tighter than the rest.
				submenu ? "gap-2" : "gap-2.5",
				danger ? "text-product-error" : "text-product-foreground-accent",
			)}
		>
			{spot ? <SpotMarker className="-left-2 top-[10px]" n={spot} /> : null}
			<Icon className="h-4 w-4 flex-none" />
			{label}
			{submenu ? <ChevronRight className="ml-auto h-4 w-4 flex-none" /> : null}
		</div>
	);
}

/** A dashboard catalogue card with its actions menu open over it. */
export function ActionsMenuScreen() {
	return (
		<Screen
			caption="One catalogue card on the dashboard Catalogues grid with its three dot actions menu open. The menu floats over the card's own dates and buttons and hangs well past the bottom of the card."
			height={560}
			legend={[
				"The catalogue's name. A name holds letters, digits and spaces only, so it is never the hyphenated web address.",
				"The three dot button, shaded while the menu is open. It sits close in to the card's top right corner.",
				"The status pill. Green with no outline means the catalogue is Active.",
				"The whole menu, floating over the card and hanging past its bottom edge. Nothing behind it is dimmed and the page does not move.",
				"The only row with an arrow. It opens a short side list of the statuses you can switch to.",
				"Delete is red, and the only row with a line above it.",
			]}
			width={540}
		>
			<div className="absolute inset-0 bg-product-background">
				{/* The grid's own heading, for context. Headings use the heading font. */}
				<div className="absolute left-[72px] top-[40px] font-product-heading">
					<SectionTitle icon={LayoutGrid}>Catalogues</SectionTitle>
				</div>

				{/* 396px: one column of the three column grid in a 1280px window. */}
				<div className="absolute left-[72px] top-[80px] flex w-[396px] flex-col gap-3 rounded-product-card border border-product-border bg-product-card p-[18px] shadow-product">
					<div className="flex items-start justify-between gap-2">
						<p className="relative min-w-0 break-words font-product-heading text-[17px] font-bold leading-snug tracking-[-0.015em] text-product-foreground">
							<SpotMarker className="-left-[22px] top-[3px]" n={1} />
							Brightside Cafe Menu
						</p>
						{/* Negative margins pull the 40px button out to 9px from the
						    card's right border and 11px from its top. */}
						<span className="relative -mr-2.5 -mt-2 grid h-10 w-10 flex-none place-items-center rounded-full bg-product-background-hero text-product-foreground-accent">
							<SpotMarker n={2} />
							<EllipsisVertical className="h-5 w-5" />
						</span>
					</div>

					<span className="relative flex w-fit">
						<SpotMarker className="-left-3 -top-2" n={3} />
						<StatusPill status="Active" />
					</span>

					<dl className="grid gap-0.5 text-[13px] text-product-muted">
						<div className="flex gap-1.5">
							<dt className="font-semibold text-product-foreground-accent">
								Updated:
							</dt>
							<dd>3/14/2026, 04:02 PM</dd>
						</div>
						<div className="flex gap-1.5">
							<dt className="font-semibold text-product-foreground-accent">
								Created:
							</dt>
							<dd>3/2/2026, 09:14 AM</dd>
						</div>
					</dl>

					<div className="mt-auto flex flex-wrap gap-2 pt-1 [&>*]:flex-[1_1_auto]">
						<Btn>View Catalogue</Btn>
						<Btn variant="outline">
							<ChartColumn />
							Analytics
						</Btn>
					</div>
				</div>

				{/* Drawn after the card and anchored to the button's right edge, so it
				    covers the card the way the real floating menu does. */}
				<div className="absolute left-[239px] top-[135px] w-[220px] rounded-[18px] border border-product-border bg-product-card p-1.5 shadow-product-hover">
					<SpotMarker n={4} />
					<MenuRow icon={Pencil} label="Edit" />
					<MenuRow icon={RefreshCw} label="Change Status" spot={5} submenu />
					<MenuRow icon={Share2} label="Share" />
					<MenuRow icon={QrCode} label="QR Editor" />
					<MenuRow icon={Code} label="Embed" />
					<MenuRow icon={Copy} label="Duplicate" />
					{/* The one separator, bleeding past the panel's padding. */}
					<span className="-mx-1.5 my-1.5 block h-px bg-product-border" />
					<MenuRow danger icon={Trash2} label="Delete" spot={6} />
				</div>
			</div>
		</Screen>
	);
}
