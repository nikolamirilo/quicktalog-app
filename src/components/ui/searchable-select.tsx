"use client";

import { Search } from "lucide-react";
import {
	type KeyboardEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { matchOptions } from "@/lib/ui/optionSearch";

export interface SearchableSelectOption {
	value: string;
	label: string;
	/** Matched by the search but not shown, e.g. a currency code. */
	keywords?: string;
}

interface SearchableSelectProps {
	options: SearchableSelectOption[];
	value?: string;
	onValueChange: (value: string) => void;
	id?: string;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	disabled?: boolean;
	className?: string;
}

/**
 * A Select that filters a long option list as you type and shows what is left
 * in alphabetical order.
 */
export function SearchableSelect({
	className,
	disabled = false,
	emptyMessage = "No matches",
	id,
	onValueChange,
	options,
	placeholder,
	searchPlaceholder = "Search",
	value,
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);

	const matches = useMemo(() => matchOptions(options, query), [options, query]);
	// Non-matches are hidden rather than dropped: unmounting an item makes Radix
	// re-run its "focus the selected item" effect, which empties the search field.
	const rows = useMemo(() => {
		const matched = new Set(matches.map((option) => option.value));
		return [
			...matches.map((option) => ({ hidden: false, option })),
			...options
				.filter((option) => !matched.has(option.value))
				.map((option) => ({ hidden: true, option })),
		];
	}, [matches, options]);

	useEffect(() => {
		if (!open) return;
		// Radix focuses the selected item once the list is placed; take focus back.
		const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
		return () => window.clearTimeout(timer);
	}, [open]);

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) setQuery("");
	};

	const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			const [first] = matches;
			if (!first) return;
			onValueChange(first.value);
			handleOpenChange(false);
			return;
		}
		// Printable keys would otherwise run the Select's own typeahead, which
		// moves focus out of the field.
		if (event.key.length === 1) event.stopPropagation();
	};

	return (
		<Select
			disabled={disabled}
			onOpenChange={handleOpenChange}
			onValueChange={onValueChange}
			open={open}
			value={value}
		>
			<SelectTrigger className={className} id={id}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent
				header={
					<div className="p-1.5 pb-1">
						<div className="relative">
							<Search
								aria-hidden="true"
								className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-product-muted"
							/>
							<Input
								aria-label={searchPlaceholder}
								autoComplete="off"
								className="h-10 pl-9"
								onChange={(event) => setQuery(event.target.value)}
								onKeyDown={handleSearchKeyDown}
								placeholder={searchPlaceholder}
								ref={searchRef}
								value={query}
							/>
						</div>
					</div>
				}
				onFocus={(event) => {
					// Radix parks focus on the list itself when the pointer leaves an item.
					if (event.target === event.currentTarget) searchRef.current?.focus();
				}}
			>
				{rows.map(({ hidden, option }) => (
					<SelectItem
						className={hidden ? "hidden" : undefined}
						key={option.value}
						value={option.value}
					>
						{option.label}
					</SelectItem>
				))}
				{matches.length === 0 && (
					<p className="px-3 py-6 text-center text-sm text-product-muted">
						{emptyMessage}
					</p>
				)}
			</SelectContent>
		</Select>
	);
}
