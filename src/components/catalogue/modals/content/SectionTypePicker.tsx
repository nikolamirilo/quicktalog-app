"use client";
import {
	Code,
	Globe,
	LayoutGrid,
	Lock,
	SeparatorHorizontal,
	Type,
} from "lucide-react";
import type { ElementType } from "react";
import { useRadioKeys } from "@/hooks/useRadioKeys";
import { cn } from "@/lib/ui/cn";
import type { ContentOption } from "./BlockConfigHeader";

const OPTIONS: { key: ContentOption; label: string; icon: ElementType }[] = [
	{ key: "items", label: "Items", icon: LayoutGrid },
	{ key: "text", label: "Text", icon: Type },
	{ key: "divider", label: "Divider", icon: SeparatorHorizontal },
	{ key: "embedding", label: "External content", icon: Globe },
	{ key: "custom_code", label: "Custom code", icon: Code },
];

const KEYS = OPTIONS.map((o) => o.key);

/**
 * Section type choice: wrapping chips on phones, a vertical list from `md`.
 * A locked type stays selectable so the form can show why it's locked; the
 * dialog's add button stays disabled for it.
 */
export function SectionTypePicker({
	value,
	onChange,
	isLocked,
	className,
}: {
	value: ContentOption;
	onChange: (value: ContentOption) => void;
	isLocked: (key: ContentOption) => boolean;
	className?: string;
}) {
	const { onKeyDown, itemProps } = useRadioKeys(KEYS, value, onChange);

	return (
		<div
			aria-label="Section type"
			className={cn(
				"flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-1",
				className,
			)}
			onKeyDown={onKeyDown}
			role="radiogroup"
		>
			{OPTIONS.map(({ key, label, icon: Icon }, i) => {
				const checked = key === value;
				const locked = isLocked(key);
				return (
					<button
						{...itemProps(key, i)}
						className={cn(
							"inline-flex h-9 items-center gap-2 rounded-full border-[1.5px] border-product-border bg-product-card px-3 text-[13.5px] font-semibold text-product-foreground-accent transition-colors hover:border-product-border-strong hover:text-product-foreground",
							"md:h-11 md:w-full md:rounded-[14px] md:border-transparent md:bg-transparent md:px-3.5 md:text-sm md:hover:border-transparent md:hover:bg-product-card",
							checked &&
								"border-product-primary-accent bg-product-primary-soft text-product-foreground hover:border-product-primary-accent md:border-product-primary-accent md:bg-product-primary-soft md:hover:border-product-primary-accent md:hover:bg-product-primary-soft",
						)}
						key={key}
					>
						<Icon
							aria-hidden="true"
							className={cn(
								"size-4 flex-none",
								checked && "text-product-primary-ink",
							)}
						/>
						<span className="whitespace-nowrap md:flex-1 md:text-left">
							{label}
						</span>
						{locked && (
							<>
								<Lock
									aria-hidden="true"
									className="size-3.5 flex-none text-product-muted"
								/>
								<span className="sr-only">(upgrade required)</span>
							</>
						)}
					</button>
				);
			})}
		</div>
	);
}
