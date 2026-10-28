"use client";

import { Check } from "lucide-react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { cn } from "@/lib/ui/cn";

type ChecklistState = {
	ticks: Record<string, boolean>;
	ids: string[];
	toggle: (id: string) => void;
	register: (id: string) => void;
};

const ChecklistContext = createContext<ChecklistState | null>(null);

const storageName = (key: string) => `quicktalog:manual:checklist:${key}`;

/**
 * Keeps a tutorial's ticks in the browser, so a reader who comes back after
 * lunch still sees where they stopped. Storage can be blocked or empty, so
 * every read and write is guarded and the page renders fine without it.
 */
export function ChecklistProvider({
	storageKey,
	children,
}: {
	storageKey: string;
	children: ReactNode;
}) {
	const [ticks, setTicks] = useState<Record<string, boolean>>({});
	const [ids, setIds] = useState<string[]>([]);

	useEffect(() => {
		try {
			const saved = window.localStorage.getItem(storageName(storageKey));
			if (saved) setTicks(JSON.parse(saved) as Record<string, boolean>);
		} catch {
			// Private windows and blocked site data land here. Start empty.
		}
	}, [storageKey]);

	const toggle = useCallback(
		(id: string) => {
			setTicks((current) => {
				const next = { ...current, [id]: !current[id] };
				try {
					window.localStorage.setItem(
						storageName(storageKey),
						JSON.stringify(next),
					);
				} catch {
					// Nothing to do: the tick still works for this visit.
				}
				return next;
			});
		},
		[storageKey],
	);

	const register = useCallback((id: string) => {
		setIds((current) => (current.includes(id) ? current : [...current, id]));
	}, []);

	const value = useMemo(
		() => ({ ids, register, ticks, toggle }),
		[ids, register, ticks, toggle],
	);

	return (
		<ChecklistContext.Provider value={value}>
			{children}
		</ChecklistContext.Provider>
	);
}

/** One tickable step of a tutorial. */
export function ChecklistItem({
	id,
	children,
}: {
	id: string;
	children: ReactNode;
}) {
	const context = useContext(ChecklistContext);
	const done = Boolean(context?.ticks[id]);

	useEffect(() => {
		context?.register(id);
	}, [context, id]);

	return (
		<li>
			<label
				className={cn(
					"flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-product-background-hero",
					done && "text-product-muted",
				)}
			>
				<input
					checked={done}
					className="sr-only"
					onChange={() => context?.toggle(id)}
					type="checkbox"
				/>
				<span
					aria-hidden="true"
					className={cn(
						"mt-[1px] grid h-[20px] w-[20px] flex-none place-items-center rounded-[6px] border-2 transition-colors",
						done
							? "border-product-success bg-product-success text-white"
							: "border-product-border-hover bg-product-card",
					)}
				>
					{done ? <Check className="h-3 w-3" /> : null}
				</span>
				<span
					className={cn(
						"text-[15px] text-product-foreground-accent",
						done && "line-through",
					)}
				>
					{children}
				</span>
			</label>
		</li>
	);
}

export function Checklist({ children }: { children: ReactNode }) {
	return (
		<ul className="rounded-product-card border border-product-border bg-product-card p-2">
			{children}
		</ul>
	);
}

/** The progress card in the right column. Renders nothing until items exist. */
export function ChecklistProgress() {
	const context = useContext(ChecklistContext);
	if (!context || context.ids.length === 0) return null;

	const total = context.ids.length;
	const done = context.ids.filter((id) => context.ticks[id]).length;
	const percent = Math.round((done / total) * 100);

	return (
		<div className="mb-5 rounded-[16px] border border-product-border bg-product-card p-3.5">
			<p className="text-xs font-bold text-product-muted">Your progress</p>
			<p className="mt-1 font-product-heading text-[15px] font-bold text-product-foreground">
				{done} of {total} done
			</p>
			<div className="mt-2 h-[6px] overflow-hidden rounded-full bg-product-background-hero">
				<div
					className="h-full rounded-full bg-product-success transition-[width]"
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}
