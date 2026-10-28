import { ChevronDown, CircleCheck, Globe, X } from "lucide-react";
import type { ReactNode } from "react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn, Input } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/** The dialog's own label: 13.5px, with the asterisk tight against the word. */
function DialogLabel({
	children,
	required,
}: {
	children: ReactNode;
	required?: boolean;
}) {
	return (
		<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
			{children}
			{required ? <span className="ml-0.5 text-product-error">*</span> : null}
		</p>
	);
}

/** A 44px select, the size the dialog uses. The kit's own select is smaller. */
function DialogSelect({
	value,
	placeholder,
}: {
	value?: string;
	placeholder?: string;
}) {
	return (
		<span
			className={cn(
				"flex h-11 items-center justify-between gap-2 rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card px-4 text-[15px]",
				value ? "text-product-foreground" : "text-product-muted",
			)}
		>
			{value ?? placeholder}
			<ChevronDown className="h-4 w-4 flex-none text-product-muted" />
		</span>
	);
}

/**
 * The "Create a Catalog" dialog: a 600px card floating on the blurred, dimmed
 * page behind it. Four fields in two columns, the name carrying its own
 * availability line, then the address preview and the two buttons.
 */
export function CreateCatalogueScreen() {
	return (
		<Screen
			caption="The Create a Catalog dialog. It asks for four things, shows the web address your name will give you, and creates the catalogue."
			height={480}
			legend={[
				"The title and the line under it, which say what the dialog is for",
				"Closes the dialog without creating anything",
				"The name, which is required and is checked while you type",
				"Your line of business, the one answer that starts empty",
				"A preview of the public address this catalogue will get",
				"Creates the catalogue. It stays switched off until all four answers are filled",
			]}
			width={640}
		>
			<div className="absolute inset-0 bg-product-background">
				<div className="absolute inset-0 bg-product-dark/[0.42]" />

				<div className="absolute left-5 top-7 flex w-[600px] flex-col gap-3.5 rounded-product-panel border border-product-border bg-product-card p-6 text-left shadow-product-hover">
					<div className="flex items-start justify-between gap-3">
						<div className="relative flex min-w-0 flex-col gap-1">
							<SpotMarker n={1} />
							<p className="font-product-heading text-[20px] font-bold leading-tight tracking-[-0.02em] text-product-foreground">
								Create a Catalog
							</p>
							<p className="text-[14px] leading-relaxed text-product-foreground-accent">
								Please enter the following information to get started
							</p>
						</div>
						<span className="relative -mr-1.5 -mt-1.5 grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent">
							<SpotMarker n={2} />
							<X className="h-5 w-5" />
						</span>
					</div>

					<div className="grid grid-cols-2 gap-3.5">
						<div className="flex min-w-0 flex-col gap-1.5">
							<DialogLabel required>Catalogue Name</DialogLabel>
							<div className="relative">
								<SpotMarker className="-left-2 top-[13px]" n={3} />
								<Input
									className="h-11 rounded-[14px] border-[1.5px] px-4 text-[15px]"
									value="Brightside Cafe Menu"
								/>
							</div>
							<p className="flex min-h-[1em] items-start gap-1.5 text-[12.5px] leading-snug text-product-success">
								<CircleCheck className="mt-px h-3.5 w-3.5 flex-none" />
								Great! This name is available.
							</p>
						</div>

						<div className="flex min-w-0 flex-col gap-1.5">
							<DialogLabel>Language</DialogLabel>
							<DialogSelect value="English" />
						</div>

						<div className="flex min-w-0 flex-col gap-1.5">
							<DialogLabel>Currency</DialogLabel>
							<DialogSelect value="Euro" />
						</div>

						<div className="flex min-w-0 flex-col gap-1.5">
							<DialogLabel>Business Type</DialogLabel>
							<div className="relative">
								<SpotMarker className="-left-2 top-[13px]" n={4} />
								<DialogSelect value="Food & Beverage" />
							</div>
						</div>
					</div>

					<div className="relative flex items-start gap-2.5 rounded-[14px] border border-dashed border-product-border-strong bg-product-background px-3.5 py-3">
						<SpotMarker n={5} />
						<Globe className="mt-0.5 h-[18px] w-[18px] flex-none text-product-muted" />
						<div className="min-w-0">
							<p className="text-[12px] font-semibold leading-4 text-product-muted">
								Your URL will be
							</p>
							<code className="block break-all font-mono text-[13px] leading-snug text-product-foreground-accent">
								https://www.quicktalog.app/catalogues/brightside-cafe-menu
							</code>
						</div>
					</div>

					<div className="mt-1 flex flex-wrap justify-end gap-2">
						<Btn className="h-11 px-[22px] text-[15px]" variant="outline">
							Cancel
						</Btn>
						<span className="relative">
							<SpotMarker n={6} />
							<Btn className="h-11 px-[22px] text-[15px]">Create Catalog</Btn>
						</span>
					</div>
				</div>
			</div>
		</Screen>
	);
}
