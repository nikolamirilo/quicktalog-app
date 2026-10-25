import { footerFeatures } from "@/constants/ui";

const Features = () => (
	<div className="cat-foot-col">
		<h2>Platform</h2>
		<ul className="cat-foot-feat">
			{footerFeatures.map((feature) => (
				<li key={feature.title}>
					{feature.icon}
					<span>
						<b>{feature.title}</b>
						<span>{feature.description}</span>
					</span>
				</li>
			))}
		</ul>
	</div>
);

export default Features;
