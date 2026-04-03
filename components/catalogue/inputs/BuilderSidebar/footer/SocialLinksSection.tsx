import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { extractDomain } from "@/helpers/client";
import { Catalogue } from "@quicktalog/common";
import { Info, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const MAX_SOCIALS = 5;

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

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<h3 className="text-lg font-bold">Social Media Links</h3>
				<Popover>
					<PopoverTrigger type="button">
						<Info className="h-4 w-4 text-muted-foreground" />
					</PopoverTrigger>
					<PopoverContent className="z-[2000] w-[200px] p-3 text-sm" side="top">
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
							disabled={!newSocialUrl.trim() || !newSocialUrl.includes(".")}
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
	);
};

export default SocialLinksSection;
