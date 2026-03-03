import PartnerBadge from "@/components/general/PartnerBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { extractDomain } from "@/helpers/client";
import { Partner, PricingPlan } from "@quicktalog/common";
import { Info, Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import LimitsOverlay from "./LimitsOverlay";

const FooterTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const hasBranding = plan?.features?.branding;
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
		<div
			className={`relative w-full ${!hasBranding ? "h-[calc(100vh-250px)] sm:h-[calc(100dvh-200px)] overflow-hidden" : "h-full"}`}
		>
			{!hasBranding && <LimitsOverlay size="lg" />}
			<div
				className={`space-y-4 p-2 ${!hasBranding ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
			>
				{/* Interaction Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Interaction</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								side="top"
								className="z-[2000] w-[200px] p-3 text-sm"
							>
								<p>Setup calls to action and newsletter signup.</p>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Label htmlFor="footer-cta-enabled" className="text-base">
									Footer Action Link
								</Label>
								<Popover>
									<PopoverTrigger type="button" className="inline-flex">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent
										side="top"
										className="z-[2000] w-[200px] p-3 text-sm"
									>
										<p>Enable a call-to-action button in the footer.</p>
									</PopoverContent>
								</Popover>
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

						<div className="relative w-full">
							{!plan?.features?.newsletter && (
								<div className="absolute inset-x-0 inset-y-[-10px] z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
									<p className="text-sm font-bold text-foreground flex items-center gap-2">
										<Lock className="w-4 h-4" /> Upgrade for Newsletter
									</p>
								</div>
							)}
							<div
								className={`flex items-center justify-between ${!plan?.features?.newsletter ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
							>
								<div className="flex items-center gap-2">
									<Label htmlFor="footer-newsletter" className="text-base">
										Newsletter
									</Label>
									<Popover>
										<PopoverTrigger type="button" className="inline-flex">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											side="top"
											className="z-[2000] w-[200px] p-3 text-sm"
										>
											<p>Enable newsletter subscription form in the footer.</p>
										</PopoverContent>
									</Popover>
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
							<h3 className="text-lg font-bold">Business Information</h3>
							<Popover>
								<PopoverTrigger type="button">
									<Info className="h-4 w-4 text-muted-foreground" />
								</PopoverTrigger>
								<PopoverContent
									side="top"
									className="z-[2000] w-[200px] p-3 text-sm"
								>
									<p>Company details and legal links.</p>
								</PopoverContent>
							</Popover>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Legal Business Name
									<Popover>
										<PopoverTrigger type="button" className="inline-flex">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											side="top"
											className="z-[2000] w-[200px] p-3 text-sm"
										>
											<p>Your officially registered business name.</p>
										</PopoverContent>
									</Popover>
								</Label>
								<Input
									placeholder="e.g. Quicktalog Inc."
									value={catalogue.legal?.legalName || ""}
									onChange={(e) =>
										handleChange("legal.legalName", e.target.value)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Business Address
									<Popover>
										<PopoverTrigger type="button" className="inline-flex">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											side="top"
											className="z-[2000] w-[200px] p-3 text-sm"
										>
											<p>Your physical business address.</p>
										</PopoverContent>
									</Popover>
								</Label>
								<Input
									placeholder="e.g. 123 Main St, San Francisco, CA"
									value={catalogue.legal?.address || ""}
									onChange={(e) =>
										handleChange("legal.address", e.target.value)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Terms & Conditions Link
									<Popover>
										<PopoverTrigger type="button" className="inline-flex">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											side="top"
											className="z-[2000] w-[200px] p-3 text-sm"
										>
											<p>Link to your terms and conditions page.</p>
										</PopoverContent>
									</Popover>
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
									<Popover>
										<PopoverTrigger type="button" className="inline-flex">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											side="top"
											className="z-[2000] w-[200px] p-3 text-sm"
										>
											<p>Link to your privacy policy page.</p>
										</PopoverContent>
									</Popover>
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
							<h3 className="text-lg font-bold">Social Media Links</h3>
							<Popover>
								<PopoverTrigger type="button">
									<Info className="h-4 w-4 text-muted-foreground" />
								</PopoverTrigger>
								<PopoverContent
									side="top"
									className="z-[2000] w-[200px] p-3 text-sm"
								>
									<p>Add links to your social media profiles.</p>
								</PopoverContent>
							</Popover>
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
								<h3 className="text-lg font-bold">Partners</h3>
								<Popover>
									<PopoverTrigger type="button" className="inline-flex mt-1">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent
										side="top"
										className="z-[2000] w-[200px] p-3 text-sm"
									>
										<p>Show trusted partners in the footer.</p>
									</PopoverContent>
								</Popover>
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
									<div className="space-y-3 p-4 rounded-lg bg-catalogue-card-background border-gray-300 border">
										<Input
											placeholder="Partner Name"
											value={newPartner.name}
											onChange={(e) =>
												setNewPartner((prev) => ({
													...prev,
													name: e.target.value,
												}))
											}
										/>
										<Input
											placeholder="Partner URL"
											value={newPartner.url}
											onChange={(e) =>
												setNewPartner((prev) => ({
													...prev,
													url: e.target.value,
												}))
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
			</div>
		</div>
	);
};

export default FooterTab;
