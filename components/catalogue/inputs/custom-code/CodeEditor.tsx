"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
					value={code}
					onChange={(v) => onChange(v || "")}
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
	);
};

export default CodeEditor;
