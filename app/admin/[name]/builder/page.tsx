import Builder from "@/components/catalogue/builder/CatalogueBuilder";
import CatalogueInitializer from "@/components/catalogue/builder/CatalogueInitializer";
import { getCatalogueByName } from "@/server_actions/catalogue";
import { getUserData } from "@/server_actions/users";
import { Catalogue, UserData } from "@quicktalog/common";

const page = async ({ params }: { params: Promise<{ name: string }> }) => {
	const { name } = await params;
	const res = await getCatalogueByName(name);
	const catalogue = res.data as Catalogue;
	const userData: UserData = await getUserData();

	return (
		<>
			{catalogue && <CatalogueInitializer catalogue={catalogue} />}
			<Builder item={catalogue} userData={userData} />
		</>
	);
};

export default page;
