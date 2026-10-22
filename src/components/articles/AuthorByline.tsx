import { MetaLine } from "@/components/resources/MetaLine";

interface Props {
	author: string;
	publishedAt: string;
	readingTimeMinutes: number;
}

/** Author avatar, name, date and reading time shown under the article title. */
export function AuthorByline({
	author,
	publishedAt,
	readingTimeMinutes,
}: Props) {
	return (
		<div className="mt-1 flex items-center gap-3">
			<span
				aria-hidden="true"
				className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full bg-product-primary font-product-heading text-[17px] font-extrabold leading-none text-product-foreground shadow-product-primary"
			>
				Q
			</span>
			<span>
				<b className="block text-[15px] text-product-foreground">{author}</b>
				<MetaLine
					publishedAt={publishedAt}
					readingTimeMinutes={readingTimeMinutes}
				/>
			</span>
		</div>
	);
}
