import { UserData } from "@quicktalog/common";
import Link from "next/link";
import { getUserData } from "@/actions/users";
import Dashboard from "@/components/admin/dashboard/Dashboard";
import FloatingActionMenu from "@/components/admin/dashboard/FloatingActionMenu";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { Button } from "@/components/ui/button";
import type { AreLimitesReached } from "@/types";

export const dynamic = "force-dynamic";

export default async function page() {
	const userData: UserData = await getUserData();

	if (!userData) {
		return (
			<div className="product font-lora min-h-screen">
				<Navbar />
				<div className="text-center text-black text-2xl h-screen flex flex-col gap-5 items-center justify-center">
					<p>Something went wrong. Please try again later.</p>
					<Button size="lg">
						<Link href="/">Go to Home</Link>
					</Button>
				</div>
			</div>
		);
	}

	const { currentPlan, usage, ...user } = userData;
	const areLimitesReached: AreLimitesReached = {
		catalogues: usage.catalogues >= currentPlan.features.catalogues,
		ocr:
			usage.ocr >= currentPlan.features.ocr_ai_import ||
			usage.catalogues >= currentPlan.features.catalogues,
		prompts:
			usage.prompts >= currentPlan.features.ai_prompts ||
			usage.catalogues >= currentPlan.features.catalogues,
	};

	return (
		<div className="product font-lora min-h-screen">
			<Navbar />
			<Dashboard pricingPlan={currentPlan} usage={usage} user={user} />
			<FloatingActionMenu
				areLimitsReached={areLimitesReached}
				planId={currentPlan.id}
			/>
			<Footer />
		</div>
	);
}
