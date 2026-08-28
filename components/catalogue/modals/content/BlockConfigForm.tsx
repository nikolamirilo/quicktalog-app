"use client";

import { UserData } from "@quicktalog/common";
import BlockNameInput from "../../inputs/BlockNameInput";
import ContentInput from "../../inputs/ContentInput";
import CustomCodeInput from "../../inputs/CustomCodeInput";
import DividerInput from "../../inputs/DividerInput";
import EmbeddingInput from "../../inputs/EmbeddingInput";
import LimitsOverlay from "../../inputs/sidebar/LimitsOverlay";
import RichTextEditor from "../../sections/common/RichTextEditor";

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
	isEditing?: boolean;
}

const BlockConfigForm = ({
	selectedOption,
	blockData,
	setBlockData,
	locked,
	userData,
	isEditing,
}: BlockConfigFormProps) => {
	return (
		<div className="flex-1 min-h-0 mt-4 pb-8 flex flex-col relative">
			<div className="max-w-2xl w-full">
				{locked && <LimitsOverlay size="sm" />}
				<>
					{selectedOption === "category" && (
						<ContentInput
							canGenerate={!isEditing}
							onChange={(val) => setBlockData({ ...blockData, ...val })}
							type="category"
							value={blockData}
						/>
					)}

					{selectedOption === "container" && (
						<ContentInput
							canGenerate={!isEditing}
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
							userData={userData}
							value={blockData}
						/>
					)}

					{selectedOption === "text" && (
						<div className="flex flex-col gap-6">
							<BlockNameInput
								onChange={(name) => setBlockData({ ...blockData, name })}
								type="text"
								value={blockData.name || ""}
							/>
							<div>
								<label className="block text-sm font-medium mb-2 text-gray-700">
									Content
								</label>
								<div style={{ fontFamily: "var(--catalogue-font-body)" }}>
									<RichTextEditor
										className="px-0.5 font-body"
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
						<div className="flex flex-col gap-6">
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
