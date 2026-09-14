"use client";
import { useEffect, useRef } from "react";

interface CodePreviewProps {
	code: string | undefined;
	previewTemplate: { name: string; code: string } | null;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, previewTemplate }) => {
	const previewRef = useRef<HTMLDivElement>(null);
	const hasRunPreviewCode = useRef<string | null>(null);

	useEffect(() => {
		if (!previewRef.current || !previewTemplate) {
			hasRunPreviewCode.current = null;
			return;
		}
		if (hasRunPreviewCode.current === previewTemplate.code) return;
		hasRunPreviewCode.current = previewTemplate.code;

		const oldScripts = Array.from(
			previewRef.current.querySelectorAll("script"),
		);
		const newScripts: HTMLScriptElement[] = [];
		let isActive = true;

		const loadScripts = async () => {
			for (const oldScript of oldScripts) {
				if (!isActive) break;
				await new Promise<void>((resolve) => {
					const newScript = document.createElement("script");
					Array.from(oldScript.attributes).forEach((attr) => {
						newScript.setAttribute(attr.name, attr.value);
					});
					newScript.textContent = oldScript.textContent;

					if (newScript.src) {
						newScript.onload = () => resolve();
						newScript.onerror = () => resolve();
					}

					document.body.appendChild(newScript);
					newScripts.push(newScript);

					if (!newScript.src) {
						resolve();
					}
				});
			}
		};

		loadScripts();

		return () => {
			isActive = false;
			newScripts.forEach((script) => {
				if (script.parentNode) {
					script.parentNode.removeChild(script);
				}
			});
		};
	}, [previewTemplate]);

	return <div ref={previewRef} />;
};

export default CodePreview;
