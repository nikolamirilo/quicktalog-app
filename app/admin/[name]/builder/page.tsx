import Builder from "@/components/catalogue/builder/CatalogueBuilder";
import CatalogueInitializer from "@/components/catalogue/builder/CatalogueInitializer";
import { getCatalogueByName } from "@/server_actions/catalogue";
import { Catalogue } from "@/types/catalogue";

const page = async ({ params }: { params: Promise<{ name: string }> }) => {
	const { name } = await params;
	const res = await getCatalogueByName(name);
	const catalogue = res.data as Catalogue;
	return (
		<>
			{catalogue && <CatalogueInitializer catalogue={catalogue} />}
			<Builder item={catalogue} />
		</>
	);
};

export default page;
