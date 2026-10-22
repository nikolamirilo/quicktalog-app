import { Catalogue } from "@quicktalog/common";
import {
	InfoTip,
	PanelSection,
} from "@/components/catalogue/inputs/sidebar/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BusinessInfoSectionProps {
	catalogue: Catalogue;
	handleChange: (field: string, value: any) => void;
}

const FIELDS = [
	{
		key: "legalName",
		label: "Legal business name",
		info: "Your officially registered business name.",
		placeholder: "e.g. Quicktalog Inc.",
		url: false,
	},
	{
		key: "address",
		label: "Business address",
		info: "Your physical business address.",
		placeholder: "e.g. 123 Main St, San Francisco, CA",
		url: false,
	},
	{
		key: "termsAndConditions",
		label: "Terms & conditions link",
		info: "Link to your terms and conditions page.",
		placeholder: "e.g. https://mywebsite.com/terms",
		url: true,
	},
	{
		key: "privacyPolicy",
		label: "Privacy policy link",
		info: "Link to your privacy policy page.",
		placeholder: "e.g. https://mywebsite.com/privacy",
		url: true,
	},
] as const;

const BusinessInfoSection = ({
	catalogue,
	handleChange,
}: BusinessInfoSectionProps) => (
	<PanelSection
		info="Company details and legal links."
		title="Business information"
	>
		{FIELDS.map((field) => (
			<div className="space-y-2" key={field.key}>
				<div className="flex items-center gap-1">
					<Label htmlFor={`legal-${field.key}`}>{field.label}</Label>
					<InfoTip label={field.label}>{field.info}</InfoTip>
				</div>
				<Input
					id={`legal-${field.key}`}
					inputMode={field.url ? "url" : undefined}
					onChange={(e) => handleChange(`legal.${field.key}`, e.target.value)}
					placeholder={field.placeholder}
					value={catalogue.legal?.[field.key] || ""}
				/>
			</div>
		))}
	</PanelSection>
);

export default BusinessInfoSection;
