import { PanelSection } from "@/components/catalogue/inputs/sidebar/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { normalizeSearch, SEARCH_PLACEHOLDER_MAX } from "@/lib/catalogue/items";
import type { Appearance } from "@quicktalog/common";

interface SearchSectionProps {
	search: Appearance["search"];
	onChange: (search: NonNullable<Appearance["search"]>) => void;
}

/** Turns the search bar under the catalogue heading on or off. Every plan has it. */
const SearchSection = ({ search, onChange }: SearchSectionProps) => {
	const current = normalizeSearch(search);
	return (
		<PanelSection
			action={
				<Switch
					aria-label="Show search bar"
					checked={current.isEnabled}
					id="search-enabled"
					onCheckedChange={(isEnabled) => onChange({ ...current, isEnabled })}
				/>
			}
			description={
				current.isEnabled
					? "Visitors can search items by name or description."
					: "Off. Turn it on to add a search bar under the heading."
			}
			id="panel-search"
			info="A search bar under the catalogue heading. Visitors type part of an item's name or description and the items filter as they type."
			isNew
			title="Search"
		>
			{current.isEnabled && (
				<div className="space-y-2">
					<Label htmlFor="search-placeholder">Placeholder text</Label>
					<Input
						aria-describedby="search-placeholder-hint"
						id="search-placeholder"
						maxLength={SEARCH_PLACEHOLDER_MAX}
						onChange={(e) =>
							onChange({ ...current, placeholder: e.target.value })
						}
						placeholder="Search items…"
						value={current.placeholder}
					/>
					<p
						className="text-[12.5px] leading-snug text-product-muted"
						id="search-placeholder-hint"
					>
						Shown in the empty search bar.
					</p>
				</div>
			)}
		</PanelSection>
	);
};

export default SearchSection;
