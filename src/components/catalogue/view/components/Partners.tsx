"use client";
import { SmartLink } from "@/components/general/SmartLink";
import { extractDomain } from "@/lib/http/domain";
import type { Partner } from "@quicktalog/common";
import { useState } from "react";

const PartnerAvatar = ({ partner }: { partner: Partner }) => {
	const [failed, setFailed] = useState(false);
	const domain = partner.url ? extractDomain(partner.url) : null;
	return (
		<span aria-hidden="true" className="cat-foot-avatar">
			{domain && !failed ? (
				<img
					alt=""
					height={32}
					onError={() => setFailed(true)}
					src={`https://img.logo.dev/${domain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
					width={32}
				/>
			) : (
				partner.name.charAt(0)
			)}
		</span>
	);
};

/** The partners row above the footer's bottom bar. */
const Partners = ({ partners }: { partners: Partner[] }) => {
	if (partners.length === 0) return null;
	return (
		<div className="cat-foot-partners">
			<b>Our partners</b>
			{partners.map((partner, index) => (
				<SmartLink
					className="cat-foot-pill"
					href={partner.url}
					key={`${partner.name}-${index}`}
				>
					<PartnerAvatar partner={partner} />
					<span className="min-w-0">
						<b className="truncate">{partner.name}</b>
						{partner.description && (
							<small className="truncate">{partner.description}</small>
						)}
					</span>
				</SmartLink>
			))}
		</div>
	);
};

export default Partners;
