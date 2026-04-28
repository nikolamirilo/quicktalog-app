"use client";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";

const Demo = () => {
	const router = useRouter();
	return (
		<div className="group relative max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
			<button
				aria-label="Play demo video"
				className="relative block w-full text-left cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-product-primary/50"
				onClick={() => router.push("/demo")}
			>
				{/* Image with slow zoom on hover */}
				<div className="overflow-hidden aspect-[4/3] sm:aspect-video">
					<img
						alt="Quicktalog product preview"
						className="w-full h-full object-cover will-change-transform transition-transform [transition-duration:1800ms] [transition-timing-function:cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-[1.03]"
						src="/images/quicktalog-banner.png"
					/>
				</div>

				{/* Gradient overlay, darker at the bottom for readability */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

				{/* CTA: fully centered on mobile, pinned bottom-right on larger screens */}
				<div className="absolute inset-0 flex items-center justify-center p-5 sm:p-8 md:p-10 sm:items-end sm:justify-end">
					<div className="inline-flex items-center gap-2.5 px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl bg-product-primary text-black text-base sm:text-lg font-bold shadow-lg shadow-product-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-product-primary/40 group-hover:-translate-y-1">
						<span>Try it out</span>
						<FiArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
					</div>
				</div>
			</button>
		</div>
	);
};
export default Demo;
