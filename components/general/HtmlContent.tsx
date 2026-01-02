"use client";
import parse from "html-react-parser";
import "../../css/rich-text-editor.css";

export default function HtmlContent({ html, className, ...props }) {
	return (
		<div className={`rich-text-content ${className || ""}`} {...props}>
			{parse(html)}
		</div>
	);
}
