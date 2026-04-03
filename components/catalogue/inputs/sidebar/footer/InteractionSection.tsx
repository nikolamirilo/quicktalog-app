import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Catalogue, PricingPlan } from "@quicktalog/common";
import { Info, Lock } from "lucide-react";

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
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<h3 className="text-lg font-bold">Interaction</h3>
				<Popover>
					<PopoverTrigger type="button">
						<Info className="h-4 w-4 text-muted-foreground" />
					</PopoverTrigger>
					<PopoverContent className="z-[2000] w-[200px] p-3 text-sm" side="top">
						<p>Setup calls to action and newsletter signup.</p>
					</PopoverContent>
				</Popover>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Label className="text-base" htmlFor="footer-cta-enabled">
							Footer Action Link
						</Label>
						<Popover>
							<PopoverTrigger className="inline-flex" type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Enable a call-to-action button in the footer.</p>
							</PopoverContent>
						</Popover>
					</div>
					<Switch
						checked={catalogue.footer?.cta?.isEnabled || false}
						id="footer-cta-enabled"
						onCheckedChange={(checked) =>
							handleChange("footer.cta.isEnabled", checked)
						}
					/>
				</div>

				{catalogue.footer?.cta?.isEnabled && (
					<>
						<div className="space-y-2">
							<Input
								onChange={(e) =>
									handleChange("footer.cta.label", e.target.value)
								}
								placeholder="Label (e.g. Contact Us)"
								value={catalogue.footer?.cta?.label || ""}
							/>
						</div>
						<div className="space-y-2">
							<Input
								onChange={(e) => handleChange("footer.cta.url", e.target.value)}
								placeholder="URL (e.g. https://mywebsite.com/contact)"
								value={catalogue.footer?.cta?.url || ""}
							/>
						</div>
					</>
				)}

				<div className="relative w-full">
					{!plan?.features?.newsletter && (
						<div className="absolute inset-x-0 inset-y-[-10px] z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
							<p className="text-sm font-bold text-foreground flex items-center gap-2">
								<Lock className="w-4 h-4" /> Upgrade for Newsletter
							</p>
						</div>
					)}
					<div
						className={`flex items-center justify-between ${!plan?.features?.newsletter ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
					>
						<div className="flex items-center gap-2">
							<Label className="text-base" htmlFor="footer-newsletter">
								Newsletter
							</Label>
							<Popover>
								<PopoverTrigger className="inline-flex" type="button">
									<Info className="h-4 w-4 text-muted-foreground" />
								</PopoverTrigger>
								<PopoverContent
									className="z-[2000] w-[200px] p-3 text-sm"
									side="top"
								>
									<p>Enable newsletter subscription form in the footer.</p>
								</PopoverContent>
							</Popover>
						</div>
						<Switch
							checked={catalogue.footer?.newsletter || false}
							id="footer-newsletter"
							onCheckedChange={(checked) =>
								handleChange("footer.newsletter", checked)
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default InteractionSection;
