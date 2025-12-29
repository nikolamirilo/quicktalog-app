import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomCodeInputProps {
	value: {
		code?: string;
	};
	onChange: (value: any) => void;
}

const CustomCodeInput = ({ value, onChange }: CustomCodeInputProps) => {
	return (
		<div className="mt-4 p-6 pt-0 space-y-6">
			<div className="space-y-4">
				<Label
					className="text-product-foreground font-medium font-body"
					htmlFor="custom-code-input"
				>
					HTML Code
					<span className="text-red-500 ml-1">*</span>
				</Label>
				<Textarea
					id="custom-code-input"
					onChange={(e) => onChange({ ...value, code: e.target.value })}
					placeholder="Enter your custom HTML code here..."
					value={value.code || ""}
					className="min-h-[200px] font-mono text-sm"
					rows={10}
				/>
				<p className="text-xs text-gray-500">
					Paste valid HTML code. It will be rendered directly in your catalogue.
				</p>
			</div>
		</div>
	);
};

export default CustomCodeInput;
