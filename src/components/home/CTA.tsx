import { Users, Zap } from "lucide-react";
import Link from "next/link";

import { CtaBand } from "@/components/general/CtaBand";
import { LottiePlayer } from "@/components/general/LottiePlayer";
import { Rise } from "@/components/general/Rise";
import { SignupButton } from "@/components/general/SignupButton";
import { Button } from "@/components/ui/button";

/** Closing dark band on the home page. */
export function CTA() {
	return (
		<Rise className="pb-12 pt-6" id="cta">
			<CtaBand
				actions={
					<>
						<SignupButton>Create Your Catalogue Now</SignupButton>
						<Button
							asChild
							className="w-full sm:w-auto sm:min-w-[224px]"
							size="lg"
							variant="inverse"
						>
							<Link href="/demo">Try the Demo</Link>
						</Button>
					</>
				}
				checks={["Free online catalog maker", "Cancel anytime"]}
				description="Launch a professional digital catalog with our catalog templates in minutes. The best free online catalog maker for businesses-no credit card required."
				kicker={
					<LottiePlayer
						animation="qr-scan"
						className="h-[124px] w-[124px] rounded-[26px] drop-shadow-[0_18px_30px_rgb(var(--product-primary-rgb)/0.25)]"
						restFrame={150}
					/>
				}
				title="Start With Our Free Online Catalogue Maker"
				trust={[
					{
						icon: <Zap aria-hidden="true" />,
						label: "Launch in under 5 minutes",
					},
					{
						icon: <Users aria-hidden="true" />,
						label: "Trusted by 1,000+ businesses",
					},
				]}
			/>
		</Rise>
	);
}
