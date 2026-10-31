import type { CSSProperties } from "react";
import { FiChevronDown } from "react-icons/fi";
import { BlockMenu } from "@/components/catalogue/cards/common/BlockMenu";
import { EditableSectionName } from "./EditableSectionName";

// Catalogue-owned so product Button restyles never reach the published catalogue.
const headerButtonClasses =
	"cat-section-header gap-2 whitespace-nowrap outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 w-full group relative flex items-center justify-between text-xl sm:text-2xl md:text-3xl font-semibold border border-catalogue-card-border rounded-2xl shadow-catalogue-category-shadow transition-all duration-300 ease-in-out hover:scale-[1.02] hover:transform hover:-translate-y-1 backdrop-blur-sm overflow-hidden !px-3 !py-3 !h-auto !min-h-0 h-9 px-4 py-2 will-change-transform";

const headerStyle: CSSProperties = {
	background: "var(--catalogue-category-gradient)",
	borderRadius: "var(--border-radius)",
	fontFamily: "var(--catalogue-font-heading)",
	fontWeight: "var(--catalogue-weight-heading)",
	letterSpacing: "var(--catalogue-spacing-heading)",
	transform: "translate3d(0, 0, 0)",
	transitionDuration: "var(--animation-duration)",
};

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
	onRename,
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
	/** Left out when the block cannot be written to; the heading is then read-only. */
	onRename?: (name: string) => void;
}) => {
	const showContent = mode === "edit" || isExpanded;
	const isEdit = mode === "edit";

	const decoration = (
		<>
			<span aria-hidden="true" className="cat-glass-fill" />
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-gradient-to-r from-transparent via-catalogue-category-accent/8 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity ease-out"
				style={{
					willChange: "opacity",
					transitionDuration: "var(--animation-duration)",
				}}
			/>
		</>
	);

	return (
		<div className="relative group/header">
			{isEdit ? (
				// A div, not a button: the heading holds the rename input, and in edit
				// mode the section is open regardless, so there is nothing to toggle.
				<div
					className={`${headerButtonClasses} !pr-14`}
					id={`section-header-${code}`}
					style={headerStyle}
				>
					{decoration}
					<span className="relative z-10 min-w-0 flex-1">
						{onRename ? (
							<EditableSectionName name={title} onRename={onRename} />
						) : (
							title
						)}
					</span>
				</div>
			) : (
				<button
					aria-controls={contentId}
					aria-expanded={showContent}
					aria-label={`${showContent ? "Collapse" : "Expand"} ${title} section`}
					className={headerButtonClasses}
					id={`section-header-${code}`}
					onClick={() => onToggle(code)}
					style={headerStyle}
					type="button"
				>
					{decoration}

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
				</button>
			)}
			{isEdit && (
				<BlockMenu
					className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2"
					currentLayout={currentLayout}
					isFirst={isFirst}
					isLast={isLast}
					name={title}
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
