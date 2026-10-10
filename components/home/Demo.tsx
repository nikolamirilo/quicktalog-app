"use client";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";

const Demo = () => {
	const router = useRouter();
	return (
		<div className="group relative max-w-5xl mx-auto">
			<button
				aria-label="Play demo video"
				className="block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-product-primary/50 rounded-2xl sm:rounded-3xl"
				onClick={() => router.push("/demo")}
			>
				{/* Image wrapper — relative on sm+ so the CTA can overlay; static on mobile so CTA sits below */}
				<div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
					<div className="overflow-hidden">
						<img
							alt="Quicktalog product preview"
							className="w-full h-auto will-change-transform transition-transform [transition-duration:1800ms] [transition-timing-function:cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.01]"
							src="/images/quicktalog-banner.png"
						/>
					</div>

					{/* Gradient overlay — only on sm+ where CTA sits on the image */}
					<div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

					{/* Desktop/tablet CTA: pinned bottom-right over the image */}
					<div className="hidden sm:flex absolute inset-0 items-end justify-end p-8 md:p-10">
						<div className="inline-flex items-center justify-center gap-2 h-14 px-8 py-4 min-w-56 rounded-lg bg-product-primary text-product-foreground text-lg font-semibold shadow-lg transition-all duration-300 transform group-hover:shadow-xl group-hover:scale-[1.03] group-hover:-translate-y-[2px]">
							<span>Try it out</span>
							<FiArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
						</div>
					</div>
				</div>

				{/* Mobile CTA: full-width, sits below the banner */}
				<div className="sm:hidden mt-4 flex justify-center">
					<div className="inline-flex w-full items-center justify-center gap-2 h-[50px] px-7 py-3.5 min-w-[200px] rounded-lg bg-product-primary text-product-foreground text-base font-semibold shadow-lg transition-all duration-300 transform group-active:shadow-xl group-active:scale-[1.03]">
						<span>Try it out</span>
						<FiArrowRight className="h-5 w-5 transition-transform duration-300 group-active:translate-x-1" />
					</div>
				</div>
			</button>
		</div>
	);
};
export default Demo;
