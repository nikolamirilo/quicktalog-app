"use client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { HeadingSize } from "@/types/shared";
import { FiItalic } from "react-icons/fi";
import { HiMiniBold } from "react-icons/hi2";

export interface FormattingToolbarProps {
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
			className={`flex md:gap-2 flex-wrap w-full items-center justify-center gap-1 px-2 bg-transparent transition-all duration-200 ${showToolbar ? "opacity-100 mb-2 py-1" : "opacity-0 pointer-events-none mb-0 py-0 h-0 overflow-hidden"}`}
		>
			{/* Bold Button */}
			<button
				className={`px-2 sm:px-3 py-1 text-base sm:!text-xl font-bold transition-all duration-200 rounded hover:text-primary hover:bg-primary/10 cursor-pointer ${
					isBold
						? "text-[var(--catalogue-primary)] bg-white/90"
						: "text-foreground/70"
				}`}
				onClick={onToggleBold}
				onPointerDown={(e) => e.preventDefault()}
				tabIndex={-1}
				title="Bold"
				type="button"
			>
				<HiMiniBold className="w-5 h-5" />
			</button>

			{/* Italic Button */}
			<button
				className={`px-2 sm:px-3 py-1 text-base sm:!text-xl italic transition-all duration-200 rounded hover:text-primary hover:bg-primary/10 cursor-pointer ${
					isItalic
						? "text-[var(--catalogue-primary)] bg-white/90"
						: "text-foreground/70"
				}`}
				onClick={onToggleItalic}
				onPointerDown={(e) => e.preventDefault()}
				tabIndex={-1}
				title="Italic"
				type="button"
			>
				<FiItalic className="w-5 h-5" />
			</button>

			{/* Separator */}
			<div className="w-px h-5 bg-foreground/20 mx-1" />

			{/* Font Size Dropdown */}
			<Select
				onOpenChange={setIsSelectOpen}
				onValueChange={onSizeChange}
				open={isSelectOpen}
				value={headingSize}
			>
				<SelectTrigger
					className="min-w-[110px] sm:min-w-[130px] w-fit h-8 text-xs sm:text-sm border-0 bg-transparent text-foreground/70 hover:text-primary hover:bg-primary/10 cursor-pointer focus:ring-0 focus:ring-offset-0 transition-all duration-200"
					onClick={() => setIsSelectOpen(!isSelectOpen)}
					onPointerDown={(e) => {
						e.preventDefault();
					}}
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="bg-white border-none" position="popper">
					<SelectItem
						className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
						value="small"
					>
						Small
					</SelectItem>
					<SelectItem
						className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
						value="medium"
					>
						Medium
					</SelectItem>
					<SelectItem
						className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
						value="large"
					>
						Large
					</SelectItem>
					<SelectItem
						className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
						value="extraLarge"
					>
						Extra Large
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
};

export default FormattingToolbar;
