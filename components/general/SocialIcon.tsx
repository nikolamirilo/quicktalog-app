import { extractDomain } from "@/helpers/client";
import SmartLink from "./SmartLink";

export default function SocialIcon({
	platform,
	href,
	className = "",
}: {
	platform: string;
	href: string;
	className?: string;
}) {
	// Ensure href is an absolute URL
	const normalizedHref =
		href.startsWith("http://") || href.startsWith("https://")
			? href
			: `https://${href}`;

	const domain = extractDomain(normalizedHref) || "example.com";

	return (
		<SmartLink
			href={normalizedHref}
			className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110 hover:rotate-3 group bg-catalogue-card-background text-catalogue-card-heading border border-catalogue-card-border overflow-hidden ${className}`}
			ariaLabel={`Follow us on ${platform}`}
		>
			<img
				alt={`${platform} icon`}
				className="w-5 h-5 rounded-sm object-cover transition-colors duration-300"
				src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
			/>
		</SmartLink>
	);
}
