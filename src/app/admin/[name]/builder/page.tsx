import { getCatalogueByName } from "@/actions/catalogue";
import { getUserData } from "@/actions/users";
import Builder from "@/components/catalogue/builder/CatalogueBuilder";
import CatalogueInitializer from "@/components/catalogue/builder/CatalogueInitializer";
import { requireUser } from "@/lib/auth/session";
import { Catalogue, UserData } from "@quicktalog/common";
import { notFound } from "next/navigation";

const page = async ({ params }: { params: Promise<{ name: string }> }) => {
	const { name } = await params;
	await requireUser(`/admin/${name}/builder`);

	// Returns data only when the signed-in user owns the catalogue.
	const res = await getCatalogueByName(name);
	if (!res.success || !res.data) {
		notFound();
	}
	const catalogue = res.data as Catalogue;

	const userData: UserData = await getUserData();

	return (
		<>
			<CatalogueInitializer catalogue={catalogue} />
			<Builder item={catalogue} userData={userData} />
		</>
	);
};

export default page;
