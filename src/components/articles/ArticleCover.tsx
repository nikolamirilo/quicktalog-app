import { BookOpen } from "lucide-react";

import { aiCover } from "@/components/articles/covers/AiCover";
import { alternativesCover } from "@/components/articles/covers/AlternativesCover";
import { businessesCover } from "@/components/articles/covers/BusinessesCover";
import { qrCover } from "@/components/articles/covers/QrCover";
import { restaurantsCover } from "@/components/articles/covers/RestaurantsCover";
import { salonsCover } from "@/components/articles/covers/SalonsCover";
import {
	type CoverDefinition,
	warmBackground,
} from "@/components/articles/covers/types";
import type { ArticleCoverName } from "@/content/articles/_types";
import { cn } from "@/lib/ui/cn";

const covers: Record<ArticleCoverName, CoverDefinition> = {
	restaurants: restaurantsCover,
	salons: salonsCover,
	ai: aiCover,
	qr: qrCover,
	alternatives: alternativesCover,
	businesses: businessesCover,
};

/** The plain amber book cover, for an article that names no illustration. */
const defaultCover: CoverDefinition = {
	background: warmBackground,
	Art: () => (
		<span className="grid h-16 w-16 place-items-center rounded-2xl bg-product-primary text-product-foreground shadow-product-primary">
			<BookOpen className="h-7 w-7" />
		</span>
	),
};

/**
 * Decorative CSS illustration for an article card or article page cover,
 * chosen by the article's `cover`. `size="lg"` is the wide banner on the
 * article page.
 */
export function ArticleCover({
	cover,
	size = "card",
	className,
}: {
	cover?: ArticleCoverName;
	size?: "card" | "lg";
	className?: string;
}) {
	const { background, chip, dark, Art } = cover ? covers[cover] : defaultCover;
	const ChipIcon = chip?.icon;

	return (
		<div
			aria-hidden="true"
			className={cn(
				"relative flex items-center justify-center overflow-hidden p-[18px]",
				background,
				size === "lg" ? "min-h-[240px] md:min-h-[360px]" : "min-h-[190px]",
				className,
			)}
		>
			<div
				className={cn(
					"absolute inset-0 bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_30%,transparent_100%)]",
					dark
						? "bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]"
						: "bg-[linear-gradient(rgba(22,20,15,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(22,20,15,0.04)_1px,transparent_1px)]",
				)}
			/>
			<div
				className={cn(
					"relative flex w-full items-center justify-center transition-transform duration-[400ms] ease-out",
					size === "card" && "group-hover:scale-[1.04]",
				)}
			>
				<div
					className={cn(
						"flex w-full max-w-[330px] justify-center",
						size === "lg" && "md:[zoom:1.45]",
					)}
				>
					<Art />
				</div>
			</div>
			{chip && ChipIcon ? (
				<span
					className={cn(
						"absolute left-3.5 top-3.5 z-[1] inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[12.5px] font-bold",
						dark
							? "border border-product-primary/35 bg-product-primary/[0.14] text-product-primary-bright"
							: "bg-product-primary text-product-foreground shadow-product-primary",
					)}
				>
					<ChipIcon className="h-3.5 w-3.5" />
					{chip.label}
				</span>
			) : null}
		</div>
	);
}
