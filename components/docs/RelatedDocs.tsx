import type { DocEntry } from "@/content/docs/_types";
import DocCard from "./DocCard";

/** Related topics shown at the foot of a docs page. */
export default function RelatedDocs({ docs }: { docs: DocEntry[] }) {
	if (!docs.length) return null;

	return (
		<section className="mx-auto mt-20 max-w-5xl px-4">
			<div className="mb-8">
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
					Keep going
				</span>
				<h2 className="mt-2 font-lora text-3xl font-bold text-product-foreground">
					More from the docs
				</h2>
			</div>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{docs.map((doc) => (
					<DocCard key={doc.meta.slug} meta={doc.meta} />
				))}
			</div>
		</section>
	);
}
