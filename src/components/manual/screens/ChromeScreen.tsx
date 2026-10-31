import {
	ArrowRight,
	Droplet,
	FileText,
	Home,
	Info,
	Layout,
	Palette,
	X,
} from "lucide-react";
import type { ReactNode } from "react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { cn } from "@/lib/ui/cn";

/**
 * The Header tab of the builder editor panel, drawn at the panel's real size:
 * a 440px column with a white header and tab strip over a sand-coloured body
 * of white cards, unrolled so nothing is cut off. The shared EditorPanel,
 * PanelSection, Toggle, Input and SliderRow are drawn at older, smaller sizes,
 * so the parts below are rebuilt here at the sizes the real panel uses.
 */

const tabs = [
	{ icon: Home, label: "General" },
	{ icon: Layout, label: "Header" },
	{ icon: FileText, label: "Footer" },
	{ icon: Palette, label: "Appearance" },
] as const;

/** The (i) popover trigger: a 28px round button holding a 16px glyph. */
function InfoDot() {
	return (
		<span className="grid h-7 w-7 flex-none place-items-center rounded-full text-product-muted">
			<Info className="h-4 w-4" />
		</span>
	);
}

/** The real switch: 44 x 26 track, 3px inset, 20px thumb. */
function SwitchPill({ on = false }: { on?: boolean }) {
	return (
		<span
			className={cn(
				"flex h-[26px] w-11 flex-none items-center rounded-full border-[3px] border-transparent",
				on
					? "justify-end bg-product-primary-accent"
					: "bg-product-border-strong",
			)}
		>
			<span className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(22,20,15,0.25)]" />
		</span>
	);
}

/** One white card in the panel body: 22px radius, 16px padding. */
function PanelCard({
	title,
	info,
	description,
	action,
	children,
}: {
	title: string;
	/** Draws the (i) beside the title. */
	info?: boolean;
	description?: string;
	/** The control at the end of the title row. */
	action?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<section className="space-y-4 rounded-product-card border border-product-border bg-product-card p-4">
			<div className="flex min-h-7 items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<div className="flex items-center gap-1">
						<p className="font-product-heading text-[15px] font-bold leading-snug text-product-foreground">
							{title}
						</p>
						{info ? <InfoDot /> : null}
					</div>
					{description ? (
						<p className="text-[13px] leading-snug text-product-muted">
							{description}
						</p>
					) : null}
				</div>
				{action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
			</div>
			{children}
		</section>
	);
}

/** A labelled on/off row, at least 44px tall. */
function SwitchRow({
	label,
	hint,
	info,
	on,
	className,
}: {
	label: string;
	hint?: string;
	info?: boolean;
	on?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex min-h-11 items-center justify-between gap-3",
				className,
			)}
		>
			<div className="min-w-0 space-y-1">
				<div className="flex items-center gap-1">
					<span className="text-[13.5px] font-semibold leading-snug text-product-foreground">
						{label}
					</span>
					{info ? <InfoDot /> : null}
				</div>
				{hint ? (
					<p className="text-[12.5px] leading-snug text-product-muted">
						{hint}
					</p>
				) : null}
			</div>
			<SwitchPill on={on} />
		</div>
	);
}

/**
 * Label, value and the slider in its 44px hit row: 6px track, 22px white thumb
 * with an amber ring. The thumb stays inside the track at both ends.
 */
function SliderRow({
	label,
	valueText,
	fill,
}: {
	label: string;
	valueText: string;
	/** Where the thumb sits, 0 to 100. */
	fill: number;
}) {
	return (
		<div className="space-y-1">
			<div className="flex items-baseline justify-between gap-3">
				<span className="flex items-center gap-1">
					<span className="text-[13.5px] font-semibold leading-none text-product-foreground">
						{label}
					</span>
					<InfoDot />
				</span>
				<span className="text-[13px] font-semibold capitalize tabular-nums text-product-foreground-accent">
					{valueText}
				</span>
			</div>
			<div className="flex h-11 w-full items-center">
				<div className="relative h-1.5 w-full rounded-full bg-product-border-strong">
					<span
						className="absolute inset-y-0 left-0 rounded-full bg-product-primary-accent"
						style={{ width: `${fill}%` }}
					/>
					<span
						className="absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full border-2 border-product-primary bg-white shadow-[0_2px_6px_rgba(22,20,15,0.18)]"
						style={{ left: `calc(${fill}% - ${(fill / 100) * 22}px)` }}
					/>
				</div>
			</div>
		</div>
	);
}

/** A text box: 44px tall, 14px radius, 1.5px border. */
function TextField({
	label,
	value,
	placeholder,
}: {
	label: string;
	value?: string;
	placeholder?: string;
}) {
	return (
		<div className="space-y-2">
			<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
				{label}
			</p>
			<span
				className={cn(
					"flex h-11 w-full items-center rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card px-4 text-[15px]",
					value ? "text-product-foreground" : "text-product-muted",
				)}
			>
				{value ?? placeholder}
			</span>
		</div>
	);
}

