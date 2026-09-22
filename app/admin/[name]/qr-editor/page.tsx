import Navbar from "@/components/navigation/Navbar";
import QrEditor from "@/components/qr-editor/QrEditor";
import { QrProvider } from "@/context/QRContext";
import { requireUser } from "@/lib/auth/session";
import { ownsCatalogue } from "@/lib/catalogue/ownership";
import { getOwnedQrConfig } from "@/lib/qr/configs";
import { withUser } from "@/utils/db";
import { notFound } from "next/navigation";

export default async function page({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name } = await params;
	const me = await requireUser(`/admin/${name}/qr-editor`);

	// Ownership and the config are read in one transaction, so a catalogue that
	// is not the caller's is a 404 rather than an empty editor.
	const owned = await withUser(me, async (tx) => {
		if (!(await ownsCatalogue(tx, me, name))) return null;
		return { config: await getOwnedQrConfig(tx, me, name) };
	});
	if (!owned) {
		notFound();
	}

	return (
		<>
			<Navbar />
			<QrProvider initialOptions={owned.config}>
				<QrEditor name={name} />
			</QrProvider>
		</>
	);
}
