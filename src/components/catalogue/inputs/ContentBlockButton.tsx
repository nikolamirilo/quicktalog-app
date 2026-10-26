import { Plus } from "lucide-react";

/**
 * The "Add Section" tile under the catalogue in the builder. It is drawn inside
 * `.catalogue-root`, so it takes its colours from the catalogue's own theme;
 * the dashed edge is what marks it as a builder control rather than content.
 */
const ContentBlockButton = ({
	setIsAddContentOpen,
}: {
	setIsAddContentOpen: (open: boolean) => void;
}) => {
	return (
		<div className="mx-auto block max-w-6xl px-4">
			<button
				className="cat-add mt-4"
				onClick={() => setIsAddContentOpen(true)}
				type="button"
			>
				<span aria-hidden="true" className="cat-add-icon">
					<Plus className="h-6 w-6" strokeWidth={2.5} />
				</span>
				<span className="flex flex-col items-center gap-1">
					<span className="cat-add-title">Add Section</span>
					<span className="cat-add-sub">
						Items, text, a divider, an embed or a custom visual
					</span>
				</span>
			</button>
		</div>
	);
};

export default ContentBlockButton;
