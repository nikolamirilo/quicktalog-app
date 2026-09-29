import { CatalogueButton } from "@/components/catalogue/view/components/CatalogueButton";
import { footerDetails } from "@/constants/details";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { SocialIcon } from "@/components/general/SocialIcon";

const DefaultActions = () => {
	const socialLinks = footerDetails.socials;

	return (
		<div className="space-y-6">
			<div className="flex items-center space-x-3">
				{Object.keys(socialLinks).map((platform, index) => (
					<SocialIcon
						className="rounded-lg"
						href={socialLinks[platform as keyof typeof socialLinks]}
						key={`social-${index}`}
						platform={platform}
					/>
				))}
			</div>

			<CatalogueButton
				asChild
				className="font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary bg-catalogue-card-background text-foreground border-primary footer-cta-button"
			>
				<Link
					aria-label="Create your own digital catalog"
					href="/auth?mode=signup"
				>
					<FiPlus className="w-4 h-4" />
					Create Your Digital Catalog
				</Link>
			</CatalogueButton>
		</div>
	);
};

export default DefaultActions;
