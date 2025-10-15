"use client";
import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { FiArrowRight, FiCheck, FiUsers, FiZap } from "react-icons/fi";

const containerVariants: Variants = {
	offscreen: {
		opacity: 0,
		y: 100,
	},
	onscreen: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring" as const,
			bounce: 0.2,
			duration: 0.9,
			delayChildren: 0.2,
			staggerChildren: 0.1,
		},
	},
};

const childVariants = {
	offscreen: {
		opacity: 0,
		y: 50,
	},
	onscreen: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring" as const,
			bounce: 0.2,
			duration: 0.8,
		},
	},
};

const CTA: React.FC = () => {
	return (
		<section id="cta" className="mt-10 mb-5 lg:my-20">
			<div className="relative h-full w-full z-10 mx-auto py-12 sm:py-20">
				<div className="h-full w-full">
					<div className="rounded-3xl opacity-95 absolute inset-0 -z-10 h-full w-full bg-[#050a02] bg-[linear-gradient(to_right,#12170f_1px,transparent_1px),linear-gradient(to_bottom,#12170f_1px,transparent_1px)] bg-[size:6rem_4rem]">
						<div className="rounded-3xl absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_600px_at_50%_500px,#1C1C02,transparent)]"></div>
					</div>

					<motion.div
						className="h-full flex flex-col items-center justify-center text-white text-center px-5"
						variants={containerVariants}
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ once: true }}
					>
						<motion.h2
							className="text-2xl sm:text-3xl md:text-5xl md:leading-tight font-semibold mb-4 max-w-3xl"
							variants={childVariants}
						>
							Start With Our Free Online Catalog Maker
						</motion.h2>

						<motion.p
							className="mx-auto max-w-2xl md:px-5 text-lg mb-8"
							variants={childVariants}
						>
							Launch a professional digital catalog with our catalog templates
							in minutes. The best free online catalog maker for businesses-no
							credit card required.
						</motion.p>

						{/* Risk reversal indicators */}
						<motion.div
							className="flex flex-wrap justify-center gap-4 mb-8 max-w-4xl"
							variants={childVariants}
						>
							<div className="flex items-center gap-2 text-sm text-gray-300 min-w-[180px] justify-center">
								<FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
								<span>Free online catalog maker</span>
							</div>
							<div className="flex items-center gap-2 text-sm text-gray-300 min-w-[180px] justify-center">
								<FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
								<span>Cancel anytime</span>
							</div>
						</motion.div>

						{/* Trust indicators */}
						<motion.div
							className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-gray-300 mb-6"
							variants={childVariants}
						>
							<div className="flex items-center gap-2">
								<FiZap className="w-4 h-4 text-product-primary" />
								<span>Launch in under 5 minutes</span>
							</div>
							<div className="flex items-center gap-2">
								<FiUsers className="w-4 h-4 text-product-primary" />
								<span>Trusted by 1,000+ businesses</span>
							</div>
						</motion.div>

						{/* Strong CTA button */}
						<motion.div
							className="flex flex-col sm:flex-row items-center gap-4"
							variants={childVariants}
						>
							<Link href="/auth?mode=signup">
								<Button variant="cta" className="text-lg px-8 py-4 h-14">
									Create Your Catalog Now
									<FiArrowRight className="w-5 h-5 ml-2" />
								</Button>
							</Link>
							<Link href="/demo">
								<Button
									variant="outline"
									className="text-lg px-8 py-4 h-14 border-2 border-white text-white hover:bg-product-background hover:text-black"
								>
									Try the Demo
								</Button>
							</Link>
						</motion.div>
					</motion.div>
				</div>
			</div>
		</section>
	);
};

export default CTA;
