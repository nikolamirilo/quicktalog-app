type LogoSettings = {
	logo: string | undefined;
	headerType: string | undefined;
	footerType: string | undefined;
};

/** Where the logo can appear, and the limit each place imposes. */
export type LogoScope = "header" | "footer";

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

/**
 * Where the logo links. It follows whose logo is drawn: a default header or
 * footer shows the Quicktalog logo, so it goes to Quicktalog, never to the
 * owner's website - otherwise a cancelled plan leaves our logo pointing at
 * their site. An empty string leaves `SmartLink` rendering no link at all.
 */
export const catalogueLogoHref = ({
	type,
	website,
}: {
	type: string | undefined;
	website: string | undefined;
}) => (type === "custom" ? website?.trim() || "" : "/");

/**
 * The tallest logo each place carries. The navbar pill is a fixed 64px, so its
 * logo stops short of it; the footer has room for more.
 */
export const LOGO_MAX_HEIGHT: Record<LogoScope, number> = {
	header: 56,
	footer: 72,
};

/** Phones keep the navbar logo smaller, whatever the owner chose. */
export const NAV_LOGO_MAX_HEIGHT_SM = 44;

export const LOGO_SCALE = { min: 10, max: 100 } as const;

/** Size is a share of what the place allows, so 100 is as big as it goes. */
export const normalizeLogoScale = (scale: unknown) =>
	typeof scale === "number" && Number.isFinite(scale)
		? clamp(scale, LOGO_SCALE.min, LOGO_SCALE.max)
		: LOGO_SCALE.max;

export const logoScaleOf = (chrome: unknown): number =>
	normalizeLogoScale((chrome as { logoScale?: unknown } | null)?.logoScale);

/** Sets the scale on a header or footer, for the agent's applier. */
export const withLogoScale = <T>(chrome: T, scale: number): T =>
	({ ...chrome, logoScale: normalizeLogoScale(scale) }) as T;

/** The drawn height for a scale, in the place's own limit. */
export const logoHeightFor = (scope: LogoScope, scale: number) =>
	Math.round((LOGO_MAX_HEIGHT[scope] * normalizeLogoScale(scale)) / 100);

export const LOGO_RADIUS_MAX = 100;

/**
 * Rounding is a share of fully round, so 100 is a circle on a square logo.
 * CSS reaches that at half the box, hence the halving.
 */
export const logoRadiusStyle = (radius: number | undefined) =>
	radius && radius > 0 ? `${normalizeLogoRadius(radius) / 2}%` : undefined;

/** Keeps a client-sent radius renderable. */
export const normalizeLogoRadius = (radius: unknown) =>
	typeof radius === "number" && Number.isFinite(radius)
		? clamp(radius, 0, LOGO_RADIUS_MAX)
		: 0;

export const logoRadiusOf = (chrome: unknown): number =>
	normalizeLogoRadius((chrome as { logoRadius?: unknown } | null)?.logoRadius);

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, Math.round(value)));
