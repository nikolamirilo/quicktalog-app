const BULLET = /^(\s*)([-*+])(\s+)(.*)$/;
const ORDERED = /^(\s*)(\d+)([.)])(\s+)(.*)$/;

export interface ListContinuation {
	value: string;
	caret: number;
}

/**
 * A new line inside a typed list carries the list on: the next bullet, or the
 * next number. A new line on a marker with nothing after it ends the list
 * instead, so there is always a way out. The text stays a plain string - the
 * composer is a textarea and what the agent receives is unchanged.
 *
 * Returns null when the line is not a list item, leaving the plain newline to
 * the browser.
 */
export function continueList(
	value: string,
	caret: number,
): ListContinuation | null {
	const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
	const line = value.slice(lineStart, caret);

	const bullet = BULLET.exec(line);
	const ordered = bullet ? null : ORDERED.exec(line);
	if (!bullet && !ordered) return null;

	const indent = (bullet ?? ordered)?.[1] ?? "";
	const content = bullet ? bullet[4] : (ordered?.[5] ?? "");

	if (!content.trim()) {
		return {
			value: value.slice(0, lineStart) + value.slice(caret),
			caret: lineStart,
		};
	}

	const marker = bullet
		? `${bullet[2]}${bullet[3]}`
		: `${Number(ordered?.[2] ?? 0) + 1}${ordered?.[3]}${ordered?.[4]}`;
	const insert = `\n${indent}${marker}`;

	return {
		value: value.slice(0, caret) + insert + value.slice(caret),
		caret: caret + insert.length,
	};
}
