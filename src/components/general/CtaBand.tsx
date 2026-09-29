import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

type CtaBandProps = {
	title: ReactNode;
	description?: ReactNode;
	/** Small uppercase label or a media element above the title. */
	kicker?: ReactNode;
	/** Short reassurance items shown with green checks. */
	checks?: string[];
	/** Resources pages show the checks as small print under the actions. */
	checksPlacement?: "above" | "below";
	/** Proof points with amber icons, shown between the checks and the actions. */
	trust?: { icon: ReactNode; label: string }[];
	actions: ReactNode;
	className?: string;
};

/** Dark closing call-to-action band. */
export function CtaBand({
	title,
	description,
	kicker,
	checks,
	checksPlacement = "above",
	trust,
	actions,
	className,
}: CtaBandProps) {
	return (
		<section
			className={cn(
				"relative isolate overflow-hidden rounded-product-band bg-product-dark-deep px-[22px] py-[72px] text-center text-white sm:px-10 sm:py-[88px]",
				className,
			)}
		>
			<div
				aria-hidden="true"
				className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)]"
			/>
			<div
				aria-hidden="true"
				className="absolute -bottom-[340px] left-1/2 -z-10 h-[620px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(var(--product-primary-rgb)/0.28),rgb(var(--product-primary-rgb)/0.08)_55%,transparent)]"
			/>
			{kicker && <div className="mb-5 flex justify-center">{kicker}</div>}
			<h2 className="mx-auto mb-[18px] max-w-[780px] text-balance text-[clamp(28px,4.4vw,50px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
				{title}
			</h2>
			{description && (
				<p className="mx-auto mb-8 max-w-[672px] text-lg text-product-on-dark">
					{description}
				</p>
			)}
			{checksPlacement === "above" && (
				<CheckList checks={checks} className="mb-8" />
			)}
			{trust && trust.length > 0 && (
				<ul className="mb-8 flex flex-col items-center justify-center gap-x-6 gap-y-3 sm:flex-row">
					{trust.map(({ icon, label }) => (
						<li
							className="flex items-center gap-2 text-[14.5px] text-product-on-dark-muted [&_svg]:size-4 [&_svg]:text-product-primary"
							key={label}
						>
							{icon}
							{label}
						</li>
					))}
				</ul>
			)}
			<div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row">
				{actions}
			</div>
			{checksPlacement === "below" && (
				<CheckList checks={checks} className="mt-6" />
			)}
		</section>
	);
}

function CheckList({
	checks,
	className,
}: {
	checks?: string[];
	className?: string;
}) {
	if (!checks?.length) return null;
	return (
		<ul
			className={cn("flex flex-wrap justify-center gap-x-5 gap-y-3", className)}
		>
			{checks.map((check) => (
				<li
					className="flex items-center gap-2 text-[14.5px] text-product-on-dark-muted"
					key={check}
				>
					<Check
						aria-hidden="true"
						className="h-4 w-4 text-product-success-on-dark"
					/>
					{check}
				</li>
			))}
		</ul>
	);
}

/** Uppercase amber label for dark surfaces. */
export function CtaKicker({ children }: { children: ReactNode }) {
	return (
		<span className="inline-flex items-center gap-[7px] rounded-full border border-product-primary/30 bg-product-primary/[0.12] px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-product-primary-bright [&_svg]:size-3.5">
			{children}
		</span>
	);
}
