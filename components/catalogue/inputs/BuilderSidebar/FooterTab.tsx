import PartnerBadge from "@/components/general/PartnerBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { extractDomain } from "@/helpers/client";
import { Partner, PricingPlan } from "@quicktalog/common";
import { Info, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import LimitsOverlay from "./LimitsOverlay";

const MAX_SOCIALS = 5;
const MAX_PARTNERS = 3;

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
	const [editingPartnerIndex, setEditingPartnerIndex] = useState<number | null>(
		null,
	);
	const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

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
		} else if (field.startsWith("footer.logoSize.")) {
			const key = field.split(".")[2];
			const currentSize = catalogue.footer?.logoSize || {
				width: 120,
				height: 40,
			};
			updateCatalogue({
				footer: {
					...catalogue.footer,
					logoSize: {
						...currentSize,
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
		if (!newSocialUrl.trim() || !newSocialUrl.includes(".")) return;
		if ((catalogue.contact.socials || []).length >= MAX_SOCIALS) return;
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

	const updateSocial = (index: number, newUrl: string) => {
		const updatedSocials = [...(catalogue.contact.socials || [])];
		updatedSocials[index] = newUrl;
		updateCatalogue({
			contact: {
				...catalogue.contact,
				socials: updatedSocials,
			},
		});
	};

	const addPartner = () => {
		if (!newPartner.name.trim()) return;
		if ((catalogue.partners || []).length >= MAX_PARTNERS) return;
		const updatedPartners = [...(catalogue.partners || []), newPartner];
		updateCatalogue({
			partners: updatedPartners,
		});
		setNewPartner({ name: "", url: "", description: "" });
		setIsAddingPartner(false);
	};

	const startEditingPartner = (index: number) => {
		setEditingPartnerIndex(index);
		setEditingPartner(catalogue.partners![index]);
	};

	const savePartner = () => {
		if (!editingPartner || !editingPartner.name.trim()) return;
		const updatedPartners = [...(catalogue.partners || [])];
		updatedPartners[editingPartnerIndex!] = editingPartner;
		updateCatalogue({
			partners: updatedPartners,
		});
		setEditingPartnerIndex(null);
		setEditingPartner(null);
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
			{!hasBranding && <LimitsOverlay size="lg" type="branding" />}
			<div
				className={`space-y-4 p-2 ${!hasBranding ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
			>
				{/* Logo Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Footer Logo Size</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Configure the size of the logo in your footer.</p>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-4">
						<div className="space-y-3">
							<div className="flex justify-end items-center">
								<span className="text-sm text-muted-foreground">
									{catalogue.footer?.logoSize?.width || 160}px
								</span>
							</div>
							<Slider
								max={400}
								min={20}
								onValueChange={(val) =>
									handleChange("footer.logoSize.width", val[0])
								}
								step={2}
								value={[catalogue.footer?.logoSize?.width || 160]}
							/>
						</div>
					</div>
				</div>

				<div className="w-full h-[1px] bg-border" />

				{/* Interaction Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Interaction</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Setup calls to action and newsletter signup.</p>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Label className="text-base" htmlFor="footer-cta-enabled">
									Footer Action Link
								</Label>
								<Popover>
									<PopoverTrigger className="inline-flex" type="button">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent
										className="z-[2000] w-[200px] p-3 text-sm"
										side="top"
									>
										<p>Enable a call-to-action button in the footer.</p>
									</PopoverContent>
								</Popover>
							</div>
							<Switch
								checked={catalogue.footer?.cta?.isEnabled || false}
								id="footer-cta-enabled"
								onCheckedChange={(checked) =>
									handleChange("footer.cta.isEnabled", checked)
								}
							/>
						</div>

						{catalogue.footer?.cta?.isEnabled && (
							<>
								<div className="space-y-2">
									<Input
										onChange={(e) =>
											handleChange("footer.cta.label", e.target.value)
										}
										placeholder="Label (e.g. Contact Us)"
										value={catalogue.footer?.cta?.label || ""}
									/>
								</div>
								<div className="space-y-2">
									<Input
										onChange={(e) =>
											handleChange("footer.cta.url", e.target.value)
										}
										placeholder="URL (e.g. https://mywebsite.com/contact)"
										value={catalogue.footer?.cta?.url || ""}
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
									<Label className="text-base" htmlFor="footer-newsletter">
										Newsletter
									</Label>
									<Popover>
										<PopoverTrigger className="inline-flex" type="button">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											className="z-[2000] w-[200px] p-3 text-sm"
											side="top"
										>
											<p>Enable newsletter subscription form in the footer.</p>
										</PopoverContent>
									</Popover>
								</div>
								<Switch
									checked={catalogue.footer?.newsletter || false}
									id="footer-newsletter"
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
									className="z-[2000] w-[200px] p-3 text-sm"
									side="top"
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
										<PopoverTrigger className="inline-flex" type="button">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											className="z-[2000] w-[200px] p-3 text-sm"
											side="top"
										>
											<p>Your officially registered business name.</p>
										</PopoverContent>
									</Popover>
								</Label>
								<Input
									onChange={(e) =>
										handleChange("legal.legalName", e.target.value)
									}
									placeholder="e.g. Quicktalog Inc."
									value={catalogue.legal?.legalName || ""}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Business Address
									<Popover>
										<PopoverTrigger className="inline-flex" type="button">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											className="z-[2000] w-[200px] p-3 text-sm"
											side="top"
										>
											<p>Your physical business address.</p>
										</PopoverContent>
									</Popover>
								</Label>
								<Input
									onChange={(e) =>
										handleChange("legal.address", e.target.value)
									}
									placeholder="e.g. 123 Main St, San Francisco, CA"
									value={catalogue.legal?.address || ""}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Terms & Conditions Link
									<Popover>
										<PopoverTrigger className="inline-flex" type="button">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											className="z-[2000] w-[200px] p-3 text-sm"
											side="top"
										>
											<p>Link to your terms and conditions page.</p>
										</PopoverContent>
									</Popover>
								</Label>
								<Input
									onChange={(e) =>
										handleChange("legal.termsAndConditions", e.target.value)
									}
									placeholder="e.g. https://mywebsite.com/terms"
									value={catalogue.legal?.termsAndConditions || ""}
								/>
							</div>

							<div className="space-y-2">
								<Label className="flex items-center gap-2">
									Privacy Policy Link
									<Popover>
										<PopoverTrigger className="inline-flex" type="button">
											<Info className="h-4 w-4 text-muted-foreground" />
										</PopoverTrigger>
										<PopoverContent
											className="z-[2000] w-[200px] p-3 text-sm"
											side="top"
										>
											<p>Link to your privacy policy page.</p>
										</PopoverContent>
									</Popover>
								</Label>
								<Input
									onChange={(e) =>
										handleChange("legal.privacyPolicy", e.target.value)
									}
									placeholder="e.g. https://mywebsite.com/privacy"
									value={catalogue.legal?.privacyPolicy || ""}
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
									className="z-[2000] w-[200px] p-3 text-sm"
									side="top"
								>
									<p>Add links to your social media profiles.</p>
								</PopoverContent>
							</Popover>
						</div>

						<div className="space-y-4">
							{catalogue.contact?.socials?.map((url, index) => (
								<div className="flex gap-2 items-center" key={index}>
									<div className="p-2 rounded-full flex items-center justify-center flex-shrink-0 bg-catalogue-card-background text-catalogue-card-heading border border-gray-400 overflow-hidden">
										<img
											alt={`Social Icon`}
											className="w-5 h-5 rounded-sm object-cover"
											src={`https://img.logo.dev/${extractDomain(url)}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
										/>
									</div>
									<Input
										onChange={(e) => updateSocial(index, e.target.value)}
										placeholder="https://"
										value={url}
									/>
									<Button
										className="flex-shrink-0"
										onClick={() => removeSocial(index)}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							))}

							{(!catalogue.contact?.socials ||
								catalogue.contact.socials.length < MAX_SOCIALS) && (
								<div className="space-y-2">
									<Input
										onChange={(e) => setNewSocialUrl(e.target.value)}
										placeholder="e.g. www.instagram.com/quicktalog"
										value={newSocialUrl}
									/>
									<Button
										className="w-full bg-product-primary text-product-foreground"
										disabled={
											!newSocialUrl.trim() || !newSocialUrl.includes(".")
										}
										onClick={addSocial}
									>
										<Plus className="h-4 w-4 mr-2" /> Add Social Media
									</Button>
								</div>
							)}
							{catalogue.contact?.socials?.length === MAX_SOCIALS && (
								<p className="text-sm text-muted-foreground text-center">
									Maximum of {MAX_SOCIALS} social links reached.
								</p>
							)}
						</div>
					</div>

					<div className="w-full h-[1px] bg-border" />

					{/* Partners Section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<h3 className="text-lg font-bold">Partners</h3>
								<Popover>
									<PopoverTrigger className="inline-flex mt-1" type="button">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent
										className="z-[2000] w-[200px] p-3 text-sm"
										side="top"
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
									<div className="flex gap-2 items-center" key={index}>
										{editingPartnerIndex === index ? (
											<div className="flex-1 space-y-3 p-4 rounded-lg bg-catalogue-card-background shadow-md">
												<Input
													onChange={(e) =>
														setEditingPartner((prev) =>
															prev ? { ...prev, name: e.target.value } : null,
														)
													}
													placeholder="Partner Name"
													value={editingPartner?.name || ""}
												/>
												<Input
													onChange={(e) =>
														setEditingPartner((prev) =>
															prev ? { ...prev, url: e.target.value } : null,
														)
													}
													placeholder="Partner URL"
													value={editingPartner?.url || ""}
												/>
												<Input
													onChange={(e) =>
														setEditingPartner((prev) =>
															prev
																? { ...prev, description: e.target.value }
																: null,
														)
													}
													placeholder="Partner Description"
													value={editingPartner?.description || ""}
												/>
												<div className="flex gap-2">
													<Button
														className="flex-1 bg-product-primary text-product-foreground"
														disabled={!editingPartner?.name.trim()}
														onClick={savePartner}
													>
														Save
													</Button>
													<Button
														onClick={() => setEditingPartnerIndex(null)}
														variant="ghost"
													>
														Cancel
													</Button>
												</div>
											</div>
										) : (
											<>
												<div className="flex-1 min-w-0">
													<PartnerBadge partner={partner} />
												</div>
												<div className="flex flex-col gap-1 flex-shrink-0">
													<Button
														onClick={() => startEditingPartner(index)}
														size="icon"
														variant="ghost"
													>
														<Pencil className="h-4 w-4" />
													</Button>
													<Button
														onClick={() => removePartner(index)}
														size="icon"
														variant="ghost"
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</div>
											</>
										)}
									</div>
								))}

								{(!catalogue.partners ||
									catalogue.partners.length < MAX_PARTNERS) &&
									(isAddingPartner ? (
										<div className="space-y-3 p-4 rounded-lg bg-catalogue-card-background">
											<Input
												onChange={(e) =>
													setNewPartner((prev) => ({
														...prev,
														name: e.target.value,
													}))
												}
												placeholder="Partner Name"
												value={newPartner.name}
											/>
											<Input
												onChange={(e) =>
													setNewPartner((prev) => ({
														...prev,
														url: e.target.value,
													}))
												}
												placeholder="Partner URL"
												value={newPartner.url}
											/>
											<Input
												onChange={(e) =>
													setNewPartner((prev) => ({
														...prev,
														description: e.target.value,
													}))
												}
												placeholder="Partner Description"
												value={newPartner.description}
											/>
											<div className="flex gap-2">
												<Button
													className="flex-1 bg-product-primary text-product-foreground"
													disabled={!newPartner.name.trim()}
													onClick={addPartner}
												>
													Confirm
												</Button>
												<Button
													onClick={() => setIsAddingPartner(false)}
													variant="ghost"
												>
													Cancel
												</Button>
											</div>
										</div>
									) : (
										<Button
											className="w-full bg-product-primary text-product-foreground"
											onClick={() => setIsAddingPartner(true)}
										>
											<Plus className="h-4 w-4 mr-2" /> Add Partner
										</Button>
									))}
								{catalogue.partners?.length === MAX_PARTNERS && (
									<p className="text-sm text-muted-foreground text-center pt-2">
										Maximum of {MAX_PARTNERS} partners reached.
									</p>
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
