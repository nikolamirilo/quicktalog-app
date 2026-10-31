import { SmartLink } from "@/components/general/SmartLink";
import type { Catalogue } from "@quicktalog/common";
import Link from "next/link";

const LegalLinks = ({
	type,
	legal,
}: {
	type: "default" | "custom";
	legal: Catalogue["legal"] | undefined;
}) => {
	if (type === "default")
		return (
			<nav aria-label="Legal links" className="cat-foot-legal">
				<Link href="/privacy-policy">Privacy Policy</Link>
				<Link href="/terms-and-conditions">Terms of Service</Link>
				<Link href="/refund-policy">Refund Policy</Link>
			</nav>
		);
	if (!legal?.privacyPolicy && !legal?.termsAndConditions) return null;
	return (
		<nav aria-label="Legal links" className="cat-foot-legal">
			{legal.privacyPolicy && (
				<SmartLink href={legal.privacyPolicy}>Privacy Policy</SmartLink>
			)}
			{legal.termsAndConditions && (
				<SmartLink href={legal.termsAndConditions}>Terms of Service</SmartLink>
			)}
		</nav>
	);
};

export default LegalLinks;
