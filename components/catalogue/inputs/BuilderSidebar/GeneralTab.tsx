import ImageDropzone from "@/components/general/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useState } from "react";
import CatalogueNameInput from "../CatalogueNameInput";
import CurrencySelect from "../CurrencySelect";
import LanguageInput from "../LanguageInput";

const GeneralTab = () => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
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
				<div className="flex items-center">
					<h3 className="text-lg font-bold text-center mx-auto">
						General Information
					</h3>
				</div>
				<CatalogueNameInput disabled={true} />
				<LanguageInput />
				<CurrencySelect />
				{/* <BusinessType /> */}
				<div className="space-y-2">
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

			{/* Contact Information Section */}
			<div className="space-y-4">
				<div className="flex items-center">
					<h3 className="text-lg font-bold text-center mx-auto">
						Contact Information
					</h3>
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
				<div className="flex items-center">
					<h3 className="text-lg font-bold text-center mx-auto">Metadata</h3>
				</div>

				<div className="space-y-2">
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
	);
};

export default GeneralTab;
