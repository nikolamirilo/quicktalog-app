"use client";
import { useRouter } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";

const Demo = () => {
	const router = useRouter();
	return (
		<div className="group relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
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

				{/* CTA pinned to bottom-right */}
				<div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 flex justify-end">
					<div className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-product-primary text-black text-sm sm:text-base font-bold shadow-lg shadow-product-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-product-primary/40 group-hover:-translate-y-1">
						<span>Try it out</span>
						<FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
					</div>
				</div>
			</button>
		</div>
	);
};
export default Demo;
