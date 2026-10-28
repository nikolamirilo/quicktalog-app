import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ManualShell } from "@/components/manual/ManualShell";
import { generateManualMetadata } from "@/constants/metadata";
import {
	MANUAL_BASE,
	getManualHomeSlug,
	getManualPage,
} from "@/lib/content/manual";

const homePage = () => {
	const slug = getManualHomeSlug();
	return slug ? getManualPage(slug) : undefined;
};

export function generateMetadata(): Metadata {
	const page = homePage();
	return page ? generateManualMetadata(page.meta, MANUAL_BASE) : {};
}

export default function ManualHomePage() {
	const page = homePage();
	if (!page) notFound();

	const { meta, Body } = page;

	return (
		<ManualShell meta={meta}>
			<Body />
		</ManualShell>
	);
}
