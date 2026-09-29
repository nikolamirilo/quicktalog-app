"use client";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CodeEditorProps {
	code: string;
	onChange: (code: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="space-y-3 font-product-body">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
					HTML code
					<span aria-hidden="true" className="ml-1 text-product-error">
						*
					</span>
				</p>
				<Button
					aria-controls="custom-code-editor"
					aria-expanded={isExpanded}
					onClick={() => setIsExpanded(!isExpanded)}
					size="sm"
					type="button"
					variant="outline"
				>
					{isExpanded ? (
						<>
							<ChevronUp aria-hidden="true" className="h-4 w-4" />
							Collapse editor
						</>
					) : (
						<>
							<ChevronDown aria-hidden="true" className="h-4 w-4" />
							Expand editor
						</>
					)}
				</Button>
			</div>

			<div
				className={`overflow-hidden rounded-[14px] border-[1.5px] border-product-border-strong transition-[height] duration-300 ${
					isExpanded ? "h-[350px]" : "h-[120px]"
				}`}
				id="custom-code-editor"
			>
				<Editor
					defaultLanguage="html"
					height="100%"
					onChange={(v) => onChange(v || "")}
					options={{
						ariaLabel: "HTML code",
						minimap: { enabled: false },
						fontSize: 14,
						wordWrap: "on",
						automaticLayout: true,
						scrollBeyondLastLine: false,
					}}
					theme="vs-dark"
					value={code}
					width="100%"
				/>
			</div>
			<p className="text-[12.5px] leading-snug text-product-muted">
				Paste valid HTML code. It will be rendered directly in your catalogue.
			</p>
		</div>
	);
};

export default CodeEditor;
