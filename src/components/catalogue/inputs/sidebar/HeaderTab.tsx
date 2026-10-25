import { PricingPlan } from "@quicktalog/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { cn } from "@/lib/ui/cn";
import { ArrowRight, Droplet } from "lucide-react";
import LimitsOverlay from "./LimitsOverlay";
import {
	PANEL_TAB_ROOT,
	PanelSection,
	SliderField,
	SwitchField,
} from "./panel";

const HeaderTab = ({
	plan,
	onOpenGlass,
}: {
	plan: PricingPlan;
	/** Switches the panel to Appearance and scrolls to the glass settings. */
	onOpenGlass: () => void;
}) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const hasBranding = plan?.features?.branding;

	if (!catalogue || !updateCatalogue) return null;

	const isCustom = catalogue.header?.type !== "default";

	const handleChange = (field: string, value: any) => {
		if (field.startsWith("header.cta.")) {
			const key = field.split(".")[2];
			updateCatalogue({
				header: {
					...catalogue.header,
					cta: {
						...catalogue.header.cta,
						[key]: value,
					},
				},
			});
		} else if (field.startsWith("header.logoSize.")) {
			const key = field.split(".")[2];
			const currentSize = catalogue.header?.logoSize || {
				width: 120,
				height: 40,
			};
			updateCatalogue({
				header: {
					...catalogue.header,
					logoSize: {
						...currentSize,
						[key]: value,
					},
				},
			});
		} else if (field.startsWith("header.")) {
			const key = field.split(".")[1];
			updateCatalogue({
				header: {
					...catalogue.header,
					[key]: value,
				},
			});
		}
	};

	const logoWidth = catalogue.header?.logoSize?.width || 160;

	return (
		<div
			className={cn(
				"relative w-full",
				PANEL_TAB_ROOT,
				!hasBranding &&
					"h-[calc(100dvh-250px)] overflow-hidden sm:h-[calc(100dvh-200px)]",
			)}
		>
			{!hasBranding && <LimitsOverlay size="lg" type="branding" />}
			<div
				className={cn(
					"space-y-4",
					!hasBranding && "pointer-events-none select-none opacity-30",
				)}
				inert={!hasBranding || undefined}
			>
				<PanelSection
					action={
						<Switch
							aria-describedby="header-type-hint"
							aria-label="Customize header"
							checked={isCustom}
							id="type"
							onCheckedChange={(checked) => {
								handleChange("header.type", checked ? "custom" : "default");
							}}
						/>
					}
					description={
						<span id="header-type-hint">
							{isCustom
								? "Your settings below are used for the header."
								: "Using the default header. Turn this on to change it."}
						</span>
					}
					title="Customize header"
				/>

				<PanelSection
					description="The header floats above the catalogue and stays at the top while visitors scroll."
					isNew
					title="Floating navbar"
				>
					<p className="flex gap-2 rounded-xl border border-product-border bg-product-background-hero px-3 py-2 text-[13px] leading-snug text-product-foreground-accent">
						<Droplet
							aria-hidden="true"
							className="mt-px h-4 w-4 shrink-0 text-product-primary-ink"
						/>
						<span>
							How see-through it is comes from{" "}
							<b className="font-semibold text-product-foreground">
								Appearance › Glass effect
							</b>
							. On phones the icons and button move into a menu.
						</span>
					</p>
					<button
						className="inline-flex items-center gap-1.5 border-b-[1.5px] border-product-primary/70 pb-px text-[13px] font-semibold text-product-primary-ink hover:text-product-foreground"
						onClick={onOpenGlass}
						type="button"
					>
						Open glass settings
						<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
					</button>
				</PanelSection>

				<div
					className={cn(
						"space-y-4",
						!isCustom && "pointer-events-none select-none opacity-50",
					)}
					inert={!isCustom || undefined}
				>
					<PanelSection
						info="Configure the size of the logo in your header."
						title="Logo size"
					>
						<SliderField
							label="Logo width"
							max={300}
							min={20}
							onValueChange={(value) =>
								handleChange("header.logoSize.width", value)
							}
							step={2}
							value={logoWidth}
							valueText={`${logoWidth}px`}
						/>
						<p className="-mt-2.5 text-[12.5px] leading-snug text-product-muted">
							In the floating navbar the logo stops growing at 44 px tall.
						</p>
					</PanelSection>

					<PanelSection
						info="Manage the call-to-action button in your header."
						title="Interaction"
					>
						<SwitchField
							checked={catalogue.header?.cta?.isEnabled || false}
							id="header-cta-enabled"
							info="Enable a call-to-action button in the header."
							label="Header action link"
							onCheckedChange={(checked) =>
								handleChange("header.cta.isEnabled", checked)
							}
						/>

						{catalogue.header?.cta?.isEnabled && (
							<div className="space-y-4 border-t border-product-border pt-4">
								<div className="space-y-2">
									<Label htmlFor="header-cta-label">Button label</Label>
									<Input
										id="header-cta-label"
										onChange={(e) =>
											handleChange("header.cta.label", e.target.value)
										}
										placeholder="e.g. Contact Us"
										value={catalogue.header?.cta?.label || ""}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="header-cta-url">Button link</Label>
									<Input
										id="header-cta-url"
										inputMode="url"
										onChange={(e) =>
											handleChange("header.cta.url", e.target.value)
										}
										placeholder="e.g. https://mywebsite.com/contact"
										value={catalogue.header?.cta?.url || ""}
									/>
								</div>
							</div>
						)}
					</PanelSection>

					<PanelSection
						info="Toggle display of contact icons in your header."
						title="Icons"
					>
						<div className="-my-2 divide-y divide-product-border">
							<SwitchField
								checked={catalogue.header?.phoneCta || false}
								className="py-2"
								hint="Show a phone icon in the header."
								id="header-phone-icon"
								label="Phone number icon"
								onCheckedChange={(checked) =>
									handleChange("header.phoneCta", checked)
								}
							/>
							<SwitchField
								checked={catalogue.header?.emailCta || false}
								className="py-2"
								hint="Show an email icon in the header."
								id="header-email-icon"
								label="Email icon"
								onCheckedChange={(checked) =>
									handleChange("header.emailCta", checked)
								}
							/>
						</div>
					</PanelSection>
				</div>
			</div>
		</div>
	);
};

export default HeaderTab;
