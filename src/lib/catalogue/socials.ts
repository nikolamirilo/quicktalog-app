export type SocialPlatform =
	| "instagram"
	| "facebook"
	| "twitter"
	| "linkedin"
	| "tiktok"
	| "youtube"
	| "pinterest"
	| "website";

const PLATFORM_HOSTS: [SocialPlatform, string[]][] = [
	["instagram", ["instagram"]],
	["facebook", ["facebook"]],
	["twitter", ["twitter", "x.com"]],
	["linkedin", ["linkedin"]],
	["tiktok", ["tiktok"]],
	["youtube", ["youtube"]],
	["pinterest", ["pinterest"]],
];

export function socialPlatform(url: string): SocialPlatform {
	const lower = url.toLowerCase();
	return (
		PLATFORM_HOSTS.find(([, hosts]) =>
			hosts.some((h) => lower.includes(h)),
		)?.[0] ?? "website"
	);
}

/** The owner's profile links, one per known platform; every unknown link is kept. */
export function uniqueSocials(
	socials: string[] | undefined,
): { platform: SocialPlatform; url: string }[] {
	const seen = new Set<SocialPlatform>();
	const out: { platform: SocialPlatform; url: string }[] = [];
	for (const url of socials ?? []) {
		if (!url?.trim()) continue;
		const platform = socialPlatform(url);
		if (platform !== "website" && seen.has(platform)) continue;
		seen.add(platform);
		out.push({ platform, url });
	}
	return out;
}
