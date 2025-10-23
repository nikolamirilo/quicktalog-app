"use client";

import { AlignCenter, AlignLeft, AlignRight, Bold, Italic } from "lucide-react";
import { useEffect, useRef } from "react";

export default function DescriptionEditor({
	value,
	onChange,
	name = "description",
	placeholder = "Start typing...",
	className = "",
}) {
	const editorRef = useRef(null);
	const isInternalChange = useRef(false);

	const execCommand = (command) => {
		document.execCommand(command, false, null);
		editorRef.current?.focus();
		updateContent();
	};

	const updateContent = () => {
		if (editorRef.current) {
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

	// Only update content from outside when it's not an internal change
	useEffect(() => {
		if (!isInternalChange.current && editorRef.current) {
			if (editorRef.current.innerHTML !== value) {
				editorRef.current.innerHTML = value || "";
			}
		}
		isInternalChange.current = false;
	}, [value]);

	return (
		<div
			className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
		>
			<div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2">
				<button
					className="p-2 hover:bg-gray-200 rounded"
					onClick={() => execCommand("bold")}
					type="button"
				>
					<Bold size={20} />
				</button>
				<button
					className="p-2 hover:bg-gray-200 rounded"
					onClick={() => execCommand("italic")}
					type="button"
				>
					<Italic size={20} />
				</button>
				<div className="w-px bg-gray-300 mx-1"></div>
				<button
					className="p-2 hover:bg-gray-200 rounded"
					onClick={() => execCommand("justifyLeft")}
					type="button"
				>
					<AlignLeft size={20} />
				</button>
				<button
					className="p-2 hover:bg-gray-200 rounded"
					onClick={() => execCommand("justifyCenter")}
					type="button"
				>
					<AlignCenter size={20} />
				</button>
				<button
					className="p-2 hover:bg-gray-200 rounded"
					onClick={() => execCommand("justifyRight")}
					type="button"
				>
					<AlignRight size={20} />
				</button>
			</div>
			<div
				className="min-h-[200px] p-4 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
				contentEditable
				data-placeholder={placeholder}
				onFocus={handleFocus}
				onInput={updateContent}
				ref={editorRef}
			/>
		</div>
	);
}
