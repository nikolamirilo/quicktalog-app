"use client";
import BlockNameInput from "./BlockNameInput";
import CodeEditor from "./custom-visual/CodeEditor";

interface CustomVisualInputProps {
	value: {
		name?: string;
		code?: string;
	};
	onChange: (value: any) => void;
}

const CustomVisualInput = ({ value, onChange }: CustomVisualInputProps) => {
	return (
		<div className="space-y-4">
			<BlockNameInput
				onChange={(name) => onChange({ ...value, name })}
				type="custom_visual"
				value={value.name || ""}
			/>

			<CodeEditor
				code={value.code || ""}
				onChange={(code) => onChange({ ...value, code })}
			/>
		</div>
	);
};

export default CustomVisualInput;
