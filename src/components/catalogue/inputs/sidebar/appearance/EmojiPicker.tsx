"use client";

import { Smile } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OVERLAY_EMOJI_GROUPS } from "@/constants/emojis";
import { splitEmojis } from "@/lib/format/emoji";
import { cn } from "@/lib/ui/cn";

interface EmojiPickerProps {
	/** What the emoji are for, e.g. "Overlay icon". Names the controls. */
	label: string;
	value: string;
	/** How many emoji the field holds. */
	max: number;
	onChange: (value: string) => void;
}

/**
 * The button beside an emoji field. It opens a searchable grid of picks so the
 * field can be filled without an emoji keyboard, and typing still works.
 */
export function EmojiPicker({ label, value, max, onChange }: EmojiPickerProps) {
	const [query, setQuery] = useState("");
	const picks = splitEmojis(value);

	const groups = useMemo(() => {
		const term = query.trim().toLowerCase();
		if (!term) return OVERLAY_EMOJI_GROUPS;
		return OVERLAY_EMOJI_GROUPS.map((group) => ({
			...group,
			emojis: group.name.toLowerCase().includes(term)
				? group.emojis
				: group.emojis.filter((emoji) => emoji.name.includes(term)),
		})).filter((group) => group.emojis.length > 0);
	}, [query]);

	const toggle = (char: string) => {
		const next = picks.includes(char)
			? picks.filter((pick) => pick !== char)
			: // Past the limit the oldest drops off, so a pick is never a dead click.
				[...picks, char].slice(-max);
		onChange(next.join(""));
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					aria-label={`Pick the ${label.toLowerCase()} emoji`}
					className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card text-product-foreground-accent transition-colors hover:border-product-border-hover hover:text-product-foreground focus-visible:border-product-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-product-primary/25 data-[state=open]:border-product-primary data-[state=open]:ring-4 data-[state=open]:ring-product-primary/25"
					type="button"
				>
					<Smile aria-hidden="true" className="h-5 w-5" />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="z-[2000] w-[308px] max-w-[calc(100vw-32px)] space-y-3 p-3"
				collisionPadding={16}
			>
				<Input
					aria-label={`Search emoji for the ${label.toLowerCase()}`}
					autoComplete="off"
					className="h-10 px-3 text-sm md:text-sm"
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search emoji"
					value={query}
				/>

				<ScrollArea className="h-[228px] pr-2.5">
					{groups.length === 0 ? (
						<p className="py-8 text-center text-[13px] text-product-muted">
							No emoji match that search.
						</p>
					) : (
						<div className="space-y-3">
							{groups.map((group) => (
								<div key={group.name}>
									<p className="mb-1.5 px-0.5 font-semibold text-[11px] text-product-muted uppercase tracking-wide">
										{group.name}
									</p>
									<ul className="grid grid-cols-7 gap-1">
										{group.emojis.map((emoji) => {
											const selected = picks.includes(emoji.char);
											return (
												<li key={emoji.char}>
													<button
														aria-label={emoji.name}
														aria-pressed={selected}
														className={cn(
															"flex aspect-square w-full items-center justify-center rounded-lg text-xl leading-none transition-colors hover:bg-product-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-product-primary",
															selected &&
																"bg-product-primary-soft ring-2 ring-product-primary",
														)}
														onClick={() => toggle(emoji.char)}
														type="button"
													>
														<span aria-hidden="true">{emoji.char}</span>
													</button>
												</li>
											);
										})}
									</ul>
								</div>
							))}
						</div>
					)}
				</ScrollArea>

				<div className="flex items-center justify-between gap-2 border-t border-product-border pt-2.5">
					<p className="text-[12.5px] text-product-muted">
						{picks.length}/{max} picked
					</p>
					<Button
						disabled={picks.length === 0}
						onClick={() => onChange("")}
						size="sm"
						type="button"
						variant="ghost"
					>
						Clear
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
