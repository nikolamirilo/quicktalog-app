import type { SocialPlatform } from "@/lib/catalogue/socials";
import { FaPinterestP, FaTiktok } from "react-icons/fa";
import {
	FiFacebook,
	FiGlobe,
	FiInstagram,
	FiLinkedin,
	FiMail,
	FiTwitter,
	FiYoutube,
} from "react-icons/fi";

const ICONS: Record<SocialPlatform | "email", React.ElementType> = {
	instagram: FiInstagram,
	facebook: FiFacebook,
	twitter: FiTwitter,
	linkedin: FiLinkedin,
	tiktok: FaTiktok,
	youtube: FiYoutube,
	pinterest: FaPinterestP,
	website: FiGlobe,
	email: FiMail,
};

/** A line icon for a footer social link, drawn in the catalogue's colours. */
export const SocialIcon = ({
	platform,
}: {
	platform: SocialPlatform | "email";
}) => {
	const Icon = ICONS[platform];
	return <Icon aria-hidden="true" />;
};
