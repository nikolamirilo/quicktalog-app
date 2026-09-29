import { Plus } from "lucide-react";

/**
 * The "Add Section" tile under the catalogue in the builder. It is a builder
 * control drawn inside `.catalogue-root`, so it sets the product typography
 * and colours itself instead of inheriting the catalogue's.
 */
const ContentBlockButton = ({
	setIsAddContentOpen,
}: {
	setIsAddContentOpen: (open: boolean) => void;
}) => {
	return (
		<div className="mx-auto block max-w-6xl px-4">
			<button
				className="group mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-product-card border-2 border-dashed border-product-border-strong bg-product-card/80 px-4 py-10 font-product-body text-product-foreground transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-product-primary-accent hover:bg-product-primary/5"
				onClick={() => setIsAddContentOpen(true)}
				type="button"
			>
				<span
					aria-hidden="true"
					className="flex h-12 w-12 items-center justify-center rounded-full bg-product-primary text-product-foreground shadow-product-primary transition-transform duration-200 group-hover:scale-105"
				>
					<Plus className="h-6 w-6" strokeWidth={2.5} />
				</span>
				<span className="flex flex-col items-center gap-1">
					<span className="font-product-heading text-lg font-bold leading-tight">
						Add Section
					</span>
					<span className="text-sm leading-snug text-product-muted">
						Items, text, a divider, an embed or custom code
					</span>
				</span>
			</button>
		</div>
	);
};

export default ContentBlockButton;
