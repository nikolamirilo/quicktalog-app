import { ChevronDown, Linkedin, Mail, Menu, Search } from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	ItemPhoto,
	type ItemPhotoName,
} from "@/components/manual/screens/ItemPhoto";

/**
 * A published catalogue at a real phone width, in the shipped monochrome theme
 * with no custom background and no glass. 390px matters: three separate
 * `min-width: 768px` blocks in catalogue-chrome.css change what is on screen,
 * so the navbar here is logo plus burger only, and the search field has no "/"
 * badge. The stage is 392 wide, not 390, because its frame has a 1px border on
 * each side: that is what leaves a 390px page inside. Everything below is drawn
 * from the real components rather than from the kit, which holds product chrome
 * (amber tokens, 1240px navbar) that never appears on a customer-facing page.
 */

/** Card and search-bar shadow: the `low` preset, the shipped default. */
const SOFT_SHADOW =
	"0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";

/** The section header fill, straight from `--catalogue-category-gradient`. */
const CATEGORY_GRADIENT = "linear-gradient(135deg, #ffffff 0%, #f3f3f3 100%)";

/**
 * The Quicktalog wordmark: an amber magnifier and the name in dark slate,
 * measured off public/images/brand/logo.svg and drawn on that file's 1064 by
 * 387 artboard. The navbar letterboxes it to 121 by 44, the footer draws it at
 * its natural 160 by 58.
 */
function QuicktalogMark({ width }: { width: number }) {
	return (
		<svg
			aria-hidden="true"
			className="block flex-none"
			height={width * 0.3637}
			viewBox="0 0 1064 387"
			width={width}
		>
			<title>Quicktalog</title>
			<circle
				cx="161"
				cy="161"
				fill="none"
				r="80"
				stroke="#FFB500"
				strokeWidth="46"
			/>
			<line
				stroke="#FFB500"
				strokeLinecap="round"
				strokeWidth="46"
				x1="216"
				x2="292"
				y1="216"
				y2="306"
			/>
			<text
				fill="#2C3A3C"
				fontSize="134"
				fontWeight="800"
				lengthAdjust="spacingAndGlyphs"
				textLength="698"
				x="297"
				y="238"
			>
				Quicktalog
			</text>
		</svg>
	);
}

/**
 * A section bar: 54px tall, 12px radius from `--border-radius` rather than the
 * `rounded-2xl` class it overrides, and no shadow at all. Open, the title
 * carries a full-width 2px underline and the chevron is turned over.
 */
function SectionBar({ open, title }: { open?: boolean; title: string }) {
	return (
		<div
			className="flex w-full items-center justify-between gap-2 overflow-hidden rounded-[12px] border border-[#e0e0e0] px-3 py-3"
			style={{ background: CATEGORY_GRADIENT }}
		>
			<span className="relative inline-block text-[20px] font-bold leading-7 text-black">
				{title}
				<span
					className="absolute -bottom-1 left-0 h-0.5 rounded-full bg-black"
					style={{ width: open ? "100%" : "0%" }}
				/>
			</span>
			<span className="ml-auto grid h-7 w-7 flex-none place-items-center rounded-full bg-black/10">
				<ChevronDown
					className="h-4 w-4 text-black"
					style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
				/>
			</span>
		</div>
	);
}

type CafeItem = {
	description: string;
	name: string;
	photo: ItemPhotoName;
	price: string;
};

/**
 * One `variant_1` card: a flex row at least 110px tall, the photo taking 40%
 * of the width and stretching to the full height, then a 6px padded text
 * column whose price is pinned to the bottom. The title is 18px regular and
 * the description 14px, both from the inline font-size variables that beat the
 * `text-[13px]` and `text-[11px]` classes the card also carries.
 */
function ItemCard({ item, marked }: { item: CafeItem; marked?: boolean }) {
	return (
		<div className="relative">
			{marked ? <SpotMarker n={5} /> : null}
			<article
				className="flex min-h-[110px] max-w-full overflow-hidden rounded-[12px] border border-[#e0e0e0] bg-white"
				style={{ boxShadow: SOFT_SHADOW }}
			>
				{/* The panel stretches to the card's height and the photo fills it
				    from the inside, so nothing here makes the card taller. */}
				<span className="relative w-[40%] min-w-[90px] flex-shrink-0">
					<ItemPhoto
						className="absolute inset-0 h-full w-full"
						name={item.photo}
					/>
				</span>
				<div className="flex min-w-0 flex-1 flex-col gap-1 p-1.5">
					<h3 className="truncate text-[18px] font-normal leading-tight text-black">
						{item.name}
					</h3>
					<p className="line-clamp-3 text-[14px] leading-[1.15] text-[#333333]">
						{item.description}
					</p>
					<div className="mt-auto flex flex-col items-start">
						<span className="relative text-[13px] font-semibold text-black">
							{marked ? (
								<SpotMarker className="-right-7 -top-1 left-auto" n={6} />
							) : null}
							{item.price} &euro;
						</span>
					</div>
				</div>
			</article>
		</div>
	);
}

const BREAKFAST: CafeItem[] = [
	{
		description:
			"Thick cut sourdough, salted butter and a spoon of our own berry jam. Toasted to order.",
		name: "Sourdough toast",
		photo: "toast",
		price: "4.50",
	},
	{
		description:
			"Two eggs baked in spiced tomato with feta, chilli oil and a slice of sourdough on the side.",
		name: "Baked eggs",
		photo: "eggs",
		price: "7.20",
	},
	{
		description:
			"Toasted oats, almonds and pumpkin seeds with thick yoghurt and whatever berries are good.",
		name: "Honey granola",
		photo: "granola",
		price: "5.60",
	},
	{
		description:
			"Rolled with cinnamon and brown sugar, baked through the morning and served warm.",
		name: "Cinnamon bun",
		photo: "bun",
		price: "3.80",
	},
];

