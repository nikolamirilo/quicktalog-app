"use client";
import {
	Code,
	Globe,
	LayoutGrid,
	Lock,
	SeparatorHorizontal,
	Type,
} from "lucide-react";
import { type ElementType, useRef } from "react";
import { useRadioKeys } from "@/hooks/useRadioKeys";
import { useScrollActiveIntoView } from "@/hooks/useScrollActiveIntoView";
import { cn } from "@/lib/ui/cn";
import { pillTab, pillTabBar } from "@/lib/ui/pill-tab";
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
 * Section type choice: the dashboard's scrolling pill bar on phones, a
 * vertical list from `md`. A locked type stays selectable so the form can show
 * why it's locked; the dialog's add button stays disabled for it.
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
	const listRef = useRef<HTMLDivElement>(null);
	useScrollActiveIntoView(listRef, '[aria-checked="true"]', value);

	return (
		<div
			aria-label="Section type"
			className={cn(
				pillTabBar,
				"-mx-4 px-4 pb-2.5 pt-1 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:p-0",
				className,
			)}
			onKeyDown={onKeyDown}
			ref={listRef}
			role="radiogroup"
		>
			{OPTIONS.map(({ key, label, icon: Icon }, i) => {
				const checked = key === value;
				const locked = isLocked(key);
				return (
					<button
						{...itemProps(key, i)}
						className={cn(
							pillTab.base,
							"transition-colors hover:border-product-border-strong hover:text-product-foreground",
							"md:h-10 md:w-full md:rounded-[12px] md:border-[1.5px] md:border-transparent md:bg-transparent md:px-3 md:hover:border-transparent md:hover:bg-product-card",
							checked &&
								cn(
									pillTab.active,
									"hover:border-product-primary md:border-product-primary-accent md:bg-product-primary-soft md:hover:border-product-primary-accent md:hover:bg-product-primary-soft",
								),
						)}
						key={key}
					>
						<Icon aria-hidden="true" className="flex-none" />
						<span className="md:flex-1 md:text-left">{label}</span>
						{locked && (
							<>
								<Lock
									aria-hidden="true"
									className="flex-none !text-product-muted"
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
