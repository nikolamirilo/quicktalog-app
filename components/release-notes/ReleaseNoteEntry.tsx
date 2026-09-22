import type { ReleaseNote, ReleaseNoteTag } from "@/constants/releaseNotes";

interface Props {
	release: ReleaseNote;
	isLatest?: boolean;
}

const tagStyles: Record<ReleaseNoteTag, string> = {
	New: "bg-product-primary/15 text-product-secondary",
	Improved: "bg-product-background-hero text-product-secondary",
	Fixed: "bg-white border border-product-border text-product-foreground-accent",
};

export default function ReleaseNoteEntry({ release, isLatest = false }: Props) {
	const dateLabel = new Date(release.date).toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	return (
		<article className="relative pl-10" id={release.slug}>
			<span
				className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-product-primary bg-product-background ${
					isLatest ? "shadow-[0_0_0_4px_var(--product-background-hover)]" : ""
				}`}
			/>

			<div className="mb-1.5 flex flex-wrap items-baseline gap-2.5">
				<span className="text-sm font-bold tabular-nums text-product-secondary">
					{release.version}
				</span>
				<span className="text-sm text-product-foreground-accent">
					{dateLabel}
				</span>
				{isLatest && (
					<span className="rounded-full bg-product-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-product-foreground">
						Latest
					</span>
				)}
			</div>

			<h2 className="mb-3.5 font-lora text-2xl font-bold leading-snug text-product-foreground">
				{release.title}
			</h2>

			<ul className="space-y-3">
				{release.items.map((item) => (
					<li className="flex items-start gap-3" key={item.text}>
						<span
							className={`mt-0.5 flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagStyles[item.tag]}`}
						>
							{item.tag}
						</span>
						<p className="text-product-foreground">{item.text}</p>
					</li>
				))}
			</ul>
		</article>
	);
}
