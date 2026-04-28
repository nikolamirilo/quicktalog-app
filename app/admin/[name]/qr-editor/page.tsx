import Navbar from "@/components/navigation/Navbar";
import QrEditor from "@/components/qr-editor/QrEditor";
import { QrProvider } from "@/context/QRContext";
import { getQrConfig } from "@/server_actions/qr-configs";

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
