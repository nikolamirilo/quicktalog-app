import React from "react";
import { getQrConfig } from "@/actions/qr-configs";
import Navbar from "@/components/navigation/Navbar";
import QrControls from "@/components/qr-editor/qr-controls";
import QrPreview from "@/components/qr-editor/qr-preview";
import { QrProvider } from "@/context/QRContext";
import { NavigationGuard } from "@/hooks/useBeforeUnload";

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
				<div className="min-h-screen px-2 sm:px-[10%] bg-gradient-to-br from-product-background to-hero-product-background py-24 font-lora">
					<div className="container mx-auto px-4 py-8 max-w-7xl">
						<div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
							{/* Left Column: Controls */}
							<div className="w-full md:w-1/2 lg:w-8/12 xl:w-2/3">
								<div className="sticky top-8">
									<div className="pb-6">
										<h1 className="text-4xl font-bold tracking-tight text-[var(--product-foreground)] mb-2">
											QR Code Editor
										</h1>
										<p className="text-gray-600 mt-2 text-base">
											Create beautiful, customized QR codes for your brand with our easy-to-use editor.
										</p>
									</div>
									<QrControls name={name} />
								</div>
							</div>

							{/* Right Column: Preview */}
							<div className="w-full md:w-1/2 lg:w-4/12 xl:w-1/3 bg-product-background rounded-3xl shadow-product-shadow flex items-start p-2 lg:my-24 justify-center">
								<QrPreview name={name} />
							</div>
						</div>
					</div>
				</div>
			</QrProvider>
		</>
	);
}
