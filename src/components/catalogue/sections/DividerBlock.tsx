"use client";

import type { DividerBlock } from "@quicktalog/common";
import { useState } from "react";
import BlockControls, {
	BLOCK_CONTROLS_GROUP,
} from "@/components/catalogue/cards/common/BlockControls";
import DividerInput from "@/components/catalogue/inputs/DividerInput";

interface DividerBlockProps {
	block: DividerBlock;
	slug?: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: "edit" | "view";
	onUpdateBlock?: (data: DividerBlock) => void;
}

const DividerBlockComponent = ({
	block,
	slug,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	mode,
	onUpdateBlock,
}: DividerBlockProps) => {
	const [isEditing, setIsEditing] = useState(false);

	const borderStyle = block.border?.isEnabled
		? {
				borderTopStyle: block.border.style || "solid",
				borderTopWidth: `${block.border.thickness || 1}px`,
				borderTopColor: block.border.color || "#000000",
				opacity: (block.border.opacity ?? 100) / 100,
			}
		: {};

	const style = {
		marginTop: `${(block.spacing || 0) / 2}rem`,
		marginBottom: `${(block.spacing || 0) / 2}rem`,
		...borderStyle,
	};

	if (mode === "view") {
		return <div className="w-full" style={style} />;
	}

	return (
		<section
			aria-label={block.name || undefined}
			className={`${BLOCK_CONTROLS_GROUP} relative rounded-lg border-2 border-dashed transition-colors ${isEditing ? "border-product-primary bg-product-card p-4 font-product-body text-sm text-product-foreground" : "border-transparent p-2 hover:border-product-border-strong [@media(hover:none)]:border-product-border"}`}
			id={slug ? `${slug}-${block.order}` : undefined}
		>
			<BlockControls
				editLabel="Edit divider"
				isEditing={isEditing}
				isFirst={isFirst}
				isLast={isLast}
				label="Divider"
				name={block.name}
				onDelete={onDelete}
				onEdit={() => setIsEditing(!isEditing)}
				onMoveDown={onMoveDown}
				onMoveUp={onMoveUp}
			/>

			{isEditing ? (
				<div className="space-y-4">
					<DividerInput
						onChange={(updates) =>
							onUpdateBlock && onUpdateBlock({ ...block, ...updates })
						}
						value={block}
					/>
				</div>
			) : (
				<div
					className="cursor-pointer w-full"
					onClick={() => setIsEditing(true)}
					style={style}
				/>
			)}
		</section>
	);
};

export default DividerBlockComponent;
