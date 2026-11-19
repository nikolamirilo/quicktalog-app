import type { Status } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

import { type CardInput, cardState } from "@/lib/dashboard/catalogue-card";

/**
 * Every state a dashboard catalogue card can be in. The card itself has no test,
 * and these states differ only in wording, so each one is asserted here.
 */
const card = (over: Partial<CardInput> & { status: Status }): CardInput => ({
	backOnline: "1 Dec 2026",
	draft: {
		itemCount: 11,
		lastSavedAt: "2026-11-19T18:00:00Z",
		sectionCount: 3,
		unpublished: false,
	},
	name: "foto-usluge",
	trafficOffAt: null,
	...over,
});

const empty = { itemCount: 0, lastSavedAt: null, sectionCount: 0 };

describe("the dashboard catalogue card", () => {
	describe("the publish row appears only when something can be published", () => {
		it("offers nothing on a live catalogue with no newer edits", () => {
			expect(cardState(card({ status: "active" })).publishLabel).toBeNull();
		});

		it("offers 'Publish changes' on a live catalogue holding newer edits", () => {
			const state = cardState(
				card({
					draft: { ...card({ status: "active" }).draft, unpublished: true },
					status: "active",
				}),
			);
			expect(state.publishLabel).toBe("Publish changes");
		});

		it("offers 'Publish catalogue' on a draft with content", () => {
			expect(cardState(card({ status: "draft" })).publishLabel).toBe(
				"Publish catalogue",
			);
		});

		it("offers 'Publish catalogue' on a switched-off catalogue with content", () => {
			expect(cardState(card({ status: "inactive" })).publishLabel).toBe(
				"Publish catalogue",
			);
		});

		it.each(["draft", "inactive"] as const)(
			"offers nothing on an empty %s, which has nothing to publish",
			(status) => {
				expect(
					cardState(card({ draft: { ...empty, unpublished: true }, status }))
						.publishLabel,
				).toBeNull();
			},
		);

		it.each(["error", "in_preparation"] as const)(
			"offers nothing while %s",
			(status) => {
				expect(cardState(card({ status })).publishLabel).toBeNull();
			},
		);
	});

	describe("the extra line says only what the status badge cannot", () => {
		it("names the waiting changes on a live catalogue", () => {
			const state = cardState(
				card({
					draft: { ...card({ status: "active" }).draft, unpublished: true },
					status: "active",
				}),
			);
			expect(state.signal).toEqual({
				text: "Changes not published yet",
				warn: true,
			});
		});

		it("stays silent on a live catalogue with nothing waiting", () => {
			expect(cardState(card({ status: "active" })).signal).toBeNull();
		});

		it.each(["draft", "inactive"] as const)(
			"stays silent on a %s, where the badge already means not published",
			(status) => {
				const state = cardState(
					card({
						draft: { ...card({ status }).draft, unpublished: true },
						status,
					}),
				);
				expect(state.signal).toBeNull();
			},
		);

		it("explains a traffic-limit switch-off instead", () => {
			const state = cardState(
				card({
					draft: { ...card({ status: "inactive" }).draft, unpublished: true },
					status: "inactive",
					trafficOffAt: "2026-11-18T03:00:00Z",
				}),
			);
			expect(state.signal).toEqual({
				text: "Back online 1 Dec 2026",
				warn: false,
			});
		});

		it("never stacks two lines", () => {
			const state = cardState(
				card({
					draft: { ...card({ status: "inactive" }).draft, unpublished: true },
					status: "inactive",
					trafficOffAt: "2026-11-18T03:00:00Z",
				}),
			);
			expect(state.signal).not.toBeNull();
			expect(state.signal?.text).not.toContain("not published");
		});
	});

	describe("the first button is always navigation, never a mutation", () => {
		it("opens the public page of a live catalogue", () => {
			expect(cardState(card({ status: "active" })).primaryAction).toEqual({
				href: "/catalogues/foto-usluge",
				label: "View Catalogue",
			});
		});

		it.each(["draft", "inactive"] as const)(
			"opens the builder for a %s",
			(status) => {
				expect(cardState(card({ status })).primaryAction).toEqual({
					href: "/admin/foto-usluge/builder",
					label: "Open in Builder",
				});
			},
		);

		it("never offers a publish verb", () => {
			for (const status of [
				"active",
				"draft",
				"inactive",
				"error",
				"in_preparation",
			] as const) {
				for (const unpublished of [true, false]) {
					const label = cardState(
						card({ draft: { ...empty, unpublished }, status }),
					).primaryAction.label;
					expect(label.toLowerCase()).not.toContain("publish");
				}
			}
		});
	});

	describe("emptiness is reported with the item count", () => {
		it("says so in place of two zeroes", () => {
			expect(
				cardState(
					card({ draft: { ...empty, unpublished: true }, status: "draft" }),
				).itemsSummary,
			).toBe("nothing in it yet");
		});

		it("counts normally otherwise", () => {
			expect(cardState(card({ status: "active" })).itemsSummary).toBe(
				"11 in 3 sections",
			);
		});

		it("keeps the singular for one section", () => {
			expect(
				cardState(
					card({
						draft: {
							itemCount: 4,
							lastSavedAt: null,
							sectionCount: 1,
							unpublished: false,
						},
						status: "active",
					}),
				).itemsSummary,
			).toBe("4 in 1 section");
		});
	});

	describe("analytics", () => {
		it("is unavailable on a draft, which has no traffic yet", () => {
			expect(cardState(card({ status: "draft" })).analyticsEnabled).toBe(false);
		});

		it.each(["active", "inactive"] as const)(
			"is available on a %s catalogue",
			(status) => {
				expect(cardState(card({ status })).analyticsEnabled).toBe(true);
			},
		);
	});

	describe("the states with no page to visit", () => {
		it.each(["error", "in_preparation"] as const)(
			"marks %s as terminal, so the card shows a message and keeps the menu",
			(status) => {
				expect(cardState(card({ status })).isTerminal).toBe(true);
			},
		);

		it.each(["active", "draft", "inactive"] as const)(
			"does not mark %s as terminal",
			(status) => {
				expect(cardState(card({ status })).isTerminal).toBe(false);
			},
		);
	});
});
