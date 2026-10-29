import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ManualShell } from "@/components/manual/ManualShell";
import { generateManualMetadata } from "@/constants/metadata";
import { generateManualSchema } from "@/constants/schemas";
import {
	getManualPage,
	getManualSubSlugs,
	manualHref,
} from "@/lib/content/manual";

// Only the known pages render. Anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
	return getManualSubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const page = getManualPage(slug);
	if (!page) return {};
	return generateManualMetadata(page.meta, manualHref(slug));
}

export default async function ManualPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const page = getManualPage(slug);
	if (!page) notFound();

	const { meta, Body } = page;
	const schema = generateManualSchema(meta, manualHref(slug));

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
				type="application/ld+json"
			/>
			<ManualShell meta={meta}>
				<Body />
			</ManualShell>
		</>
	);
}
