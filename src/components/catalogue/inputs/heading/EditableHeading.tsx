"use client";
import { headingSizeMap } from "@/constants/builder";
import { HeadingSize } from "@/types/shared";
import React from "react";

const PLACEHOLDER = "+ Add Heading";

interface EditableHeadingProps {
	editorRef: React.RefObject<HTMLDivElement | null>;
	headingSize: HeadingSize;
	isEmpty: boolean;
	isFocused: boolean;
	placeholderColor: string;
	onBeforeInput: (e: React.FormEvent<HTMLDivElement>) => void;
	onFocus?: () => void;
	onInput: () => void;
	onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
	onKeyUp: () => void;
	onMouseUp: () => void;
	onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
	onSelect: () => void;
	onClickFocus: () => void;
}

const EditableHeading = ({
	editorRef,
	headingSize,
	isEmpty,
	isFocused,
	placeholderColor,
	onBeforeInput,
	onFocus,
	onInput,
	onKeyDown,
	onKeyUp,
	onMouseUp,
	onPaste,
	onSelect,
	onClickFocus,
}: EditableHeadingProps) => {
	const showPlaceholder = isEmpty && !isFocused;

	return (
		<div
			className={`
				grid mx-auto w-fit
				text-center ${headingSizeMap[headingSize]}
				text-heading font-heading font-normal
				border-2 border-dashed border-product-border-strong rounded-product-card hover:border-product-muted
				focus-within:border-product-primary focus-within:border-solid
				bg-transparent
				max-w-[94%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] 2xl:max-w-[50%]
				min-w-[80%] sm:min-w-[70%] md:min-w-[50%] lg:min-w-[40%] xl:min-w-[30%]
				break-words transition-all
			`}
		>
			{/* Always rendered so the box keeps the placeholder's width and height
			    once the editor is focused or filled. Hidden it keeps reserving the
			    width, but not the height, so a wrapped placeholder leaves no gap. */}
			<span
				aria-hidden="true"
				className={`
					col-start-1 row-start-1
					px-4 sm:px-6 py-2
					pointer-events-none select-none
					${showPlaceholder ? "text-[color-mix(in_srgb,var(--catalogue-text)_60%,transparent)]" : "invisible h-0 overflow-hidden"}
				`}
			>
				{PLACEHOLDER}
			</span>
			<div
				aria-label="Catalogue heading"
				className="col-start-1 row-start-1 px-4 sm:px-6 py-2 bg-transparent outline-none break-words"
				contentEditable
				enterKeyHint="done"
				inputMode="text"
				onBeforeInput={onBeforeInput}
				onClick={onClickFocus}
				onFocus={onFocus}
				onInput={onInput}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
				onMouseUp={onMouseUp}
				onPaste={onPaste}
				onSelect={onSelect}
				ref={editorRef}
				role="textbox"
				style={
					{
						WebkitUserSelect: "text",
						userSelect: "text",
						"--placeholder-color": placeholderColor,
					} as React.CSSProperties
				}
				suppressContentEditableWarning
			/>
		</div>
	);
};

export default EditableHeading;
