import Builder from "@/components/catalogue/builder/CatalogueBuilder";
import CatalogueInitializer from "@/components/catalogue/builder/CatalogueInitializer";
import { getCatalogueByName } from "@/server_actions/catalogue";
import { getUserData } from "@/server_actions/users";
import { currentUser } from "@clerk/nextjs/server";
import { Catalogue, UserData } from "@quicktalog/common";
import { notFound } from "next/navigation";

const page = async ({ params }: { params: Promise<{ name: string }> }) => {
	const { name } = await params;
	const [user, res] = await Promise.all([
		currentUser(),
		getCatalogueByName(name),
	]);
	const catalogue = res.data as Catalogue;

	if (!catalogue || catalogue.createdBy !== user?.id) {
		notFound();
	}

	const userData: UserData = await getUserData();

	return (
		<>
			{catalogue && <CatalogueInitializer catalogue={catalogue} />}
			<Builder item={catalogue} userData={userData} />
		</>
	);
};

export default page;
