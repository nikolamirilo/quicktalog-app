"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiArrowRight, FiZap } from "react-icons/fi";

const AIShortcut = () => {
	return (
		<div className="lg:mt-0">
			<div className="text-center mb-6 lg:mb-12">
				<h1 className="text-2xl lg:text-4xl mb-5 font-bold font-lora text-product-foreground">
					Or
				</h1>

				<h3 className="text-2xl lg:text-3xl font-bold font-lora text-product-foreground">
					Let AI do the work
				</h3>
				<p className="text-sm lg:text-base text-product-foreground-accent mt-1">
					Describe your business and generate a ready-to-edit catalog in
					seconds.
				</p>
			</div>
			<motion.div
				className="w-full bg-product-background border border-product-border rounded-xl p-5 mb-10 sm:p-6 shadow-md"
				initial={{ opacity: 0, y: 30 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				{/* Card content */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
					{/* Illustration */}
					<div className="relative w-full h-full">
						<div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-gradient-to-br from-product-primary/5 to-product-primary/10 border border-product-border">
							<img
								src="/images/ai.svg"
								alt="AI generates your catalog"
								className="w-full h-full object-contain p-4"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.style.display = "none";
								}}
							/>
							<div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-product-primary text-product-background text-xs font-semibold shadow">
								<FiZap className="w-3.5 h-3.5" />
								<span>AI</span>
							</div>
						</div>
					</div>

					{/* Content */}
					<div className="flex flex-col gap-2">
						<h3 className="font-lora font-bold text-lg sm:text-xl">
							Generate your catalog with AI
						</h3>
						<p className="text-product-foreground-accent text-sm sm:text-base">
							Describe your business and get auto‑built categories, items, and
							pricing you can edit fast.
						</p>
						<div className="mt-2">
							<Link
								href="/admin/create/ai"
								className="inline-flex w-full sm:w-auto"
							>
								<Button
									variant="default"
									size="sm"
									className="no-tap-highlight w-full"
								>
									Try AI
									<FiArrowRight className="w-4 h-4 ml-2" />
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default AIShortcut;
