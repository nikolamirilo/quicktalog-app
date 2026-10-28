import {
	ChartColumn,
	Download,
	Eye,
	FileChartColumn,
	LayoutGrid,
	Mail,
	Plus,
	Rocket,
	Users,
} from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	AppNavbar,
	Btn,
	CatalogueCard,
	DashboardSidebar,
	PageWash,
	Panel,
	SectionTitle,
	StatCard,
} from "@/components/manual/screens/kit";

/** Email, catalogue and sign-up date, the three columns of the real table. */
const subscribers: [string, string, string][] = [
	["sophie.martin@gmail.com", "Brightside Cafe Menu", "Mar 14, 2026"],
	["daniel.okafor@outlook.com", "Brightside Cafe Menu", "Mar 12, 2026"],
	["lena.hart@gmail.com", "Winter Drinks", "Mar 9, 2026"],
	["tomas.reyes@gmail.com", "Brightside Cafe Menu", "Mar 5, 2026"],
];

/**
 * The newsletter card: a header strip with the count and the export button,
 * then the three-column table. The kit has no table, so it is drawn here.
 */
function NewsletterCard() {
	return (
		<div className="overflow-hidden rounded-product-card border border-product-border bg-product-card shadow-product">
			<div className="flex items-center justify-between gap-2.5 border-b border-product-border px-[18px] py-3.5">
				<span className="font-product-heading text-[15px] font-bold text-product-foreground">
					{subscribers.length} subscribers
				</span>
				<span className="relative">
					<SpotMarker n={5} />
					<Btn variant="outline">
						<Download />
						Export CSV
					</Btn>
				</span>
			</div>
			<table className="w-full text-sm">
				<thead>
					<tr>
						{(
							[
								["Email", "w-[45%]"],
								["Catalogue", "w-[30%]"],
								["Date", "w-[25%]"],
							] as const
						).map(([heading, width]) => (
							<th
								className={`${width} bg-product-background px-[18px] py-3 text-left text-xs font-bold text-product-muted`}
								key={heading}
								scope="col"
							>
								{heading}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{subscribers.map(([email, catalogue, date]) => (
						<tr
							className="border-b border-product-border last:border-0"
							key={email}
						>
							<td className="whitespace-nowrap px-[18px] py-3 text-product-foreground">
								{email}
							</td>
							<td className="whitespace-nowrap px-[18px] py-3">
								<span className="font-semibold text-product-primary-ink underline decoration-product-primary-ink/35 underline-offset-[3px]">
									{catalogue}
								</span>
							</td>
							<td className="whitespace-nowrap px-[18px] py-3 tabular-nums text-product-foreground-accent">
								{date}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/** The dashboard Overview tab: profile, totals, catalogues and subscribers. */
export function DashboardScreen() {
	return (
		<Screen
			caption="The dashboard Overview tab: a sticky tab sidebar beside a panel holding your welcome card, four traffic totals, your catalogue cards and the newsletter sign-up table."
			height={1330}
			legend={[
				"Dashboard tabs; Overview is the active one",
				"Your name and sign-in email",
				"Totals across all your catalogues; tap the ⓘ for what each one counts",
				"Whether a catalogue is live, a draft or switched off",
				"Download everyone who signed up through your catalogues",
				"Start a new catalogue",
			]}
			title="https://www.quicktalog.app/admin/dashboard"
			width={1280}
		>
			<PageWash>
				<AppNavbar />
				<div className="absolute inset-x-0 top-[120px] mx-auto flex max-w-[1280px] items-start gap-7 px-8">
					<div className="relative">
						<SpotMarker className="-left-2 top-[26px]" n={1} />
						<DashboardSidebar active="Overview" />
					</div>
					<Panel>
						<div className="relative flex items-center gap-6 rounded-product-card border border-product-border bg-product-amber-panel p-8 shadow-product">
							<SpotMarker n={2} />
							<span className="grid h-24 w-24 flex-none place-items-center rounded-full bg-product-primary-soft font-product-heading text-[32px] font-extrabold text-product-foreground shadow-[0_0_0_4px_var(--product-primary),0_10px_24px_-8px_rgb(var(--product-foreground-rgb)/0.3)]">
								AM
							</span>
							<div className="min-w-0">
								<p className="font-product-heading text-[30px] font-extrabold leading-[1.15] tracking-[-0.03em] text-product-foreground">
									Welcome back, Ana!
								</p>
								<p className="mt-1 text-[15px] text-product-foreground-accent">
									ana@brightsidecafe.com
								</p>
							</div>
						</div>

						<div className="mt-9">
							<SectionTitle icon={FileChartColumn}>Dashboard</SectionTitle>
						</div>
						<div className="relative mt-4 grid grid-cols-4 gap-4">
							<SpotMarker n={3} />
							<StatCard icon={Eye} label="Total Views" value="1,284" />
							<StatCard icon={Users} label="Total Visitors" value="612" />
							<StatCard icon={LayoutGrid} label="Catalogues" value="3" />
							<StatCard icon={Mail} label="Newsletter" value="4" />
						</div>

						<div className="mt-9">
							<SectionTitle icon={LayoutGrid}>Catalogues</SectionTitle>
						</div>
						<div className="mt-4 grid grid-cols-3 gap-3.5">
							<div className="relative flex">
								<SpotMarker className="left-1.5 top-[68px]" n={4} />
								<CatalogueCard
									actions={
										<>
											<Btn>Continue Editing</Btn>
											<Btn variant="outline">
												<Rocket />
												Publish Catalogue
											</Btn>
										</>
									}
									created="3/9/2026, 11:40 AM"
									name="Spring Specials"
									status="Draft"
									updated="3/12/2026, 10:21 AM"
								/>
							</div>
							<CatalogueCard
								actions={
									<>
										<Btn>View Catalogue</Btn>
										<Btn variant="outline">
											<ChartColumn />
											Analytics
										</Btn>
									</>
								}
								created="3/2/2026, 09:14 AM"
								name="Brightside Cafe Menu"
								status="Active"
								updated="3/14/2026, 04:02 PM"
							/>
							<CatalogueCard
								actions={
									<>
										<Btn>Continue Editing</Btn>
										<Btn variant="outline">
											<Rocket />
											Publish Catalogue
										</Btn>
									</>
								}
								created="1/8/2026, 08:05 AM"
								name="Winter Drinks"
								status="Inactive"
								updated="2/1/2026, 01:37 PM"
							/>
						</div>

						<div className="mt-9">
							<SectionTitle icon={Mail}>Newsletter Subscribers</SectionTitle>
						</div>
						<div className="mt-4">
							<NewsletterCard />
						</div>
					</Panel>
				</div>
				<div className="absolute bottom-8 right-8">
					<span className="relative grid h-[60px] w-[60px] place-items-center rounded-full bg-product-primary text-product-foreground shadow-[0_14px_30px_-8px_rgb(var(--product-primary-accent-rgb)/0.7),0_2px_6px_rgb(var(--product-foreground-rgb)/0.14)]">
						<SpotMarker n={6} />
						<Plus className="size-[26px]" strokeWidth={2.4} />
					</span>
				</div>
			</PageWash>
		</Screen>
	);
}
