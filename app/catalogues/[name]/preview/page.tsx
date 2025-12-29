import Catalogue from "@/components/catalogue/display/Catalogue";
import LimitsModal from "@/components/modals/LimitsModal";
import { Catalogue as CatalogueType } from "@/types/catalogue";
import { redis } from "@/utils/redis";

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
			throw new Error("Service catalogue name is required");
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
		console.warn("Service catalogue preview error:", error);
		return <LimitsModal isOpen={true} type="notFound" />;
	}
};

export default PreviewPage;
