import { CategoryTag } from "@/components/resources/CategoryTag";
import { IconTile } from "@/components/general/IconTile";
import { MetaLine } from "@/components/resources/MetaLine";
import type { DocMeta } from "@/content/docs/_types";

/** Title block for a docs topic: icon tile and tag, H1, summary and meta line. */
export function DocHero({ meta, total }: { meta: DocMeta; total: number }) {
	const Icon = meta.icon;

	return (
		<header className="mb-[22px] flex flex-col gap-3 border-b border-product-border pb-6">
			<span className="flex items-center gap-2.5">
				<IconTile>
					<Icon />
				</IconTile>
				<CategoryTag className="self-center">{meta.tag}</CategoryTag>
			</span>
			<h1 className="text-balance text-[clamp(32px,4.4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.035em] text-product-foreground">
				{meta.title}
			</h1>
			<p className="max-w-[62ch] text-[clamp(17px,1.5vw,19px)] leading-[1.6] text-product-foreground-accent">
				{meta.description}
			</p>
			<MetaLine
				part={{ order: meta.order, total }}
				readingTimeMinutes={meta.readingTimeMinutes}
			/>
		</header>
	);
}
