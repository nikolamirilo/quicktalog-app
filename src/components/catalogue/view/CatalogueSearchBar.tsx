"use client";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
	value: string;
	onChange: (next: string) => void;
	/** Items matching `value`, for the status line under the bar. */
	matchCount: number;
	placeholder?: string;
	debounceMs?: number;
}

const isTypingTarget = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	!!target.closest("input, textarea, select, [contenteditable='true']");

/** The opt-in search bar under the catalogue heading. "/" focuses it. */
const CatalogueSearchBar = ({
	value,
	onChange,
	matchCount,
	placeholder,
	debounceMs = 200,
}: Props) => {
	const onChangeRef = useRef(onChange);
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);
	const [local, setLocal] = useState(value);

	useEffect(() => {
		setLocal(value);
	}, [value]);

	useEffect(() => {
		if (local === value) return;
		const t = setTimeout(() => onChangeRef.current(local), debounceMs);
		return () => clearTimeout(t);
	}, [local, value, debounceMs]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
			if (isTypingTarget(e.target)) return;
			e.preventDefault();
			inputRef.current?.focus({ preventScroll: true });
			inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	const handleClear = () => {
		setLocal("");
		onChangeRef.current("");
		inputRef.current?.focus();
	};

	const query = value.trim();

	return (
		<div className="cat-search-wrap" role="search">
			<div className="cat-search">
				<Search aria-hidden="true" />
				<input
					aria-label="Search catalogue items"
					autoComplete="off"
					onChange={(e) => setLocal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Escape") handleClear();
					}}
					placeholder={placeholder || "Search items…"}
					ref={inputRef}
					type="search"
					value={local}
				/>
				{local ? (
					<button
						aria-label="Clear search"
						className="cat-search-clear"
						onClick={handleClear}
						type="button"
					>
						<X aria-hidden="true" />
					</button>
				) : (
					<kbd aria-hidden="true" title="Press / to search">
						/
					</kbd>
				)}
			</div>
			<p aria-live="polite" className="cat-search-status" role="status">
				{query &&
					(matchCount === 0
						? `No items match “${query}”.`
						: `${matchCount} ${matchCount === 1 ? "item matches" : "items match"} “${query}”`)}
			</p>
		</div>
	);
};

export default CatalogueSearchBar;
