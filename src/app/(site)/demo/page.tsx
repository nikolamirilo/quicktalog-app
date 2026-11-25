import { DemoPreview } from "@/components/demo/DemoPreview";
import { DemoTour } from "@/components/demo/DemoTour";
import { Container } from "@/components/general/Container";
import { GetStartedCTA } from "@/components/general/GetStartedCTA";
import { PageHero } from "@/components/general/PageHero";
import { PRODUCT_TOUR_URL } from "@/constants/marketing";

const Page = () => {
	return (
		<>
			<PageHero
				lead="Walk through the product at your own pace. Click around, explore the flow, and see how it fits what you are building."
				short
				title="Discover It in Action"
			/>
			{/*
			 * The static preview comes first and needs no JavaScript: the tour below
			 * is a third-party iframe, so a fetch of this page used to return
			 * "Loading tour…" and nothing about the product.
			 */}
			<Container as="section" className="pb-4 pt-2">
				<DemoPreview />
			</Container>
			<Container as="section" className="pb-10 pt-6">
				{PRODUCT_TOUR_URL && (
					<>
						<h2 className="mb-5 text-center text-[clamp(21px,2.4vw,27px)] font-bold leading-[1.2] tracking-[-0.02em]">
							Take the interactive tour
						</h2>
						<DemoTour />
					</>
				)}
				<GetStartedCTA />
			</Container>
		</>
	);
};

export default Page;
