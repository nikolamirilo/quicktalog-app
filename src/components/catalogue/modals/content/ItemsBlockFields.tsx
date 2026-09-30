"use client";
import { ChevronsUpDown, Heading } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { builderFieldClass } from "./BuilderDialog";
import { LayoutPicker } from "./LayoutPicker";
import { OptionSwitch } from "./OptionSwitch";

export interface ItemsBlockValue {
	name: string;
	layout: string;
	showHeading?: boolean;
	isExpanded?: boolean;
}

/**
 * Fields of an items section: heading, heading options and layout. Auto-expand
 * needs the heading, because the heading is the collapse toggle.
 */
export function ItemsBlockFields<T extends ItemsBlockValue>({
	value,
	onChange,
}: {
	value: T;
	onChange: (value: T) => void;
}) {
	const showHeading = value.showHeading ?? true;

	return (
		<div className="flex w-full flex-col gap-4 md:gap-5">
			<div className="flex max-w-md flex-col gap-1.5">
				<Label htmlFor="items-name-input">
					{showHeading ? "Heading" : "Section name"}
					<span aria-hidden="true" className="ml-1 text-product-error">
						*
					</span>
				</Label>
				<Input
					aria-describedby={showHeading ? undefined : "items-name-hint"}
					className={builderFieldClass}
					id="items-name-input"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder={showHeading ? "e.g. Breakfast" : "e.g. Weekly specials"}
					required
					value={value.name}
				/>
				{!showHeading && (
					<p className="text-xs text-product-muted" id="items-name-hint">
						Not shown to customers. It names the section when you move items.
					</p>
				)}
			</div>

			<div className="grid gap-2 md:grid-cols-2 md:gap-3">
				<OptionSwitch
					checked={showHeading}
					hint="Title bar above the items"
					icon={<Heading />}
					id="show-heading"
					label="Show heading"
					onCheckedChange={(checked) =>
						onChange({ ...value, showHeading: checked })
					}
				/>
				<OptionSwitch
					checked={showHeading && (value.isExpanded ?? true)}
					disabled={!showHeading}
					hint={
						showHeading
							? "Open when the page loads"
							: "Turn on the heading first"
					}
					icon={<ChevronsUpDown />}
					id="expanded"
					label="Auto-expand"
					onCheckedChange={(checked) =>
						onChange({ ...value, isExpanded: checked })
					}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<p
					className="text-[13.5px] font-semibold leading-none text-product-foreground"
					id="items-layout-label"
				>
					Layout
				</p>
				<LayoutPicker
					labelledBy="items-layout-label"
					onChange={(layout) => onChange({ ...value, layout })}
					value={value.layout}
				/>
			</div>
		</div>
	);
}
