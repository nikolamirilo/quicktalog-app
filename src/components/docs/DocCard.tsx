import Link from "next/link";

import { CategoryTag } from "@/components/resources/CategoryTag";
import { MetaLine } from "@/components/resources/MetaLine";
import { MiniCataloguePage } from "@/components/resources/MiniCataloguePage";
import { ReadMore } from "@/components/resources/ReadMore";
import { IconTile } from "@/components/general/IconTile";
import type { DocMeta } from "@/content/docs/_types";
import { cn } from "@/lib/ui/cn";

interface Props {
	meta: DocMeta;
	/** Number of docs, for "Part N of M". */
	total: number;
	/** Wide amber card with a sample catalogue illustration (from 860px). */
	featured?: boolean;
}

export function DocCard({ meta, total, featured = false }: Props) {
	const Icon = meta.icon;

	return (
		<Link
			className={cn(
				"group flex flex-col overflow-hidden rounded-product-card border text-product-foreground shadow-product transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-product-hover",
				featured
					? "border-product-primary/60 bg-product-amber-panel min-[860px]:flex-row min-[860px]:items-stretch"
					: "border-product-border bg-product-card",
			)}
			href={`/docs/${meta.slug}`}
		>
			<div
				className={cn(
					"flex flex-1 flex-col gap-3 px-[22px] pb-5 pt-[22px]",
					featured && "min-[860px]:px-9 min-[860px]:py-[34px]",
				)}
			>
				<span className="flex items-center justify-between gap-2.5">
					<IconTile className="group-hover:border-product-primary group-hover:bg-product-primary group-hover:text-product-foreground">
						<Icon />
					</IconTile>
					<CategoryTag className="self-center">{meta.tag}</CategoryTag>
				</span>
				<h3
					className={cn(
						"text-product-foreground",
						featured
							? "text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.2] tracking-[-0.025em]"
							: "text-[19px] font-bold leading-[1.25] tracking-[-0.015em]",
					)}
				>
					{meta.title}
				</h3>
				<p
					className={cn(
						"leading-[1.6] text-product-foreground-accent",
						featured ? "max-w-[52ch] text-base" : "text-[15px]",
					)}
				>
					{meta.description}
				</p>
				<span className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1.5">
					<MetaLine
						part={{ order: meta.order, total }}
						readingTimeMinutes={meta.readingTimeMinutes}
					/>
					<ReadMore />
				</span>
			</div>
			{featured && (
				<div
					aria-hidden="true"
					className="hidden flex-[0_0_38%] items-center justify-center py-[26px] pl-0 pr-[30px] min-[860px]:flex"
				>
					<MiniCataloguePage className="w-full max-w-[340px] rotate-[1.5deg] text-[13px] shadow-product-hover" />
				</div>
			)}
		</Link>
	);
}
