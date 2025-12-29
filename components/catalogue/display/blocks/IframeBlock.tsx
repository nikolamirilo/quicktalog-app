"use client";
import type { IframeBlock } from "@/types/catalogue";
import BlockControls from "./components/cards/common/BlockControls";

interface IframeBlockProps {
	block: IframeBlock;
	slug: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: "edit" | "view";
}

const IframeBlockComponent = ({
	block,
	slug,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	mode,
}: IframeBlockProps) => {
	return (
		<section className="mb-5 group relative" id={`${slug}-${block.order}`}>
			{/* Ordering and Delete Controls */}
			{mode === "edit" && (
				<BlockControls
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
				/>
			)}
			<div className="w-full aspect-video rounded-lg overflow-hidden shadow-md">
				<iframe
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="w-full h-full"
					src={block.src}
				/>
			</div>
		</section>
	);
};

export default IframeBlockComponent;
