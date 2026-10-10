"use client";

import { useState } from "react";

import { Container } from "@/components/general/Container";
import { ShowcaseFrame } from "@/components/showcases/ShowcaseFrame";
import { ShowcaseList } from "@/components/showcases/ShowcaseList";
import {
	ShowcaseMobileFooter,
	ShowcaseMobileHeader,
} from "@/components/showcases/ShowcaseMobileControls";
import type { ShowcaseItem } from "@/constants/marketing";

/** Live catalogue viewer: list + browser frame on desktop, swipeable carousel on mobile. */
export function Showcases({ data }: { data: ShowcaseItem[] }) {
	const [activeIndex, setActiveIndex] = useState(0);
	const active = data[activeIndex];

	const select = (index: number) =>
		setActiveIndex((index + data.length) % data.length);
	const next = () => select(activeIndex + 1);
	const previous = () => select(activeIndex - 1);

	return (
		<Container as="section" className="pb-[72px] pt-2">
			<h2 className="sr-only">Live catalogue examples</h2>
			<ShowcaseMobileHeader
				activeIndex={activeIndex}
				onNext={next}
				onPrevious={previous}
				title={active.title}
			/>

			<div className="flex flex-col gap-4 lg:h-[660px] lg:flex-row">
				<ShowcaseList
					activeIndex={activeIndex}
					items={data}
					onSelect={select}
				/>
				<ShowcaseFrame item={active} onNext={next} onPrevious={previous} />
			</div>

			<ShowcaseMobileFooter
				activeIndex={activeIndex}
				items={data}
				onSelect={select}
			/>
		</Container>
	);
}
