import { Catalogue } from "@quicktalog/common";
import {
	PanelSection,
	SliderField,
} from "@/components/catalogue/inputs/sidebar/panel";

interface LogoSizeSectionProps {
	catalogue: Catalogue;
	handleChange: (field: string, value: any) => void;
}

const LogoSizeSection = ({ catalogue, handleChange }: LogoSizeSectionProps) => {
	const width = catalogue.footer?.logoSize?.width || 160;
	return (
		<PanelSection
			info="Configure the size of the logo in your footer."
			title="Logo size"
		>
			<SliderField
				label="Logo width"
				max={400}
				min={20}
				onValueChange={(value) => handleChange("footer.logoSize.width", value)}
				step={2}
				value={width}
				valueText={`${width}px`}
			/>
		</PanelSection>
	);
};

export default LogoSizeSection;
