import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

function TemplateCard({
	title,
	badge,
	description,
	chips,
	selected,
	dashed,
	spot,
}: {
	title: string;
	badge?: string;
	description: string;
	chips: string;
	selected?: boolean;
	dashed?: boolean;
	spot?: number;
}) {
	return (
		<div
			className={cn(
				"relative rounded-[14px] border-[1.5px] p-3 text-center",
				selected
					? "border-product-primary bg-product-primary-soft ring-[3px] ring-product-primary/30"
					: "border-product-border bg-product-card",
				dashed && !selected && "border-dashed",
			)}
		>
			{spot ? <SpotMarker n={spot} /> : null}
			{badge ? (
				<span className="absolute right-2 top-2 rounded-full bg-product-primary px-2 py-[2px] text-[9.5px] font-bold text-product-foreground">
					{badge}
				</span>
			) : null}
			<p className="px-7 text-[13.5px] font-bold text-product-foreground">
				{title}
			</p>
			<div
				className={cn(
					"mx-auto mt-2 grid h-[72px] place-items-center rounded-[10px]",
					dashed
						? "border-[1.5px] border-dashed border-product-border-strong text-[22px] text-product-muted"
						: "bg-product-background-hero",
				)}
			>
				{dashed ? "+" : null}
			</div>
			<p className="mt-2 text-[11px] leading-[1.45] text-product-foreground-accent">
				{description}
			</p>
			<p className="mt-1 text-[10.5px] text-product-muted">{chips}</p>
		</div>
	);
}

/** The Choose a Template dialog, which opens by itself on an empty catalogue. */
export function TemplateScreen() {
	return (
		<Screen
			caption="The Choose a Template dialog. It opens by itself the first time a catalogue has no content."
			height={340}
			legend={[
				"Quick Start, chosen for you",
				"Standard Catalog, which fills a Starter plan completely",
				"Start from Scratch, an empty catalogue",
				"Apply the one you picked",
			]}
			width={860}
		>
			<div className="absolute inset-0 bg-product-card p-6">
				<p className="font-product-heading text-[19px] font-extrabold text-product-foreground">
					Choose a Template
				</p>
				<p className="mt-1 text-[12.5px] text-product-foreground-accent">
					Start with a pre-made layout or build from scratch
				</p>

				<div className="mt-5 grid grid-cols-3 gap-3">
					<TemplateCard
						badge="Recommended"
						chips="2 categories &middot; 6 items"
						description="Everything you need to start selling right away"
						selected
						spot={1}
						title="Quick Start"
					/>
					<TemplateCard
						chips="4 categories &middot; 15 items"
						description="A flexible layout that works for everyone"
						spot={2}
						title="Standard Catalog"
					/>
					<TemplateCard
						chips="Nothing to delete"
						dashed
						description="Build the whole catalogue yourself"
						spot={3}
						title="Start from Scratch"
					/>
				</div>

				<div className="mt-5 flex justify-center">
					<span className="relative">
						<SpotMarker n={4} />
						<Btn>Select template</Btn>
					</span>
				</div>
			</div>
		</Screen>
	);
}
