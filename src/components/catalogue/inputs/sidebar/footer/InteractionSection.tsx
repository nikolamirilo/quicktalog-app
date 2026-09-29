import { Catalogue, PricingPlan } from "@quicktalog/common";
import { Lock } from "lucide-react";
import {
	PanelSection,
	SwitchField,
} from "@/components/catalogue/inputs/sidebar/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/ui/cn";

interface InteractionSectionProps {
	catalogue: Catalogue;
	handleChange: (field: string, value: any) => void;
	plan: PricingPlan;
}

const InteractionSection = ({
	catalogue,
	handleChange,
	plan,
}: InteractionSectionProps) => {
	const hasNewsletter = !!plan?.features?.newsletter;
	return (
		<PanelSection
			info="Set up calls to action and newsletter signup."
			title="Interaction"
		>
			<SwitchField
				checked={catalogue.footer?.cta?.isEnabled || false}
				id="footer-cta-enabled"
				info="Enable a call-to-action button in the footer."
				label="Footer action link"
				onCheckedChange={(checked) =>
					handleChange("footer.cta.isEnabled", checked)
				}
			/>

			{catalogue.footer?.cta?.isEnabled && (
				<div className="space-y-4 border-t border-product-border pt-4">
					<div className="space-y-2">
						<Label htmlFor="footer-cta-label">Button label</Label>
						<Input
							id="footer-cta-label"
							onChange={(e) => handleChange("footer.cta.label", e.target.value)}
							placeholder="e.g. Contact Us"
							value={catalogue.footer?.cta?.label || ""}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="footer-cta-url">Button link</Label>
						<Input
							id="footer-cta-url"
							inputMode="url"
							onChange={(e) => handleChange("footer.cta.url", e.target.value)}
							placeholder="e.g. https://mywebsite.com/contact"
							value={catalogue.footer?.cta?.url || ""}
						/>
					</div>
				</div>
			)}

			<div className="border-t border-product-border pt-2">
				<div
					className={cn(!hasNewsletter && "pointer-events-none opacity-40")}
					inert={!hasNewsletter || undefined}
				>
					<SwitchField
						checked={catalogue.footer?.newsletter || false}
						id="footer-newsletter"
						info="Enable newsletter subscription form in the footer."
						label="Newsletter"
						onCheckedChange={(checked) =>
							handleChange("footer.newsletter", checked)
						}
					/>
				</div>
				{!hasNewsletter && (
					<p className="mt-1 flex items-center gap-1.5 rounded-xl bg-product-primary-soft px-3 py-2 text-[12.5px] font-semibold text-product-primary-ink">
						<Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
						Upgrade your plan for the newsletter form.
					</p>
				)}
			</div>
		</PanelSection>
	);
};

export default InteractionSection;
