"use client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { HeadingSize } from "@/types/shared";
import { Bold, Italic } from "lucide-react";

// Edit-only product chrome inside `.catalogue-root`, so type and focus are explicit.
const toolButtonClasses =
	"inline-flex h-10 w-10 items-center justify-center rounded-full text-product-foreground-accent transition-colors hover:bg-product-background-hero hover:text-product-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-secondary [@media(hover:hover)]:h-9 [@media(hover:hover)]:w-9 [&_svg]:size-[18px]";
const activeClasses =
	"bg-product-primary-soft text-product-primary-ink hover:bg-product-primary-soft hover:text-product-primary-ink";

const SIZE_OPTIONS: { value: HeadingSize; label: string }[] = [
	{ value: "small", label: "Small" },
	{ value: "medium", label: "Medium" },
	{ value: "large", label: "Large" },
	{ value: "extraLarge", label: "Extra Large" },
];

interface FormattingToolbarProps {
	showToolbar: boolean;
	isBold: boolean;
	isItalic: boolean;
	headingSize: HeadingSize;
	isSelectOpen: boolean;
	setIsSelectOpen: (open: boolean) => void;
	onToggleBold: () => void;
	onToggleItalic: () => void;
	onSizeChange: (size: HeadingSize) => void;
}

const FormattingToolbar = ({
	showToolbar,
	isBold,
	isItalic,
	headingSize,
	isSelectOpen,
	setIsSelectOpen,
	onToggleBold,
	onToggleItalic,
	onSizeChange,
}: FormattingToolbarProps) => {
	return (
		<div
			className={`flex w-full justify-center font-product-body text-sm font-normal not-italic leading-none tracking-normal transition-opacity duration-200 ${showToolbar ? "mb-2 opacity-100" : "pointer-events-none mb-0 h-0 overflow-hidden opacity-0"}`}
		>
			<div
				aria-label="Heading formatting"
				className="flex items-center gap-0.5 rounded-full border border-product-border bg-product-card p-1 shadow-product"
				role="toolbar"
			>
				<button
					aria-label="Bold"
					aria-pressed={isBold}
					className={`${toolButtonClasses} ${isBold ? activeClasses : ""}`}
					onClick={onToggleBold}
					onPointerDown={(e) => e.preventDefault()}
					tabIndex={-1}
					title="Bold"
					type="button"
				>
					<Bold aria-hidden="true" />
				</button>

				<button
					aria-label="Italic"
					aria-pressed={isItalic}
					className={`${toolButtonClasses} ${isItalic ? activeClasses : ""}`}
					onClick={onToggleItalic}
					onPointerDown={(e) => e.preventDefault()}
					tabIndex={-1}
					title="Italic"
					type="button"
				>
					<Italic aria-hidden="true" />
				</button>

				<div aria-hidden="true" className="mx-1 h-5 w-px bg-product-border" />

				<Select
					onOpenChange={setIsSelectOpen}
					onValueChange={onSizeChange}
					open={isSelectOpen}
					value={headingSize}
				>
					<SelectTrigger
						aria-label="Heading size"
						className="h-10 w-fit min-w-[118px] gap-1.5 rounded-full border-0 bg-transparent px-3 text-sm font-medium text-product-foreground-accent shadow-none hover:bg-product-background-hero hover:text-product-foreground focus:ring-0 focus:ring-offset-0 [@media(hover:hover)]:h-9"
						onClick={() => setIsSelectOpen(!isSelectOpen)}
						onPointerDown={(e) => {
							e.preventDefault();
						}}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent position="popper">
						{SIZE_OPTIONS.map(({ value, label }) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};

export default FormattingToolbar;
