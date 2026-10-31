"use client";
import {
	type MdBlock,
	type MdInline,
	parseMarkdownBlocks,
} from "@/lib/format/markdown";
import { cn } from "@/lib/ui/cn";
import type { ReactNode } from "react";

/**
 * A chat message, written in Markdown by the agent, drawn in the bubble.
 *
 * Headings render as bold lines rather than real heading tags: the message sits
 * inside the chat panel's own outline, and a reply must not add to it.
 */

type Tone = "default" | "onDark";

const surface = (tone: Tone) =>
	tone === "onDark" ? "bg-product-on-dark/15" : "bg-product-background-hero";

const edge = (tone: Tone) =>
	tone === "onDark" ? "border-product-on-dark/25" : "border-product-border";

function inlineNodes(
	nodes: MdInline[],
	tone: Tone,
	keyPrefix: string,
): ReactNode[] {
	return nodes.map((node, index) => {
		const key = `${keyPrefix}-${index}`;
		switch (node.type) {
			case "text":
				return node.value;
			case "code":
				return (
					<code
						className={`rounded px-1 py-0.5 font-mono text-[0.92em] ${surface(tone)}`}
						key={key}
					>
						{node.value}
					</code>
				);
			case "strong":
				return (
					<strong className="font-semibold" key={key}>
						{inlineNodes(node.children, tone, key)}
					</strong>
				);
			case "em":
				return <em key={key}>{inlineNodes(node.children, tone, key)}</em>;
			case "strike":
				return <s key={key}>{inlineNodes(node.children, tone, key)}</s>;
			case "link":
				return (
					<a
						className="underline underline-offset-2"
						href={node.href}
						key={key}
						rel="noopener noreferrer"
						target="_blank"
					>
						{inlineNodes(node.children, tone, key)}
					</a>
				);
		}
	});
}

function blockNode(block: MdBlock, tone: Tone, key: string): ReactNode {
	switch (block.type) {
		case "paragraph":
			return (
				<p className="whitespace-pre-wrap" key={key}>
					{inlineNodes(block.content, tone, key)}
				</p>
			);

		case "heading":
			return (
				<p
					className={cn("font-bold", block.level <= 2 && "text-[15px]")}
					key={key}
				>
					{inlineNodes(block.content, tone, key)}
				</p>
			);

		case "list": {
			const List = block.ordered ? "ol" : "ul";
			return (
				<List
					className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
					key={key}
					start={block.ordered && block.start !== 1 ? block.start : undefined}
				>
					{block.items.map((item, index) => (
						<li key={`${key}-${index}`}>
							<span className="whitespace-pre-wrap">
								{inlineNodes(item.content, tone, `${key}-${index}`)}
							</span>
							{item.children.map((child, childIndex) =>
								blockNode(child, tone, `${key}-${index}-${childIndex}`),
							)}
						</li>
					))}
				</List>
			);
		}

		case "codeBlock":
			return (
				<pre
					className={`chat-scroll overflow-x-auto rounded-lg px-2.5 py-2 ${surface(tone)}`}
					key={key}
				>
					<code className="font-mono text-[12px] leading-relaxed">
						{block.value}
					</code>
				</pre>
			);

		case "quote":
			return (
				<blockquote
					className={`space-y-2 border-l-2 pl-3 italic ${edge(tone)}`}
					key={key}
				>
					{block.blocks.map((child, index) =>
						blockNode(child, tone, `${key}-${index}`),
					)}
				</blockquote>
			);

		case "rule":
			return <hr className={edge(tone)} key={key} />;

		case "table":
			return (
				<div className="chat-scroll overflow-x-auto" key={key}>
					<table className="w-full border-collapse text-left text-[13px]">
						{block.head.length > 0 && (
							<thead>
								<tr>
									{block.head.map((cell, index) => (
										<th
											className={`border-b px-2 py-1 font-semibold ${edge(tone)}`}
											key={`${key}-h-${index}`}
										>
											{inlineNodes(cell, tone, `${key}-h-${index}`)}
										</th>
									))}
								</tr>
							</thead>
						)}
						<tbody>
							{block.rows.map((row, rowIndex) => (
								<tr key={`${key}-r-${rowIndex}`}>
									{row.map((cell, index) => (
										<td
											className={`border-b px-2 py-1 align-top ${edge(tone)}`}
											key={`${key}-r-${rowIndex}-${index}`}
										>
											{inlineNodes(cell, tone, `${key}-r-${rowIndex}-${index}`)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);
	}
}

export function MarkdownText({
	text,
	tone = "default",
}: {
	text: string;
	tone?: Tone;
}) {
	return (
		<>
			{parseMarkdownBlocks(text).map((block, index) =>
				blockNode(block, tone, `block-${index}`),
			)}
		</>
	);
}

export default MarkdownText;
