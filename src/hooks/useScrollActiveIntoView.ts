import { type RefObject, useEffect } from "react";

/**
 * Keeps the active item of a horizontal scroller centred, so an item picked
 * off-screen (or selected on load) stays visible. It sets `scrollLeft` rather
 * than calling `scrollIntoView`, which would also scroll the page.
 */
export function useScrollActiveIntoView(
	listRef: RefObject<HTMLElement | null>,
	activeSelector: string,
	activeKey: unknown,
) {
	useEffect(() => {
		const list = listRef.current;
		const active = list?.querySelector<HTMLElement>(activeSelector);
		if (!list || !active) return;
		const offset =
			active.getBoundingClientRect().left - list.getBoundingClientRect().left;
		list.scrollTo({
			left:
				list.scrollLeft + offset - (list.clientWidth - active.offsetWidth) / 2,
			behavior: "smooth",
		});
	}, [activeKey]);
}
