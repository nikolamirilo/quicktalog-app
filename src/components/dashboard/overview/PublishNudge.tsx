import { Rocket } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { CatalogueWithDraft } from "@/lib/dashboard/overview";

/**
 * The step most accounts never take. 159 of 628 catalogues on the live site are still
 * drafts and 160 have nothing in them, so an owner with catalogues but nothing
 * published is told what is left to do and taken straight there.
 *
 * It appears only while nothing of theirs is live: once one catalogue is published the
 * banner is gone for good.
 */
export function PublishNudge({
	catalogues,
}: {
	catalogues: CatalogueWithDraft[];
}) {
	if (catalogues.length === 0) return null;
	if (catalogues.some((catalogue) => catalogue.status === "active"))
		return null;

	// The furthest along one: the owner's best candidate to finish.
	const best = [...catalogues].sort(
		(a, b) => b.draft.itemCount - a.draft.itemCount,
	)[0];
	const hasContent = best.draft.itemCount > 0;

	return (
		<div className="mb-4 flex flex-col gap-3 rounded-product-card border border-product-primary/45 bg-product-primary-soft px-[18px] py-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-start gap-3">
				<Rocket
					aria-hidden="true"
					className="mt-0.5 size-5 flex-none text-product-primary-ink"
				/>
				<div>
					<p className="font-semibold leading-snug">
						{hasContent
							? "Your catalogue is not live yet"
							: "Your catalogue is still empty"}
					</p>
					<p className="mt-0.5 text-[13.5px] leading-snug text-product-foreground-accent">
						{hasContent
							? `"${best.name}" has ${best.draft.itemCount} ${
									best.draft.itemCount === 1 ? "item" : "items"
								} saved. Publish it to get a link and a QR code you can share.`
							: `Open "${best.name}" and let Quick AI build it from a description or a photo of your menu.`}
					</p>
				</div>
			</div>
			<Button asChild className="shrink-0 sm:w-auto">
				<Link href={`/admin/${best.name}/builder`}>
					{hasContent ? "Open and publish" : "Finish your catalogue"}
				</Link>
			</Button>
		</div>
	);
}
