"use client";
import { headingSizeMap } from "@/constants/builder";
import { HeadingSize } from "@/types/shared";
import React from "react";

export interface EditableHeadingProps {
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
	return (
		<div
			className={`
				text-center ${headingSizeMap[headingSize]}
				text-heading font-heading font-normal
				border-2 border-dashed border-[var(--catalogue-text)]/20 rounded-lg
				px-4 sm:px-6 py-2
				bg-transparent focus:border-primary outline-none
				w-fit
				max-w-[94%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] 2xl:max-w-[50%]
				min-w-[80%] sm:min-w-[70%] md:min-w-[50%] lg:min-w-[40%] xl:min-w-[30%]
				mx-auto
				break-words transition-all
				relative
				${isEmpty && !isFocused ? "before:content-[attr(data-placeholder)] before:pointer-events-none before:absolute before:left-1/2 before:-translate-x-1/2 before:text-[var(--placeholder-color)] before:whitespace-nowrap" : ""}
			`}
			contentEditable
			data-placeholder="+ Add Heading"
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
			style={
				{
					WebkitUserSelect: "text",
					userSelect: "text",
					"--placeholder-color": placeholderColor,
				} as React.CSSProperties
			}
			suppressContentEditableWarning
		/>
	);
};

export default EditableHeading;
