"use client";
import BlockNameInput from "./BlockNameInput";
import CodeEditor from "./custom-code/CodeEditor";

interface CustomCodeInputProps {
	value: {
		name?: string;
		code?: string;
	};
	onChange: (value: any) => void;
}

const CustomCodeInput = ({ value, onChange }: CustomCodeInputProps) => {
	return (
		<div className="space-y-6">
			<BlockNameInput
				onChange={(name) => onChange({ ...value, name })}
				type="custom_code"
				value={value.name || ""}
			/>

			<CodeEditor
				code={value.code || ""}
				onChange={(code) => onChange({ ...value, code })}
			/>
		</div>
	);
};

export default CustomCodeInput;
