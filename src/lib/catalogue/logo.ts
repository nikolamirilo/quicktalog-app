type LogoSettings = {
	logo: string | undefined;
	headerType: string | undefined;
	footerType: string | undefined;
};

/** Header and footer each show the user's logo only when they are custom. */
export const catalogueLogos = (
	{ logo, headerType, footerType }: LogoSettings,
	defaultLogo: string,
) => ({
	header: headerType === "custom" ? logo : defaultLogo,
	footer: footerType === "custom" ? logo : defaultLogo,
});

/** A logo is set but neither the header nor the footer will show it. */
export const isLogoHidden = ({ logo, headerType, footerType }: LogoSettings) =>
	Boolean(logo) && headerType !== "custom" && footerType !== "custom";
