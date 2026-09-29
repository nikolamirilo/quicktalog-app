import { ArrowRight, Zap } from "lucide-react";

import { CreateCatalogueButton } from "@/components/catalogue/create/CreateCatalogueButton";
import { LottiePlayer } from "@/components/general/LottiePlayer";
import { Rise } from "@/components/general/Rise";
import { AiGlow } from "@/components/home/ai/AiGlow";
import { AiPromptBox } from "@/components/home/ai/AiPromptBox";
import { aiSteps } from "@/constants/marketing";

/** "Or let AI do the work": dark card with a live prompt demo. */
export function AiShortcut() {
	return (
		<section aria-labelledby="ai-shortcut-heading" className="pb-16 lg:pb-24">
			<Rise className="mb-10 text-center">
				<p
					aria-hidden="true"
					className="mb-[18px] flex items-center justify-center gap-[18px] font-product-heading text-[clamp(28px,3vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em] before:h-px before:w-14 before:bg-product-border-strong after:h-px after:w-14 after:bg-product-border-strong"
				>
					Or
				</p>
				<h2
					className="text-[clamp(24px,2.6vw,32px)] font-extrabold"
					id="ai-shortcut-heading"
				>
					<span className="sr-only">Or </span>Let AI do the work
				</h2>
				<p className="mt-2 text-base text-product-foreground-accent">
					Describe your business and generate a ready-to-edit catalog in
					seconds.
				</p>
			</Rise>

			<Rise className="relative isolate overflow-hidden rounded-product-panel p-[1.5px] shadow-[0_30px_60px_-30px_rgb(var(--product-foreground-rgb)/0.55),0_0_0_6px_rgb(var(--product-primary-rgb)/0.06)]">
				<AiGlow />
				<div className="relative isolate grid grid-cols-1 items-center gap-6 overflow-hidden rounded-[26.5px] bg-product-dark p-5 text-product-on-dark md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-9 md:p-7">
					<div
						aria-hidden="true"
						className="absolute inset-0 -z-10 bg-[radial-gradient(420px_260px_at_85%_0%,rgb(var(--product-primary-rgb)/0.22),transparent_70%),radial-gradient(360px_240px_at_0%_100%,rgb(var(--product-primary-rgb)/0.1),transparent_70%)]"
					/>
					<div
						aria-hidden="true"
						className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] opacity-50 [mask-image:radial-gradient(ellipse_at_70%_30%,#000_20%,transparent_75%)]"
					/>

					<div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(135deg,#fffbf1,#fff1d6)] shadow-[0_20px_50px_-20px_rgb(var(--product-primary-rgb)/0.45)]">
						<LottiePlayer
							animation="ai-build"
							className="absolute inset-0 m-2"
							fallback={
								<img
									alt=""
									className="h-full w-full object-contain p-2"
									loading="lazy"
									src="/images/marketing/ai.svg"
								/>
							}
							restFrame={200}
						/>
						<span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-product-primary px-[11px] py-[5px] text-[12.5px] font-bold text-product-foreground shadow-product-primary">
							<Zap aria-hidden="true" className="h-3.5 w-3.5" />
							AI
						</span>
						<span
							aria-hidden="true"
							className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-product-border bg-product-card px-3 py-[7px] text-[12.5px] font-bold text-product-foreground shadow-[0_8px_20px_-8px_rgb(var(--product-foreground-rgb)/0.35)]"
						>
							<i className="h-2 w-2 rounded-full bg-product-success-bright shadow-[0_0_0_3px_rgb(var(--product-success-bright-rgb)/0.18)]" />
							Draft ready to edit
						</span>
					</div>

					<div>
						<span className="inline-flex items-center gap-[7px] rounded-full border border-product-primary/30 bg-product-primary/[0.12] px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-product-primary-bright">
							<Zap aria-hidden="true" className="h-3.5 w-3.5" />
							AI catalog builder
						</span>
						<h3 className="mt-3.5 text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.025em] text-white">
							Generate your catalog with AI
						</h3>
						<p className="mt-2 text-base text-product-on-dark-muted">
							Describe your business and get auto‑built categories, items, and
							pricing you can edit fast.
						</p>

						<AiPromptBox />

						<CreateCatalogueButton className="group mt-[18px] w-full min-w-0 sm:w-auto">
							Try AI
							<ArrowRight
								aria-hidden="true"
								className="transition-transform group-hover:translate-x-[3px]"
							/>
						</CreateCatalogueButton>

						<ol className="mt-5 grid grid-cols-1 gap-2.5 border-t border-white/[0.08] pt-4 min-[421px]:grid-cols-3">
							{aiSteps.map((step, index) => (
								<li
									className="flex items-center gap-2 text-[13.5px] font-semibold leading-tight text-product-on-dark-muted"
									key={step}
								>
									<span
										aria-hidden="true"
										className="grid h-6 w-6 flex-none place-items-center rounded-full bg-product-primary text-xs font-extrabold text-product-foreground"
									>
										{index + 1}
									</span>
									{step}
								</li>
							))}
						</ol>
					</div>
				</div>
			</Rise>
		</section>
	);
}
