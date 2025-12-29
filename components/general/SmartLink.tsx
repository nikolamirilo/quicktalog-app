import Link from "next/link";
import React from "react";

type SmartLinkProps = {
	href: string;
	children: React.ReactNode;
	className?: string;
	ariaLabel?: string;
};

const SmartLink: React.FC<SmartLinkProps> = ({
	href,
	children,
	className,
	ariaLabel,
}) => {
	const isExternal =
		/^https?:\/\//.test(href) ||
		/^www\./.test(href) ||
		(/^[^\/]+\.[^\/]+/.test(href) && !href.startsWith("/"));

	const finalHref = isExternal
		? href.startsWith("http")
			? href
			: `https://${href}`
		: href;

	if (isExternal) {
		return (
			<a
				href={finalHref}
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
		<Link href={finalHref} className={className} aria-label={ariaLabel}>
			{children}
		</Link>
	);
};

export default SmartLink;
