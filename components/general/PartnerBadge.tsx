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
			className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-card-border bg-card-bg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
			href={partner.url}
		>
			{/* Logo */}
			{/* Logo */}
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
				<p className="text-sm font-semibold text-card-heading truncate leading-tight">
					{partner.name}
				</p>
				<p className="text-xs text-card-heading/60 truncate mt-0.5">
					{partner.description}
				</p>
			</div>

			{/* Arrow */}
			<svg
				className="w-4 h-4 text-card-heading/30 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
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
