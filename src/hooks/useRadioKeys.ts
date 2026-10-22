import { type KeyboardEvent, useRef } from "react";

/** Arrow keys move and select, like native radios (roving tabindex). */
export function useRadioKeys<T>(
	values: readonly T[],
	value: T,
	onChange: (value: T) => void,
) {
	const refs = useRef<(HTMLButtonElement | null)[]>([]);
	const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
		const step =
			e.key === "ArrowRight" || e.key === "ArrowDown"
				? 1
				: e.key === "ArrowLeft" || e.key === "ArrowUp"
					? -1
					: 0;
		if (!step) return;
		e.preventDefault();
		const current = Math.max(0, values.indexOf(value));
		const next = (current + step + values.length) % values.length;
		refs.current[next]?.focus();
		onChange(values[next]);
	};
	const itemProps = (item: T, index: number) => ({
		ref: (el: HTMLButtonElement | null) => {
			refs.current[index] = el;
		},
		role: "radio" as const,
		type: "button" as const,
		"aria-checked": item === value,
		// Keep the group reachable when a saved value matches no option.
		tabIndex:
			item === value || (!values.includes(value) && index === 0) ? 0 : -1,
		onClick: () => onChange(item),
	});
	return { onKeyDown, itemProps };
}
