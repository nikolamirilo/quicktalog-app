import { tiers, UserData } from "@quicktalog/common";
import { getUserData } from "@/actions/users";
import OCRBuilder from "@/components/admin/create/OCRBuilder";
import LimitsModal from "@/components/modals/LimitsModal";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";

export const dynamic = "force-dynamic";
export default async function page() {
	const userData: UserData = await getUserData();
	if (
		userData &&
		userData.currentPlan.features.ocr_ai_import > 0 &&
		userData.usage.traffic.pageview_count <
			userData.currentPlan.features.traffic_limit
	) {
		return (
			<div className="product font-lora min-h-screen">
				<Navbar />
				<div className="w-full min-h-screen px-2 md:px-8 pt-24 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
					<div className="container mx-auto flex flex-col px-4 gap-8">
						<OCRBuilder
							api_url={process.env.BACKEND_BASE_URL!}
							userData={userData}
						/>
					</div>
				</div>
				<Footer />
			</div>
		);
	} else {
		return (
			<LimitsModal
				currentPlan={userData.currentPlan}
				isOpen={true}
				requiredPlan={
					userData.nextPlan.features.ocr_ai_import === 0
						? tiers.find((item) => item.features.ocr_ai_import > 0)
						: userData.nextPlan
				}
				type="ocr"
			/>
		);
	}
}
