import { getCatalogueByName } from "@/actions/catalogue";
import { getQrConfig } from "@/actions/qr-configs";
import Navbar from "@/components/navigation/Navbar";
import QrEditor from "@/components/qr-editor/QrEditor";
import { QrProvider } from "@/context/QRContext";
import { currentUser } from "@clerk/nextjs/server";
import { Catalogue } from "@quicktalog/common";
import { notFound } from "next/navigation";

export default async function page({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name } = await params;
	const [user, res] = await Promise.all([
		currentUser(),
		getCatalogueByName(name),
	]);
	const catalogue = res.data as Catalogue;

	if (!catalogue || catalogue.createdBy !== user?.id) {
		notFound();
	}

	const { config } = await getQrConfig(name);

	return (
		<>
			<Navbar />
			<QrProvider initialOptions={config}>
				<QrEditor name={name} />
			</QrProvider>
		</>
	);
}
