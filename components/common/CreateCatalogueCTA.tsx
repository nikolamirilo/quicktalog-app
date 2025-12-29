import React from "react";

const CreateCatalogueCTA = () => {
	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-product-background border-t border-product-border">
			<div className="max-w-4xl mx-auto">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-3">
					<div className="text-center sm:text-left">
						<p className="text-sm text-product-foreground font-medium">
							Ready to create your own catalogue?
						</p>
					</div>
					<div className="flex gap-2">
						<a
							className="bg-product-primary text-product-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-product-primary-accent transition-colors duration-200 shadow-product-shadow"
							href="/auth?mode=signup"
						>
							Get Started
						</a>
						<a
							className="text-product-secondary border border-product-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-product-primary hover:text-product-foreground transition-all duration-200"
							href="/pricing"
						>
							Pricing
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreateCatalogueCTA;
