"use client";
import HtmlContent from "@/components/general/HtmlContent";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";
import { UserData } from "@quicktalog/common";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

const PreviewItem = memo(
	({
		code,
		label,
		onSelect,
		canUse,
		isHorizontal,
	}: {
		code: string;
		label: string;
		onSelect: () => void;
		canUse: boolean;
		isHorizontal: boolean;
	}) => {
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

interface CustomCodeInputProps {
	value: {
		code?: string;
	};
	onChange: (value: any) => void;
	userData: UserData;
}

const CustomCodeInput = ({
	value,
	onChange,
	userData,
}: CustomCodeInputProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [previewTemplate, setPreviewTemplate] = useState<{
		name: string;
		code: string;
	} | null>(null);
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

	// Check if user has access to premium features (Growth or Premium plans)
	const canUseTemplates = userData?.planId && userData.currentPlan.id >= 2; // 2 = Growth, 3 = Premium

	// Convert camelCase to Title Case
	const toTitleCase = (str: string) => {
		return str
			.replace(/([A-Z])/g, " $1")
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	};

	const handleUseTemplate = (code: string) => {
		if (!canUseTemplates) return;
		onChange({ ...value, code });
	};

	return (
		<div className="space-y-6">
			{/* Code Editor Section */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label
						className="text-product-foreground font-medium font-body"
						htmlFor="custom-code-input"
					>
						HTML Code
						<span className="text-red-500 ml-1">*</span>
					</Label>
					<Button
						className="text-sm"
						onClick={() => setIsExpanded(!isExpanded)}
						size="sm"
						type="button"
						variant="outline"
					>
						{isExpanded ? (
							<>
								<ChevronUp className="w-4 h-4 mr-2" />
								Collapse Editor
							</>
						) : (
							<>
								<ChevronDown className="w-4 h-4 mr-2" />
								Expand Editor
							</>
						)}
					</Button>
				</div>

				<div
					className={`border rounded-md overflow-hidden transition-all duration-300 ${
						isExpanded ? "h-[350px]" : "h-[75px]"
					}`}
				>
					<Editor
						height="100%"
						width="100%"
						defaultLanguage="html"
						value={value.code || ""}
						onChange={(v) => onChange({ ...value, code: v || "" })}
						theme="vs-dark"
						options={{
							minimap: { enabled: false },
							fontSize: 14,
							wordWrap: "on",
							automaticLayout: true,
							scrollBeyondLastLine: false,
						}}
					/>
				</div>
				<p className="text-xs text-gray-500">
					Paste valid HTML code. It will be rendered directly in your catalogue.
				</p>
			</div>

			{/* Template Library Section */}
			<div className="space-y-4 pt-4 border-t border-gray-200">
				<div>
					<h3 className="text-product-foreground font-semibold font-body mb-1">
						Custom Code Library
					</h3>
					<p className="text-xs text-gray-500 mb-6">
						Pre-made components ready to be added to your catalogue
					</p>
				</div>

				{/* <div className="grid grid-cols-2 gap-4 w-full pb-8 grid-flow-dense">
					{Object.entries(customCodeTemplates).map(([key, code]) => {
						const isHorizontal = [
							"ctaSection",
							"jewelryCollection",
							"giftShopBanner",
							"cafeLoyalty",
							"fashionLookbook"
						].includes(key);

						return (
							<PreviewItem
								key={key}
								code={code}
								label={toTitleCase(key)}
								onSelect={() => handleUseTemplate(code)}
								canUse={canUseTemplates}
								isHorizontal={isHorizontal}
							/>
						);
					})}
				</div> */}
			</div>
		</div>
	);
};

export default CustomCodeInput;
