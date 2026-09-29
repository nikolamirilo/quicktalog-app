import { notFound } from "next/navigation";
import { AppShell } from "@/components/navigation/AppShell";
import { QrEditor } from "@/components/qr-editor/QrEditor";
import { QrProvider } from "@/context/QRContext";
import { requireUser } from "@/lib/auth/session";
import { getOwnedCatalogue } from "@/lib/catalogue/ownership";
import { getOwnedQrConfig } from "@/lib/qr/configs";
import { catalogueUrl, loadQrConfig } from "@/lib/qr/design";
import { withUser } from "@/utils/db";

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
		const catalogue = await getOwnedCatalogue(tx, me, name);
		if (!catalogue) return null;
		return {
			status: catalogue.status,
			config: await getOwnedQrConfig(tx, me, name),
		};
	});
	if (!owned) {
		notFound();
	}

	return (
		<AppShell>
			<QrProvider
				initialOptions={loadQrConfig(owned.config, catalogueUrl(name))}
			>
				<QrEditor
					hasSavedDesign={Boolean(owned.config)}
					name={name}
					status={owned.status}
				/>
			</QrProvider>
		</AppShell>
	);
}
