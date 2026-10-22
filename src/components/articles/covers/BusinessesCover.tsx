import {
	BookOpen,
	CalendarDays,
	Home,
	Lightbulb,
	type LucideIcon,
	MapPin,
	PenLine,
	Scissors,
	Sparkles,
	Store,
	Users,
	UtensilsCrossed,
	Zap,
} from "lucide-react";

import {
	type CoverDefinition,
	warmBackground,
} from "@/components/articles/covers/types";
import { cn } from "@/lib/ui/cn";

const icons: LucideIcon[] = [
	UtensilsCrossed,
	Zap,
	Scissors,
	Users,
	Store,
	PenLine,
	Lightbulb,
	Home,
	CalendarDays,
	MapPin,
	BookOpen,
	Sparkles,
];

/** A grid of business-type icons. */
export const businessesCover: CoverDefinition = {
	background: warmBackground,
	Art: () => (
		<div className="grid grid-cols-[repeat(4,44px)] gap-2">
			{icons.map((Icon, i) => (
				<span
					className={cn(
						"grid h-11 w-11 place-items-center rounded-[13px] border text-product-primary-ink shadow-[0_1px_2px_rgba(22,20,15,0.06)]",
						i % 3 === 0
							? "border-product-primary/40 bg-product-primary-soft"
							: "border-product-border bg-white",
					)}
					key={i}
				>
					<Icon className="h-[18px] w-[18px]" />
				</span>
			))}
		</div>
	),
};
