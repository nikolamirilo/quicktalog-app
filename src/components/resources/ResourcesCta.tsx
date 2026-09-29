import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/general/Container";
import { CtaBand, CtaKicker } from "@/components/general/CtaBand";
import { Button } from "@/components/ui/button";

type Props = {
	title?: string;
	description?: string;
};

/** Dark closing CTA used at the foot of the articles, docs and release-notes pages. */
export function ResourcesCta({
	title = "Launch your first interactive catalog today",
	description = "Turn your menu, services, or products into a beautiful digital catalog in minutes. Free forever plan included.",
}: Props) {
	return (
		<section aria-label="Get started" className="pb-4 pt-6">
			<Container>
				<CtaBand
					actions={
						<>
							<Button
								asChild
								className="group w-full min-[480px]:w-auto min-[480px]:min-w-[224px]"
								size="lg"
							>
								<Link href="/auth?mode=signup">
									Create free catalog
									<ArrowRight
										aria-hidden="true"
										className="transition-transform group-hover:translate-x-[3px]"
									/>
								</Link>
							</Button>
							<Button
								asChild
								className="w-full min-[480px]:w-auto min-[480px]:min-w-[224px]"
								size="lg"
								variant="inverse"
							>
								<Link href="/demo">See demo</Link>
							</Button>
						</>
					}
					checks={[
						"No credit card",
						"Free forever plan",
						"Setup in under 2 minutes",
					]}
					checksPlacement="below"
					description={description}
					kicker={
						<CtaKicker>
							<Sparkles aria-hidden="true" />
							Free forever plan available
						</CtaKicker>
					}
					title={title}
				/>
			</Container>
		</section>
	);
}
