"use client";

export default function HtmlContent({
	html,
	className,
	unstyled,
	...props
}: {
	html: string;
	className?: string;
	/**
	 * Skip the `.rich-text-content` typography rules. For markup that carries its
	 * own styling (custom code blocks), inheriting them is interference.
	 */
	unstyled?: boolean;
}) {
	return (
		<div
			className={`${unstyled ? "" : "rich-text-content"} ${className || ""}`.trim()}
			dangerouslySetInnerHTML={{ __html: html }}
			suppressHydrationWarning
			{...props}
		/>
	);
}
