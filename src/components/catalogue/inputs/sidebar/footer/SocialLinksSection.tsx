import { Catalogue } from "@quicktalog/common";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PanelSection } from "@/components/catalogue/inputs/sidebar/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SOCIALS } from "@/constants";
import { extractDomain } from "@/lib/http/domain";

interface SocialLinksSectionProps {
	catalogue: Catalogue;
	updateCatalogue: (partial: Partial<Catalogue>) => void;
}

const SocialLinksSection = ({
	catalogue,
	updateCatalogue,
}: SocialLinksSectionProps) => {
	const [newSocialUrl, setNewSocialUrl] = useState("");

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

	const socials = catalogue.contact?.socials || [];
	const canAdd = newSocialUrl.trim() && newSocialUrl.includes(".");

	return (
		<PanelSection
			info="Add links to your social media profiles."
			title="Social media links"
		>
			{socials.length > 0 && (
				<ul className="space-y-2">
					{socials.map((url, index) => (
						<li className="flex items-center gap-2" key={index}>
							<span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-product-border bg-product-card">
								<img
									alt=""
									className="h-5 w-5 rounded-sm object-cover"
									src={`https://img.logo.dev/${extractDomain(url)}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
								/>
							</span>
							<Input
								aria-label={`Social link ${index + 1}`}
								className="min-w-0 flex-1"
								inputMode="url"
								onChange={(e) => updateSocial(index, e.target.value)}
								placeholder="https://"
								value={url}
							/>
							<Button
								aria-label={`Remove social link ${index + 1}`}
								className="h-11 w-11 shrink-0 text-product-error hover:bg-product-error-soft hover:text-product-error-ink"
								onClick={() => removeSocial(index)}
								size="icon"
								type="button"
								variant="ghost"
							>
								<Trash2 aria-hidden="true" className="h-4 w-4" />
							</Button>
						</li>
					))}
				</ul>
			)}

			{socials.length < MAX_SOCIALS ? (
				<form
					className="space-y-2"
					onSubmit={(e) => {
						e.preventDefault();
						addSocial();
					}}
				>
					<Label htmlFor="footer-new-social">Add a profile link</Label>
					<div className="flex gap-2">
						<Input
							className="min-w-0 flex-1"
							id="footer-new-social"
							inputMode="url"
							onChange={(e) => setNewSocialUrl(e.target.value)}
							placeholder="e.g. www.instagram.com/quicktalog"
							value={newSocialUrl}
						/>
						<Button
							aria-label="Add social link"
							className="h-11 w-11 shrink-0"
							disabled={!canAdd}
							size="icon"
							type="submit"
						>
							<Plus aria-hidden="true" className="h-4 w-4" />
						</Button>
					</div>
					<p className="text-[12.5px] text-product-muted">
						{socials.length} of {MAX_SOCIALS} links added.
					</p>
				</form>
			) : (
				<p className="text-[13px] text-product-muted">
					Maximum of {MAX_SOCIALS} social links reached.
				</p>
			)}
		</PanelSection>
	);
};

export default SocialLinksSection;
