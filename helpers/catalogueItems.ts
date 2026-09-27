import type { AnyItemsBlock, ContentBlock, Item } from "@quicktalog/common";
import { isItemsBlock } from "@/helpers/contentBlocks";

export const INITIAL_ITEM_COUNT = 20;
export const LOAD_MORE_STEP = 20;
/** Below this many items a catalogue is short enough to scan without search. */
export const SEARCH_MIN_ITEMS = 20;

export interface DisplayItem {
	item: Item;
	originalIndex: number;
}

export function normalizeText(value: string | null | undefined): string {
	if (!value) return "";
	const withoutTags = String(value).replace(/<[^>]*>/g, " ");
	return withoutTags
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

export function matchesQuery(item: Item, query: string): boolean {
	const q = normalizeText(query);
	if (!q) return true;
	const haystack = `${normalizeText(item.name)} ${normalizeText(item.description)}`;
	return q.split(" ").every((term) => haystack.includes(term));
}

export function getDisplayItems(
	block: AnyItemsBlock,
	query: string,
): DisplayItem[] {
	const items = block?.items;
	if (!Array.isArray(items) || items.length === 0) return [];
	const result: DisplayItem[] = [];
	for (let i = 0; i < items.length; i++) {
		if (matchesQuery(items[i], query)) {
			result.push({ item: items[i], originalIndex: i });
		}
	}
	return result;
}

export function getTotalItemCount(blocks: ContentBlock[] | undefined): number {
	if (!Array.isArray(blocks)) return 0;
	return blocks.reduce((total, block) => {
		if (!isItemsBlock(block)) return total;
		return total + (block.items?.length ?? 0);
	}, 0);
}

/**
 * Tesseract-style language codes (`catalogue.language`) to a BCP-47 tag, so
 * prices format the way the catalogue's readers expect. Deterministic on
 * purpose: the runtime default would differ between server and client.
 */
const LOCALE_BY_LANGUAGE: Record<string, string> = {
	eng: "en-US",
	spa: "es-ES",
	fra: "fr-FR",
	deu: "de-DE",
	ita: "it-IT",
	por: "pt-BR",
	rus: "ru-RU",
	chi_sim: "zh-CN",
	chi_tra: "zh-TW",
	jpn: "ja-JP",
	kor: "ko-KR",
	ara: "ar-EG",
	hin: "hi-IN",
	tha: "th-TH",
	vie: "vi-VN",
	nld: "nl-NL",
	swe: "sv-SE",
	nor: "nb-NO",
	dan: "da-DK",
	fin: "fi-FI",
	pol: "pl-PL",
	ces: "cs-CZ",
	hun: "hu-HU",
	tur: "tr-TR",
	heb: "he-IL",
	ukr: "uk-UA",
	bul: "bg-BG",
	hrv: "hr-HR",
	slk: "sk-SK",
	slv: "sl-SI",
	srp: "sr-RS",
	srp_latn: "sr-Latn-RS",
};

export const DEFAULT_LOCALE = "en-US";

export function localeForLanguage(language: string | undefined | null): string {
	if (!language) return DEFAULT_LOCALE;
	return LOCALE_BY_LANGUAGE[language] ?? DEFAULT_LOCALE;
}
