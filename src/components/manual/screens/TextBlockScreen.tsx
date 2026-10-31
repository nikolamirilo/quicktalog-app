import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Globe,
	Italic,
	LayoutGrid,
	List,
	ListOrdered,
	type LucideIcon,
	SeparatorHorizontal,
	Sparkles,
	Type,
	Underline,
	X,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn, Input } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/** The five kinds of section, in the order the rail lists them. */
const SECTION_TYPES = [
	{ icon: LayoutGrid, label: "Items" },
	{ icon: Type, label: "Text" },
	{ icon: SeparatorHorizontal, label: "Divider" },
	{ icon: Globe, label: "External content" },
	{ icon: Sparkles, label: "Custom visual" },
] as const;

/** One toolbar button: 36px square, 8px radius, no fill until the editor has focus. */
function ToolButton({ icon: Icon }: { icon: LucideIcon }) {
	return (
		<span className="grid h-9 w-9 flex-none place-items-center rounded-lg text-product-foreground-accent">
			<Icon className="h-[18px] w-[18px]" />
		</span>
	);
}

/** The hairline between two groups of toolbar buttons. */
function ToolDivider() {
	return <span className="mx-1 h-5 w-px flex-none bg-product-border" />;
}

/**
 * The text size control. It is a plain browser select, so it is a touch
 * squarer and lighter than the fields in the form below it.
 */
function SizeSelect({ value }: { value: string }) {
	return (
		<span className="flex h-9 flex-none items-center gap-1.5 rounded-lg border border-product-border bg-product-card px-2 text-sm text-product-foreground">
			{value}
			<span className="text-[10px] leading-none text-product-muted">
				&#9662;
			</span>
		</span>
	);
}

/** The Text section editor, with its formatting toolbar. */
export function TextBlockScreen() {
	return (
		<Screen
			caption="The Add section dialog in the Brightside Cafe builder with Text picked. An optional section name sits above the writing box, and the toolbar is the only formatting you get."
			height={600}
			legend={[
				"The dialog title. It says Edit section when you reopen a section you already added",
				"The kind of section. Text is picked, so the rest of the dialog is the text editor",
				"An optional name. Screen readers and the builder use it, and the page never shows it",
				"Nine formatting buttons in three groups, plus the text size, set to Medium",
				"Where you write. Text appears at the size and font your catalogue uses, and the corner drags down to make the box taller",
				"Adds the section. It stays ready even with the name left empty",
			]}
			width={880}
		>
			<div className="absolute inset-0 flex bg-product-card">
				{/* The section type rail: 224px, sand coloured, with its own right edge. */}
				<div className="flex w-56 flex-none flex-col border-r border-product-border bg-product-background-hero px-3.5 pb-4 pt-5">
					<div className="flex items-center justify-between gap-3 px-1.5">
						<span className="relative font-product-heading text-[18px] font-bold leading-tight tracking-[-0.02em] text-product-foreground">
							<SpotMarker className="-top-2 left-auto right-[-24px]" n={1} />
							Add section
						</span>
					</div>

					<div className="mt-4 flex flex-col gap-1">
						{SECTION_TYPES.map(({ icon: Icon, label }) => {
							const selected = label === "Text";

							return (
								<div
									className={cn(
										"relative flex h-10 items-center gap-[7px] rounded-[12px] border-[1.5px] border-transparent px-3 text-sm font-semibold text-product-foreground-accent",
										selected &&
											"border-product-primary-accent bg-product-primary-soft font-bold text-product-foreground",
									)}
									key={label}
								>
									{selected ? <SpotMarker n={2} /> : null}
									<Icon
										className={cn(
											"h-4 w-4 flex-none",
											selected && "text-product-primary-ink",
										)}
									/>
									{label}
								</div>
							);
						})}
					</div>
				</div>

				{/* The form column: header, the part that scrolls, then the footer. */}
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<div className="flex flex-none items-start justify-between gap-3 border-b border-product-border px-6 pb-4 pt-5">
						<div className="min-w-0">
							<p className="font-product-heading text-[16px] font-bold leading-tight text-product-foreground">
								Text
							</p>
							<p className="mt-1 text-[13px] leading-[18px] text-product-foreground-accent">
								Add rich text content with headings, lists, links, and
								formatting.
							</p>
						</div>
						<span className="-mr-2 -mt-1 grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent">
							<X className="h-5 w-5" />
						</span>
					</div>

					<div className="min-h-0 flex-1 overflow-hidden px-6 py-5">
						<div className="flex flex-col gap-4">
							<div className="flex max-w-md flex-col gap-1.5">
								<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
									Section name
								</p>
								<span className="relative block">
									<SpotMarker n={3} />
									<Input
										className="h-10 border-[1.5px] text-[15px]"
										placeholder="e.g. Summer sale banner"
									/>
								</span>
								<span className="text-[12px] leading-snug text-product-muted">
									Describes this section for screen readers and identifies it in
									the builder. Not shown on the page.
								</span>
							</div>

							<div className="flex flex-col gap-2">
								<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
									Content
								</p>
								<div className="px-0.5">
									<div className="relative mb-2 flex items-center gap-0.5 rounded-xl border border-product-border bg-product-card p-1 shadow-product">
										<SpotMarker n={4} />
										<ToolButton icon={Bold} />
										<ToolButton icon={Italic} />
										<ToolButton icon={Underline} />
										<ToolDivider />
										<ToolButton icon={List} />
										<ToolButton icon={ListOrdered} />
										<ToolDivider />
										<ToolButton icon={AlignLeft} />
										<ToolButton icon={AlignCenter} />
										<ToolButton icon={AlignRight} />
										<ToolDivider />
										<SizeSelect value="Medium" />
									</div>

									{/* A new text section opens empty: no example text, no prompt. */}
									<div className="relative h-[200px] rounded-xl border border-product-border bg-product-card p-4">
										<SpotMarker n={5} />
										<span className="block h-[30px] w-px bg-product-foreground/50" />
										<span className="absolute bottom-[3px] right-[3px] text-product-muted/70">
											<svg
												aria-hidden="true"
												className="h-3.5 w-3.5"
												fill="none"
												viewBox="0 0 14 14"
											>
												<title>Drag to resize</title>
												<path
													d="M13 5 5 13M13 10l-3 3"
													stroke="currentColor"
													strokeLinecap="round"
													strokeWidth="1.5"
												/>
											</svg>
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="flex flex-none items-center justify-end gap-2 border-t border-product-border bg-product-card px-6 py-4">
						<Btn className="h-11 px-[22px] text-[15px]" variant="outline">
							Cancel
						</Btn>
						<span className="relative">
							<SpotMarker n={6} />
							<Btn className="h-11 px-[22px] text-[15px]">Add section</Btn>
						</span>
					</div>
				</div>
			</div>
		</Screen>
	);
}
