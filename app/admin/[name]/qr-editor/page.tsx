import Navbar from "@/components/navigation/Navbar";
import QrEditor from "@/components/qr-editor/QrEditor";
import { QrProvider } from "@/context/QRContext";
import { requireUser } from "@/lib/auth/session";
import { ownsCatalogue } from "@/lib/catalogue/ownership";
import { getOwnedQrConfig } from "@/lib/qr/configs";
import { notFound } from "next/navigation";

export default async function page({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name } = await params;
	const me = await requireUser(`/admin/${name}/qr-editor`);

	if (!(await ownsCatalogue(me, name))) {
		notFound();
	}

	const config = await getOwnedQrConfig(me, name);

	return (
		<>
			<Navbar />
			<QrProvider initialOptions={config}>
				<QrEditor name={name} />
			</QrProvider>
		</>
	);
}
