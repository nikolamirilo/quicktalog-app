import type { Status } from "@quicktalog/common";

import type { CatalogueDraftSummary } from "@/lib/dashboard/overview";

/** A line on the card that says something its status badge cannot. */
export type CardSignal = { text: string; warn: boolean };

export type CardState = {
	/** The publish row's label in the Options menu, or null when nothing can be published. */
	publishLabel: string | null;
	signal: CardSignal | null;
	primaryAction: { label: string; href: string };
	/** A catalogue that has never gone live has no traffic to chart. */
	analyticsEnabled: boolean;
	/** The `Items:` value; emptiness is reported here rather than as a second badge. */
	itemsSummary: string;
	/** Nothing to visit and nothing to publish, but the menu still reaches Delete. */
	isTerminal: boolean;
};

export type CardInput = {
	name: string;
	status: Status;
	/** Set when the plan's traffic limit switched the catalogue off. */
	trafficOffAt?: string | null;
	draft: CatalogueDraftSummary;
	/** The already-formatted day the traffic allowance resets. */
	backOnline: string;
};

/**
 * What one dashboard catalogue card shows, for each of the states a catalogue can
 * be in. Kept out of the component so every state can be asserted: the card has no
 * test of its own, and the states differ only in wording.
 */
export function cardState({
	name,
	status,
	trafficOffAt,
	draft,
	backOnline,
}: CardInput): CardState {
	const { itemCount, sectionCount, unpublished } = draft;
	const isEmpty = itemCount === 0 && sectionCount === 0;
	const isActive = status === "active";
	const isTerminal = status === "error" || status === "in_preparation";

	/*
	 * Only a live catalogue holding newer edits earns a line of its own: the Draft
	 * and Inactive badges already mean "not published", so repeating it there would
	 * put two pills of the same shape side by side saying one thing.
	 */
	let signal: CardSignal | null = null;
	if (isActive && unpublished) {
		signal = { text: "Changes not published yet", warn: true };
	} else if (status === "inactive" && trafficOffAt) {
		signal = { text: `Back online ${backOnline}`, warn: false };
	}

	// An empty catalogue has nothing to publish; the only useful move is to finish it.
	let publishLabel: string | null = null;
	if (!isTerminal && !isEmpty) {
		if (isActive) {
			publishLabel = unpublished ? "Publish changes" : null;
		} else {
			publishLabel = "Publish catalogue";
		}
	}

	return {
		publishLabel,
		signal,
		primaryAction: isActive
			? { label: "View Catalogue", href: `/catalogues/${name}` }
			: { label: "Open in Builder", href: `/admin/${name}/builder` },
		analyticsEnabled: status !== "draft",
		itemsSummary: isEmpty
			? "nothing in it yet"
			: `${itemCount} in ${sectionCount} ${
					sectionCount === 1 ? "section" : "sections"
				}`,
		isTerminal,
	};
}
