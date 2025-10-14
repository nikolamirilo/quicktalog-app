import { benefits } from "@/constants/ui";
import BenefitSection from "./BenefitSection";

const Benefits: React.FC = () => {
	return (
		<div className="text-product-foreground" id="features">
			<h2 className="sr-only">Features</h2>
			{benefits.map((item, index) => {
				return (
					<BenefitSection
						benefit={item}
						imageAtRight={index % 2 !== 0}
						key={`benefit-${index}`}
					/>
				);
			})}
		</div>
	);
};

export default Benefits;
