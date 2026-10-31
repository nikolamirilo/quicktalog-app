import {
	type SectionKind,
	sectionKinds,
} from "@/components/manual/sectionKinds";
import { cn } from "@/lib/ui/cn";

const legend: { kind: SectionKind; meaning: string }[] = [
	{ kind: "steps", meaning: "Do this, in this order" },
	{ kind: "opts", meaning: "Every setting on the screen" },
	{ kind: "rules", meaning: "What the product allows" },
	{ kind: "example", meaning: "A worked example to copy" },
	{ kind: "risk", meaning: "Careful: this cannot be undone" },
	{ kind: "info", meaning: "How something works" },
	{ kind: "fix", meaning: "A message and what to do about it" },
];

/** The colour key for section headings, shown once on the welcome page. */
export function SectionLegend() {
	return (
		<ul className="grid gap-2 sm:grid-cols-2">
			{legend.map(({ kind, meaning }) => {
				const { icon: Icon, tile } = sectionKinds[kind];
				return (
					<li className="flex items-center gap-2.5" key={kind}>
						<span
							aria-hidden="true"
							className={cn(
								"grid h-[26px] w-[26px] flex-none place-items-center rounded-[8px] [&_svg]:h-[14px] [&_svg]:w-[14px]",
								tile,
							)}
						>
							<Icon />
						</span>
						<span className="text-[14.5px] text-product-foreground-accent">
							{meaning}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
