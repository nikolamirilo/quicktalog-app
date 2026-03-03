import ImageDropzone from "@/components/general/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { PricingPlan } from "@quicktalog/common";
import { Info } from "lucide-react";
import { useState } from "react";
import CatalogueNameInput from "../CatalogueNameInput";
import CurrencySelect from "../CurrencySelect";
import LanguageInput from "../LanguageInput";
import LimitsOverlay from "./LimitsOverlay";

const GeneralTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const hasBranding = plan?.features?.branding;
	const [_isUploading, setIsUploading] = useState(false);

	if (!catalogue || !updateCatalogue) return null;

	const handleChange = (field: string, value: any) => {
		// Handle nested updates for metadata and contact
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
		<div className="space-y-4 p-2">
			{/* Logo Section */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold">General Information</h3>
					<Popover>
						<PopoverTrigger type="button">
							<Info className="h-4 w-4 text-muted-foreground" />
						</PopoverTrigger>
						<PopoverContent side="top" className="z-[2000] w-[200px] p-3 text-sm">
							<p>Basic settings for your catalogue.</p>
						</PopoverContent>
					</Popover>
				</div>
				<CatalogueNameInput disabled={true} />
				<LanguageInput />
				<CurrencySelect />
				{/* <BusinessType /> */}
				<div className="relative w-full">
					{!hasBranding && <LimitsOverlay size="sm" />}
					<div className={`space-y-2 ${!hasBranding ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}>
						<div className="flex items-center gap-2">
							<Label className="text-base">Logo</Label>
						</div>

						<ImageDropzone
							type="icon"
							className="w-full aspect-video bg-transparent"
							image={catalogue.logo}
							onUploadComplete={(url) => handleChange("logo", url)}
							removeImage={() => handleChange("logo", "")}
							setIsUploading={setIsUploading}
						/>
					</div>
				</div>
			</div>

			{/* Contact Information Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold">Contact Information</h3>
					<Popover>
						<PopoverTrigger type="button">
							<Info className="h-4 w-4 text-muted-foreground" />
						</PopoverTrigger>
						<PopoverContent side="top" className="z-[2000] w-[200px] p-3 text-sm">
							<p>Contact details displayed to your customers.</p>
						</PopoverContent>
					</Popover>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Label htmlFor="contact-phone">Phone Number</Label>
						</div>
						<Input
							id="contact-phone"
							placeholder="e.g. +1 123 456 7890"
							value={catalogue.contact?.phone || ""}
							onChange={(e) => handleChange("contact.phone", e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Label htmlFor="contact-email">Email</Label>
						</div>
						<Input
							id="contact-email"
							placeholder="e.g. example@gmail.com"
							value={catalogue.contact?.email || ""}
							onChange={(e) => handleChange("contact.email", e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Label htmlFor="contact-website">Website</Label>
						</div>
						<Input
							id="contact-website"
							placeholder="e.g. https://www.example.com"
							value={catalogue.contact?.website || ""}
							onChange={(e) => handleChange("contact.website", e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Metadata Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold">Metadata</h3>
					<Popover>
						<PopoverTrigger type="button">
							<Info className="h-4 w-4 text-muted-foreground" />
						</PopoverTrigger>
						<PopoverContent side="top" className="z-[2000] w-[200px] p-3 text-sm">
							<p>Metadata enhances your catalogue's appearance when shared on social media or found in search engines. The icon will be displayed in the browser tab when visitors view your catalogue.</p>
						</PopoverContent>
					</Popover>
				</div>

				<div className="relative w-full">
					{!hasBranding && <LimitsOverlay />}
					<div className={`space-y-2 ${!hasBranding ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}>
						<div className="space-y-2">
							<Label htmlFor="meta-title">Title</Label>
							<Input
								id="meta-title"
								placeholder="e.g. My Awesome Catalogue"
								value={catalogue.metadata?.title || ""}
								onChange={(e) => handleChange("metadata.title", e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="meta-description">Description</Label>
							<Textarea
								id="meta-description"
								placeholder="e.g. Best items in town..."
								value={catalogue.metadata?.description || ""}
								onChange={(e) =>
									handleChange("metadata.description", e.target.value)
								}
								className="resize-none min-h-[100px]"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="meta-icon">Icon</Label>
							<ImageDropzone
								type="icon"
								className="w-full aspect-video bg-transparent"
								image={catalogue.metadata?.icon || ""}
								onUploadComplete={(url) => handleChange("metadata.icon", url)}
								removeImage={() => handleChange("metadata.icon", "")}
								setIsUploading={setIsUploading}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GeneralTab;
