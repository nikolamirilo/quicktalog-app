"use client";

import type { CustomCodeBlock } from "@quicktalog/common";
import HtmlContent from "../../general/HtmlContent";
import BlockControls from "../cards/common/BlockControls";

interface CustomCodeBlockProps {
	block: CustomCodeBlock;
	slug: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onEdit?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: "edit" | "view";
}

const CustomCodeBlockComponent = ({
	block,
	slug,
	onDelete,
	onMoveUp,
	onMoveDown,
	onEdit,
	isFirst,
	isLast,
	mode,
}: CustomCodeBlockProps) => {
	return (
		<section className="mb-5 group relative" id={`${slug}-${block.order}`}>
			{mode === "edit" && (
				<BlockControls
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
					onEdit={onEdit}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}
			<HtmlContent html={block.code} />
		</section>
	);
};

export default CustomCodeBlockComponent;
