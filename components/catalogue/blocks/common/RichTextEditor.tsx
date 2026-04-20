import { useEffect, useRef, useState } from "react";
import {
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
	themeMode?: "light" | "catalogue";
}

export default function RichTextEditor({
	content,
	onChange,
	editable = true,
	className = "",
	themeMode = "light",
}: RichTextEditorProps) {
	const isCatalogue = themeMode === "catalogue";
	const toolbarBg = isCatalogue ? "bg-catalogue-background" : "bg-gray-50";
	const editorBg = isCatalogue ? "bg-catalogue-card-background" : "bg-white";
	const borderColor = isCatalogue
		? "border-catalogue-card-border"
		: "border-gray-300";
	const textColor = isCatalogue ? "text-catalogue-card-text" : "text-gray-900";
	const selectHover = isCatalogue
		? "hover:bg-catalogue-background"
		: "hover:bg-gray-100";
	const btnHover = isCatalogue
		? "hover:bg-catalogue-card-background"
		: "hover:bg-gray-100";
	const btnActive = isCatalogue ? "bg-catalogue-card-border" : "bg-gray-200";
	const btnIdle = isCatalogue ? "bg-transparent" : "bg-white";
	const dividerColor = isCatalogue ? "bg-catalogue-card-border" : "bg-gray-300";

	const editorRef = useRef<HTMLDivElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [fontSize, setFontSize] = useState("5");

	useEffect(() => {
		if (editorRef.current && editorRef.current.innerHTML !== content) {
			editorRef.current.innerHTML = content;
		}
	}, [content]);

	const handleSelectionChange = () => {
		if (isFocused) {
			try {
				const size = document.queryCommandValue("fontSize");
				if (size) {
					setFontSize(size.toString());
				} else {
					setFontSize("5");
				}
			} catch {
				// ignore
			}
		}
	};

	useEffect(() => {
		document.addEventListener("selectionchange", handleSelectionChange);
		return () => {
			document.removeEventListener("selectionchange", handleSelectionChange);
		};
	}, [isFocused]);

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

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		e.preventDefault();
		const text = e.clipboardData?.getData("text/plain");
		if (text) {
			document.execCommand("insertText", false, text);
		}
	};

	const handleInput = () => {
		if (editorRef.current) {
			onChange(editorRef.current.innerHTML);
		}
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
				className={`px-3 py-1.5 border ${borderColor} ${btnHover} transition-colors text-sm font-medium flex items-center justify-center ${textColor} ${isActive ? btnActive : btnIdle}`}
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
				<div
					className={`flex flex-wrap gap-1 mb-2 p-2 ${toolbarBg} border ${borderColor} rounded ${textColor}`}
				>
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

					<div className={`w-px ${dividerColor} mx-1`} />

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

					<div className={`w-px ${dividerColor} mx-1`} />

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

					<div className={`w-px ${dividerColor} mx-1`} />

					<select
						className={`px-2 py-1 border ${borderColor} rounded text-sm ${editorBg} ${selectHover} cursor-pointer ${textColor}`}
						onChange={(e) => {
							const value = e.target.value;
							execCommand("fontSize", value);
							setFontSize(value);
						}}
						onMouseDown={handleSelectMouseDown}
						value={fontSize}
					>
						<option value="4">Small</option>
						<option value="5">Medium</option>
						<option value="6">Large</option>
						<option value="7">Extra Large</option>
					</select>
				</div>
			)}

			<div
				className={`min-h-[200px] max-h-[300px] rich-text-content p-4 border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-product-primary focus:border-transparent ${editorBg} ${textColor}`}
				contentEditable={editable}
				onBlur={() => setIsFocused(false)}
				onFocus={() => setIsFocused(true)}
				onInput={handleInput}
				onPaste={handlePaste}
				ref={editorRef}
				style={{
					resize: "vertical",
					overflow: "auto",
				}}
			/>
		</div>
	);
}
