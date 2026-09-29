import { BookOpen, CalendarDays, Clock } from "lucide-react";

import { formatIsoDay } from "@/lib/format/date";

const iconClass = "h-3.5 w-3.5 text-product-primary-ink";

/**
 * The small meta line on resource cards and heroes: the publish date (articles)
 * or "Part N of M" (docs), then the reading time, each with an amber icon.
 */
export function MetaLine({
	publishedAt,
	part,
	readingTimeMinutes,
}: {
	/** ISO day, for articles. */
	publishedAt?: string;
	/** Position in the docs sequence, for docs. */
	part?: { order: number; total: number };
	readingTimeMinutes: number;
}) {
	return (
		<span className="inline-flex flex-wrap items-center gap-x-[7px] gap-y-1 text-[13.5px] font-medium text-product-muted">
			{publishedAt ? (
				<>
					<CalendarDays aria-hidden="true" className={iconClass} />
					<time dateTime={publishedAt}>{formatIsoDay(publishedAt)}</time>
					<span aria-hidden="true">·</span>
				</>
			) : null}
			{part ? (
				<>
					<BookOpen aria-hidden="true" className={iconClass} />
					Part {part.order} of {part.total}
					<span aria-hidden="true">·</span>
				</>
			) : null}
			<Clock aria-hidden="true" className={iconClass} />
			{readingTimeMinutes} min read
		</span>
	);
}
