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
				}}
				type="button"
				variant="section-header"
			>
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-r from-transparent via-section-header-accent/8 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out"
					style={{ willChange: "opacity" }}
				/>

				<span className="relative z-10">
					<span className="relative inline-block">
						{title}
						<span
							aria-hidden="true"
							className="absolute left-0 -bottom-1 h-0.5 bg-section-header-accent rounded-full
              transition-all duration-200 ease-out origin-left"
							style={{
								width: showContent ? "100%" : "0%",
								willChange: "width",
							}}
						/>
					</span>
				</span>
				{mode !== "edit" && (
					<div className="relative z-10 flex items-center ml-auto">
						<div
							aria-hidden="true"
							className="w-7 h-7 bg-section-header-accent/10 rounded-full flex items-center justify-center
            group-hover:bg-section-header-accent/15 transition-colors duration-150 ease-out"
							style={{ willChange: "background-color" }}
						>
							<FiChevronDown
								aria-hidden="true"
								className="text-lg text-foreground transition-transform duration-200 ease-out"
								style={{
									transform: showContent ? "rotate(180deg)" : "rotate(0deg)",
									willChange: "transform",
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
					currentLayout={currentLayout}
					onLayoutChange={onLayoutChange}
				/>
			)}
		</div>
	);
};

export default CategoryHeader;
