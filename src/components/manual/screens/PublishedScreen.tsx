import { Search } from "lucide-react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	ItemPhoto,
	type ItemPhotoName,
} from "@/components/manual/screens/ItemPhoto";

/** A published catalogue on a phone, as a customer sees it. */
export function PublishedScreen() {
	return (
		<Screen
			caption="A published catalogue on a phone. This is what your customers open."
			height={450}
			legend={[
				"Your navbar, with your logo",
				"Your catalogue heading",
				"The search bar, if you switch it on",
				"A section heading customers can fold away",
				"One item, which opens larger when tapped",
			]}
			width={360}
		>
			<div className="absolute inset-0 overflow-hidden bg-[#fafafa]">
				<div className="relative mx-3 mt-3 flex h-12 items-center gap-2 rounded-[14px] border border-black/10 bg-white px-3 shadow-sm">
					<SpotMarker n={1} />
					<span className="font-product-heading text-[14px] font-extrabold text-black">
						Brightside
					</span>
					<span className="ml-auto rounded-full bg-black px-2.5 py-1 text-[11px] font-bold text-white">
						Book
					</span>
				</div>

				<p className="mt-6 px-4 text-center font-product-heading text-[25px] font-extrabold leading-[1.15] text-black">
					<span className="relative inline-block">
						<SpotMarker className="-left-6 top-1" n={2} />
						Brightside Cafe
					</span>
				</p>

				<div className="relative mx-4 mt-4 flex h-11 items-center gap-2 rounded-[14px] border border-black/10 bg-white px-3">
					<SpotMarker n={3} />
					<Search className="h-4 w-4 text-black/40" />
					<span className="text-[12.5px] text-black/40">
						Search items&#8230;
					</span>
				</div>

				<div className="relative mx-4 mt-4 flex items-center justify-between rounded-[12px] bg-white px-3 py-2.5 shadow-sm">
					<SpotMarker n={4} />
					<span className="text-[13.5px] font-extrabold text-black">
						Breakfast
					</span>
					<span className="text-[11px] text-black/40">&#9650;</span>
				</div>

				<div className="mx-4 mt-2.5 grid gap-2.5">
					{(
						[
							["Sourdough toast", "Thick cut, salted butter", "4.50", "toast"],
							["Baked eggs", "Tomato, feta and chilli oil", "7.00", "eggs"],
						] as [string, string, string, ItemPhotoName][]
					).map(([name, description, price, photo], index) => (
						<div
							className="relative flex gap-2.5 rounded-[12px] bg-white p-2.5 shadow-sm"
							key={name}
						>
							{index === 0 ? <SpotMarker n={5} /> : null}
							<ItemPhoto
								className="h-14 w-14 flex-none rounded-[9px]"
								name={photo}
							/>
							<span className="min-w-0 flex-1">
								<span className="block text-[12.5px] font-bold text-black">
									{name}
								</span>
								<span className="block text-[11px] leading-[1.4] text-black/55">
									{description}
								</span>
								<span className="mt-1 block text-[12px] font-bold text-black">
									&#8364;{price}
								</span>
							</span>
						</div>
					))}
				</div>
			</div>
		</Screen>
	);
}
