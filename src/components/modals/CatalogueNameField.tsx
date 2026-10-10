"use client";
import { generateUniqueSlug } from "@quicktalog/common";
import { Globe } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";

import { NameHint } from "@/components/modals/NameHint";
import { UrlPreview } from "@/components/modals/UrlPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogueNameField as NameFieldState } from "@/hooks/useCatalogueNameField";

const NAME_MAX_LENGTH = 60;

/** The public URL a catalogue with this name would get (`.as-url`). */
export function CatalogueUrlPreview({
	name,
	label = "Your URL will be",
	icon = <Globe />,
}: {
	name: string;
	label?: string;
	icon?: ReactNode;
}) {
	const slug = name ? generateUniqueSlug(name) : "…";
	return (
		<UrlPreview
			icon={icon}
			label={label}
			url={`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${slug}`}
		/>
	);
}

type CatalogueNameFieldProps = {
	id: string;
	field: NameFieldState;
	label?: string;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	/** Render the URL preview under the field (off when the dialog shows it elsewhere). */
	showUrlPreview?: boolean;
	onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

/**
 * Label, input, live availability hint and (optionally) URL preview for a new
 * catalogue name. State comes from `useCatalogueNameField`.
 */
export function CatalogueNameField({
	id,
	field,
	label = "Catalogue Name",
	required = false,
	disabled = false,
	placeholder = "e.g. Burger House",
	showUrlPreview = true,
	onKeyDown,
}: CatalogueNameFieldProps) {
	const hintId = `${id}-hint`;
	const hasName = field.value.trim().length > 0;
	const showHint =
		!disabled &&
		field.touched &&
		hasName &&
		(Boolean(field.error) || field.checking || field.available);

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<Label htmlFor={id}>
				{label}
				{required && (
					<span aria-hidden="true" className="ml-0.5 text-product-error">
						*
					</span>
				)}
			</Label>
			<Input
				aria-describedby={hintId}
				aria-invalid={Boolean(field.touched && field.error) || undefined}
				aria-required={required || undefined}
				autoComplete="off"
				disabled={disabled}
				id={id}
				maxLength={NAME_MAX_LENGTH}
				onChange={field.onChange}
				onKeyDown={onKeyDown}
				placeholder={placeholder}
				type="text"
				value={field.value}
			/>
			<NameHint
				checking={field.checking}
				error={field.error}
				id={hintId}
				show={showHint}
			/>
			{showUrlPreview && <CatalogueUrlPreview name={field.value} />}
		</div>
	);
}
