"use client";

export default function HtmlContent({
	html,
	className,
	...props
}: {
	html: string;
	className?: string;
}) {
	return (
		<div
			className={`rich-text-content ${className || ""}`}
			dangerouslySetInnerHTML={{ __html: html }}
			suppressHydrationWarning
			{...props}
		/>
	);
}
