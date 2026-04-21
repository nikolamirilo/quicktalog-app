"use client";

import GetStartedCTA from "@/components/general/GetStartedCTA";
import SectionWrapper from "@/components/home/SectionWrapper";
import { Navbar } from "@/components/navigation";
import { useState } from "react";

const Page = () => {
	const [isLoaded, setIsLoaded] = useState(false);

	return (
		<div className="min-h-screen text-text bg-background font-lora">
			<Navbar />
			<main className="mt-16">
				<SectionWrapper
					description="Walk through the product at your own pace. Click around, explore the flow, and see how it fits what you are building."
					id="demo"
					title="Discover It in Action"
				>
					<div className="px-4 sm:px-6 lg:px-8 pb-20 sm:pb-12">
						<div className="max-w-6xl mx-auto">
							<div className="rounded-2xl sm:rounded-3xl overflow-hidden relative aspect-video">
								{/* Skeleton — always in DOM, fades out once iframe is ready */}
								<style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
								<div
									className="absolute inset-0 z-10 pointer-events-none flex flex-col overflow-hidden bg-gray-100"
									style={{
										opacity: isLoaded ? 0 : 1,
										transition: "opacity 500ms",
									}}
								>
									{/* Browser-chrome toolbar */}
									<div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white/70 px-4 py-3">
										<div className="flex gap-1.5">
											<div className="h-3 w-3 animate-pulse rounded-full bg-gray-300" />
											<div className="h-3 w-3 animate-pulse rounded-full bg-gray-300" />
											<div className="h-3 w-3 animate-pulse rounded-full bg-gray-300" />
										</div>
										<div className="mx-3 h-5 flex-1 animate-pulse rounded-full bg-gray-200" />
										<div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
									</div>

									{/* Main shimmer area */}
									<div className="relative flex-1 overflow-hidden">
										<div
											className="absolute inset-0"
											style={{
												background:
													"linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)",
												backgroundSize: "200% 100%",
												animation: "shimmer 1.8s ease-in-out infinite",
											}}
										/>
										{/* Centered spinner */}
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-gray-500" />
										</div>
									</div>

									{/* Demo-player footer */}
									<div className="flex shrink-0 items-center gap-3 border-t border-gray-200 bg-white/70 px-4 py-3">
										<div className="h-7 w-7 animate-pulse rounded-full bg-gray-200" />
										<div className="h-1.5 flex-1 animate-pulse rounded-full bg-gray-200" />
										<div className="h-5 w-10 animate-pulse rounded bg-gray-200" />
									</div>
								</div>

								<iframe
									allowFullScreen
									className="absolute inset-0 w-full h-full border-0 transition-opacity duration-500"
									onLoad={() => setTimeout(() => setIsLoaded(true), 800)}
									src="https://app.usehexus.com/embed/254bfe62-3496-414e-93e8-5447b8fa54a9"
									style={{ opacity: isLoaded ? 1 : 0 }}
									title="Quicktalog interactive demo"
								/>
							</div>
						</div>
					</div>
				</SectionWrapper>

				<GetStartedCTA />
			</main>
		</div>
	);
};

export default Page;
