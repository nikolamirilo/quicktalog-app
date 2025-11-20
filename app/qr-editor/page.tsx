"use client";

import React from "react";
import { QrProvider } from "@/context/qr-context";
import QrPreview from "@/components/qr-editor/qr-preview";
import QrControls from "@/components/qr-editor/qr-controls";

export default function QrEditorPage() {
	return (
		<QrProvider>
			<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
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
								<QrControls />
							</div>
						</div>

						{/* Right Column: Preview */}
						<div className="w-full md:w-1/2 lg:w-4/12 xl:w-1/3 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm min-h-[calc(100vh-100px)] flex items-center justify-center">
							<QrPreview />
						</div>
					</div>
				</div>
			</div>
		</QrProvider>
	);
}
