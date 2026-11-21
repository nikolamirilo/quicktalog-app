/**
 * Emoji are counted and split as graphemes: ❤️, 👍🏽 and 👨‍👩‍👧 are each one emoji
 * spread over several code points, so iterating code points miscounts them.
 */

const KEYCAP = /^[#*0-9]️?⃣$/;
const PICTOGRAPHIC =
	/^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}‍️\u{E0020}-\u{E007F}]*$/u;

const segmenter =
	typeof Intl !== "undefined" && "Segmenter" in Intl
		? new Intl.Segmenter(undefined, { granularity: "grapheme" })
		: null;

const toGraphemes = (value: string): string[] =>
	segmenter
		? [...segmenter.segment(value)].map((part) => part.segment)
		: [...value];

export const isEmoji = (grapheme: string) =>
	KEYCAP.test(grapheme) || PICTOGRAPHIC.test(grapheme);

/** The emoji in `value`, one string each; anything else is dropped. */
export const splitEmojis = (value: string): string[] =>
	toGraphemes(value).filter(isEmoji);

export const countEmojis = (value: string) => splitEmojis(value).length;

export const isOnlyEmojis = (value: string) =>
	toGraphemes(value).every(isEmoji);
