"use client";

import { Maximize2 } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/ui/cn";

type SpotState = {
	active: number | null;
	setActive: (n: number | null) => void;
};

const SpotContext = createContext<SpotState | null>(null);

/**
 * Shares the hovered hotspot between a screen and the text or steps that point
 * at it. A screen on its own sets this up for itself; a follow-along block sets
 * it up around both halves.
 */
export function ScreenProvider({ children }: { children: ReactNode }) {
	const [active, setActive] = useState<number | null>(null);

	return (
		<SpotContext.Provider value={{ active, setActive }}>
			{children}
		</SpotContext.Provider>
	);
}

/**
 * A numbered marker on a screen. Put it inside the element it points at, and
 * give that element `relative`. The highlight appears only while the reader
 * hovers the matching number in the text, never on hover over the screen.
 */
export function SpotMarker({
	n,
	className,
}: {
	n: number;
	/** Overrides the default top-left placement. */
	className?: string;
}) {
	const context = useContext(SpotContext);
	const active = context?.active === n;

	return (
		<>
			<span
				aria-hidden="true"
				className={cn(
					"absolute -left-2 -top-2 z-20 grid h-[19px] w-[19px] place-items-center rounded-full font-product-heading text-[11px] font-extrabold leading-none transition-colors",
					active
						? "bg-product-info text-white"
						: "bg-product-foreground text-white",
					className,
				)}
			>
				{n}
			</span>
			{active ? (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute -inset-1 z-10 rounded-[8px] ring-2 ring-product-info"
				/>
			) : null}
		</>
	);
}

/**
 * The number chip in text, a legend row or a follow-along step. Hovering it
 * highlights its spot on the screen. Selecting it does nothing on purpose:
 * readers found a pinned highlight more confusing than helpful.
 */
export function SpotRef({
	n,
	children,
	label,
}: {
	n: number;
	children?: ReactNode;
	/** Read out instead of the bare number, such as "Step 3". */
	label?: string;
}) {
	const context = useContext(SpotContext);
	const active = context?.active === n;

	return (
		<span
			className={cn(
				"mt-[1px] grid h-[26px] w-[26px] cursor-default place-items-center rounded-full font-product-heading text-[13px] font-extrabold leading-none transition-colors",
				active
					? "bg-product-info text-white"
					: "bg-product-primary text-product-foreground",
			)}
			onBlur={() => context?.setActive(null)}
			onFocus={() => context?.setActive(n)}
			onMouseEnter={() => context?.setActive(n)}
			onMouseLeave={() => context?.setActive(null)}
			tabIndex={0}
		>
			<span className="sr-only">{label ?? `Point ${n}`}: </span>
			{children ?? n}
		</span>
	);
}

/** The number chip used inside a sentence. */
export function Point({ n }: { n: number }) {
	const context = useContext(SpotContext);
	const active = context?.active === n;

	return (
		<span
			className={cn(
				"mx-[2px] inline-grid h-[18px] w-[18px] cursor-default place-items-center rounded-full align-[-2px] font-product-heading text-[11px] font-extrabold leading-none transition-colors",
				active
					? "bg-product-info text-white"
					: "bg-product-foreground text-white",
			)}
			onBlur={() => context?.setActive(null)}
			onFocus={() => context?.setActive(n)}
			onMouseEnter={() => context?.setActive(n)}
			onMouseLeave={() => context?.setActive(null)}
			tabIndex={0}
		>
			<span className="sr-only">Point </span>
			{n}
		</span>
	);
}

/**
 * Scales a fixed-size drawing down to the column it sits in, so the screen
 * keeps the product's real proportions instead of reflowing into a layout the
 * product never shows.
 */
