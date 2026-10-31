"use client";
import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditableSectionNameProps {
	/** The section's current heading. */
	name: string;
	onRename: (name: string) => void;
}

/**
 * An items section's heading in edit mode: click it, or focus it and press
 * Enter, to rename it in place. Enter and clicking away save, Escape reverts,
 * and an empty name keeps the old one - the name is required, and it labels the
 * section in "Move to section" and to the AI assistant.
 */
export function EditableSectionName({
	name,
	onRename,
}: EditableSectionNameProps) {
	const [draft, setDraft] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	// Enter and Escape both drop a focused input, which can fire blur in turn, so
	// whichever of the three lands first is the one that decides.
	const settled = useRef(false);

	const isEditing = draft !== null;

	useEffect(() => {
		if (isEditing) inputRef.current?.select();
	}, [isEditing]);

	const close = (value: string | null) => {
		if (settled.current) return;
		settled.current = true;
		const next = (value ?? "").trim();
		if (next && next !== name) onRename(next);
		setDraft(null);
	};

	if (!isEditing) {
		return (
			<button
				className="group/rename inline-flex max-w-full cursor-text items-center gap-2 border-b-2 border-dashed border-catalogue-category-accent/80 text-left hover:border-solid focus-visible:border-solid focus-visible:outline-none"
				onClick={() => {
					settled.current = false;
					setDraft(name);
				}}
				title="Rename this section"
				type="button"
			>
				<span className="min-w-0 truncate">{name}</span>
				<Pencil
					aria-hidden="true"
					className="size-[0.5em] min-w-3.5 flex-none opacity-60 group-hover/rename:opacity-100"
				/>
			</button>
		);
	}

	return (
		<input
			aria-label="Section heading"
			autoFocus
			className="w-full min-w-0 rounded-t-md border-0 border-b-2 border-solid border-catalogue-category-accent bg-catalogue-card-background/70 px-2 py-0.5 text-text outline-none"
			onBlur={() => close(draft)}
			onChange={(e) => setDraft(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					close(e.currentTarget.value);
				} else if (e.key === "Escape") {
					e.preventDefault();
					close(null);
				}
			}}
			ref={inputRef}
			// An input does not inherit the heading's type, and the two have to match exactly.
			style={{ font: "inherit", letterSpacing: "inherit" }}
			value={draft}
		/>
	);
}
