"use client";

import { AlignCenter, AlignLeft, AlignRight, Bold, Italic } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function DescriptionEditor({
	value,
	onChange,
	name = "description",
	placeholder = "Start typing...",
	className = "",
	maxLength = 750,
}) {
	const editorRef = useRef(null);
	const isInternalChange = useRef(false);
	const [activeFormats, setActiveFormats] = useState({
		bold: false,
		italic: false,
		alignLeft: false,
		alignCenter: false,
		alignRight: false,
	});

	const detectAlignment = () => {
		if (!editorRef.current) return { left: false, center: false, right: false };

		const selection = window.getSelection();
		if (!selection || !selection.rangeCount) {
			// No selection, check the first element or the editor itself
			const firstChild = editorRef.current.firstChild;
			const element =
				firstChild?.nodeType === Node.ELEMENT_NODE
					? (firstChild as Element)
					: editorRef.current;
			const align = window.getComputedStyle(element).textAlign;

			return {
				left: align === "left" || align === "start",
				center: align === "center",
				right: align === "right" || align === "end",
			};
		}

		const node = selection.anchorNode;
		const element =
			node?.nodeType === Node.ELEMENT_NODE
				? (node as Element)
				: node?.parentElement;

		if (element && editorRef.current.contains(element)) {
			const align = window.getComputedStyle(element).textAlign;
			return {
				left: align === "left" || align === "start",
				center: align === "center",
				right: align === "right" || align === "end",
			};
		}

		return { left: false, center: false, right: false };
	};

	const updateActiveFormats = () => {
		const bold = document.queryCommandState("bold");
		const italic = document.queryCommandState("italic");
		const alignment = detectAlignment();

		setActiveFormats({
			bold,
			italic,
			alignLeft: alignment.left,
			alignCenter: alignment.center,
			alignRight: alignment.right,
		});
	};

	const execCommand = (command) => {
		document.execCommand(command, false, null);
		editorRef.current?.focus();
		updateContent();
		updateActiveFormats();
	};

	const updateContent = () => {
		if (editorRef.current) {
			const textContent = editorRef.current.innerText || "";

			// Check character limit
			if (textContent.length > maxLength) {
				// Prevent further input by restoring previous content
				editorRef.current.innerHTML = value || "";
				return;
			}

			isInternalChange.current = true;
			onChange({
				target: {
					name: name,
					value: editorRef.current.innerHTML,
				},
			});
		}
	};

	const handleFocus = () => {
		if (editorRef.current && editorRef.current.innerHTML === "") {
			editorRef.current.innerHTML = "";
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		e.preventDefault();

		// Get plain text from clipboard
		const text = e.clipboardData.getData("text/plain");

		if (text && editorRef.current) {
			// Insert plain text using Selection API (avoids deprecated execCommand)
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				range.deleteContents(); // Clear any existing selection

				const textNode = document.createTextNode(text);
				range.insertNode(textNode);

				// Position cursor at the end of the inserted text
				range.setStartAfter(textNode);
				range.setEndAfter(textNode);
				selection.removeAllRanges();
				selection.addRange(range);
			} else {
				// Fallback: append to end if no selection (e.g., not focused)
				const textNode = document.createTextNode(text);
				editorRef.current.appendChild(textNode);
			}

			// Focus the editor
			editorRef.current.focus();

			// Update content and formats
			updateContent();
			updateActiveFormats();
		}
	};

	const handleSelectionChange = () => {
		updateActiveFormats();
	};

	useEffect(() => {
		document.addEventListener("selectionchange", handleSelectionChange);
		return () => {
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, []);

	useEffect(() => {
		if (!isInternalChange.current && editorRef.current) {
			if (editorRef.current.innerHTML !== value) {
				editorRef.current.innerHTML = value || "";
				// Update active formats after loading content
				setTimeout(() => {
					updateActiveFormats();
				}, 0);
			}
		}
		isInternalChange.current = false;
	}, [value]);

	return (
		<div
			className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
		>
			<div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2 items-center">
				<button
					className={`p-2 rounded ${
						activeFormats.bold
							? "bg-blue-200 hover:bg-blue-300"
							: "hover:bg-gray-200"
					}`}
					onClick={() => execCommand("bold")}
					type="button"
				>
					<Bold size={20} />
				</button>
				<button
					className={`p-2 rounded ${
						activeFormats.italic
							? "bg-blue-200 hover:bg-blue-300"
							: "hover:bg-gray-200"
					}`}
					onClick={() => execCommand("italic")}
					type="button"
				>
					<Italic size={20} />
				</button>
				<div className="w-px bg-gray-300 mx-1"></div>
				<button
					className={`p-2 rounded ${
						activeFormats.alignLeft
							? "bg-blue-200 hover:bg-blue-300"
							: "hover:bg-gray-200"
					}`}
					onClick={() => execCommand("justifyLeft")}
					type="button"
				>
					<AlignLeft size={20} />
				</button>
				<button
					className={`p-2 rounded ${
						activeFormats.alignCenter
							? "bg-blue-200 hover:bg-blue-300"
							: "hover:bg-gray-200"
					}`}
					onClick={() => execCommand("justifyCenter")}
					type="button"
				>
					<AlignCenter size={20} />
				</button>
				<button
					className={`p-2 rounded ${
						activeFormats.alignRight
							? "bg-blue-200 hover:bg-blue-300"
							: "hover:bg-gray-200"
					}`}
					onClick={() => execCommand("justifyRight")}
					type="button"
				>
					<AlignRight size={20} />
				</button>
				<div className="ml-auto text-sm text-gray-600">
					{editorRef.current?.innerText?.length || 0} / {maxLength}
				</div>
			</div>
			<div
				className="min-h-[200px] p-4 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 text-left"
				contentEditable
				data-placeholder={placeholder}
				onFocus={handleFocus}
				onInput={updateContent}
				onPaste={handlePaste}
				ref={editorRef}
			/>
		</div>
	);
}
