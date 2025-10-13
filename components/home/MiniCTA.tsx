"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { FiArrowRight } from "react-icons/fi";

const MiniCTA: React.FC = () => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			viewport={{ once: true }}
			className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-r from-white via-product-primary/25 to-product-primary/40 border border-product-border shadow-md"
		>
			{/* Background gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-r from-white/60 via-product-primary/15 to-product-primary/25 pointer-events-none" />

			<div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
				{/* Left content */}
				<div className="flex-1 space-y-4">
					{/* Main heading - inline on larger screens */}
					<h3 className="text-xl lg:text-2xl font-semibold text-product-foreground">
						Need something <span className="text-product-primary">custom</span>?{" "}
						We've got you covered.
					</h3>

					{/* Product-specific features in one row */}
					<div className="flex flex-wrap items-center gap-4">
						{[
							"Unlimited catalogs",
							"Custom branding",
							"Advanced analytics",
							"Priority support",
						].map((feature, index) => (
							<div key={index} className="flex items-center gap-3">
								<div className="flex-shrink-0 w-5 h-5 bg-product-primary/10 rounded-full flex items-center justify-center">
									<BsFillCheckCircleFill className="w-3 h-3 text-product-primary" />
								</div>
								<span className="text-sm text-product-foreground-accent font-medium">
									{feature}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Right CTA button */}
				<div className="flex-shrink-0 w-full sm:w-auto">
					<Button
						asChild
						className="w-full sm:w-auto bg-product-primary hover:bg-product-primary-accent text-product-secondary px-6 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
					>
						<Link
							href="/contact"
							className="flex items-center  justify-center gap-2"
						>
							Get Started
							<FiArrowRight className="w-4 h-4" />
						</Link>
					</Button>
				</div>
			</div>
		</motion.div>
	);
};

export default MiniCTA;
