"use client";
import { headingSizeMap } from "@/constants/builder";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { HeadingSize } from "@/types/shared";
import { themes } from "@quicktalog/common";
import { useCallback, useEffect, useRef, useState } from "react";

const HEADING_CHAR_LIMIT = 100;

export { HEADING_CHAR_LIMIT };

export function useHeadingEditor() {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	const editorRef = useRef<HTMLDivElement>(null);
	const [headingSize, setHeadingSize] = useState<HeadingSize>("medium");
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [isSelectOpen, setIsSelectOpen] = useState(false);
	const [isEmpty, setIsEmpty] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const [placeholderColor, setPlaceholderColor] = useState("#4A5565");
	const [charCount, setCharCount] = useState(0);

	const lastValidHtml = useRef("");
	const isInitialized = useRef(false);

	useEffect(() => {
		if (editorRef.current && catalogue?.heading && !isInitialized.current) {
			isInitialized.current = true;

			const sizeMatch = catalogue.heading.match(/data-size="([^"]+)"/);
			if (sizeMatch) {
				const size = sizeMatch[1] as HeadingSize;
				if (["extraLarge", "large", "medium", "small"].includes(size)) {
					setHeadingSize(size);
				}
			}

			let content = catalogue.heading;
			const innerMatch = content.match(/<h1[^>]*>([\s\S]*)<\/h1>/);
			if (innerMatch) {
				content = innerMatch[1];
			}
			const parsed = content || "";
			editorRef.current.innerHTML = parsed;
			lastValidHtml.current = parsed;
			setIsEmpty(!parsed || parsed === "<br>");
			setCharCount(editorRef.current.textContent?.length || 0);
		}
	}, [catalogue?.heading]);

	const updateSelection = useCallback(() => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;
		const range = selection.getRangeAt(0);
		const node = range.startContainer;
		const el =
			node.nodeType === Node.TEXT_NODE
				? node.parentElement
				: (node as HTMLElement);

		const hasBoldAncestor =
			!!el?.closest("b, strong") ||
			(el as HTMLElement)?.style?.fontWeight === "bold" ||
			(el as HTMLElement)?.style?.fontWeight === "700";

		const hasItalicAncestor =
			!!el?.closest("i, em") ||
			(el as HTMLElement)?.style?.fontStyle === "italic";

		setIsBold(hasBoldAncestor);
		setIsItalic(hasItalicAncestor);
	}, []);

	const saveSelection = useCallback(() => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return null;
		const range = selection.getRangeAt(0);
		if (!editorRef.current?.contains(range.commonAncestorContainer))
			return null;
		const preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(editorRef.current);
		preCaretRange.setEnd(range.startContainer, range.startOffset);
		const start = preCaretRange.toString().length;
		const end = start + range.toString().length;
		return { start, end };
	}, []);

	const restoreSelection = useCallback(
		(pos: { start: number; end: number } | null) => {
			if (!pos || !editorRef.current) return;
			const selection = window.getSelection();
			if (!selection) return;
			const range = document.createRange();
			let charIndex = 0;
			let foundStart = false;
			const treeWalker = document.createTreeWalker(
				editorRef.current,
				NodeFilter.SHOW_TEXT,
				null,
			);
			let node: Node | null;
			while ((node = treeWalker.nextNode())) {
				const nextCharIndex = charIndex + (node.textContent?.length || 0);
				if (!foundStart && pos.start <= nextCharIndex) {
					range.setStart(node, pos.start - charIndex);
					foundStart = true;
				}
				if (foundStart && pos.end <= nextCharIndex) {
					range.setEnd(node, pos.end - charIndex);
					break;
				}
				charIndex = nextCharIndex;
			}
			if (foundStart) {
				range.collapse(false);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		},
		[],
	);

	const handleBeforeInput = useCallback(
		(e: React.FormEvent<HTMLDivElement>) => {
			if (!editorRef.current) return;
			const ev = e.nativeEvent as InputEvent;
			const inputType = ev.inputType || "";
			if (inputType.startsWith("delete") || inputType.startsWith("format"))
				return;
			const currentLen = editorRef.current.textContent?.length || 0;
			const selection = window.getSelection();
			const selectedLen = selection?.toString().length || 0;
			const available = HEADING_CHAR_LIMIT - (currentLen - selectedLen);
			const insertLen = ev.data?.length ?? 1;
			if (available < insertLen) {
				e.preventDefault();
			}
		},
		[],
	);

	const handleInput = useCallback(() => {
		if (editorRef.current) {
			const savedPos = saveSelection();
			const textLen = editorRef.current.textContent?.length || 0;
			if (
				editorRef.current.scrollHeight >
				editorRef.current.clientHeight + 10
			) {
				editorRef.current.innerHTML = lastValidHtml.current;
				restoreSelection(savedPos);
				return;
			}
			lastValidHtml.current = editorRef.current.innerHTML;
			const html = editorRef.current.innerHTML;
			setIsEmpty(!html || html === "<br>" || html === "");
			setCharCount(textLen);
			const sizeClass = headingSizeMap[headingSize];
			const wrappedHtml = `<h1 class="${sizeClass} font-heading text-heading drop-shadow-sm mb-4 text-center break-words pb-1 md:pb-2 w-full max-w-[98%] mx-auto" data-size="${headingSize}">${html}</h1>`;
			updateCatalogue({ heading: wrappedHtml });
		}
	}, [updateCatalogue, headingSize, saveSelection, restoreSelection]);

	const execCommand = useCallback(
		(command: string) => {
			document.execCommand(command, false);
			editorRef.current?.focus();
			updateSelection();
			handleInput();
		},
		[updateSelection, handleInput],
	);

	const toggleBold = useCallback(() => execCommand("bold"), [execCommand]);
	const toggleItalic = useCallback(() => execCommand("italic"), [execCommand]);

	const handleSizeChange = useCallback(
		(size: HeadingSize) => {
			setHeadingSize(size);
			if (editorRef.current) {
				const html = editorRef.current.innerHTML;
				const sizeClass = headingSizeMap[size];
				const wrappedHtml = `<h1 class="${sizeClass} font-heading text-heading drop-shadow-sm mb-4 text-center break-words pb-1 md:pb-2 w-full max-w-[98%] mx-auto" data-size="${size}">${html}</h1>`;
				updateCatalogue({ heading: wrappedHtml });
			}
		},
		[updateCatalogue],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key === "Enter" && editorRef.current) {
				const html = editorRef.current.innerHTML;
				const newlines = (html.match(/<br>|<\/p>|<\/div>/gi) || []).length;
				if (newlines >= 2) e.preventDefault();
			}
		},
		[],
	);

	const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
		e.preventDefault();
		let text = e.clipboardData?.getData("text/plain");
		if (text && editorRef.current) {
			const currentLen = editorRef.current.textContent?.length || 0;
			const selection = window.getSelection();
			const selectedLen = selection?.toString().length || 0;
			const remaining = HEADING_CHAR_LIMIT - (currentLen - selectedLen);
			if (remaining <= 0) return;
			text = text.slice(0, remaining);
			document.execCommand("insertText", false, text);
		}
	}, []);

	const handleBlur = useCallback((e: React.FocusEvent) => {
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		if (containerRef.current && !containerRef.current.contains(relatedTarget)) {
			if (
				relatedTarget?.closest &&
				(relatedTarget.closest("[data-radix-popper-content-wrapper]") ||
					relatedTarget.closest('[role="listbox"]'))
			) {
				return;
			}
			setIsFocused(false);
			setIsBold(false);
			setIsItalic(false);
		}
	}, []);

	const handleFocus = useCallback(() => {
		isInitialized.current = true;
		setIsFocused(true);
		setIsBold(false);
		setIsItalic(false);
	}, []);

	useEffect(() => {
		const currentTheme = themes.find(
			(t) => t.key === catalogue?.appearance.theme.name,
		);
		setPlaceholderColor(currentTheme?.type === "dark" ? "#E5E7EB" : "#4A5565");
	}, [catalogue?.appearance.theme.name]);

	return {
		editorRef,
		containerRef,
		headingSize,
		isBold,
		isItalic,
		isFocused,
		isSelectOpen,
		setIsSelectOpen,
		isEmpty,
		placeholderColor,
		charCount,
		showToolbar: isFocused || isSelectOpen,
		updateSelection,
		handleBeforeInput,
		handleInput,
		handleKeyDown,
		handlePaste,
		handleBlur,
		handleFocus,
		handleSizeChange,
		toggleBold,
		toggleItalic,
	};
}
