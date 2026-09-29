import { ArrowRight, Check, X } from "lucide-react";

import { Rise } from "@/components/general/Rise";
import { ProblemPreview } from "@/components/home/problems/ProblemPreviews";
import type { Problem } from "@/constants/marketing";

/** One problem: the "Before" card, an arrow and the "With Quicktalog" card. */
export function BeforeAfter({
	problem,
	index,
}: {
	problem: Problem;
	index: number;
}) {
	const headingId = `problem-${index}`;
	return (
		<Rise aria-labelledby={headingId} as="article">
			<div className="mb-[18px] flex flex-col items-start gap-2.5">
				<span className="rounded-full bg-product-primary-soft px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-product-primary-ink">
					{problem.topic}
				</span>
				<h3
					className="max-w-[24ch] text-balance text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.15]"
					id={headingId}
				>
					{problem.title}
				</h3>
			</div>
			<div className="grid grid-cols-1 items-stretch gap-3 min-[880px]:grid-cols-[minmax(0,1fr)_56px_minmax(0,1.08fr)]">
				<div className="flex flex-col gap-3.5 rounded-product-card border border-dashed border-product-border-strong bg-product-background-hero px-[22px] pb-[22px] pt-6 min-[880px]:px-7 min-[880px]:pb-[26px] min-[880px]:pt-7">
					<span className="self-start rounded-full bg-product-error-soft px-[11px] py-[5px] text-[12.5px] font-bold text-product-error">
						Before
					</span>
					<p className="max-w-[46ch] text-base leading-[1.6] text-product-muted">
						{problem.before.text}
					</p>
					<ul className="grid gap-[9px]">
						{problem.before.points.map((point) => (
							<li
								className="flex items-start gap-2.5 text-[15px] leading-[1.4] text-product-muted"
								key={point}
							>
								<X
									aria-hidden="true"
									className="mt-px box-content h-3 w-3 flex-none rounded-full bg-product-error-soft p-1 text-product-error"
								/>
								<span>
									<span className="sr-only">Problem: </span>
									{point}
								</span>
							</li>
						))}
					</ul>
				</div>
				<div
					aria-hidden="true"
					className="z-[1] -my-1 grid h-11 w-11 rotate-90 place-items-center self-center justify-self-center rounded-full bg-product-primary text-product-foreground shadow-product-primary min-[880px]:my-0 min-[880px]:rotate-0"
				>
					<ArrowRight className="h-5 w-5" />
				</div>
				<div className="flex flex-col gap-3.5 rounded-product-card border-[1.5px] border-product-primary/55 bg-product-card px-[22px] pb-[22px] pt-6 shadow-[var(--product-shadow),0_0_0_6px_rgb(var(--product-primary-rgb)/0.08)] transition-[transform,box-shadow] duration-[250ms] hover:-translate-y-[3px] hover:shadow-[var(--product-shadow-hover),0_0_0_6px_rgb(var(--product-primary-rgb)/0.12)] min-[880px]:px-7 min-[880px]:pb-[26px] min-[880px]:pt-7">
					<span className="self-start rounded-full bg-product-primary px-[11px] py-[5px] text-[12.5px] font-bold text-product-foreground">
						With Quicktalog
					</span>
					<p className="max-w-[46ch] text-base font-medium leading-[1.6]">
						{problem.after.text}
					</p>
					<ul className="grid gap-[9px]">
						{problem.after.points.map((point) => (
							<li
								className="flex items-start gap-2.5 text-[15px] font-medium leading-[1.4]"
								key={point}
							>
								<Check
									aria-hidden="true"
									className="mt-px box-content h-3 w-3 flex-none rounded-full bg-product-primary-soft p-1 text-product-primary-ink"
								/>
								{point}
							</li>
						))}
					</ul>
					<div
						aria-hidden="true"
						className="mt-auto rounded-2xl border border-product-border bg-product-background px-3.5 py-3"
					>
						<ProblemPreview kind={problem.preview} />
					</div>
				</div>
			</div>
		</Rise>
	);
}
