import { cn } from "@/lib/ui/cn";

/**
 * Stand-in photographs for the sample coffee-shop items. Drawn rather than
 * fetched, so a screen never waits on a network request or shows a broken
 * image, and they crop like a real photo inside the card's frame.
 */
const photos = {
	toast: {
		bg: "#E8D4B0",
		art: (
			<>
				<rect fill="#C98B4B" height="34" rx="4" width="46" x="17" y="22" />
				<rect fill="#E3B877" height="26" rx="3" width="38" x="21" y="26" />
				<circle cx="34" cy="36" fill="#F2E3C4" r="5" />
				<circle cx="48" cy="44" fill="#F2E3C4" r="4" />
				<circle cx="46" cy="32" fill="#B9532F" r="3.5" />
			</>
		),
	},
	eggs: {
		bg: "#D9C7A6",
		art: (
			<>
				<circle cx="40" cy="39" fill="#8A4B2A" r="23" />
				<circle cx="40" cy="39" fill="#C0472F" r="19" />
				<ellipse cx="34" cy="35" fill="#FBF3DF" rx="8" ry="6.5" />
				<circle cx="34" cy="35" fill="#F0A92B" r="3.5" />
				<ellipse cx="47" cy="44" fill="#FBF3DF" rx="7.5" ry="6" />
				<circle cx="47" cy="44" fill="#F0A92B" r="3" />
				<circle cx="44" cy="30" fill="#4E7A3A" r="2.5" />
			</>
		),
	},
	granola: {
		bg: "#E2DAC8",
		art: (
			<>
				<circle cx="40" cy="39" fill="#F7F2E6" r="23" />
				<circle cx="40" cy="39" fill="#EFE6D2" r="18" />
				<circle cx="33" cy="34" fill="#C08A46" r="4" />
				<circle cx="44" cy="33" fill="#A8703A" r="3.4" />
				<circle cx="48" cy="42" fill="#C08A46" r="3.6" />
				<circle cx="36" cy="46" fill="#A8703A" r="3.2" />
				<circle cx="41" cy="40" fill="#8E2F4B" r="3.4" />
				<circle cx="30" cy="42" fill="#8E2F4B" r="2.6" />
			</>
		),
	},
	bun: {
		bg: "#EBD8B6",
		art: (
			<>
				<circle cx="40" cy="39" fill="#C98B4B" r="22" />
				<circle cx="40" cy="39" fill="#DFA868" r="17" />
				<circle cx="40" cy="39" fill="#C98B4B" r="11" />
				<circle cx="40" cy="39" fill="#DFA868" r="6" />
				<path
					d="M40 20c6 6 6 12 0 19"
					fill="none"
					stroke="#F6EBD6"
					strokeLinecap="round"
					strokeWidth="2.5"
				/>
			</>
		),
	},
	latte: {
		bg: "#DCCDB6",
		art: (
			<>
				<circle cx="40" cy="39" fill="#F4EFE4" r="23" />
				<circle cx="40" cy="39" fill="#B07A45" r="18" />
				<path
					d="M40 28c4 4 4 8 0 11-4 3-4 7 0 11"
					fill="none"
					stroke="#F7F1E6"
					strokeLinecap="round"
					strokeWidth="3"
				/>
				<ellipse
					cx="40"
					cy="39"
					fill="none"
					rx="14"
					ry="14"
					stroke="#CFA070"
					strokeWidth="2"
				/>
			</>
		),
	},
	cold: {
		bg: "#D7CDBB",
		art: (
			<>
				<rect fill="#F5F1E8" height="40" rx="5" width="26" x="27" y="20" />
				<rect fill="#C68A4E" height="22" rx="3" width="20" x="30" y="36" />
				<rect fill="#EBDCC4" height="10" rx="3" width="20" x="30" y="26" />
				<rect
					fill="#4E7A3A"
					height="26"
					rx="2"
					transform="rotate(14 50 22)"
					width="3"
					x="48"
					y="14"
				/>
			</>
		),
	},
} as const;

export type ItemPhotoName = keyof typeof photos;

export function ItemPhoto({
	name,
	className,
}: {
	name: ItemPhotoName;
	className?: string;
}) {
	const photo = photos[name];

	return (
		<span className={cn("block overflow-hidden", className)}>
			<svg
				aria-hidden="true"
				className="h-full w-full"
				preserveAspectRatio="xMidYMid slice"
				viewBox="0 0 80 78"
			>
				<title>Item photo</title>
				<rect fill={photo.bg} height="78" width="80" />
				{photo.art}
			</svg>
		</span>
	);
}
