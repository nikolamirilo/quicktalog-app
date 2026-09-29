import { useEffect, useRef, useState } from "react";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	List,
	ListOrdered,
	Underline,
} from "lucide-react";

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
	// The toolbar is product chrome in both modes. In "catalogue" mode the
	// writing surface keeps the catalogue's colours so the text reads as it will
	// be published; in "light" mode (dialogs) it is a product field.
	const isCatalogue = themeMode === "catalogue";
	const editorSurface = isCatalogue
		? "bg-catalogue-card-background text-catalogue-card-text border-catalogue-card-border"
		: "bg-product-card text-product-foreground border-product-border hover:border-product-border-hover";

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
			} catch {}
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
		const html = e.clipboardData?.getData("text/html");
		let text: string;
		if (html) {
			const temp = document.createElement("div");
			temp.innerHTML = html;
			text = temp.innerText || temp.textContent || "";
		} else {
			text = e.clipboardData?.getData("text/plain") || "";
		}
		if (!text) return;
		document.execCommand("insertText", false, text);
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
				aria-label={title}
				aria-pressed={command ? isActive : undefined}
				className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-secondary [&_svg]:size-[18px] ${
					isActive
						? "bg-product-primary-soft text-product-primary-ink"
						: "text-product-foreground-accent hover:bg-product-background-hero hover:text-product-foreground"
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
				<div
					aria-label="Text formatting"
					className="mb-2 flex flex-wrap items-center gap-0.5 rounded-xl border border-product-border bg-product-card p-1 font-product-body text-sm font-normal not-italic leading-none tracking-normal text-product-foreground shadow-product"
					role="toolbar"
				>
					<ToolbarButton
						command="bold"
						onClick={() => execCommand("bold")}
						title="Bold"
					>
						<Bold aria-hidden="true" />
					</ToolbarButton>

					<ToolbarButton
						command="italic"
						onClick={() => execCommand("italic")}
						title="Italic"
					>
						<Italic aria-hidden="true" />
					</ToolbarButton>

					<ToolbarButton
						command="underline"
						onClick={() => execCommand("underline")}
						title="Underline"
					>
						<Underline aria-hidden="true" />
					</ToolbarButton>

					<div aria-hidden="true" className="mx-1 h-5 w-px bg-product-border" />

					<ToolbarButton
						command="insertUnorderedList"
						onClick={() => execCommand("insertUnorderedList")}
						title="Bullet List"
					>
						<List aria-hidden="true" />
					</ToolbarButton>

					<ToolbarButton
						command="insertOrderedList"
						onClick={() => execCommand("insertOrderedList")}
						title="Numbered List"
					>
						<ListOrdered aria-hidden="true" />
					</ToolbarButton>

					<div aria-hidden="true" className="mx-1 h-5 w-px bg-product-border" />

					<ToolbarButton
						command="justifyLeft"
						onClick={() => execCommand("justifyLeft")}
						title="Align Left"
					>
						<AlignLeft aria-hidden="true" />
					</ToolbarButton>

					<ToolbarButton
						command="justifyCenter"
						onClick={() => execCommand("justifyCenter")}
						title="Align Center"
					>
						<AlignCenter aria-hidden="true" />
					</ToolbarButton>

					<ToolbarButton
						command="justifyRight"
						onClick={() => execCommand("justifyRight")}
						title="Align Right"
					>
						<AlignRight aria-hidden="true" />
					</ToolbarButton>

					<div aria-hidden="true" className="mx-1 h-5 w-px bg-product-border" />

					<select
						aria-label="Text size"
						className="h-9 cursor-pointer rounded-lg border border-product-border bg-product-card px-2 text-sm text-product-foreground hover:border-product-border-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-product-secondary"
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
				aria-label="Text content"
				aria-multiline="true"
				className={`min-h-[200px] max-h-[300px] rich-text-content p-4 border rounded-xl transition-colors focus:outline-none focus:border-product-primary focus:ring-2 focus:ring-product-primary/30 ${editorSurface}`}
				contentEditable={editable}
				onBlur={() => setIsFocused(false)}
				onFocus={() => setIsFocused(true)}
				onInput={handleInput}
				onPaste={handlePaste}
				ref={editorRef}
				role="textbox"
				style={{
					resize: "vertical",
					overflow: "auto",
				}}
			/>
		</div>
	);
}
