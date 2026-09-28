import type { DocEntry } from "@/content/docs/_types";
import DocCard from "./DocCard";

/** Related topics shown at the foot of a docs page. */
export default function RelatedDocs({ docs }: { docs: DocEntry[] }) {
	if (!docs.length) return null;

	return (
		<section className="mt-16 border-t border-product-border pt-12">
			<div className="mb-8">
				<span className="text-xs font-semibold uppercase tracking-[0.2em] text-product-secondary">
					Keep going
				</span>
				<h2 className="mt-2 font-lora text-2xl font-bold text-product-foreground sm:text-3xl">
					More from the docs
				</h2>
			</div>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{docs.map((doc) => (
					<DocCard key={doc.meta.slug} meta={doc.meta} />
				))}
			</div>
		</section>
	);
}
