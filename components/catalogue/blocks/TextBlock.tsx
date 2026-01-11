"use client";
import HtmlContent from "@/components/general/HtmlContent";
import type { TextBlock } from "@quicktalog/common";
import { useState } from "react";
import BlockControls from "../cards/common/BlockControls";
import RichTextEditor from "./common/RichTextEditor";

interface TextBlockProps {
	block: TextBlock;
	slug?: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: "edit" | "view";
	onUpdateBlock?: (data: TextBlock) => void;
}

const TextBlockComponent = ({
	block,
	slug,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	mode,
	onUpdateBlock,
}: TextBlockProps) => {
	const [isEditing, setIsEditing] = useState(false);

	if (mode === "view") {
		return (
			<section className="mb-5">
				<HtmlContent className="" html={block.content} />
			</section>
		);
	}

	return (
		<section
			className={`mb-5 group relative min-h-[50px] rounded-lg border-2 border-transparent hover:border-dashed hover:border-gray-300 p-2 transition-all ${isEditing ? "border-dashed border-gray-300 bg-gray-50/50" : ""}`}
			id={slug ? `${slug}-${block.order}` : undefined}
		>
			<BlockControls
				isEditing={isEditing}
				isFirst={isFirst}
				isLast={isLast}
				onDelete={onDelete}
				onEdit={() => setIsEditing(!isEditing)}
				onMoveDown={onMoveDown}
				onMoveUp={onMoveUp}
			/>
			{isEditing ? (
				<RichTextEditor
					content={block.content}
					onChange={(html) =>
						onUpdateBlock && onUpdateBlock({ ...block, content: html })
					}
				/>
			) : (
				<div
					className="cursor-pointer min-h-[30px]"
					onClick={() => setIsEditing(true)}
				>
					{block.content && <HtmlContent className="" html={block.content} />}
				</div>
			)}
		</section>
	);
};

export default TextBlockComponent;
