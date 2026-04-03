"use client";

export interface CharacterCountProps {
	charCount: number;
	charLimit: number;
	visible: boolean;
}

const CharacterCount = ({
	charCount,
	charLimit,
	visible,
}: CharacterCountProps) => {
	if (!visible) return null;

	return (
		<span
			className={`text-xs mt-1 transition-colors ${charCount >= charLimit ? "text-red-500" : "text-foreground/40"}`}
		>
			{charCount}/{charLimit}
		</span>
	);
};

export default CharacterCount;
