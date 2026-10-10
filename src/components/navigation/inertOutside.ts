const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "TEMPLATE"]);

/**
 * Makes everything on the page except `keep` (and its ancestors) `inert`, so
 * focus, clicks and screen readers stay inside `keep` while a sheet or panel
 * is open. Elements that were already inert are left alone. Returns the undo.
 */
export function inertOutside(keep: HTMLElement): () => void {
	const changed: HTMLElement[] = [];
	let node: HTMLElement = keep;

	while (node !== document.body && node.parentElement) {
		const parent: HTMLElement = node.parentElement;
		for (const sibling of Array.from(parent.children)) {
			if (
				sibling === node ||
				!(sibling instanceof HTMLElement) ||
				sibling.inert ||
				SKIPPED_TAGS.has(sibling.tagName)
			) {
				continue;
			}
			sibling.inert = true;
			changed.push(sibling);
		}
		node = parent;
	}

	return () => {
		for (const element of changed) element.inert = false;
	};
}
