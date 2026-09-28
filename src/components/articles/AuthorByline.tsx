import { Clock } from "lucide-react";

interface Props {
	author: string;
	publishedAt: string;
	readingTimeMinutes: number;
}

/** Author avatar, name, date, and reading time row shown under the title. */
export default function AuthorByline({
	author,
	publishedAt,
	readingTimeMinutes,
}: Props) {
	const date = new Date(publishedAt).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const initial = author.trim().charAt(0).toUpperCase();

	return (
		<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-product-foreground-accent">
			<span
				aria-hidden
				className="flex h-9 w-9 items-center justify-center rounded-full bg-product-secondary font-lora-semibold text-sm font-bold text-white"
			>
				{initial}
			</span>
			<span className="font-medium text-product-foreground">{author}</span>
			<span aria-hidden>·</span>
			<time dateTime={publishedAt}>{date}</time>
			<span aria-hidden>·</span>
			<span className="inline-flex items-center gap-1">
				<Clock className="h-4 w-4" /> {readingTimeMinutes} min read
			</span>
		</div>
	);
}
