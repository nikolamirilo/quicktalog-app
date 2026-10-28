/**
 * The Markdown a chat message is written in, parsed to a small tree the chat
 * renders as React nodes. Deliberately not a general Markdown implementation:
 * it covers what a reply uses - emphasis, inline code, links, lists, headings,
 * fenced code, quotes, rules and small tables - and leaves anything else as the
 * text it was.
 *
 * Two properties matter as much as the grammar: nothing ever throws on partial
 * input, because a reply is parsed on every stream chunk, and an unfinished
 * marker reads as literal text rather than swallowing the rest of the message.
 */

export type MdInline =
	| { type: "text"; value: string }
	| { type: "code"; value: string }
	| { type: "strong"; children: MdInline[] }
	| { type: "em"; children: MdInline[] }
	| { type: "strike"; children: MdInline[] }
	| { type: "link"; href: string; children: MdInline[] };

export interface MdListItem {
	content: MdInline[];
	/** A nested list, when the item has one. */
	children: MdBlock[];
}

export type MdBlock =
	| { type: "paragraph"; content: MdInline[] }
	| { type: "heading"; level: number; content: MdInline[] }
	| { type: "list"; ordered: boolean; start: number; items: MdListItem[] }
	| { type: "codeBlock"; language: string; value: string }
	| { type: "quote"; blocks: MdBlock[] }
	| { type: "rule" }
	| { type: "table"; head: MdInline[][]; rows: MdInline[][][] };

