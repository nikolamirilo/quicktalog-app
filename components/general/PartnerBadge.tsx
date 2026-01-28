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
			className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-102 hover:shadow-md cursor-pointer bg-card-bg text-card-description border border-card-border"
			href={partner.url}
		>
			<div className="w-8 h-8 flex items-center justify-center">
				{imageError ? (
					<span className="text-lg">{partner.name.charAt(0)}</span>
				) : (
					<img
						alt={`${partner.name} logo`}
						className="w-8 h-8 rounded-full"
						height={32}
						onError={() => setImageError(true)}
						src={`https://img.logo.dev/${extractDomain(partner.url)}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
						width={32}
					/>
				)}
			</div>
			<div className="flex-1">
				<div className="font-semibold text-sm font-heading font-weight-heading tracking-heading text-card-heading">
					{partner.name}
				</div>
				<div className="text-xs text-card-description">
					{partner.description}
				</div>
			</div>
		</SmartLink>
	);
}
