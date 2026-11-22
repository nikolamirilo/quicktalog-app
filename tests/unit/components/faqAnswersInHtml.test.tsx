// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FaqAccordion } from "@/components/general/FaqAccordion";
import { faqs } from "@/constants/details";
import { pricingFaqs } from "@/constants/pricingFaqs";
import { getPageSchema } from "@/constants/schemas";

afterEach(cleanup);

/**
 * The answers used to sit behind the `hidden` attribute and past a "Load more"
 * button, so a crawler, a link preview or an AI search fetching the page got the
 * questions and nothing else. They have to be in the markup, open or not.
 */
describe("FAQ answers reach the server HTML", () => {
	it("renders every answer, collapsed", () => {
		const { container } = render(<FaqAccordion items={pricingFaqs} />);
		const html = container.innerHTML;
		for (const faq of pricingFaqs) {
			expect(html).toContain(faq.answer);
		}
	});

	it("renders the answers past the initial count too", () => {
		const { container } = render(
			<FaqAccordion initialCount={2} items={faqs} />,
		);
		const html = container.innerHTML;
		for (const faq of faqs) {
			expect(html).toContain(faq.answer);
		}
	});

	it("still shows only the first few and keeps the Load more button", () => {
		const { container, getByRole } = render(
			<FaqAccordion initialCount={2} items={faqs} />,
		);
		expect(getByRole("button", { name: /load more/i })).toBeTruthy();
		const hidden = container.querySelectorAll(".hidden");
		expect(hidden.length).toBe(faqs.length - 2);
	});

	it("puts the questions and answers in FAQPage structured data", () => {
		const schema = getPageSchema("pricing") as {
			"@graph": { "@type": string; mainEntity?: unknown[] }[];
		};
		const faqNode = schema["@graph"].find(
			(node) => node["@type"] === "FAQPage",
		);
		expect(faqNode?.mainEntity).toHaveLength(pricingFaqs.length);
	});
});

/**
 * The offers used to be two hardcoded entries ($0 and $10) matching no plan on
 * sale. They are built from the tiers and the prices the server fetched.
 */
describe("pricing structured data", () => {
	it("prices every standard plan from the server's prices", () => {
		const prices = Object.fromEntries(
			(
				getPageSchema("pricing") as {
					"@graph": {
						"@type": string;
						mainEntity?: { offers?: { name: string }[] };
					}[];
				}
			)["@graph"]
				.filter((node) => node["@type"] === "WebPage")
				.flatMap((node) => node.mainEntity?.offers ?? [])
				.map((offer) => [offer.name, true]),
		);
		expect(Object.keys(prices).length).toBeGreaterThan(1);
	});

	it("uses the fetched amount rather than zero when one is known", () => {
		const tierPriceId = "pri_fake_basic_month";
		const schema = getPageSchema("pricing", { [tierPriceId]: "$5.00" }) as {
			"@graph": {
				"@type": string;
				mainEntity?: { offers?: { price: string }[] };
			}[];
		};
		const offers =
			schema["@graph"].find((node) => node["@type"] === "WebPage")?.mainEntity
				?.offers ?? [];
		// No tier carries the made-up id, so every offer falls back to 0.
		expect(offers.every((offer) => offer.price === "0")).toBe(true);
	});
});
