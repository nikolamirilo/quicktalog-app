import React from "react";
import { getQrConfig } from "@/actions/qr-configs";
import Navbar from "@/components/navigation/Navbar";
import QrControls from "@/components/qr-editor/qr-controls";
import QrPreview from "@/components/qr-editor/qr-preview";
import { QrProvider } from "@/context/QRContext";

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
				<div className="min-h-screen px-2 sm:px-[10%] bg-neutral-50 dark:bg-neutral-950 py-24">
					<div className="container mx-auto px-4 py-8 max-w-7xl">
						<div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
							{/* Left Column: Controls */}
							<div className="w-full md:w-1/2 lg:w-8/12 xl:w-2/3">
								<div className="sticky top-8">
									<div className="mb-6">
										<h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
											QR Code Editor
										</h1>
										<p className="text-neutral-500 dark:text-neutral-400 mt-2">
											Create beautiful, customized QR codes for your brand.
										</p>
									</div>
									<QrControls name={name} />
								</div>
							</div>

							{/* Right Column: Preview */}
							<div className="w-full md:w-1/2 lg:w-4/12 xl:w-1/3 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm min-h-[calc(100vh-100px)] flex items-start sm:py-24 justify-center">
								<QrPreview name={name} />
							</div>
						</div>
					</div>
				</div>
			</QrProvider>
		</>
	);
}
