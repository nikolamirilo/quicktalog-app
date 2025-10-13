import { testimonials } from "@/constants/details";
import React from "react";
import { FiTrendingUp } from "react-icons/fi";

const Testimonials: React.FC = () => {
	return (
		<div className="grid gap-14 max-w-lg w-full mx-auto lg:gap-8 lg:grid-cols-3 lg:max-w-full">
			{testimonials.map((testimonial, index) => (
				<div key={index} className="">
					<div className="flex items-center mb-4 w-full justify-center lg:justify-start">
						<img
							src={testimonial.avatar}
							alt={`${testimonial.name} avatar`}
							width={50}
							height={50}
							className="rounded-full shadow-md"
						/>
						<div className="ml-4">
							<h3 className="text-lg font-semibold text-product-secondary">
								{testimonial.name}
							</h3>
							<p className="text-sm text-product-foreground-accent">
								{testimonial.role}
							</p>
							{testimonial.industry && (
								<div className="flex items-center gap-1 mt-1">
									<span className="text-xs bg-product-primary/10 text-product-primary px-2 py-1 rounded-full">
										{testimonial.industry}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Metric badge */}
					{testimonial.metric && (
						<div className="mb-3 flex items-center gap-2">
							<FiTrendingUp className="w-4 h-4 text-product-primary" />
							<span className="text-sm font-semibold text-product-primary">
								{testimonial.metric}
							</span>
						</div>
					)}

					<p className="text-product-foreground-accent text-center lg:text-left">
						&quot;{testimonial.message}&quot;
					</p>
				</div>
			))}
		</div>
	);
};

export default Testimonials;
