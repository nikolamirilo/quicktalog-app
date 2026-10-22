"use client";
import { HtmlContent } from "@/components/general/HtmlContent";
import type { TextBlock } from "@quicktalog/common";
import { useState } from "react";
import BlockControls, {
	BLOCK_CONTROLS_GROUP,
} from "@/components/catalogue/cards/common/BlockControls";
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
			<section aria-label={block.name || undefined} className="mb-5">
				<HtmlContent className="" html={block.content} />
			</section>
		);
	}

	return (
		<section
			aria-label={block.name || undefined}
			className={`mb-5 ${BLOCK_CONTROLS_GROUP} relative min-h-[50px] rounded-lg border-2 border-dashed p-2 transition-colors ${isEditing ? "border-product-primary" : "border-transparent hover:border-product-border-strong [@media(hover:none)]:border-product-border"}`}
			id={slug ? `${slug}-${block.order}` : undefined}
		>
			<BlockControls
				editLabel="Edit text"
				isEditing={isEditing}
				isFirst={isFirst}
				isLast={isLast}
				label="Text"
				name={block.name}
				onDelete={onDelete}
				onEdit={() => setIsEditing(!isEditing)}
				onMoveDown={onMoveDown}
				onMoveUp={onMoveUp}
			/>
			{isEditing ? (
				<RichTextEditor
					className="font-body"
					content={block.content}
					onChange={(html) =>
						onUpdateBlock && onUpdateBlock({ ...block, content: html })
					}
					themeMode="catalogue"
				/>
			) : (
				<div
					className="cursor-text min-h-[30px]"
					onClick={() => setIsEditing(true)}
				>
					{block.content && <HtmlContent className="" html={block.content} />}
				</div>
			)}
		</section>
	);
};

export default TextBlockComponent;
