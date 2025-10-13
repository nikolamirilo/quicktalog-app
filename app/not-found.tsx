import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FiArrowLeft, FiHome, FiSearch } from "react-icons/fi";

export const metadata = {
	title: "Page Not Found - Quicktalog",
	description:
		"The page you're looking for doesn't exist. Return to our homepage to create your digital catalog.",
};

export default function NotFound() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-product-background to-hero-product-background flex items-center justify-center p-4">
			{/* Background Pattern */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>

			<div className="relative z-10 max-w-2xl mx-auto text-center">
				{/* Main Container */}
				<div className="bg-product-background/95 backdrop-blur-sm border border-product-border rounded-3xl shadow-md p-8 sm:p-12 lg:p-16">
					{/* 404 Number */}
					<div className="mb-8">
						<h1 className="text-6xl sm:text-8xl lg:text-[8rem] 2xl:text-[10rem] font-bold text-product-primary/20 font-heading leading-none">
							404
						</h1>
					</div>

					{/* Main Content */}
					<div className="space-y-4 mb-8">
						<div className="flex items-center row justify-center gap-3">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-product-primary/10 rounded-full flex items-center justify-center">
								<FiSearch className="w-5 h-5 sm:w-6 sm:h-6 text-product-primary" />
							</div>
							<h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-product-foreground font-heading">
								Page Not Found
							</h2>
						</div>
						<p className="text-base sm:text-lg text-product-foreground-accent font-body max-w-md mx-auto">
							Oops! The page you're looking for seems to have wandered off.
							Let's get you back to creating amazing digital catalogs.
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Button asChild variant="cta" className="w-full sm:w-auto">
							<Link href="/" className="flex items-center gap-2">
								<FiHome className="w-4 h-4" />
								Return Home
							</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="w-full sm:w-auto border-2 border-product-primary"
						>
							<Link href="/admin/dashboard" className="flex items-center gap-2">
								<FiArrowLeft className="w-4 h-4" />
								Go to Dashboard
							</Link>
						</Button>
					</div>

					{/* Helpful Links */}
					<div className="mt-8 pt-6 border-t border-product-border">
						<p className="text-sm text-product-foreground-accent mb-4 font-body">
							Looking for something specific?
						</p>
						<div className="flex flex-wrap justify-center gap-4 text-sm">
							<Link
								href="/pricing"
								className="text-product-primary hover:text-product-primary-accent transition-colors duration-200 font-medium"
							>
								Pricing
							</Link>
							<Link
								href="/contact"
								className="text-product-primary hover:text-product-primary-accent transition-colors duration-200 font-medium"
							>
								Contact
							</Link>
							<Link
								href="/demo"
								className="text-product-primary hover:text-product-primary-accent transition-colors duration-200 font-medium"
							>
								Try Demo
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
