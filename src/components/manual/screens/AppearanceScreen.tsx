import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	EditorPanel,
	PanelSection,
	SliderRow,
} from "@/components/manual/screens/panel";
import { Select } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

const themes = [
	{ dot: "#000000", label: "Monochrome", tile: "#f3f3f3" },
	{ dot: "#7da2ff", label: "Elegant", tile: "#14151a" },
	{ dot: "#5c7453", label: "Organic", tile: "#f0ece1" },
	{ dot: "#a78bfa", label: "Modern", tile: "#1b1630" },
	{ dot: "#c9a227", label: "Luxury", tile: "#faf6ec" },
];

/** The Appearance tab: themes on top, then the four style controls. */
export function AppearanceScreen() {
	return (
		<Screen
			caption="The Appearance tab of the editor panel, where the theme and the shape of your catalogue are set."
			height={740}
			legend={[
				"A Custom tile, on Pro and above, for your own colours",
				"The seven ready-made themes",
				"Show the themes the grid hides at first",
				"Font, text size, corners and shadow",
			]}
			width={440}
		>
			<EditorPanel tab="Appearance">
				<div className="grid gap-2.5">
					<PanelSection title="Themes">
						<div className="grid grid-cols-3 gap-2">
							<div className="relative grid h-[76px] place-items-center rounded-[10px] border-[1.5px] border-dashed border-product-border-strong">
								<SpotMarker n={1} />
								<span className="h-5 w-5 rounded-full bg-[conic-gradient(#ff7a7a,#ffd166,#7bd389,#5bc0eb,#b388ff,#ff7a7a)]" />
								<span className="mt-1 text-[10.5px] font-semibold text-product-foreground-accent">
									Custom
								</span>
							</div>
							{themes.map((theme, index) => (
								<div
									className={cn(
										"relative grid h-[76px] place-items-center rounded-[10px] border",
										index === 0
											? "border-product-primary ring-2 ring-product-primary/40"
											: "border-product-border",
									)}
									key={theme.label}
									style={{ background: theme.tile }}
								>
									{index === 0 ? <SpotMarker n={2} /> : null}
									<span
										className="h-5 w-5 rounded-full"
										style={{ background: theme.dot }}
									/>
									<span
										className="mt-1 text-[10.5px] font-semibold"
										style={{ color: theme.dot }}
									>
										{theme.label}
									</span>
								</div>
							))}
						</div>
						<div className="relative mt-2 grid place-items-center">
							<SpotMarker n={3} />
							<span className="rounded-full border border-product-border-strong px-3 py-1 text-[11.5px] font-semibold text-product-foreground-accent">
								Show more themes
							</span>
						</div>
					</PanelSection>

					<div className="relative">
						<SpotMarker n={4} />
						<PanelSection title="Style">
							<div className="grid gap-3.5">
								<div>
									<p className="mb-1 text-[12.5px] font-semibold text-product-foreground">
										Font style
									</p>
									<Select value="Inter" />
								</div>
								<SliderRow
									fill={50}
									label="Content font size"
									marks={["Small", "Medium", "Large"]}
									value="Medium"
								/>
								<SliderRow fill={75} label="Corner radius" value="12px" />
								<SliderRow
									fill={33}
									label="Shadow"
									marks={["None", "High"]}
									value="Low"
								/>
							</div>
						</PanelSection>
					</div>
				</div>
			</EditorPanel>
		</Screen>
	);
}
