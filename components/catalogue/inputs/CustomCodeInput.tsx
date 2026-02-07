"use client";
import HtmlContent from "@/components/general/HtmlContent";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { customCodeTemplates } from "@/constants/customSolutions";
import Editor from "@monaco-editor/react";
import { UserData } from "@quicktalog/common";
import { ChevronDown, ChevronUp, Eye, Lock } from "lucide-react";
import { useRef, useState } from "react";
import { FaCheck } from "react-icons/fa";

interface CustomCodeInputProps {
	value: {
		code?: string;
	};
	onChange: (value: any) => void;
	userData: UserData;
}

const CustomCodeInput = ({ value, onChange, userData }: CustomCodeInputProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [previewTemplate, setPreviewTemplate] = useState<{
		name: string;
		code: string;
	} | null>(null);
	const previewRef = useRef<HTMLDivElement>(null);

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
		setPreviewTemplate(null);
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
					className={`border rounded-md overflow-hidden transition-all duration-300 ${isExpanded ? "h-[350px]" : "h-[75px]"
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
					<p className="text-xs text-gray-500">
						Pre-made components you can use in your catalogue
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{Object.entries(customCodeTemplates).map(([key, code]) => (
						<div
							key={key}
							className="group border-2 border-gray-200 rounded-xl p-5 transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
						>
							<div className="space-y-3">
								<div className="flex-1">
									<h4 className="font-semibold text-base text-product-foreground mb-1.5">
										{toTitleCase(key)}
									</h4>
									<p className="text-xs text-gray-600 leading-relaxed">
										Pre-built component ready to use
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										className="flex-1"
										onClick={() => setPreviewTemplate({ name: key, code })}
										size="sm"
										type="button"
									>
										<Eye className="w-4 h-4 mr-2" />
										Preview
									</Button>
									<Button
										className={`flex-1 ${canUseTemplates
											? ""
											: "bg-gray-100 text-gray-400 cursor-not-allowed"
											}`}
										disabled={!canUseTemplates}
										onClick={() => canUseTemplates && handleUseTemplate(code)}
										size="sm"
										type="button"
									>
										{canUseTemplates ? (
											<>
												<FaCheck className="w-4 h-4 mr-2" />
												Select
											</>
										) : (
											<>
												<Lock className="w-4 h-4 mr-2" />
												Premium
											</>
										)}
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Preview Modal */}
			<Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-product-background">
					<DialogHeader>
						<DialogTitle>
							{previewTemplate && toTitleCase(previewTemplate.name)}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div className="border rounded-lg overflow-hidden bg-gray-900">
							<div className="p-4 bg-gray-800 border-b border-gray-700">
								<p className="text-sm text-gray-300">Preview</p>
							</div>
							<div className="p-6 bg-gray-900" ref={previewRef}>
								{previewTemplate && (
									<HtmlContent html={previewTemplate.code} />
								)}
							</div>
						</div>

						<div className="flex justify-end gap-3">
							<Button
								onClick={() => setPreviewTemplate(null)}
								type="button"
								variant="outline"
							>
								Close
							</Button>
							<Button
								onClick={() => previewTemplate && handleUseTemplate(previewTemplate.code)}
								type="button"
								className="bg-product-primary hover:bg-product-primary/90"
							>
								Use Template
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default CustomCodeInput;
