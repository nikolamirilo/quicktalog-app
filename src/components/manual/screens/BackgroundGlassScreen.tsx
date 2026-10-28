import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Toggle } from "@/components/manual/screens/kit";
import {
	EditorPanel,
	PanelSection,
	SliderRow,
} from "@/components/manual/screens/panel";
import { cn } from "@/lib/ui/cn";

const gradients = [
	"linear-gradient(140deg,#f6f1e9,#efe3cf)",
	"linear-gradient(140deg,#ffe9df,#ffd3c2)",
	"linear-gradient(140deg,#ffe3c7,#ffc9a6)",
	"linear-gradient(140deg,#e9f1e4,#d6e8cf)",
	"linear-gradient(140deg,#e3f0e8,#c9e4d6)",
	"linear-gradient(140deg,#e4f0f4,#cbe4ee)",
];

/** The Background and glass controls, both on Pro and above. */
export function BackgroundGlassScreen() {
	return (
		<Screen
			caption="Background and glass, which sit together in the Appearance tab on Pro plans and above."
			height={640}
			legend={[
				"Switch the background on",
				"Photo, gradient or a flat colour",
				"Twelve ready gradients, all of them light",
				"How strong the glass effect is",
				"Which surfaces it applies to",
			]}
			width={440}
		>
			<EditorPanel tab="Appearance">
				<div className="grid gap-2.5">
					<PanelSection title="Background">
						<div className="relative">
							<SpotMarker n={1} />
							<Toggle label="Customize background" on />
						</div>
						<div className="relative mt-3">
							<SpotMarker n={2} />
							<p className="mb-1.5 text-[12px] font-semibold text-product-foreground">
								Background type
							</p>
							<div className="grid grid-cols-3 gap-1.5">
								{["Photo", "Gradient", "Colour"].map((type) => (
									<span
										className={cn(
											"rounded-[9px] border py-1.5 text-center text-[11.5px] font-semibold",
											type === "Gradient"
												? "border-product-primary bg-product-primary-soft text-product-foreground"
												: "border-product-border text-product-foreground-accent",
										)}
										key={type}
									>
										{type}
									</span>
								))}
							</div>
						</div>
						<div className="relative mt-3 grid grid-cols-6 gap-1.5">
							<SpotMarker n={3} />
							{gradients.map((gradient, index) => (
								<span
									className={cn(
										"aspect-[4/3] rounded-[7px] border",
										index === 0
											? "border-product-primary ring-2 ring-product-primary/35"
											: "border-product-border",
									)}
									key={gradient}
									style={{ background: gradient }}
								/>
							))}
						</div>
					</PanelSection>

					<PanelSection title="Style">
						<div className="relative">
							<SpotMarker n={4} />
							<SliderRow
								fill={66}
								label="Glass effect"
								marks={["Off", "Clear", "Semi", "Frosted"]}
								value="Semi-frosted"
							/>
						</div>
						<div className="relative mt-3">
							<SpotMarker n={5} />
							<p className="mb-1.5 text-[12px] font-semibold text-product-foreground">
								Use glass on
							</p>
							<div className="flex flex-wrap gap-1.5">
								{["Navbar", "Search bar", "Section headers", "Item cards"].map(
									(surface) => (
										<span
											className="rounded-full border border-product-primary bg-product-primary-soft px-2.5 py-1 text-[11px] font-semibold text-product-foreground"
											key={surface}
										>
											{surface}
										</span>
									),
								)}
							</div>
						</div>
						<div className="mt-3 grid gap-3">
							<SliderRow fill={45} label="Opacity" value="55%" />
							<SliderRow fill={20} label="Frost" value="8px" />
						</div>
					</PanelSection>
				</div>
			</EditorPanel>
		</Screen>
	);
}
