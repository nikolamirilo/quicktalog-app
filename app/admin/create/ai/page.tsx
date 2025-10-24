import { getUserData } from "@/actions/users";
import AIBuilder from "@/components/admin/create/AIBuilder";
import LimitsModal from "@/components/modals/LimitsModal";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { UserData } from "@/types";

export const dynamic = "force-dynamic";
export default async function page() {
	const userData: UserData = await getUserData();
	if (userData && userData.currentPlan.features.ai_prompts > 0) {
		return (
			<div className="product font-lora min-h-screen">
				<Navbar />
				<div className="w-full min-h-screen md:px-8 pt-24 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
					<div className="container mx-auto flex flex-col px-4 gap-8">
						<AIBuilder
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
				isOpen={
					userData && userData.currentPlan.features.ai_prompts > 0
						? false
						: true
				}
				requiredPlan={userData.nextPlan}
				type="ai"
			/>
		);
	}
}
