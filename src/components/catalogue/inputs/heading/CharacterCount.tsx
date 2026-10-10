"use client";

interface CharacterCountProps {
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
			aria-live="polite"
			className={`mt-2 rounded-full bg-product-card px-2 py-1 font-product-body text-xs font-medium leading-none tabular-nums transition-colors ${charCount >= charLimit ? "text-product-error" : "text-product-muted"}`}
		>
			{charCount}/{charLimit}
		</span>
	);
};

export default CharacterCount;
