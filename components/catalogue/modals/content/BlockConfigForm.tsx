"use client";

import { UserData } from "@quicktalog/common";
import RichTextEditor from "../../blocks/common/RichTextEditor";
import LimitsOverlay from "../../inputs/BuilderSidebar/LimitsOverlay";
import ContentInput from "../../inputs/ContentInput";
import CustomCodeInput from "../../inputs/CustomCodeInput";
import DividerInput from "../../inputs/DividerInput";
import EmbeddingInput from "../../inputs/EmbeddingInput";

type ContentOption =
	| "container"
	| "category"
	| "text"
	| "embedding"
	| "custom_code"
	| "divider";

interface BlockData {
	name: string;
	layout: string;
	src: string;
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
	isExpanded: boolean;
}

interface BlockConfigFormProps {
	selectedOption: ContentOption;
	blockData: BlockData;
	setBlockData: (data: BlockData) => void;
	locked: boolean;
	userData: UserData;
}

const BlockConfigForm = ({
	selectedOption,
	blockData,
	setBlockData,
	locked,
	userData,
}: BlockConfigFormProps) => {
	return (
		<div className="flex-1 overflow-y-auto mt-4 pb-8 flex flex-col relative">
			<div className="max-w-2xl w-full">
				{locked && <LimitsOverlay size="sm" />}
				<>
					{selectedOption === "category" && (
						<ContentInput
							onChange={(val) => setBlockData({ ...blockData, ...val })}
							type="category"
							value={blockData}
						/>
					)}

					{selectedOption === "container" && (
						<ContentInput
							onChange={(val) => setBlockData({ ...blockData, ...val })}
							type="container"
							value={blockData}
						/>
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
							userData={userData}
						/>
					)}

					{selectedOption === "text" && (
						<div>
							<label className="block text-sm font-medium mb-2 text-gray-700">
								Content
							</label>
							<RichTextEditor
								className="px-0.5"
								content={blockData.content || "<p></p>"}
								onChange={(val) => setBlockData({ ...blockData, content: val })}
							/>
						</div>
					)}

					{selectedOption === "divider" && (
						<DividerInput
							value={blockData.divider as any}
							onChange={(val) =>
								setBlockData({
									...blockData,
									divider: { ...blockData.divider, ...val } as any,
								})
							}
						/>
					)}
				</>
			</div>
		</div>
	);
};

export default BlockConfigForm;
