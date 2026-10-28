import type { ReactNode } from "react";

import { Tag } from "@/components/manual/Inline";

/** Every setting on a screen, in the order the screen shows them. */
export function Options({ children }: { children: ReactNode }) {
	return (
		<div className="divide-y divide-product-border overflow-hidden rounded-product-card border border-product-border bg-product-card/70">
			{children}
		</div>
	);
}

export function Option({
	name,
	required,
	optional,
	defaultValue,
	limit,
	plan,
	values,
	children,
}: {
	name: string;
	required?: boolean;
	optional?: boolean;
	/** Written the way the product has it, such as "Starter" or "50". */
	defaultValue?: string;
	/** Such as "Max 80 characters" or "1 to 100". */
	limit?: string;
	/** The plan this setting needs, when it is not on every plan. */
	plan?: string;
	/** The allowed values, exactly as the product lists them. */
	values?: string[];
	children: ReactNode;
}) {
	return (
		<div className="px-5 py-[18px]">
			<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
				<p className="font-product-heading text-[16px] font-bold text-product-foreground">
					{name}
				</p>
				{required ? <Tag kind="req">Required</Tag> : null}
				{optional ? <Tag kind="opt">Optional</Tag> : null}
				{defaultValue ? <Tag kind="def">Default: {defaultValue}</Tag> : null}
				{limit ? <Tag kind="lim">{limit}</Tag> : null}
				{plan ? <Tag kind="plan">{plan}</Tag> : null}
			</div>
			{values?.length ? (
				<div className="mt-2.5 flex flex-wrap gap-1.5">
					{values.map((value) => (
						<span
							className="rounded-lg bg-product-background-hero px-2.5 py-1 text-[13px] font-semibold text-product-foreground-accent"
							key={value}
						>
							{value}
						</span>
					))}
				</div>
			) : null}
			<div className="mt-1.5 max-w-[640px] text-[15.5px] leading-[1.65] text-product-foreground-accent [&>p+p]:mt-2">
				{children}
			</div>
		</div>
	);
}
