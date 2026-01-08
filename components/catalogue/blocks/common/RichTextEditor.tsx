import { useEffect, useRef, useState } from "react";
import {
	MdCode,
	MdFormatAlignCenter,
	MdFormatAlignLeft,
	MdFormatAlignRight,
	MdFormatBold,
	MdFormatItalic,
	MdFormatListBulleted,
	MdFormatListNumbered,
	MdFormatUnderlined,
} from "react-icons/md";

interface RichTextEditorProps {
	content: string;
	onChange: (html: string) => void;
	editable?: boolean;
	className?: string;
}

export default function RichTextEditor({
	content,
	onChange,
	editable = true,
	className = "",
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [showSource, setShowSource] = useState(false);

	useEffect(() => {
		if (
			!showSource &&
			editorRef.current &&
			editorRef.current.innerHTML !== content
		) {
			editorRef.current.innerHTML = content;
		}
		if (
			showSource &&
			textareaRef.current &&
			textareaRef.current.value !== content
		) {
			textareaRef.current.value = content;
		}
	}, [content, showSource]);

	const execCommand = (command: string, value?: string) => {
		if (!editorRef.current) return;

		editorRef.current.focus();

		if (
			(command === "insertUnorderedList" || command === "insertOrderedList") &&
			window.getSelection()?.toString() === ""
		) {
			if (editorRef.current.textContent?.trim() === "") {
				editorRef.current.innerHTML = "<div><br /></div>";
				editorRef.current.focus();
			}
		}

		document.execCommand(command, false, value);
		handleInput();
	};

	const handleInput = () => {
		if (showSource && textareaRef.current) {
			onChange(textareaRef.current.value);
		} else if (editorRef.current) {
			onChange(editorRef.current.innerHTML);
		}
	};

	const toggleSource = () => {
		if (showSource && textareaRef.current) {
			onChange(textareaRef.current.value);
		} else if (editorRef.current) {
			onChange(editorRef.current.innerHTML);
		}
		setShowSource(!showSource);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
	};

	const handleSelectMouseDown = (e: React.MouseEvent<HTMLSelectElement>) => {
		e.stopPropagation();
	};

	const isCommandActive = (command: string) => {
		try {
			return document.queryCommandState(command);
		} catch {
			return false;
		}
	};

	const ToolbarButton = ({
		onClick,
		children,
		title,
		command,
	}: {
		onClick: () => void;
		children: React.ReactNode;
		title: string;
		command?: string;
	}) => {
		const [isActive, setIsActive] = useState(false);

		useEffect(() => {
			if (command && isFocused) {
				setIsActive(isCommandActive(command));
			}
		}, [isFocused, command]);

		return (
			<button
				className={`px-3 py-1.5 border border-gray-300 hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center ${
					isActive ? "bg-gray-200" : "bg-white"
				}`}
				onClick={onClick}
				onMouseDown={handleMouseDown}
				title={title}
				type="button"
			>
				{children}
			</button>
		);
	};

	return (
		<div className={className}>
			{editable && (
				<div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 border border-gray-300 rounded">
					<ToolbarButton
						command="bold"
						onClick={() => execCommand("bold")}
						title="Bold"
					>
						<MdFormatBold className="w-4 h-4" />
					</ToolbarButton>

					<ToolbarButton
						command="italic"
						onClick={() => execCommand("italic")}
						title="Italic"
					>
						<MdFormatItalic className="w-4 h-4" />
					</ToolbarButton>

					<ToolbarButton
						command="underline"
						onClick={() => execCommand("underline")}
						title="Underline"
					>
						<MdFormatUnderlined className="w-4 h-4" />
					</ToolbarButton>

					<div className="w-px bg-gray-300 mx-1" />

					<ToolbarButton
						command="insertUnorderedList"
						onClick={() => execCommand("insertUnorderedList")}
						title="Bullet List"
					>
						<MdFormatListBulleted className="w-4 h-4" />
					</ToolbarButton>

					<ToolbarButton
						command="insertOrderedList"
						onClick={() => execCommand("insertOrderedList")}
						title="Numbered List"
					>
						<MdFormatListNumbered className="w-4 h-4" />
					</ToolbarButton>

					<div className="w-px bg-gray-300 mx-1" />

					<ToolbarButton
						command="justifyLeft"
						onClick={() => execCommand("justifyLeft")}
						title="Align Left"
					>
						<MdFormatAlignLeft className="w-4 h-4" />
					</ToolbarButton>

					<ToolbarButton
						command="justifyCenter"
						onClick={() => execCommand("justifyCenter")}
						title="Align Center"
					>
						<MdFormatAlignCenter className="w-4 h-4" />
					</ToolbarButton>

					<ToolbarButton
						command="justifyRight"
						onClick={() => execCommand("justifyRight")}
						title="Align Right"
					>
						<MdFormatAlignRight className="w-4 h-4" />
					</ToolbarButton>

					<div className="w-px bg-gray-300 mx-1" />

					<select
						className="px-2 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-100 cursor-pointer"
						defaultValue="default"
						onChange={(e) => {
							const value = e.target.value;
							if (value !== "default") {
								execCommand("fontSize", value);
								setTimeout(() => {
									e.target.value = "default";
								}, 0);
							}
						}}
						onMouseDown={handleSelectMouseDown}
					>
						<option value="default">Font Size</option>
						<option value="1">Very Small</option>
						<option value="2">Small</option>
						<option value="3">Normal</option>
						<option value="4">Medium</option>
						<option value="5">Large</option>
						<option value="6">Very Large</option>
						<option value="7">Huge</option>
					</select>

					<div className="w-px bg-gray-300 mx-1" />

					<button
						className={`px-3 py-1.5 border border-gray-300 hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center ${
							showSource ? "bg-gray-200" : "bg-white"
						}`}
						onClick={toggleSource}
						title="View Source"
						type="button"
					>
						<MdCode className="w-4 h-4" />
					</button>
				</div>
			)}

			{showSource ? (
				<textarea
					className="w-full min-h-[200px] p-4 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-product-primary focus:border-transparent bg-white font-mono text-sm"
					defaultValue={content}
					onInput={handleInput}
					ref={textareaRef}
					spellCheck={false}
					style={{ resize: "vertical" }}
				/>
			) : (
				<div
					className="min-h-[200px] rich-text-content p-4 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-product-primary focus:border-transparent bg-white"
					contentEditable={editable}
					onBlur={() => setIsFocused(false)}
					onFocus={() => setIsFocused(true)}
					onInput={handleInput}
					ref={editorRef}
					style={{ resize: "vertical", overflow: "auto" }}
				/>
			)}
		</div>
	);
}
