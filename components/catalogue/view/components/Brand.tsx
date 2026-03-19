import SmartLink from "@/components/general/SmartLink";
import SocialIcon from "@/components/general/SocialIcon";
import { footerDetails } from "@/constants/details";

export const Brand = ({
	type,
	activeData,
	logo,
	effectiveSocials,
}: {
	type: string;
	activeData: any;
	logo: string | undefined;
	effectiveSocials: Record<string, string>;
}) => {
	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div
					aria-label={`Go to ${type === "default" ? "Quicktalog" : activeData?.legal?.legalName || "Custom"} homepage`}
					className="flex flex-col items-start space-y-6 mt-2 group transition-transform duration-200 hover:scale-102"
				>
					<SmartLink
						href={type === "default" ? "/" : effectiveSocials?.website || ""}
					>
						<img
							alt={`${type === "default" ? "Quicktalog" : activeData?.legal?.legalName || "Custom"} logo`}
							className={`rounded-sm object-contain object-left ${logo ? "" : "hidden"}`}
							src={logo ?? "/logo.svg"}
							style={{
								width: activeData?.footer?.logoSize?.width
									? `${activeData.footer.logoSize.width}px`
									: type === "default"
										? "120px"
										: "100px",
								height: "auto",
								maxWidth: "100%",
							}}
						/>
					</SmartLink>

					{type === "default" && (
						<p className="text-sm text-catalogue-navigation-text">
							Digital Catalogue Platform
						</p>
					)}
					{type === "custom" && (
						<div className="ml-0">
							<h3 className="text-xl font-semibold font-heading font-weight-heading tracking-heading text-catalogue-navigation-text">
								{activeData?.legal?.legalName}
							</h3>
						</div>
					)}
				</div>
				<p className="text-sm leading-relaxed text-catalogue-navigation-text">
					{type === "default" ? footerDetails.subheading : ""}
				</p>
			</div>
			{type === "custom" && Object.keys(effectiveSocials).length > 0 && (
				<nav
					aria-label="Social media links"
					className="flex items-center space-x-3"
					role="navigation"
				>
					{Object.keys(effectiveSocials).map((platform) => {
						const socialUrl = effectiveSocials[platform];
						return (
							<SocialIcon
								href={socialUrl || ""}
								key={platform}
								platform={platform.startsWith("link-") ? "website" : platform}
							/>
						);
					})}
				</nav>
			)}
		</div>
	);
};

export default Brand;
