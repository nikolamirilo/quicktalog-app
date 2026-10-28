import { ChevronDown, Link2, Upload, UploadCloud, X } from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn } from "@/components/manual/screens/kit";

/**
 * The Add item dialog as it really opens on a desktop screen: a 640px centred
 * alert dialog over the dimmed builder, with a text-only header, the four
 * fields, and three pill buttons hugging the right of the footer. The builder
 * behind the dim is deliberately left out.
 */

/** A field label at the builder dialog's size: 13.5px, 6px above the control. */
function FieldLabel({
	children,
	required,
}: {
	children: string;
	required?: boolean;
}) {
	return (
		<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
			{children}
			{required ? <span className="ml-1 text-product-error">*</span> : null}
		</p>
	);
}

/** One of the two pill checkboxes beside the price: 36px tall, 16px box. */
function PillCheck({ label }: { label: string }) {
	return (
		<span className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-product-border bg-product-card pl-2.5 pr-3.5 text-[13.5px] font-semibold text-product-foreground-accent">
			<span className="h-4 w-4 flex-none rounded-[5px] border-[1.5px] border-product-border-strong bg-product-card" />
			{label}
		</span>
	);
}

/** The Add item dialog, with the name typed and nothing else filled in. */
export function ItemScreen() {
	return (
		<Screen
			caption="The Add item dialog, opened from a catalogue section, with fields for the item's name, description, price and picture."
			height={720}
			legend={[
				"The title tells you which section the new item lands in.",
				"Name is the only required field. The red star marks it.",
				"Type the price and pick a unit, such as kg or portion.",
				"Tick Free to hide the price, or On sale to add a sale price.",
				"Upload a picture from your device, or paste a web address.",
				'"Add item & add another" saves and keeps the dialog open.',
			]}
			width={672}
		>
			{/* The builder is dimmed behind the dialog. */}
			<div className="absolute inset-0 bg-product-dark/[0.42]" />

			<div className="absolute left-4 top-[22px] flex w-[640px] flex-col overflow-hidden rounded-product-panel border border-product-border bg-product-card shadow-product-hover">
				{/* Header: text on the left, a round close button on the right. */}
				<div className="flex flex-none items-start justify-between gap-3 border-b border-product-border px-6 pb-4 pt-5">
					<div className="relative min-w-0">
						<SpotMarker className="-left-5 top-0" n={1} />
						<p className="font-product-heading text-lg font-bold leading-tight tracking-[-0.02em] text-product-foreground">
							Add item
						</p>
						<p className="mt-0.5 text-[13px] leading-[18px] text-product-foreground-accent">
							In Desserts
						</p>
					</div>
					<span className="-mr-2 -mt-1 grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent">
						<X className="h-5 w-5" />
					</span>
				</div>

				{/* Body: name, description, price row, picture. */}
				<div className="px-6 py-5">
					<div className="space-y-4 p-1">
						<div className="space-y-1.5">
							<FieldLabel required>Name</FieldLabel>
							<span className="relative flex h-10 items-center rounded-[12px] border-[1.5px] border-product-border-strong bg-product-card px-3 text-[15px] text-product-foreground">
								<SpotMarker className="-left-2 top-[10px]" n={2} />
								Salted caramel brownie
							</span>
						</div>

						<div className="space-y-1.5">
							<FieldLabel>Description</FieldLabel>
							<span className="flex h-[84px] items-start rounded-[12px] border-[1.5px] border-product-border-strong bg-product-card px-3 py-2.5 text-[15px] leading-relaxed text-product-muted">
								e.g. Pancakes with Nutella, cherries, and ice cream
							</span>
						</div>

						{/* Price on the left, the two pills bottom-aligned on the right. */}
						<div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
							<div className="space-y-1.5">
								<FieldLabel>Price (USD)</FieldLabel>
								<span className="relative flex gap-2">
									<SpotMarker className="-left-2 top-[10px]" n={3} />
									{/* No placeholder on this one: it really is blank. */}
									<span className="h-10 min-w-0 flex-1 rounded-[12px] border-[1.5px] border-product-border-strong bg-product-card px-3" />
									<span className="flex h-10 w-[112px] flex-none items-center justify-between rounded-[12px] border-[1.5px] border-product-border-strong bg-product-card px-3 text-[15px] text-product-foreground">
										none
										<ChevronDown className="h-4 w-4 flex-none text-product-muted" />
									</span>
								</span>
							</div>

							<span className="relative flex h-10 items-center gap-2">
								<SpotMarker className="-left-2.5 -top-2" n={4} />
								<PillCheck label="Free" />
								<PillCheck label="On sale" />
							</span>
						</div>

						<div className="flex w-full flex-col gap-1.5">
							<div className="flex items-center justify-between gap-3">
								<FieldLabel>Image</FieldLabel>
								<span className="relative inline-flex h-8 items-center gap-1 rounded-full border border-product-border bg-product-background-hero p-0.5">
									<SpotMarker n={5} />
									<span className="inline-flex h-full items-center gap-1.5 rounded-full bg-product-card px-2.5 text-[12.5px] font-semibold text-product-foreground shadow-product">
										<Upload className="h-3.5 w-3.5" />
										Upload
									</span>
									<span className="inline-flex h-full items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold text-product-foreground-accent">
										<Link2 className="h-3.5 w-3.5" />
										URL
									</span>
								</span>
							</div>

							{/* The only dashed line in the dialog. */}
							<span className="flex h-40 w-full flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-product-border-strong bg-product-card px-4 py-6 text-center">
								<span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-product-primary-soft text-product-primary-ink">
									<UploadCloud className="h-5 w-5" />
								</span>
								<span className="mt-2 text-sm font-semibold leading-snug text-product-foreground">
									Choose a file or drag it here
								</span>
								<span className="text-[12.5px] leading-snug text-product-muted">
									PNG, JPG or WebP, up to 50 MB. We resize it for you.
								</span>
							</span>
						</div>
					</div>
				</div>

				{/* Footer: natural-width buttons hugging the right edge. */}
				<div className="flex flex-none justify-end border-t border-product-border bg-product-card px-6 py-4">
					<span className="relative flex gap-2">
						<SpotMarker className="-left-2 top-[12px]" n={6} />
						<Btn className="h-11 px-[22px] text-[15px]" variant="outline">
							Cancel
						</Btn>
						<Btn className="h-11 px-[22px] text-[15px]" variant="outline">
							Add item &amp; add another
						</Btn>
						<Btn className="h-11 px-[22px] text-[15px]">Add item</Btn>
					</span>
				</div>
			</div>
		</Screen>
	);
}
