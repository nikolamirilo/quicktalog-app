"use client";

import BlockNameInput from "@/components/catalogue/inputs/BlockNameInput";
import CustomCodeInput from "@/components/catalogue/inputs/CustomCodeInput";
import DividerInput from "@/components/catalogue/inputs/DividerInput";
import EmbeddingInput from "@/components/catalogue/inputs/EmbeddingInput";
import LimitsOverlay from "@/components/catalogue/inputs/sidebar/LimitsOverlay";
import RichTextEditor from "@/components/catalogue/sections/common/RichTextEditor";
import { cn } from "@/lib/ui/cn";
import type { ContentOption } from "./BlockConfigHeader";
import { ItemsBlockFields } from "./ItemsBlockFields";

interface BlockData {
	name: string;
	layout: string;
	items: any[];
	code: string;
	content: string;
	divider: {
		spacing: number;
		border: {
			isEnabled: boolean;
			style: string;
			thickness: number;
			color: string;
			opacity: number;
		};
	};
	showHeading: boolean;
	isExpanded: boolean;
}

interface BlockConfigFormProps {
	selectedOption: ContentOption;
	blockData: BlockData;
	setBlockData: (data: BlockData) => void;
	locked: boolean;
}

const BlockConfigForm = ({
	selectedOption,
	blockData,
	setBlockData,
	locked,
}: BlockConfigFormProps) => {
	return (
		<div className={cn("relative flex flex-col", locked && "min-h-[280px]")}>
			<div className="w-full max-w-2xl">
				{locked && <LimitsOverlay size="sm" />}
				<>
					{selectedOption === "items" && (
						<ItemsBlockFields onChange={setBlockData} value={blockData} />
					)}

					{selectedOption === "embedding" && (
						<EmbeddingInput
							onChange={(val) => setBlockData({ ...blockData, ...val })}
							value={blockData}
						/>
					)}

					{selectedOption === "custom_code" && (
						<CustomCodeInput
							onChange={(val) => setBlockData({ ...blockData, ...val })}
							value={blockData}
						/>
					)}

					{selectedOption === "text" && (
						<div className="flex flex-col gap-4">
							<BlockNameInput
								onChange={(name) => setBlockData({ ...blockData, name })}
								type="text"
								value={blockData.name || ""}
							/>
							<div className="flex flex-col gap-2">
								<p className="text-[13.5px] font-semibold leading-none text-product-foreground">
									Content
								</p>
								{/* The editor previews catalogue text, so it keeps the catalogue font. */}
								<div style={{ fontFamily: "var(--catalogue-font-body)" }}>
									<RichTextEditor
										className="px-0.5"
										content={blockData.content || "<p></p>"}
										onChange={(val) =>
											setBlockData({ ...blockData, content: val })
										}
									/>
								</div>
							</div>
						</div>
					)}

					{selectedOption === "divider" && (
						<div className="flex flex-col gap-4">
							<BlockNameInput
								onChange={(name) => setBlockData({ ...blockData, name })}
								type="divider"
								value={blockData.name || ""}
							/>
							<DividerInput
								onChange={(val) =>
									setBlockData({
										...blockData,
										divider: { ...blockData.divider, ...val } as any,
									})
								}
								value={blockData.divider as any}
							/>
						</div>
					)}
				</>
			</div>
		</div>
	);
};

export default BlockConfigForm;
