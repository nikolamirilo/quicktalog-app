import { CheckList } from "@/components/general/CheckList";
import { starterTier } from "@/constants/pricing";

/**
 * What `/demo` shows before anything runs.
 *
 * The page used to be a `PageHero` and an iframe mounted after hydration, so a server
 * fetch of `/demo` came back with "Loading…" and "Loading tour…" - nothing about the
 * product for a crawler, a link preview or anybody on a slow connection. This is plain
 * server HTML: a sample catalogue laid out the way a real one reads, and what the tour
 * below it walks through.
 */

const SAMPLE = {
	heading: "Bella Vista — Kitchen & Bar",
	sections: [
		{
			name: "Starters",
			items: [
				{
					name: "Burrata & heritage tomato",
					description: "Creamy burrata, basil oil, aged balsamic, sourdough",
					price: "€11.50",
				},
				{
					name: "Calamari fritti",
					description: "Lightly fried, lemon aioli, parsley",
					price: "€12.00",
				},
				{
					name: "Soup of the day",
					description: "Ask your server — always vegetarian",
					price: "€7.50",
				},
			],
		},
		{
			name: "Mains",
			items: [
				{
					name: "Tagliatelle al ragù",
					description: "Eight-hour beef ragù, parmigiano, fresh tagliatelle",
					price: "€18.00",
				},
				{
					name: "Sea bass al forno",
					description: "Whole roasted sea bass, fennel, olives, new potatoes",
					price: "€24.50",
				},
				{
					name: "Wild mushroom risotto",
					description: "Carnaroli rice, porcini, thyme, truffle butter",
					price: "€17.00",
				},
			],
		},
	],
};

const CAPABILITIES = [
	"Sections and items with photos, prices and descriptions",
	"A link and a QR code your customers open on any phone",
	"Edits that go live the moment you publish",
	"Built by AI from a description or a photo of your printed menu",
];

export function DemoPreview() {
	return (
		<section
			aria-labelledby="demo-preview-heading"
			className="mx-auto max-w-[1152px]"
		>
			<h2
				className="text-balance text-center text-[clamp(21px,2.4vw,27px)] font-bold leading-[1.2] tracking-[-0.02em]"
				id="demo-preview-heading"
			>
				This is what your customers see
			</h2>
			<p className="mx-auto mt-3 max-w-[640px] text-center text-product-foreground-accent">
				A Quicktalog catalogue is one page: your sections, your items, your
				prices. Here is a real one, and the tour below opens the builder that
				made it.
			</p>

			<div className="mt-7 grid gap-5 md:grid-cols-[1.15fr_1fr] md:items-start">
				<article className="overflow-hidden rounded-product-card border border-product-border bg-product-card shadow-product">
					<header className="border-b border-product-border px-6 py-5 text-center">
						<h3 className="text-[clamp(19px,2.2vw,24px)] font-bold tracking-[-0.02em]">
							{SAMPLE.heading}
						</h3>
						<p className="mt-1.5 text-sm text-product-muted">
							Sample catalogue · prices in EUR
						</p>
					</header>
					<div className="divide-y divide-product-border">
						{SAMPLE.sections.map((section) => (
							<section className="px-6 py-5" key={section.name}>
								<h4 className="mb-3 text-[15px] font-bold uppercase tracking-[0.08em] text-product-foreground-accent">
									{section.name}
								</h4>
								<ul className="flex flex-col gap-3.5">
									{section.items.map((item) => (
										<li
											className="flex items-baseline justify-between gap-4"
											key={item.name}
										>
											<span className="min-w-0">
												<span className="block font-semibold leading-snug">
													{item.name}
												</span>
												<span className="block text-sm leading-snug text-product-muted">
													{item.description}
												</span>
											</span>
											<span className="shrink-0 font-semibold tabular-nums">
												{item.price}
											</span>
										</li>
									))}
								</ul>
							</section>
						))}
					</div>
				</article>

				<div className="rounded-product-card border border-product-border bg-product-background-hero px-6 py-6">
					<h3 className="text-[19px] font-bold tracking-[-0.02em]">
						What you get
					</h3>
					<CheckList
						className="mt-4 flex-col items-start justify-start gap-y-3 text-left text-[15px] text-product-foreground-accent"
						iconClassName="mt-1 h-4 w-4 self-start"
						items={CAPABILITIES}
					/>
					<p className="mt-5 text-sm leading-relaxed text-product-foreground-accent">
						The {starterTier.name} plan is free: one catalogue, up to{" "}
						{starterTier.features.items_per_catalogue} items, and a shareable
						link with its own QR code.
					</p>
				</div>
			</div>
		</section>
	);
}
