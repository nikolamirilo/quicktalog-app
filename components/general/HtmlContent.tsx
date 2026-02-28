"use client";
import parse from "html-react-parser";

export default function HtmlContent({
	html,
	className,
	...props
}: {
	html: string;
	className?: string;
}) {
	return (
		<div className={`rich-text-content ${className || ""}`} {...props}>
			{parse(html)}
		</div>
	);
}
