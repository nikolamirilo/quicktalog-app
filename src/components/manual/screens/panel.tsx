import { FileText, Home, Layout, Palette, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The builder's editor panel: 440px wide, four tabs, one scrolling body. Shared
 * by the Appearance, Header and Background drawings.
 */
export function EditorPanel({
	tab,
	children,
}: {
	tab: "General" | "Header" | "Footer" | "Appearance";
	children: ReactNode;
}) {
	const tabs = [
		{ icon: Home, label: "General" },
		{ icon: Layout, label: "Header" },
		{ icon: FileText, label: "Footer" },
		{ icon: Palette, label: "Appearance" },
	] as const;

	return (
		<div className="absolute inset-0 flex flex-col border-l border-product-border bg-product-card">
			<div className="flex items-start gap-2 px-4 pb-3 pt-4">
				<div className="min-w-0 flex-1">
					<p className="font-product-heading text-[15px] font-extrabold text-product-foreground">
						Edit catalogue
					</p>
					<p className="text-[11.5px] text-product-muted">
						Name, header, footer and appearance
					</p>
				</div>
				<X className="h-4 w-4 flex-none text-product-muted" />
			</div>

			<div className="grid grid-cols-4 gap-1 px-3">
				{tabs.map(({ icon: Icon, label }) => (
					<div
						className={cn(
							"grid place-items-center gap-1 rounded-[11px] border px-1 py-2",
							label === tab
								? "border-product-primary bg-product-primary-soft text-product-foreground"
								: "border-transparent text-product-foreground-accent",
						)}
						key={label}
					>
						<Icon className="h-4 w-4" />
						<span className="text-[10.5px] font-semibold leading-none">
							{label}
						</span>
					</div>
				))}
			</div>

			<div className="flex-1 overflow-hidden px-3 pb-3 pt-3">{children}</div>
		</div>
	);
}

/** One white card inside the panel. */
export function PanelSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children?: ReactNode;
}) {
	return (
		<div className="rounded-[14px] border border-product-border bg-product-card p-3 shadow-[0_1px_2px_rgba(22,20,15,0.04)]">
			<p className="text-[15px] font-bold leading-tight text-product-foreground">
				{title}
			</p>
			{description ? (
				<p className="mt-0.5 text-[11.5px] leading-[1.45] text-product-muted">
					{description}
				</p>
			) : null}
			{children ? <div className="mt-2.5">{children}</div> : null}
		</div>
	);
}

/** A slider row with its value echoed beside the label. */
export function SliderRow({
	label,
	value,
	marks,
	fill = 50,
}: {
	label: string;
	value: string;
	marks?: string[];
	fill?: number;
}) {
	return (
		<div>
			<div className="flex items-baseline justify-between">
				<span className="text-[12.5px] font-semibold text-product-foreground">
					{label}
				</span>
				<span className="text-[11.5px] text-product-muted">{value}</span>
			</div>
			<div className="mt-2 h-[5px] rounded-full bg-product-background-hero">
				<div
					className="relative h-full rounded-full bg-product-primary"
					style={{ width: `${fill}%` }}
				>
					<span className="absolute -right-[6px] -top-[4px] h-[13px] w-[13px] rounded-full border-2 border-product-primary bg-product-card" />
				</div>
			</div>
			{marks?.length ? (
				<div className="mt-1 flex justify-between text-[10px] text-product-muted">
					{marks.map((mark) => (
						<span key={mark}>{mark}</span>
					))}
				</div>
			) : null}
		</div>
	);
}
