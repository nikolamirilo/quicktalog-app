import { PricingPlan } from "@quicktalog/common";
import { useState } from "react";
import CatalogueNameInput from "@/components/catalogue/inputs/CatalogueNameInput";
import CurrencySelect from "@/components/catalogue/inputs/CurrencySelect";
import LanguageInput from "@/components/catalogue/inputs/LanguageInput";
import { ImageDropzone } from "@/components/general/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { LockedGroup, PANEL_TAB_ROOT, PanelSection } from "./panel";
import { cn } from "@/lib/ui/cn";

const GeneralTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const hasBranding = !!plan?.features?.branding;
	const [_isUploading, setIsUploading] = useState(false);

	if (!catalogue || !updateCatalogue) return null;

	const handleChange = (field: string, value: any) => {
		if (field.startsWith("metadata.")) {
			const key = field.split(".")[1];
			updateCatalogue({
				metadata: {
					...catalogue.metadata,
					[key]: value,
				},
			});
		} else if (field.startsWith("contact.")) {
			const key = field.split(".")[1];
			updateCatalogue({
				contact: {
					...catalogue.contact,
					[key]: value,
				},
			});
		} else {
			updateCatalogue({ [field]: value });
		}
	};

	return (
		<div className={cn("space-y-4", PANEL_TAB_ROOT)}>
			<PanelSection
				info="Basic settings for your catalogue."
				title="General information"
			>
				<CatalogueNameInput disabled={true} />
				<LanguageInput />
				<CurrencySelect />
			</PanelSection>

			<PanelSection
				description="Shown in your catalogue's header and footer."
				title="Logo"
			>
				<LockedGroup locked={!hasBranding}>
					<ImageDropzone
						className="w-full"
						image={catalogue.logo}
						onUploadComplete={(url) => handleChange("logo", url)}
						removeImage={() => handleChange("logo", "")}
						setIsUploading={setIsUploading}
						targetSizeKB={400}
						type="icon"
					/>
				</LockedGroup>
			</PanelSection>

			<PanelSection
				info="Contact details displayed to your customers."
				title="Contact information"
			>
				<LockedGroup locked={!hasBranding}>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="contact-phone">Phone number</Label>
							<Input
								autoComplete="tel"
								id="contact-phone"
								inputMode="tel"
								onChange={(e) => handleChange("contact.phone", e.target.value)}
								placeholder="e.g. +1 123 456 7890"
								type="tel"
								value={catalogue.contact?.phone || ""}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-email">Email</Label>
							<Input
								autoComplete="email"
								id="contact-email"
								inputMode="email"
								onChange={(e) => handleChange("contact.email", e.target.value)}
								placeholder="e.g. example@gmail.com"
								type="email"
								value={catalogue.contact?.email || ""}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-website">Website</Label>
							<Input
								autoComplete="url"
								id="contact-website"
								inputMode="url"
								onChange={(e) =>
									handleChange("contact.website", e.target.value)
								}
								placeholder="e.g. https://www.example.com"
								value={catalogue.contact?.website || ""}
							/>
						</div>
					</div>
				</LockedGroup>
			</PanelSection>

			<PanelSection
				info="Metadata enhances your catalogue's appearance when shared on social media or found in search engines. The icon is shown in the browser tab when visitors view your catalogue."
				title="Search and sharing"
			>
				<LockedGroup locked={!hasBranding}>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="meta-title">Title</Label>
							<Input
								id="meta-title"
								onChange={(e) => handleChange("metadata.title", e.target.value)}
								placeholder="e.g. My Awesome Catalogue"
								value={catalogue.metadata?.title || ""}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="meta-description">Description</Label>
							<Textarea
								className="min-h-[100px] resize-none"
								id="meta-description"
								onChange={(e) =>
									handleChange("metadata.description", e.target.value)
								}
								placeholder="e.g. Best items in town..."
								value={catalogue.metadata?.description || ""}
							/>
						</div>
						<div className="space-y-2">
							<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
								Browser tab icon
							</p>
							<p className="text-[12.5px] leading-snug text-product-muted">
								A square image works best.
							</p>
							<ImageDropzone
								className="w-full"
								image={catalogue.metadata?.icon || ""}
								onUploadComplete={(url) => handleChange("metadata.icon", url)}
								removeImage={() => handleChange("metadata.icon", "")}
								setIsUploading={setIsUploading}
								type="icon"
							/>
						</div>
					</div>
				</LockedGroup>
			</PanelSection>
		</div>
	);
};

export default GeneralTab;
