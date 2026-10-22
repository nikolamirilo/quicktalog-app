"use client";
import {
	CharacterCount,
	EditableHeading,
	FormattingToolbar,
	HEADING_CHAR_LIMIT,
	useHeadingEditor,
} from "./heading";

const HeadingInput = () => {
	const {
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
		showToolbar,
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
	} = useHeadingEditor();

	return (
		<div
			className="flex flex-col mt-8 lg:mt-4 mb-4 items-center w-full px-0"
			onBlur={handleBlur}
			ref={containerRef}
		>
			<FormattingToolbar
				headingSize={headingSize}
				isBold={isBold}
				isItalic={isItalic}
				isSelectOpen={isSelectOpen}
				onSizeChange={handleSizeChange}
				onToggleBold={toggleBold}
				onToggleItalic={toggleItalic}
				setIsSelectOpen={setIsSelectOpen}
				showToolbar={showToolbar}
			/>
			<EditableHeading
				editorRef={editorRef}
				headingSize={headingSize}
				isEmpty={isEmpty}
				isFocused={isFocused}
				onBeforeInput={handleBeforeInput}
				onClickFocus={handleFocus}
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				onKeyUp={updateSelection}
				onMouseUp={updateSelection}
				onPaste={handlePaste}
				onSelect={updateSelection}
				placeholderColor={placeholderColor}
			/>
			<CharacterCount
				charCount={charCount}
				charLimit={HEADING_CHAR_LIMIT}
				visible={isFocused}
			/>
		</div>
	);
};

export default HeadingInput;
