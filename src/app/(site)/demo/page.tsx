import { DemoTour } from "@/components/demo/DemoTour";
import { Container } from "@/components/general/Container";
import { GetStartedCTA } from "@/components/general/GetStartedCTA";
import { PageHero } from "@/components/general/PageHero";

const Page = () => {
	return (
		<>
			<PageHero
				lead="Walk through the product at your own pace. Click around, explore the flow, and see how it fits what you are building."
				short
				title="Discover It in Action"
			/>
			<Container as="section" className="pb-10 pt-2">
				<h2 className="sr-only">Interactive product tour</h2>
				<DemoTour />
				<GetStartedCTA />
			</Container>
		</>
	);
};

export default Page;
