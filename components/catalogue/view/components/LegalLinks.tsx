import Link from "next/link";
import SmartLink from "@/components/general/SmartLink";

export const LegalLinks = ({
	type,
	activeData,
}: {
	type: string;
	activeData: any;
}) => {
	return (
		<nav
			aria-label="Legal links"
			className="flex items-center space-x-6"
			role="navigation"
		>
			{type === "default" ? (
				<>
					<Link
						aria-label="Privacy Policy"
						className="hover:text-primary transition-colors duration-200"
						href="/privacy-policy"
					>
						Privacy Policy
					</Link>
					<Link
						aria-label="Terms of Service"
						className="hover:text-primary transition-colors duration-200"
						href="/terms-and-conditions"
					>
						Terms of Service
					</Link>
					<Link
						aria-label="Refund Policy"
						className="hover:text-primary transition-colors duration-200"
						href="/refund-policy"
					>
						Refund Policy
					</Link>
				</>
			) : (
				<>
					{activeData?.legal?.privacyPolicy && (
						<SmartLink
							aria-label="Privacy Policy"
							className="hover:text-primary transition-colors duration-200"
							href={activeData?.legal?.privacyPolicy}
						>
							Privacy Policy
						</SmartLink>
					)}
					{activeData?.legal?.termsAndConditions && (
						<SmartLink
							aria-label="Terms of Service"
							className="hover:text-primary transition-colors duration-200"
							href={activeData?.legal?.termsAndConditions}
						>
							Terms of Service
						</SmartLink>
					)}
				</>
			)}
		</nav>
	);
};

export default LegalLinks;