/** The link out of one card into the setting that unblocks it. */
function Shortcut({ label }: { label: string }) {
	return (
		<span className="inline-flex items-center gap-1.5 border-b-[1.5px] border-product-primary/70 pb-px text-[13px] font-semibold text-product-primary-ink">
			{label}
			<ArrowRight className="h-3.5 w-3.5" />
		</span>
	);
}

/** The Header tab, where your own navbar is switched on and set up. */
export function ChromeScreen() {
	return (
		<Screen
			caption="The Header tab of the 440px builder editor panel, drawn with the Customize header switch on, so all five cards are live."
			height={1320}
			legend={[
				"Four icon-over-label tabs; the active one is an amber tint with an amber border, not a solid fill.",
				"The master switch. Off, the header stays default and the three cards below dim to half strength.",
				"A grey-beige note points to Appearance › Glass effect, with a shortcut that jumps there.",
				"Logo size and corner rounding, both inert until a logo has been uploaded.",
				"Switching the header action link on reveals these two fields; switching it off removes them entirely.",
				"Phone and email icons in the header, each a labelled row with a hint and a switch.",
			]}
			width={440}
		>
			<div className="absolute inset-0 flex flex-col border-l border-product-border bg-product-background font-product-body text-product-foreground">
				{/* The header carries no bottom border: it runs into the tab strip. */}
				<div className="flex shrink-0 items-center gap-2 bg-product-card px-4 py-3">
					<div className="min-w-0 flex-1">
						<p className="truncate font-product-heading text-base font-bold leading-tight text-product-foreground">
							Edit catalogue
						</p>
						<p className="truncate text-xs leading-snug text-product-muted">
							Name, header, footer and appearance
						</p>
					</div>
					<span className="grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent">
						<X className="h-[17.6px] w-[17.6px]" />
					</span>
				</div>

				<div className="shrink-0 border-b border-product-border bg-product-card px-4 py-3">
					<div className="relative">
						<SpotMarker n={1} />
						<div className="grid grid-cols-4 gap-1 rounded-2xl border border-product-border bg-product-background-hero p-1">
							{tabs.map(({ icon: Icon, label }) => (
								<span
									className={cn(
										"flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-1 py-2 text-xs font-semibold",
										label === "Header"
											? "border-product-primary bg-product-primary-soft text-product-foreground"
											: "border-transparent text-product-foreground-accent",
									)}
									key={label}
								>
									<Icon className="h-4 w-4" />
									<span className="max-w-full truncate">{label}</span>
								</span>
							))}
						</div>
					</div>
				</div>

				<div className="min-h-0 flex-1 overflow-hidden p-4">
					<div className="space-y-4">
						<PanelCard
							action={
								<span className="relative block">
									<SpotMarker n={2} />
									<SwitchPill on />
								</span>
							}
							description="Your settings below are used for the header."
							title="Customize header"
						/>

						<PanelCard
							description="The header floats above the catalogue and stays at the top while visitors scroll."
							title="Floating navbar"
						>
							<div className="relative">
								<SpotMarker className="-right-2 -top-2 left-auto" n={3} />
								<div className="space-y-4">
									<p className="flex gap-2 rounded-xl border border-product-border bg-product-background-hero px-3 py-2 text-[13px] leading-snug text-product-foreground-accent">
										<Droplet className="mt-px h-4 w-4 shrink-0 text-product-primary-ink" />
										<span>
											How see-through it is comes from{" "}
											<b className="font-semibold text-product-foreground">
												Appearance › Glass effect
											</b>
											. On phones the icons and button move into a menu.
										</span>
									</p>
									<div>
										<Shortcut label="Open glass settings" />
									</div>
								</div>
							</div>
						</PanelCard>

						{/* In the product, Logo, Interaction and Icons sit in one wrapper
						    and dim together when the master switch above is off. */}
						<PanelCard info title="Logo">
							<div className="relative">
								<SpotMarker className="-bottom-2 -left-2 top-auto" n={4} />
								<div className="space-y-4">
									<SliderRow fill={100} label="Logo size" valueText="100%" />
									<SliderRow
										fill={0}
										label="Corner rounding"
										valueText="Square"
									/>
								</div>
							</div>
						</PanelCard>

						<PanelCard info title="Interaction">
							<SwitchRow info label="Header action link" on />
							<div className="relative">
								<SpotMarker className="-bottom-2 -left-2 top-auto" n={5} />
								<div className="space-y-4 border-t border-product-border pt-4">
									<TextField label="Button label" value="Book a table" />
									<TextField
										label="Button link"
										value="https://brightsidecafe.co/book"
									/>
								</div>
							</div>
						</PanelCard>

						<PanelCard info title="Icons">
							<div className="relative -my-2">
								<SpotMarker className="-right-2 -top-2 left-auto" n={6} />
								<div className="divide-y divide-product-border">
									<SwitchRow
										className="py-2"
										hint="Show a phone icon in the header."
										label="Phone number icon"
										on
									/>
									<SwitchRow
										className="py-2"
										hint="Show an email icon in the header."
										label="Email icon"
										on
									/>
								</div>
							</div>
						</PanelCard>
					</div>
				</div>
			</div>
		</Screen>
	);
}
