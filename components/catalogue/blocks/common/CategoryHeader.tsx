import { FiChevronDown } from "react-icons/fi";
import { Button } from "../../../ui/button";
import BlockControls from "../../cards/common/BlockControls";

const CategoryHeader = ({
	title,
	code,
	isExpanded,
	onToggle,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	mode,
	currentLayout,
	onLayoutChange,
	onEdit,
}: {
	title: string;
	code: string;
	isExpanded: boolean;
	onToggle: (code: string) => void;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: string;
	currentLayout?: string;
	onLayoutChange?: (layout: string) => void;
	onEdit?: () => void;
}) => {
	const showContent = mode === "edit" || isExpanded;
	return (
		<div className="relative group/header">
			<Button
				aria-controls={`section-content-${code}`}
				aria-expanded={showContent}
				aria-label={`${showContent ? "Collapse" : "Expand"} ${title} section`}
				className="group relative overflow-hidden will-change-transform w-full"
				id={`section-header-${code}`}
				onClick={() => onToggle(code)}
				style={{
					background: "var(--section-header-gradient)",
					fontFamily: "var(--font-family-heading)",
					fontWeight: "var(--font-weight-heading)",
					letterSpacing: "var(--letter-spacing-heading)",
					transform: "translate3d(0, 0, 0)",
					borderRadius: "var(--border-radius)",
					transitionDuration: "var(--animation-duration)",
				}}
				type="button"
				variant="section-header"
			>
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-r from-transparent via-section-header-accent/8 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity ease-out"
					style={{
						willChange: "opacity",
						transitionDuration: "var(--animation-duration)",
					}}
				/>

				<span className="relative z-10">
					<span className="relative inline-block">
						{title}
						<span
							aria-hidden="true"
							className="absolute left-0 -bottom-1 h-0.5 bg-section-header-accent rounded-full
              transition-all ease-out origin-left"
							style={{
								width: showContent ? "100%" : "0%",
								willChange: "width",
								transitionDuration: "var(--animation-duration)",
							}}
						/>
					</span>
				</span>
				{mode !== "edit" && (
					<div className="relative z-10 flex items-center ml-auto">
						<div
							aria-hidden="true"
							className="w-7 h-7 bg-section-header-accent/10 rounded-full flex items-center justify-center
            group-hover:bg-section-header-accent/15 transition-colors ease-out"
							style={{
								willChange: "background-color",
								transitionDuration: "var(--animation-duration)",
							}}
						>
							<FiChevronDown
								aria-hidden="true"
								className="text-lg text-foreground transition-transform ease-out"
								style={{
									transform: showContent ? "rotate(180deg)" : "rotate(0deg)",
									willChange: "transform",
									transitionDuration: "var(--animation-duration)",
								}}
							/>
						</div>
					</div>
				)}
			</Button>

			{mode === "edit" && (
				<BlockControls
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
					onEdit={onEdit}
					currentLayout={currentLayout}
					onLayoutChange={onLayoutChange}
				/>
			)}
		</div>
	);
};

export default CategoryHeader;
