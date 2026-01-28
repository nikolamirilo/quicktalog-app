import PartnerBadge from "@/components/general/PartnerBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { extractDomain } from "@/helpers/client";
import { Partner } from "@quicktalog/common";
import { Info, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const FooterTab = () => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const [newSocialUrl, setNewSocialUrl] = useState("");
	const [newPartner, setNewPartner] = useState<Partner>({
		name: "",
		url: "",
		description: "",
	});
	const [isAddingPartner, setIsAddingPartner] = useState(false);

	if (!catalogue || !updateCatalogue) return null;

	const handleChange = (field: string, value: any) => {
		if (field.startsWith("footer.cta.")) {
			const key = field.split(".")[2];
			updateCatalogue({
				footer: {
					...catalogue.footer,
					cta: {
						...catalogue.footer.cta,
						[key]: value,
					},
				},
			});
		} else if (field.startsWith("footer.")) {
			const key = field.split(".")[1];
			updateCatalogue({
				footer: {
					...catalogue.footer,
					[key]: value,
				},
			});
		} else if (field.startsWith("legal.")) {
			const key = field.split(".")[1];
			updateCatalogue({
				legal: {
					...catalogue.legal,
					[key]: value,
				},
			});
		}
	};

	const addSocial = () => {
		if (!newSocialUrl.trim()) return;
		const updatedSocials = [...(catalogue.contact.socials || []), newSocialUrl];
		updateCatalogue({
			contact: {
				...catalogue.contact,
				socials: updatedSocials,
			},
		});
		setNewSocialUrl("");
	};

	const removeSocial = (index: number) => {
		const updatedSocials = [...(catalogue.contact.socials || [])];
		updatedSocials.splice(index, 1);
		updateCatalogue({
			contact: {
				...catalogue.contact,
				socials: updatedSocials,
			},
		});
	};

	const addPartner = () => {
		if (!newPartner.name.trim()) return;
		const updatedPartners = [...(catalogue.partners || []), newPartner];
		updateCatalogue({
			partners: updatedPartners,
		});
		setNewPartner({ name: "", url: "", description: "" });
		setIsAddingPartner(false);
	};

	const removePartner = (index: number) => {
		const updatedPartners = [...(catalogue.partners || [])];
		updatedPartners.splice(index, 1);
		updateCatalogue({
			partners: updatedPartners,
		});
	};

	return (
		<div className="space-y-4 p-2">
			{/* Interaction Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold text-center mx-auto">Interaction</h3>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label htmlFor="footer-cta-enabled" className="text-base">
								Footer Action Link
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Enable a call-to-action button in the footer.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Switch
							id="footer-cta-enabled"
							checked={catalogue.footer?.cta?.isEnabled || false}
							onCheckedChange={(checked) =>
								handleChange("footer.cta.isEnabled", checked)
							}
						/>
					</div>

					{catalogue.footer?.cta?.isEnabled && (
						<>
							<div className="space-y-2">
								<Input
									placeholder="Label (e.g. Contact Us)"
									value={catalogue.footer?.cta?.label || ""}
									onChange={(e) =>
										handleChange("footer.cta.label", e.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Input
									placeholder="URL (e.g. https://mywebsite.com/contact)"
									value={catalogue.footer?.cta?.url || ""}
									onChange={(e) =>
										handleChange("footer.cta.url", e.target.value)
									}
								/>
							</div>
						</>
					)}

					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label htmlFor="footer-newsletter" className="text-base">
								Newsletter
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Enable newsletter subscription form in the footer.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Switch
							id="footer-newsletter"
							checked={catalogue.footer?.newsletter || false}
							onCheckedChange={(checked) =>
								handleChange("footer.newsletter", checked)
							}
						/>
					</div>
				</div>
			</div>

			<div className="w-full h-[1px] bg-" />

			{/* Business Information Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold text-center mx-auto">
						Business Information
					</h3>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							Legal Business Name
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Your officially registered business name.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Input
							placeholder="e.g. Quicktalog Inc."
							value={catalogue.legal?.legalName || ""}
							onChange={(e) => handleChange("legal.legalName", e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							Business Address
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Your physical business address.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Input
							placeholder="e.g. 123 Main St, San Francisco, CA"
							value={catalogue.legal?.address || ""}
							onChange={(e) => handleChange("legal.address", e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							Terms & Conditions Link
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Link to your terms and conditions page.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Input
							placeholder="e.g. https://mywebsite.com/terms"
							value={catalogue.legal?.termsAndConditions || ""}
							onChange={(e) =>
								handleChange("legal.termsAndConditions", e.target.value)
							}
						/>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							Privacy Policy Link
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Link to your privacy policy page.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</Label>
						<Input
							placeholder="e.g. https://mywebsite.com/privacy"
							value={catalogue.legal?.privacyPolicy || ""}
							onChange={(e) =>
								handleChange("legal.privacyPolicy", e.target.value)
							}
						/>
					</div>
				</div>
			</div>

			<div className="w-full h-[1px] bg-border" />

			{/* Social Media Links Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold text-center mx-auto">
						Social Media Links
					</h3>
				</div>

				<div className="space-y-4">
					{catalogue.contact?.socials?.map((url, index) => (
						<div key={index} className="flex gap-2">
							<img
								alt={`Social Icon go`}
								className="w-8 h-8 rounded-full"
								height={32}
								src={`https://img.logo.dev/${extractDomain(url)}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
								width={32}
							/>
							<Input value={url} disabled />
							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeSocial(index)}
							>
								<Trash2 className="h-4 w-4 text-destructive" />
							</Button>
						</div>
					))}

					<div className="space-y-2">
						<Input
							placeholder="e.g. www.instagram.com/quicktalog"
							value={newSocialUrl}
							onChange={(e) => setNewSocialUrl(e.target.value)}
						/>
						<Button
							onClick={addSocial}
							className="w-full bg-product-primary text-product-foreground"
						>
							<Plus className="h-4 w-4 mr-2" /> Add Social Media
						</Button>
					</div>
				</div>
			</div>

			<div className="w-full h-[1px] bg-border" />

			{/* Partners Section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold text-center mx-auto">Partners</h3>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Info className="h-4 w-4 text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Show trusted partners in the footer.</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<Switch
						checked={catalogue.footer?.showPartners || false}
						onCheckedChange={(checked) =>
							handleChange("footer.showPartners", checked)
						}
					/>
				</div>

				{catalogue.footer?.showPartners && (
					<div className="space-y-4">
						{catalogue.partners?.map((partner, index) => (
							<div key={index} className="p-3 rounded-lg relative">
								<PartnerBadge partner={partner} />
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-3 right-3"
									onClick={() => removePartner(index)}
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						))}

						{isAddingPartner ? (
							<div className="space-y-3 p-4 rounded-lg bg-card-bg border-gray-300 border">
								<Input
									placeholder="Partner Name"
									value={newPartner.name}
									onChange={(e) =>
										setNewPartner((prev) => ({ ...prev, name: e.target.value }))
									}
								/>
								<Input
									placeholder="Partner URL"
									value={newPartner.url}
									onChange={(e) =>
										setNewPartner((prev) => ({ ...prev, url: e.target.value }))
									}
								/>
								<Input
									placeholder="Partner Description"
									value={newPartner.description}
									onChange={(e) =>
										setNewPartner((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
								/>
								<div className="flex gap-2">
									<Button
										onClick={addPartner}
										className="flex-1 bg-product-primary text-product-foreground"
									>
										Confirm
									</Button>
									<Button
										variant="ghost"
										onClick={() => setIsAddingPartner(false)}
									>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<Button
								onClick={() => setIsAddingPartner(true)}
								className="w-full bg-product-primary text-product-foreground"
							>
								<Plus className="h-4 w-4 mr-2" /> Add Partner
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default FooterTab;