const FENCE = /^\s{0,3}(```+|~~~+)\s*([\w+-]*)\s*$/;
const RULE = /^\s{0,3}([-*_])\s*(\1\s*){2,}$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;
const TABLE_DIVIDER = /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/;

const SAFE_HREF = /^(https?:\/\/|mailto:)/i;

/** Where a marker could start; everything between two of these is literal text. */
const MARK = /[\\`*_~[]/g;

// Tried in this order at a marker, so ``code`` wins over the ** inside it and
// ***both*** over **strong**. Sticky, to match at the cursor and nowhere else.
const ESCAPE = /\\([\\`*_~[\]()#>-])/y;
const CODE = /`([^`\n]+)`/y;
const BOTH = /(\*\*\*|___)(?=\S)([^\n]*?\S)\1/y;
const STRONG = /(\*\*|__)(?=\S)([^\n]*?\S)\1/y;
const STRIKE = /~~(?=\S)([^\n]*?\S)~~/y;
const EM = /([*_])(?=\S)([^*_\n]*?\S)\1/y;
const LINK = /\[([^\]\n]*)\]\(([^)\s]+)\)/y;

const at = (pattern: RegExp, source: string, index: number) => {
	pattern.lastIndex = index;
	return pattern.exec(source);
};

/** Keeps adjacent literals in one node, so the output has no needless spans. */
function pushText(nodes: MdInline[], value: string): void {
	if (!value) return;
	const last = nodes[nodes.length - 1];
	if (last?.type === "text") last.value += value;
	else nodes.push({ type: "text", value });
}

export function parseInline(source: string): MdInline[] {
	const nodes: MdInline[] = [];
	let plainFrom = 0;
	let i = 0;

	while (i < source.length) {
		MARK.lastIndex = i;
		const next = MARK.exec(source);
		if (!next) break;
		i = next.index;

		const node = inlineAt(source, i);
		if (!node) {
			i += 1;
			continue;
		}

		pushText(nodes, source.slice(plainFrom, i));
		if (node.node) nodes.push(node.node);
		else pushText(nodes, node.literal ?? "");
		i = node.end;
		plainFrom = i;
	}

	pushText(nodes, source.slice(plainFrom));
	return nodes;
}

/** One marker at `index`, or null when what is there is only text. */
function inlineAt(
	source: string,
	index: number,
): { node?: MdInline; literal?: string; end: number } | null {
	const escaped = at(ESCAPE, source, index);
	if (escaped) return { literal: escaped[1], end: index + escaped[0].length };

	const code = at(CODE, source, index);
	if (code)
		return {
			node: { type: "code", value: code[1] },
			end: index + code[0].length,
		};

	const both = at(BOTH, source, index);
	if (both)
		return {
			node: {
				type: "strong",
				children: [{ type: "em", children: parseInline(both[2]) }],
			},
			end: index + both[0].length,
		};

	const strong = at(STRONG, source, index);
	if (strong)
		return {
			node: { type: "strong", children: parseInline(strong[2]) },
			end: index + strong[0].length,
		};

	const strike = at(STRIKE, source, index);
	if (strike)
		return {
			node: { type: "strike", children: parseInline(strike[1]) },
			end: index + strike[0].length,
		};

	const em = at(EM, source, index);
	// `snake_case` is one word, not emphasis: `_` only opens at a boundary.
	if (em && !(em[1] === "_" && /\w/.test(source[index - 1] ?? ""))) {
		return {
			node: { type: "em", children: parseInline(em[2]) },
			end: index + em[0].length,
		};
	}

	const link = at(LINK, source, index);
	if (link) {
		return SAFE_HREF.test(link[2])
			? {
					node: { type: "link", href: link[2], children: parseInline(link[1]) },
					end: index + link[0].length,
				}
			: { literal: link[0], end: index + link[0].length };
	}

	return null;
}

const indentOf = (value: string): number => value.replace(/\t/g, "  ").length;

const listMarker = (line: string) => {
	const bullet = BULLET.exec(line);
	if (bullet)
		return {
			indent: indentOf(bullet[1]),
			ordered: false,
			start: 1,
			content: bullet[2],
		};
	const ordered = ORDERED.exec(line);
	if (ordered)
		return {
			indent: indentOf(ordered[1]),
			ordered: true,
			start: Number(ordered[2]),
			content: ordered[3],
		};
	return null;
};

const startsBlock = (line: string | undefined): boolean =>
	line !== undefined &&
	(FENCE.test(line) ||
		RULE.test(line) ||
		HEADING.test(line) ||
		QUOTE.test(line) ||
		listMarker(line) !== null);

const cells = (line: string): string[] =>
	line
		.trim()
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split("|")
		.map((cell) => cell.trim());

export function parseMarkdownBlocks(source: string): MdBlock[] {
	const lines = source.replace(/\r\n?/g, "\n").split("\n");
	const blocks: MdBlock[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (!line.trim()) {
			i += 1;
			continue;
		}

		const fence = FENCE.exec(line);
		if (fence) {
			const marker = fence[1][0];
			const body: string[] = [];
			i += 1;
			while (
				i < lines.length &&
				!new RegExp(`^\\s{0,3}${marker === "`" ? "```" : "~~~"}+\\s*$`).test(
					lines[i],
				)
			) {
				body.push(lines[i]);
				i += 1;
			}
			i += 1; // the closing fence, or the end of a reply still streaming
			blocks.push({
				type: "codeBlock",
				language: fence[2] ?? "",
				value: body.join("\n"),
			});
			continue;
		}

		if (RULE.test(line)) {
			blocks.push({ type: "rule" });
			i += 1;
			continue;
		}

		const heading = HEADING.exec(line);
		if (heading) {
			blocks.push({
				type: "heading",
				level: heading[1].length,
				content: parseInline(heading[2]),
			});
			i += 1;
			continue;
		}

		if (QUOTE.test(line)) {
			const quoted: string[] = [];
			while (i < lines.length) {
				const match = QUOTE.exec(lines[i]);
				if (!match) break;
				quoted.push(match[1]);
				i += 1;
			}
			blocks.push({
				type: "quote",
				blocks: parseMarkdownBlocks(quoted.join("\n")),
			});
			continue;
		}

		if (
			line.includes("|") &&
			lines[i + 1] !== undefined &&
			TABLE_DIVIDER.test(lines[i + 1])
		) {
			const head = cells(line).map(parseInline);
			i += 2;
			const rows: MdInline[][][] = [];
			while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
				rows.push(cells(lines[i]).map(parseInline));
				i += 1;
			}
			blocks.push({ type: "table", head, rows });
			continue;
		}

		if (listMarker(line)) {
			const { list, next } = parseList(lines, i);
			blocks.push(list);
			i = next;
			continue;
		}

		const paragraph: string[] = [];
		while (
			i < lines.length &&
			lines[i].trim() &&
			!startsBlock(lines[i]) &&
			!(
				lines[i].includes("|") &&
				lines[i + 1] !== undefined &&
				TABLE_DIVIDER.test(lines[i + 1])
			)
		) {
			paragraph.push(lines[i]);
			i += 1;
		}
		// A line that only opens a block when a later line agrees (a table header)
		// is still a paragraph line; without this the loop could not advance.
		if (paragraph.length === 0) {
			paragraph.push(lines[i]);
			i += 1;
		}
		blocks.push({
			type: "paragraph",
			content: parseInline(paragraph.join("\n")),
		});
	}

	return blocks;
}

/** One list, including the lists nested inside its items. */
function parseList(
	lines: string[],
	from: number,
): { list: Extract<MdBlock, { type: "list" }>; next: number } {
	const first = listMarker(lines[from]);
	const baseIndent = first?.indent ?? 0;
	const list: Extract<MdBlock, { type: "list" }> = {
		type: "list",
		ordered: first?.ordered ?? false,
		start: first?.start ?? 1,
		items: [],
	};

	let i = from;
	while (i < lines.length) {
		const line = lines[i];
		if (!line.trim()) break;

		const marker = listMarker(line);
		if (marker) {
			if (marker.indent > baseIndent) {
				const nested = parseList(lines, i);
				const parent = list.items[list.items.length - 1];
				if (parent) parent.children.push(nested.list);
				else list.items.push({ content: [], children: [nested.list] });
				i = nested.next;
				continue;
			}
			if (marker.indent < baseIndent || marker.ordered !== list.ordered) break;
			list.items.push({
				content: parseInline(marker.content),
				children: [],
			});
			i += 1;
			continue;
		}

		// A wrapped item: indented text under the marker it belongs to.
		const item = list.items[list.items.length - 1];
		if (!item || indentOf(line.match(/^\s*/)?.[0] ?? "") <= baseIndent) break;
		pushText(item.content, `\n${line.trim()}`);
		i += 1;
	}

	return { list, next: i };
}
