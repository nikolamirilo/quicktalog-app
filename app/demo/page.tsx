import GetStartedCTA from "@/components/general/GetStartedCTA";
import SectionWrapper from "@/components/home/SectionWrapper";
import { Navbar } from "@/components/navigation";

const Page = () => {
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
							<div className="rounded-2xl sm:rounded-3xl overflow-hidden">
								<iframe
									allowFullScreen
									className="block w-full aspect-video border-0"
									loading="lazy"
									src="https://app.usehexus.com/embed/254bfe62-3496-414e-93e8-5447b8fa54a9"
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
