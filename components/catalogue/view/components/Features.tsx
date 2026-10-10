import { footerFeatures } from "@/constants/ui";

export const Features = () => {
	return (
		<div className="space-y-6">
			<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-catalogue-navigation-text">
				<div
					aria-hidden="true"
					className="w-1 h-5 bg-primary rounded-full"
				></div>
				<span>Platform Features</span>
			</h4>
			<ul className="space-y-4">
				{footerFeatures.map((feature, index) => (
					<li
						className="flex items-start space-x-3 group text-catalogue-navigation-text"
						key={`footer-feature-${index}`}
					>
						<div className="mt-1 group-hover:scale-110 transition-transform duration-200 text-catalogue-navigation-text">
							{feature.icon}
						</div>
						<div>
							<div className="font-semibold text-sm font-heading font-weight-heading tracking-heading text-catalogue-navigation-text">
								{feature.title}
							</div>
							<div className="text-xs opacity-75">{feature.description}</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
};

export default Features;
