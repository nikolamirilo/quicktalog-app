import Catalogue from "@/components/catalogue/view/Catalogue";
import LimitsModal from "@/components/modals/LimitsModal";
import { redis } from "@/utils/redis";
import * as Sentry from "@sentry/nextjs";
import { Catalogue as CatalogueType } from "@quicktalog/common";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Preview | Quicktalog",
	description: "Preview your catalogue",
};

const PreviewPage = async ({
	params,
}: {
	params: Promise<{ name: string }>;
}) => {
	try {
		const { name } = await params;

		if (!name) {
			throw new Error("Catalogue name is required");
		}

		console.log("Fetching preview for:", name);

		const data = await redis.get(name);

		if (!data) {
			console.warn("No data found for the service catalogue");
			return <LimitsModal isOpen={true} type="notFound" />;
		}

		const item = data as CatalogueType;

		if (!item.heading || !item.content) {
			console.warn("Invalid catalogue data:", item);
		}

		// For preview, we don't strictly check status, or we allow draft
		return <Catalogue item={item} type="view" />;
	} catch (error) {
		// A Redis failure here is indistinguishable from "not found" for the
		// visitor, so make sure it still reaches Sentry instead of only stderr.
		Sentry.captureException(error, { tags: { op: "cataloguePreview" } });
		console.warn("Catalogue preview error:", error);
		return <LimitsModal isOpen={true} type="notFound" />;
	}
};

export default PreviewPage;
