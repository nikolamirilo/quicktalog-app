import React from "react";
import { getQrConfig } from "@/actions/qr-configs";
import Navbar from "@/components/navigation/Navbar";
import QrControls from "@/components/qr-editor/qr-controls";
import QrPreview from "@/components/qr-editor/qr-preview";
import { QrProvider } from "@/context/QRContext";
import QrEditor from "@/components/qr-editor/QrEditor";

export default async function page({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name } = await params;
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
