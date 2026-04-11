import Link from "next/link";
import React from "react";

type SmartLinkProps = {
	href: string;
	children: React.ReactNode;
	className?: string;
	ariaLabel?: string;
};

const KNOWN_TLDS =
	/\.(com|org|net|io|co|dev|app|me|info|biz|us|uk|de|fr|rs|hr|ba|eu|shop|store|tech|ai|xyz|online|site|website)$/i;

function isExternalUrl(raw: string): boolean {
	if (/^https?:\/\//i.test(raw)) return true;
	if (/^www\./i.test(raw)) return true;
	// Bare domain: must contain a dot, no slashes before it, and end with a known TLD
	const domain = raw.split("/")[0];
	if (domain.includes(".") && KNOWN_TLDS.test(domain)) return true;
	return false;
}

function normalizeHref(raw: string): string {
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

const SmartLink: React.FC<SmartLinkProps> = ({
	href,
	children,
	className,
	ariaLabel,
}) => {
	const trimmed = href?.trim();

	if (!trimmed || trimmed === "https:" || trimmed === "http:") {
		return <span className={className}>{children}</span>;
	}

	if (isExternalUrl(trimmed)) {
		return (
			<a
				href={normalizeHref(trimmed)}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
				aria-label={ariaLabel}
			>
				{children}
			</a>
		);
	}

	return (
		<Link aria-label={ariaLabel} className={className} href={trimmed}>
			{children}
		</Link>
	);
};

export default SmartLink;
