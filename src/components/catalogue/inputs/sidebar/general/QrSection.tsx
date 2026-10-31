import { PanelSection } from "@/components/catalogue/inputs/sidebar/panel";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import Link from "next/link";

/** The way from the editor panel to the QR editor, which is a page of its own. */
const QrSection = ({ name }: { name: string }) => (
	<PanelSection
		description="Design the code visitors scan, then download it for print."
		info="The code always points at your catalogue's public address. Colours, shape, logo and the label under the code are saved per catalogue, and the editor opens in a new tab so this draft stays as it is."
		title="QR code"
	>
		<Button asChild className="w-full" variant="outline">
			<Link href={`/admin/${name}/qr-editor`} rel="noreferrer" target="_blank">
				<QrCode aria-hidden="true" />
				Open QR editor
			</Link>
		</Button>
	</PanelSection>
);

export default QrSection;
