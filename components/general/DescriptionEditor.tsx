"use client";

import { Bold, Italic } from "lucide-react";
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
	});

	const updateActiveFormats = () => {
		const bold = document.queryCommandState("bold");
		const italic = document.queryCommandState("italic");

		setActiveFormats({
			bold,
			italic,
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
			// Use insertText command which inserts plain text without formatting
			document.execCommand("insertText", false, text);

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
							? "bg-product-primary"
							: "hover:bg-product-hover-background"
					}`}
					onClick={() => execCommand("bold")}
					type="button"
				>
					<Bold size={20} />
				</button>
				<button
					className={`p-2 rounded ${
						activeFormats.italic
							? "bg-product-primary"
							: "hover:bg-product-hover-background"
					}`}
					onClick={() => execCommand("italic")}
					type="button"
				>
					<Italic size={20} />
				</button>
				<div className="ml-auto text-sm text-gray-600">
					{editorRef.current?.innerText?.length || 0} / {maxLength}
				</div>
			</div>
			<div
				className="min-h-[200px] p-4 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 "
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