function Scaler({
	width,
	height,
	children,
}: {
	width: number;
	height: number;
	children: ReactNode;
}) {
	const frame = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useEffect(() => {
		const node = frame.current;
		if (!node) return;
		const measure = () => setScale(Math.min(1, node.clientWidth / width));
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, [width]);

	return (
		<div className="relative" ref={frame} style={{ height: height * scale }}>
			<div
				className="absolute left-1/2 top-0"
				style={{
					height,
					transform: `translateX(-50%) scale(${scale})`,
					transformOrigin: "top center",
					width,
				}}
			>
				{children}
			</div>
		</div>
	);
}

function Stage({
	width,
	height,
	title,
	children,
}: {
	width: number;
	height: number;
	title?: string;
	children: ReactNode;
}) {
	return (
		<div
			className="product overflow-hidden rounded-[14px] border border-product-border-strong bg-product-background shadow-product"
			style={{ height, width }}
		>
			{title ? (
				<div className="flex h-[30px] items-center gap-1.5 border-b border-product-border bg-product-background-hero px-3">
					<span className="h-[9px] w-[9px] rounded-full bg-product-border-hover" />
					<span className="h-[9px] w-[9px] rounded-full bg-product-border-hover" />
					<span className="h-[9px] w-[9px] rounded-full bg-product-border-hover" />
					<span className="ml-2 text-[11px] font-semibold text-product-muted">
						{title}
					</span>
				</div>
			) : null}
			<div
				className="relative"
				style={{ height: title ? height - 30 : height }}
			>
				{children}
			</div>
		</div>
	);
}

function ScreenFigure({
	caption,
	title,
	width,
	height,
	legend,
	children,
}: ScreenProps) {
	const [open, setOpen] = useState(false);

	return (
		<figure className="mt-1">
			<div className="overflow-hidden rounded-[18px] border border-product-border bg-product-background-hero p-3">
				<Scaler height={height} width={width}>
					<Stage height={height} title={title} width={width}>
						{children}
					</Stage>
				</Scaler>
			</div>
			{legend?.length ? (
				<ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
					{legend.map((item, index) => (
						<li className="flex items-start gap-2" key={item}>
							<SpotRef n={index + 1} />
							<span className="pt-[3px] text-[14px] text-product-foreground-accent">
								{item}
							</span>
						</li>
					))}
				</ol>
			) : null}
			<figcaption className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13.5px] text-product-muted">
				<span className="min-w-0 flex-1">{caption}</span>
				<button
					className="inline-flex flex-none items-center gap-1.5 text-[13px] font-semibold text-product-primary-ink underline decoration-product-primary/40 underline-offset-2 transition-colors hover:decoration-product-primary"
					onClick={() => setOpen(true)}
					type="button"
				>
					<Maximize2 aria-hidden="true" className="h-3.5 w-3.5" />
					Enlarge
				</button>
			</figcaption>
			<Dialog onOpenChange={setOpen} open={open}>
				<DialogContent className="max-w-[min(96vw,1320px)] p-4">
					<DialogTitle className="text-[15px]">{caption}</DialogTitle>
					<div className="max-h-[78dvh] overflow-auto rounded-[14px] bg-product-background-hero p-3">
						<Stage height={height} title={title} width={width}>
							{children}
						</Stage>
					</div>
				</DialogContent>
			</Dialog>
		</figure>
	);
}

interface ScreenProps {
	/** One plain sentence saying what the screen shows. */
	caption: string;
	/** Adds a window bar with this title. Use it for full app screens. */
	title?: string;
	width: number;
	height: number;
	/** Numbered notes under the screen, in hotspot order. */
	legend?: string[];
	children: ReactNode;
}

/** A drawing of a real product screen, at the product's own proportions. */
export function Screen(props: ScreenProps) {
	const context = useContext(SpotContext);

	if (context) return <ScreenFigure {...props} />;

	return (
		<ScreenProvider>
			<ScreenFigure {...props} />
		</ScreenProvider>
	);
}

/** A screen with the steps that happen on it underneath. */
export function FollowAlong({
	screen,
	children,
}: {
	screen: ReactNode;
	children: ReactNode;
}) {
	return (
		<ScreenProvider>
			<div className="rounded-product-card border border-product-border bg-product-card p-[18px]">
				{screen}
				<div className="mt-5 border-t border-product-border pt-5">
					{children}
				</div>
			</div>
		</ScreenProvider>
	);
}
