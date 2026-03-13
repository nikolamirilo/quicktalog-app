"use client";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiItalic } from "react-icons/fi";
import { HiMiniBold } from "react-icons/hi2";

type HeadingSize = "extraLarge" | "large" | "medium" | "small";

const HEADING_SIZE_CLASSES: Record<HeadingSize, string> = {
	extraLarge: "text-4xl md:text-5xl lg:text-6xl",
	large: "text-3xl md:text-4xl lg:text-5xl",
	medium: "text-2xl md:text-3xl lg:text-4xl",
	small: "text-xl md:text-2xl lg:text-3xl",
};

const HeadingInput = () => {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	const editorRef = useRef<HTMLDivElement>(null);
	const [headingSize, setHeadingSize] = useState<HeadingSize>("medium");
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [isSelectOpen, setIsSelectOpen] = useState(false);
	const [isEmpty, setIsEmpty] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);

	const lastValidHtml = useRef("");

	// Parse headingSize from HTML if stored (e.g., data-size attribute)
	useEffect(() => {
		if (catalogue?.heading) {
			const match = catalogue.heading.match(/data-size="([^"]+)"/);
			if (match) {
				const size = match[1] as HeadingSize;
				if (["extraLarge", "large", "medium", "small"].includes(size)) {
					setHeadingSize(size);
				}
			}
		}
	}, []);

	// Initialize editor content
	const isInitialized = useRef(false);
	useEffect(() => {
		if (editorRef.current && catalogue?.heading && !isInitialized.current) {
			isInitialized.current = true;
			// Strip the wrapper h1 if present to get inner content
			let content = catalogue.heading;
			const innerMatch = content.match(/<h1[^>]*>([\s\S]*)<\/h1>/);
			if (innerMatch) {
				content = innerMatch[1];
			}
			// If content is plain text (no HTML), use it directly
			const parsed = content || "";
			editorRef.current.innerHTML = parsed;
			lastValidHtml.current = parsed;
			setIsEmpty(!parsed || parsed === "<br>");
		}
	}, [catalogue?.heading]);

	// updateSelection: only reflect actual bold/italic from typed content,
	// NOT inherited CSS font-weight (font-semibold on the container).
	const updateSelection = useCallback(() => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		// queryCommandState checks computed style at cursor — but font-semibold
		// on the parent makes it always return true for "bold".
		// Instead, check if the closest <b> or <strong> ancestor exists,
		// or if inline font-weight:bold is explicitly set on a span.
		const range = selection.getRangeAt(0);
		const node = range.startContainer;
		const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);

		const hasBoldAncestor = !!el?.closest("b, strong") ||
			(el as HTMLElement)?.style?.fontWeight === "bold" ||
			(el as HTMLElement)?.style?.fontWeight === "700";

		const hasItalicAncestor = !!el?.closest("i, em") ||
			(el as HTMLElement)?.style?.fontStyle === "italic";

		setIsBold(hasBoldAncestor);
		setIsItalic(hasItalicAncestor);
	}, []);

	const handleInput = useCallback(() => {
		if (editorRef.current) {
			// Prevents typing beyond 3 visual rows (which are restricted by line-clamp-3)
			if (editorRef.current.scrollHeight > editorRef.current.clientHeight + 4) {
				editorRef.current.innerHTML = lastValidHtml.current;

				// Move cursor to the end safely
				const selection = window.getSelection();
				const range = document.createRange();
				range.selectNodeContents(editorRef.current);
				range.collapse(false);
				selection?.removeAllRanges();
				selection?.addRange(range);
				return;
			}

			lastValidHtml.current = editorRef.current.innerHTML;
			const html = editorRef.current.innerHTML;

			// Track empty state for placeholder
			setIsEmpty(!html || html === "<br>" || html === "");

			// Generate complete HTML with h1 tag and size class
			const sizeClass = HEADING_SIZE_CLASSES[headingSize];
			const wrappedHtml = `<h1 class="${sizeClass} font-heading text-heading drop-shadow-sm mb-4 text-center line-clamp-3 break-words pb-1 md:pb-2 max-w-[94%] md:max-w-[80%] mx-auto" data-size="${headingSize}">${html}</h1>`;
			updateCatalogue({ heading: wrappedHtml });
		}
	}, [updateCatalogue, headingSize]);

	const execCommand = useCallback(
		(command: string) => {
			document.execCommand(command, false);
			editorRef.current?.focus();
			updateSelection();
			handleInput();
		},
		[updateSelection, handleInput],
	);

	const toggleBold = useCallback(() => {
		execCommand("bold");
	}, [execCommand]);

	const toggleItalic = useCallback(() => {
		execCommand("italic");
	}, [execCommand]);

	const handleSizeChange = useCallback(
		(size: HeadingSize) => {
			setHeadingSize(size);
			if (editorRef.current) {
				const html = editorRef.current.innerHTML;
				// Generate complete HTML with h1 tag and size class
				const sizeClass = HEADING_SIZE_CLASSES[size];
				const wrappedHtml = `<h1 class="${sizeClass} font-heading text-heading drop-shadow-sm mb-4 text-center line-clamp-3 break-words pb-1 md:pb-2 max-w-[94%] md:max-w-[80%] mx-auto" data-size="${size}">${html}</h1>`;
				updateCatalogue({ heading: wrappedHtml });
			}
		},
		[updateCatalogue],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "Enter") {
				if (editorRef.current) {
					// Count both <br> and block elements that browsers use for new lines
					const html = editorRef.current.innerHTML;
					const newlines = (html.match(/<br>|<\/p>|<\/div>/gi) || []).length;

					// Limit to 3 rows (2 newlines)
					if (newlines >= 2) {
						e.preventDefault();
					}
				}
			}
		},
		[],
	);

	const handleBlur = useCallback((e: React.FocusEvent) => {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (containerRef.current && !containerRef.current.contains(relatedTarget)) {
			// Prevent hiding if focus moves to the Radix select dropdown portal
			if (
				relatedTarget?.closest &&
				(relatedTarget.closest("[data-radix-popper-content-wrapper]") ||
					relatedTarget.closest('[role="listbox"]'))
			) {
				return;
			}
			setIsFocused(false);
			// Reset bold/italic state when leaving
			setIsBold(false);
			setIsItalic(false);
		}
	}, []);

	const handleFocus = useCallback(() => {
		setIsFocused(true);
		// Reset bold/italic — let updateSelection reflect actual cursor state
		setIsBold(false);
		setIsItalic(false);
	}, []);

	const showToolbar = isFocused || isSelectOpen;

	return (
		<div
			className="flex flex-col items-center w-full mb-4 px-0"
			ref={containerRef}
			onFocus={handleFocus}
			onBlur={handleBlur}
		>
			{/* Formatting Toolbar */}
			<div
				className={`flex md:gap-2 flex-wrap w-full items-center justify-center gap-1 mb-2 px-2 py-1 bg-transparent transition-opacity duration-200 ${showToolbar ? "opacity-100" : "opacity-0 pointer-events-none"}`}
			>
				{/* Bold Button */}
				<button
					className={`px-2 sm:px-3 py-1 text-base sm:!text-xl font-bold transition-all duration-200 rounded hover:text-primary hover:bg-primary/10 cursor-pointer ${isBold ? "text-[var(--catalogue-primary)] bg-white/90" : "text-foreground/70"
						}`}
					onClick={toggleBold}
					onMouseDown={(e) => e.preventDefault()}
					title="Bold"
					type="button"
					tabIndex={-1}
				>
					<HiMiniBold className="w-5 h-5" />
				</button>

				{/* Italic Button */}
				<button
					className={`px-2 sm:px-3 py-1 text-base sm:!text-xl italic transition-all duration-200 rounded hover:text-primary hover:bg-primary/10 cursor-pointer ${isItalic ? "text-[var(--catalogue-primary)] bg-white/90" : "text-foreground/70"
						}`}
					onClick={toggleItalic}
					onMouseDown={(e) => e.preventDefault()}
					title="Italic"
					type="button"
					tabIndex={-1}
				>
					<FiItalic className="w-5 h-5" />
				</button>

				{/* Separator */}
				<div className="w-px h-5 bg-foreground/20 mx-1" />

				{/* Font Size Dropdown */}
				<Select
					onValueChange={handleSizeChange}
					value={headingSize}
					onOpenChange={setIsSelectOpen}
				>
					<SelectTrigger className="min-w-[110px] sm:min-w-[130px] w-fit h-8 text-xs sm:text-sm border-0 bg-transparent text-foreground/70 hover:text-primary hover:bg-primary/10 cursor-pointer focus:ring-0 focus:ring-offset-0 transition-all duration-200">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="bg-white border-none">
						<SelectItem
							className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
							value="extraLarge"
						>
							Extra Large
						</SelectItem>
						<SelectItem
							className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
							value="large"
						>
							Large
						</SelectItem>
						<SelectItem
							className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
							value="medium"
						>
							Medium
						</SelectItem>
						<SelectItem
							className="hover:bg-primary/10 cursor-pointer focus:bg-primary/10 focus:text-primary"
							value="small"
						>
							Small
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Editable Heading */}
			<div
				className={`
					text-center ${HEADING_SIZE_CLASSES[headingSize]}
					text-heading font-heading font-normal
					border-2 border-dashed border-[var(--catalogue-text)]/20 rounded-lg
					px-4 sm:px-6 py-2
					bg-transparent focus:border-primary outline-none
					w-auto
					max-w-[94%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] 2xl:max-w-[50%]
					min-w-[80%] sm:min-w-[70%] md:min-w-[50%] lg:min-w-[40%] xl:min-w-[30%]
					mx-auto
					line-clamp-3 break-words transition-all
					relative
					${isEmpty && !isFocused ? "before:content-[attr(data-placeholder)] before:pointer-events-none" : ""}
				`}
				contentEditable
				data-placeholder="+ Add Heading"
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				onKeyUp={updateSelection}
				onMouseUp={updateSelection}
				onSelect={updateSelection}
				ref={editorRef}
				suppressContentEditableWarning
			/>
		</div>
	);
};

export default HeadingInput;