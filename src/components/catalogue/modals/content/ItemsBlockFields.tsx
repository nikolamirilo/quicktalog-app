"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LayoutPicker } from "./LayoutPicker";

export interface ItemsBlockValue {
	name: string;
	layout: string;
	showHeading?: boolean;
	isExpanded?: boolean;
}

/** Fields of an items section: heading, heading switches and layout. */
export function ItemsBlockFields<T extends ItemsBlockValue>({
	value,
	onChange,
}: {
	value: T;
	onChange: (value: T) => void;
}) {
	const showHeading = value.showHeading ?? true;

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex max-w-md flex-col gap-2">
				<Label htmlFor="items-name-input">
					{showHeading ? "Heading" : "Section name"}
					<span aria-hidden="true" className="ml-1 text-product-error">
						*
					</span>
				</Label>
				<Input
					aria-describedby={showHeading ? undefined : "items-name-hint"}
					id="items-name-input"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder={showHeading ? "Enter heading" : "Enter section name"}
					required
					value={value.name}
				/>
				{!showHeading && (
					<p className="text-xs text-product-muted" id="items-name-hint">
						Used to identify this section when moving items. Not visible to end
						users.
					</p>
				)}
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2.5">
					<Switch
						checked={showHeading}
						id="show-heading"
						onCheckedChange={(checked) =>
							onChange({ ...value, showHeading: checked })
						}
					/>
					<Label className="font-medium" htmlFor="show-heading">
						Show heading above the items
					</Label>
				</div>

				{/* The heading is the collapse toggle, so without one there is nothing to expand. */}
				{showHeading && (
					<div className="flex items-center gap-2.5">
						<Switch
							checked={value.isExpanded ?? true}
							id="expanded"
							onCheckedChange={(checked) =>
								onChange({ ...value, isExpanded: checked })
							}
						/>
						<Label className="font-medium" htmlFor="expanded">
							Auto-expand on page load
						</Label>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-3">
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
