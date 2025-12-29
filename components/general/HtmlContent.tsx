"use client";

import parse from "html-react-parser";

export default function HtmlContent({ html, className, ...props }) {
	return (
		<div className={className} {...props}>
			{parse(html)}
		</div>
	);
}
