import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IframeBlock } from "@/types/catalogue";

interface IframeInputProps {
	value: Partial<IframeBlock>;
	onChange: (value: Partial<IframeBlock>) => void;
}

const IframeInput = ({ value, onChange }: IframeInputProps) => {
	return (
		<div className="p-6 pt-0 space-y-6">
			{/* Source URL Input */}
			<div className="space-y-4">
				<Label className="text-sm font-medium text-product-foreground">
					Source URL <span className="text-red-500">*</span>
				</Label>
				<Input
					value={value.src || ""}
					onChange={(e) => onChange({ ...value, src: e.target.value })}
					placeholder="https://www.google.com/maps/embed?pb=!1m18!1m1..."
					className="focus-visible:ring-product-primary"
				/>
				<p className="text-xs text-gray-500">
					Enter the full URL of the content you want to embed.
				</p>
				{value.src && (
					<div className="mt-4 border rounded-lg overflow-hidden bg-gray-50">
						<div className="p-2 bg-gray-100 border-b text-xs text-gray-500 font-medium">
							Preview
						</div>
						<div className="aspect-video w-full">
							<iframe
								src={value.src}
								title="Preview"
								className="w-full h-full"
								sandbox="allow-scripts allow-same-origin allow-popups"
								referrerPolicy="no-referrer"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default IframeInput;
