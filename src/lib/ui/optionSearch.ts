interface SearchableOption {
	label: string;
	/** Matched by the search but not shown, e.g. a currency code. */
	keywords?: string;
}

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

/** -1 means no match; a lower rank sorts first, so prefixes beat inner matches. */
function rankOption(option: SearchableOption, needle: string) {
	const haystacks = [option.label, option.keywords ?? ""].map((text) =>
		text.toLowerCase(),
	);
	if (haystacks.some((text) => text.startsWith(needle))) return 0;
	if (haystacks.some((text) => text.includes(needle))) return 1;
	return -1;
}

/** The options a query matches, alphabetical by label within equal relevance. */
export function matchOptions<T extends SearchableOption>(
	options: T[],
	query: string,
): T[] {
	const sorted = [...options].sort((a, b) =>
		collator.compare(a.label, b.label),
	);
	const needle = query.trim().toLowerCase();
	if (!needle) return sorted;
	return sorted
		.map((option) => ({ option, rank: rankOption(option, needle) }))
		.filter((entry) => entry.rank >= 0)
		.sort((a, b) => a.rank - b.rank)
		.map((entry) => entry.option);
}
