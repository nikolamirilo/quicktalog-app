import { getCatalogueByName } from "@/actions/catalogue";
import Catalogue from "@/components/catalogue/view/Catalogue";
import LimitsModal from "@/components/modals/LimitsModal";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import * as Sentry from "@sentry/nextjs";
import { Catalogue as CatalogueType } from "@quicktalog/common";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Preview | Quicktalog",
	description: "Preview your catalogue",
	robots: { index: false, follow: false },
};

/** Draft preview for the catalogue's owner only. */
const PreviewPage = async ({
	params,
}: {
	params: Promise<{ name: string }>;
}) => {
	const { name } = await params;

	if (!(await getVerifiedIdentity())) {
		redirect(`/auth?next=${encodeURIComponent(`/catalogues/${name}/preview`)}`);
	}

	try {
		const result = await getCatalogueByName(name);
		if (!result.success || !result.data) {
			return <LimitsModal isOpen={true} type="notFound" />;
		}

		return <Catalogue item={result.data as CatalogueType} type="view" />;
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "cataloguePreview" } });
		console.warn("Catalogue preview error:", error);
		return <LimitsModal isOpen={true} type="notFound" />;
	}
};

export default PreviewPage;
