import type { ComponentType } from "react";

import type { ProblemPreviewKind } from "@/constants/marketing";

const TemplatePreview = () => (
	<div className="flex flex-wrap gap-2">
		<span className="rounded-full border border-product-foreground bg-product-foreground px-3 py-1.5 text-[13px] font-semibold text-white">
			Template
		</span>
		{["Coffee", "Luxury"].map((chip) => (
			<span
				className="rounded-full border border-product-border-strong bg-product-card px-3 py-1.5 text-[13px] font-semibold text-product-foreground-accent"
				key={chip}
			>
				{chip}
			</span>
		))}
		<span className="rounded-full border border-product-primary/50 bg-product-primary-soft px-3 py-1.5 text-[13px] font-semibold text-product-primary-ink">
			✦ AI draft
		</span>
	</div>
);

const PricePreview = () => (
	<>
		<div className="flex items-baseline gap-2.5 text-[15px]">
			<span className="min-w-0 flex-1 font-semibold">Flat white</span>
			<span className="text-[13.5px] text-product-muted line-through">
				€4.00
			</span>
			<span className="font-product-heading text-[17px] font-extrabold tabular-nums">
				€4.50
			</span>
		</div>
		<div className="mt-1.5 flex items-center gap-[7px] text-[12.5px] font-semibold text-product-success">
			<i className="h-[7px] w-[7px] rounded-full bg-product-success-bright shadow-[0_0_0_3px_rgb(var(--product-success-bright-rgb)/0.18)]" />
			Live · updated just now
		</div>
	</>
);

const SharePreview = () => (
	<div className="flex items-center gap-3.5">
		<div className="relative h-[52px] w-[52px] flex-none rounded-[10px] border border-product-border-strong bg-product-card bg-[radial-gradient(var(--product-foreground)_38%,transparent_42%)] bg-[length:6px_6px] bg-[position:3px_3px]">
			{["left-1 top-1", "right-1 top-1", "bottom-1 left-1"].map((position) => (
				<i
					className={`absolute h-[15px] w-[15px] rounded border-[3px] border-product-foreground bg-product-primary shadow-[inset_0_0_0_2.5px_var(--product-card)] ${position}`}
					key={position}
				/>
			))}
		</div>
		<div className="flex min-w-0 flex-col gap-1.5">
			<span className="truncate text-[13px] font-semibold">
				quicktalog.app/catalogues/your-shop
			</span>
			<span className="flex items-center gap-2 text-[12.5px] font-semibold text-product-primary-ink">
				<svg
					aria-hidden="true"
					className="flex-none text-product-primary-accent"
					height="20"
					viewBox="0 0 64 20"
					width="64"
				>
					<path
						d="M1 17 L10 14 L19 15 L28 10 L37 11 L46 6 L55 7 L63 2"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
					/>
				</svg>
				Views this week
			</span>
		</div>
	</div>
);

const previews: Record<ProblemPreviewKind, ComponentType> = {
	template: TemplatePreview,
	price: PricePreview,
	share: SharePreview,
};

/** The small illustration at the bottom of a "With Quicktalog" card. */
export function ProblemPreview({ kind }: { kind: ProblemPreviewKind }) {
	const Preview = previews[kind];
	return <Preview />;
}
