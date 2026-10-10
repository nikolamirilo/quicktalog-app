"use client";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
	debounceMs?: number;
}

const CatalogueSearchBar = ({
	value,
	onChange,
	placeholder = "Search items…",
	debounceMs = 200,
}: Props) => {
	const onChangeRef = useRef(onChange);
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

	const handleClear = () => {
		setLocal("");
		onChangeRef.current("");
	};

	return (
		<div className="flex justify-end mb-3">
			<div
				className="relative flex items-center h-9 w-full sm:w-72 bg-[var(--catalogue-card-background)] border border-[var(--catalogue-card-border)] focus-within:border-[var(--catalogue-primary)] transition-colors"
				style={{ borderRadius: "var(--border-radius)" }}
			>
				<Search
					aria-hidden="true"
					className="absolute left-3 w-4 h-4 text-[var(--catalogue-text)]/60"
				/>
				<input
					aria-label="Search catalogue items"
					className="w-full h-9 bg-transparent pl-9 pr-9 text-sm text-[var(--catalogue-text)] placeholder:text-[var(--catalogue-text)]/50 outline-none"
					onChange={(e) => setLocal(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Escape") handleClear();
					}}
					placeholder={placeholder}
					type="search"
					value={local}
				/>
				{local && (
					<button
						aria-label="Clear search"
						className="absolute right-1 p-1.5 text-[var(--catalogue-text)]/60 hover:text-[var(--catalogue-text)] transition-colors"
						onClick={handleClear}
						type="button"
					>
						<X aria-hidden="true" className="w-4 h-4" />
					</button>
				)}
			</div>
		</div>
	);
};

export default CatalogueSearchBar;
