import {
	AlertTriangle,
	BookOpen,
	Info,
	Lightbulb,
	LifeBuoy,
	Link2,
	ListChecks,
	type LucideIcon,
	Monitor,
	SlidersHorizontal,
} from "lucide-react";

/**
 * Section kinds carry meaning through colour, so a reader skimming a page can
 * tell steps from settings from a warning without reading the heading.
 */
export type SectionKind =
	| "steps"
	| "opts"
	| "rules"
	| "example"
	| "risk"
	| "info"
	| "screen"
	| "fix"
	| "link";

export const sectionKinds: Record<
	SectionKind,
	{ icon: LucideIcon; tile: string }
> = {
	steps: {
		icon: ListChecks,
		tile: "bg-product-primary-soft text-product-primary-ink",
	},
	opts: {
		icon: SlidersHorizontal,
		tile: "bg-product-info-soft text-product-info",
	},
	rules: {
		icon: BookOpen,
		tile: "bg-product-warning/15 text-product-warning",
	},
	example: {
		icon: Lightbulb,
		tile: "bg-product-secondary-soft text-product-secondary",
	},
	risk: {
		icon: AlertTriangle,
		tile: "bg-product-error-soft text-product-error-ink",
	},
	info: {
		icon: Info,
		tile: "bg-product-background-hero text-product-muted",
	},
	screen: {
		icon: Monitor,
		tile: "bg-product-background-hero text-product-muted",
	},
	fix: {
		icon: LifeBuoy,
		tile: "bg-product-error-soft text-product-error-ink",
	},
	link: {
		icon: Link2,
		tile: "bg-product-background-hero text-product-muted",
	},
};
