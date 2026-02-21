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
			className="group flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-105 hover:bg-primary/5 cursor-pointer border border-card-heading shadow-sm hover:shadow-md hover:border-primary/30 bg-transparent text-secondary"
			href={partner.url}
		>
			<div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
				{imageError ? (
					<div className="w-full h-full rounded-full bg-secondary/10 flex items-center justify-center font-heading font-weight-heading text-secondary">
						<span className="text-lg leading-none">
							{partner.name.charAt(0)}
						</span>
					</div>
				) : (
					<img
						alt={`${partner.name} logo`}
						className="w-8 h-8 rounded-full object-cover heading transition-transform group-hover:scale-110 duration-200"
						height={32}
						onError={() => setImageError(true)}
						src={`https://img.logo.dev/${extractDomain(partner.url)}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
						width={32}
					/>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="font-semibold text-sm font-heading font-weight-heading tracking-heading text-card-heading truncate">
					{partner.name}
				</div>
				<div className="text-xs text-card-heading truncate group-hover:text-secondary transition-colors duration-200">
					{partner.description}
				</div>
			</div>
		</SmartLink>
	);
}
