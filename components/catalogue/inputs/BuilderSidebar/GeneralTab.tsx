import ImageDropzone from "@/components/general/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Info } from "lucide-react";
import { useState } from "react";

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
		<div className="space-y-8 p-4">
			{/* Logo Section */}
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Label className="text-base">Logo</Label>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Info className="h-4 w-4 text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Upload your business logo here.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
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
				<div className="flex items-center gap-2">
					<h3 className="font-serif text-xl font-medium">
						Contact Information
					</h3>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Label htmlFor="contact-phone">Phone Number</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Contact phone number for your customers.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
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
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Contact email address.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Input
							id="contact-email"
							placeholder="e.g. example@gmail.com"
							value={catalogue.contact?.email || ""}
							onChange={(e) => handleChange("contact.email", e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Metadata Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="font-serif text-xl font-medium">Metadata</h3>
				</div>

				<div className="space-y-4">
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