/** A published catalogue on a phone, as a customer sees it. */
export function PublishedScreen() {
	return (
		<Screen
			caption="A published catalogue on a 390px phone, drawn from the top of the page down to the footer's brand block. Customers can fold a section away, tap an item for a larger view, and search if you switched the search bar on."
			height={1280}
			legend={[
				"The navbar sticks below the top edge as customers scroll. On a phone it holds your logo and the menu button only; the email icon and the Create Your Catalog button move into the menu and come back on wider screens.",
				"Your heading, centred at 30px in normal weight. It turns bold only where you made the words bold yourself.",
				"The search bar appears only if you switched it on. The slash key badge next to it is hidden on phones.",
				"Tap a section bar to fold the section away. Open, the title is underlined and the chevron points up; folded, like Coffee & drinks below it, the chevron points down and the items are gone.",
				"The picture fills 40 percent of the card and stretches to the card's full height, so a tall or wide photo is cropped rather than boxed in.",
				"The price reads amount first, then the currency symbol, at 13px. It is the only bold text in the card.",
			]}
			title="https://www.quicktalog.app/catalogues/brightside-cafe"
			width={392}
		>
			{/* The page flows from the top and runs past the bottom edge, the way a
			    phone shows it: the footer carries on below the cut. */}
			<div
				className="absolute inset-0 overflow-hidden bg-[#f3f3f3] leading-normal text-black"
				style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
			>
				{/* The sticky pill: 366 by 64, 12px clear of each edge, 9px down. */}
				<header className="px-3 pt-[9px]">
					<nav className="relative flex h-16 items-center justify-between gap-3 rounded-full border border-black/[0.09] bg-white pl-[18px] pr-2.5 shadow-[0_1px_2px_rgba(22,20,15,0.04)]">
						<SpotMarker n={1} />
						<span className="flex h-11 w-[121px] flex-none items-center">
							<QuicktalogMark width={121} />
						</span>
						<span className="grid h-11 w-11 flex-none place-items-center rounded-full text-black">
							<Menu className="h-[22px] w-[22px]" />
						</span>
					</nav>
				</header>

				<main className="flex flex-col">
					{/* No top padding on a phone: `pt-16` only starts at 768px. */}
					<section className="flex w-full flex-shrink-0 flex-col items-center px-4 text-center">
						<div className="mb-4 w-full">
							<div className="mt-8 flex w-full flex-col items-center">
								<div className="mx-auto w-full max-w-[94%]">
									<h1 className="mx-auto w-full max-w-[98%] break-words pb-1 text-center text-[30px] font-normal leading-9 text-black drop-shadow-sm">
										<span className="relative inline-block">
											<SpotMarker className="-left-7 top-1.5" n={2} />
											Brightside Cafe
										</span>
									</h1>
								</div>
							</div>
						</div>
					</section>

					{/* 16px gutters: the content column is 358 wide, not the full 390. */}
					<section className="w-full pb-8">
						<div className="mx-auto px-4">
							<div className="mb-7 mt-1 grid w-full justify-items-center gap-2.5">
								<div
									className="relative flex h-[52px] w-full items-center rounded-full border border-[#e0e0e0] bg-white"
									style={{ boxShadow: SOFT_SHADOW }}
								>
									<SpotMarker n={3} />
									<Search
										aria-hidden="true"
										className="absolute left-[18px] h-5 w-5 text-[rgba(26,26,26,0.62)]"
									/>
									<span className="pl-[50px] pr-14 text-[16px] text-[rgba(26,26,26,0.52)]">
										Search items…
									</span>
								</div>
								{/* The result count sits here and is empty until someone types. */}
								<span aria-hidden="true" className="text-[14px] leading-5" />
							</div>

							<section className="mb-5">
								<div className="relative">
									<SpotMarker n={4} />
									<SectionBar open title="Breakfast" />
								</div>
								<div className="mb-2 mt-4 overflow-hidden">
									<div className="my-1 grid grid-cols-1 gap-3 px-1">
										{BREAKFAST.map((item, index) => (
											<ItemCard
												item={item}
												key={item.name}
												marked={index === 0}
											/>
										))}
									</div>
								</div>
							</section>

							<section className="mb-5">
								<SectionBar title={"Coffee & drinks"} />
							</section>
						</div>
					</section>
				</main>

				{/* The Quicktalog footer. Below the brand block it carries Contact &
				    Support, Platform, Create your own and the legal line. */}
				<footer className="bg-white px-5 pb-24 pt-16 text-black">
					<QuicktalogMark width={160} />
					<p className="mt-4 max-w-[320px] text-[16.5px] leading-[1.6] text-[rgba(0,0,0,0.74)]">
						Empowering businesses to go digital with interactive catalogues.
					</p>
					<div className="mt-5 flex flex-wrap gap-3">
						<span className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#e0e0e0] bg-white text-[rgba(26,26,26,0.8)]">
							<Linkedin className="h-[21px] w-[21px]" />
						</span>
						<span className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#e0e0e0] bg-white text-[rgba(26,26,26,0.8)]">
							<Mail className="h-[21px] w-[21px]" />
						</span>
					</div>
				</footer>
			</div>
		</Screen>
	);
}
