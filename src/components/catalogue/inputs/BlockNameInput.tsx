"use client";
import { builderFieldClass } from "@/components/catalogue/modals/content/BuilderDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BlockNameInputProps {
	/** Block type, used to build a stable input id. */
	type: string;
	value: string;
	onChange: (name: string) => void;
}

/**
 * Optional name for block types that render no heading of their own (text,
 * divider, embedding, custom code).
 *
 * It is never drawn on the page. It becomes the section's accessible name - a
 * `<section>` without one is not exposed as a landmark at all, so naming a
 * block is what lets screen-reader users navigate to it - and it identifies the
 * block in the builder and to the AI assistant.
 */
const BlockNameInput = ({ type, value, onChange }: BlockNameInputProps) => (
	<div className="flex max-w-md flex-col gap-1.5 font-product-body">
		<Label htmlFor={`${type}-name-input`}>Section name</Label>
		<Input
			aria-describedby={`${type}-name-hint`}
			className={builderFieldClass}
			id={`${type}-name-input`}
			onChange={(e) => onChange(e.target.value)}
			placeholder="e.g. Summer sale banner"
			value={value}
		/>
		<span
			className="text-xs leading-snug text-product-muted"
			id={`${type}-name-hint`}
		>
			Describes this section for screen readers and identifies it in the
			builder. Not shown on the page.
		</span>
	</div>
);

export default BlockNameInput;
