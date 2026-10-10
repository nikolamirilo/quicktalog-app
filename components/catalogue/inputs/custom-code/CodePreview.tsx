"use client";
import HtmlContent from "@/components/general/HtmlContent";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { memo, useEffect, useRef } from "react";

interface PreviewItemProps {
	code: string;
	label: string;
	onSelect: () => void;
	canUse: boolean;
	isHorizontal: boolean;
}

export const PreviewItem = memo(
	({ code, label, onSelect, canUse, isHorizontal }: PreviewItemProps) => {
		const ref = useRef<HTMLDivElement>(null);

		useEffect(() => {
			if (!ref.current) return;
			const container = ref.current;

			const oldScripts = Array.from(container.querySelectorAll("script"));
			const newScripts: HTMLScriptElement[] = [];

			let isActive = true;

			const loadScripts = async () => {
				for (const oldScript of oldScripts) {
					if (!isActive) break;
					if (oldScript.src) {
						if (!document.querySelector(`script[src="${oldScript.src}"]`)) {
							await new Promise<void>((resolve) => {
								const newScript = document.createElement("script");
								newScript.src = oldScript.src;
								newScript.onload = () => resolve();
								newScript.onerror = () => resolve();
								document.body.appendChild(newScript);
								newScripts.push(newScript);
							});
						}
					} else {
						const newScript = document.createElement("script");
						newScript.textContent = oldScript.textContent;
						document.body.appendChild(newScript);
						newScripts.push(newScript);
					}
				}
			};

			loadScripts();

			return () => {
				isActive = false;
				if (typeof (window as any).lottie !== "undefined") {
					try {
						(window as any).lottie.destroy();
					} catch (e) {}
				}
				newScripts.forEach((script) => {
					if (script.parentNode) {
						script.parentNode.removeChild(script);
					}
				});
			};
		}, [code]);

		return (
			<div
				className={`group relative rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md overflow-hidden ${isHorizontal ? "col-span-2" : "col-span-1"}`}
			>
				<div
					ref={ref}
					className="pointer-events-none w-full relative"
					style={{ zoom: 0.5 } as any}
				>
					<HtmlContent html={code} />
				</div>
				{/* Overlay */}
				<div className="absolute inset-0 z-10 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
					<span className="text-white font-semibold mb-4 text-xl drop-shadow-md">
						{label}
					</span>
					<Button
						variant={canUse ? "default" : "secondary"}
						onClick={onSelect}
						disabled={!canUse}
						className={
							canUse
								? "bg-white text-black hover:bg-gray-100 px-6 font-bold shadow-lg"
								: "shadow-lg"
						}
					>
						{canUse ? (
							<>Select Template</>
						) : (
							<>
								<Lock className="w-4 h-4 mr-2" /> Premium
							</>
						)}
					</Button>
				</div>
			</div>
		);
	},
);

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
