import { Label } from "@/components/ui/label";
import Editor from "@monaco-editor/react";

interface CustomCodeInputProps {
	value: {
		code?: string;
	};
	onChange: (value: any) => void;
}

const CustomCodeInput = ({ value, onChange }: CustomCodeInputProps) => {
	return (
		<div className="space-y-4">
			<Label
				className="text-product-foreground font-medium font-body"
				htmlFor="custom-code-input"
			>
				HTML Code
				<span className="text-red-500 ml-1">*</span>
			</Label>
			<div className="border rounded-md overflow-hidden h-[350px]">
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
	);
};

export default CustomCodeInput;
