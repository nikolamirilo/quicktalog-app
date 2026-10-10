import { CheckList } from "@/components/general/CheckList";
import { Rise } from "@/components/general/Rise";
import { SignupButton } from "@/components/general/SignupButton";
import { TextLink } from "@/components/general/TextLink";
import { BeforeAfter } from "@/components/home/problems/BeforeAfter";
import { problems } from "@/constants/marketing";

/** Three before/after problems and a closing sign-up card. */
export function ProblemSection() {
	return (
		<>
			<div className="mx-auto flex max-w-[1120px] flex-col gap-14 min-[880px]:gap-16">
				{problems.map((problem, index) => (
					<BeforeAfter index={index} key={problem.topic} problem={problem} />
				))}
			</div>
			<Rise className="mx-auto mt-14 flex max-w-[1120px] flex-col items-center gap-[18px] rounded-product-panel border border-product-border bg-product-card px-[22px] py-7 text-center shadow-product min-[880px]:flex-row min-[880px]:justify-between min-[880px]:gap-6 min-[880px]:px-8 min-[880px]:text-left">
				<div className="flex flex-col items-center gap-2.5 min-[880px]:items-start">
					<h3 className="text-balance text-[clamp(21px,2.4vw,26px)] font-extrabold leading-[1.2] tracking-[-0.02em]">
						Switch from paper to a catalog that stays up to date.
					</h3>
					<CheckList
						className="gap-x-4 gap-y-1 min-[880px]:justify-start"
						items={["Free forever plan", "No credit card", "Cancel anytime"]}
					/>
				</div>
				<div className="flex w-full flex-wrap items-center justify-center gap-x-[22px] gap-y-3.5 sm:w-auto min-[880px]:flex-nowrap">
					<SignupButton />
					<TextLink className="underline-offset-4" href="/demo">
						See a live demo
					</TextLink>
				</div>
			</Rise>
		</>
	);
}
