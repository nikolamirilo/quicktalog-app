"use client";
import { extractDomain } from "@/helpers/client";
import { useState } from "react";
import SmartLink from "./SmartLink";

export default function PartnerBadge({
	partner,
}: {
	partner: {
		name: string;
		description: string;
		url?: string;
	};
}) {
	const [imageError, setImageError] = useState(false);

	return (
		<SmartLink
			className="group flex items-center gap-3 px-4 py-3 border font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:bg-primary/10 hover:text-primary bg-catalogue-card-background text-foreground border-primary rounded-lg cursor-pointer"
			href={partner.url}
		>
			<div className="w-9 p-1 h-9 flex-shrink-0 rounded-full overflow-hidden">
				{imageError ? (
					<div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
						{partner.name.charAt(0)}
					</div>
				) : (
					<img
						alt={`${partner.name} logo`}
						className="w-full h-full object-cover"
						height={32}
						onError={() => setImageError(true)}
						src={`https://img.logo.dev/${extractDomain(partner.url)}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
						width={32}
					/>
				)}
			</div>

			{/* Text */}
			<div className="flex-1 min-w-0">
				<p className="font-semibold truncate leading-tight transition-colors group-hover:text-primary">
					{partner.name}
				</p>
				<p className="opacity-70 truncate mt-0.5 transition-colors group-hover:text-primary/70">
					{partner.description}
				</p>
			</div>

			{/* Arrow */}
			<svg
				className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
				fill="none"
				stroke="currentColor"
				strokeWidth={2}
				viewBox="0 0 24 24"
			>
				<path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</SmartLink>
	);
}
