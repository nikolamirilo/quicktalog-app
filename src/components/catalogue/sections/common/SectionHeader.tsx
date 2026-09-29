import { FiChevronDown } from "react-icons/fi";
import BlockControls from "@/components/catalogue/cards/common/BlockControls";

// Catalogue-owned so product Button restyles never reach the published catalogue.
const headerButtonClasses =
	"gap-2 whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 w-full group relative flex items-center justify-between text-xl sm:text-2xl md:text-3xl font-semibold border-2 border-catalogue-category-border rounded-2xl shadow-catalogue-category-shadow transition-all duration-300 ease-in-out hover:scale-[1.02] hover:transform hover:-translate-y-1 backdrop-blur-sm overflow-hidden !px-3 !py-3 !h-auto !min-h-0 h-9 px-4 py-2 will-change-transform";

const SectionHeader = ({
	title,
	code,
	contentId,
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
	/** Id of the element this header expands. Omitted only by the error fallback. */
	contentId?: string;
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
			<button
				aria-controls={contentId}
				aria-expanded={showContent}
				aria-label={`${showContent ? "Collapse" : "Expand"} ${title} section`}
				className={headerButtonClasses}
				id={`section-header-${code}`}
				onClick={() => onToggle(code)}
				style={{
					background: "var(--catalogue-category-gradient)",
					fontFamily: "var(--catalogue-font-heading)",
					fontWeight: "var(--catalogue-weight-heading)",
					letterSpacing: "var(--catalogue-spacing-heading)",
					transform: "translate3d(0, 0, 0)",
					borderRadius: "var(--border-radius)",
					transitionDuration: "var(--animation-duration)",
				}}
				type="button"
			>
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-r from-transparent via-catalogue-category-accent/8 to-transparent 
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
							className="absolute left-0 -bottom-1 h-0.5 bg-catalogue-category-accent rounded-full
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
							className="w-7 h-7 bg-catalogue-category-accent/10 rounded-full flex items-center justify-center
            group-hover:bg-catalogue-category-accent/15 transition-colors ease-out"
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
			</button>

			{mode === "edit" && (
				<BlockControls
					currentLayout={currentLayout}
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
					onEdit={onEdit}
					onLayoutChange={onLayoutChange}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}
		</div>
	);
};

export default SectionHeader;
