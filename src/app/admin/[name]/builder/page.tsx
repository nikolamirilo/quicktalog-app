import { getBuilderCatalogue } from "@/actions/catalogue";
import { getUserData } from "@/actions/users";
import Builder from "@/components/catalogue/builder/CatalogueBuilder";
import { requireUser } from "@/lib/auth/session";
import { UserData } from "@quicktalog/common";
import { notFound } from "next/navigation";

const page = async ({ params }: { params: Promise<{ name: string }> }) => {
	const { name } = await params;
	await requireUser(`/admin/${name}/builder`);

	// Returns data only when the signed-in user owns the catalogue.
	const res = await getBuilderCatalogue(name);
	if (!res.success || !res.data) {
		notFound();
	}

	const userData: UserData = await getUserData();

	return (
		<Builder
			draftUpdatedAt={res.draftUpdatedAt}
			item={res.data}
			unpublished={res.unpublished}
			userData={userData}
		/>
	);
};

export default page;
