import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { PricingPlan } from "@quicktalog/common";
import { Info } from "lucide-react";
import LimitsOverlay from "./LimitsOverlay";

const HeaderTab = ({ plan }: { plan: PricingPlan }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};
	const hasBranding = plan?.features?.branding;

	if (!catalogue || !updateCatalogue) return null;

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

	return (
		<div
			className={`relative w-full ${!hasBranding ? "h-[calc(100vh-250px)] sm:h-[calc(100dvh-200px)] overflow-hidden" : "h-full"}`}
		>
			{!hasBranding && <LimitsOverlay size="lg" />}
			<div
				className={`space-y-4 p-2 ${!hasBranding ? "opacity-30 pointer-events-none select-none blur-[1px]" : ""}`}
			>
				{/* Logo Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Logo Configuration</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								side="top"
								className="z-[2000] w-[200px] p-3 text-sm"
							>
								<p>Configure the size of the logo in your header.</p>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-4">
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<Label className="text-base">Size</Label>
								<span className="text-sm text-muted-foreground">
									{catalogue.header?.logoSize?.width || 160}px
								</span>
							</div>
							<Slider
								min={20}
								max={300}
								step={2}
								value={[catalogue.header?.logoSize?.width || 160]}
								onValueChange={(val) =>
									handleChange("header.logoSize.width", val[0])
								}
							/>
						</div>
					</div>
				</div>

				<div className="w-full h-[1px] bg-border" />

				{/* Interaction Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Interaction</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								side="top"
								className="z-[2000] w-[200px] p-3 text-sm"
							>
								<p>Manage the call-to-action button in your header.</p>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Label htmlFor="header-cta-enabled" className="text-base">
									Header Action Link
								</Label>
								<Popover>
									<PopoverTrigger type="button" className="inline-flex">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent
										side="top"
										className="z-[2000] w-[200px] p-3 text-sm"
									>
										<p>Enable a call-to-action button in the header.</p>
									</PopoverContent>
								</Popover>
							</div>
							<Switch
								id="header-cta-enabled"
								checked={catalogue.header?.cta?.isEnabled || false}
								onCheckedChange={(checked) =>
									handleChange("header.cta.isEnabled", checked)
								}
								className="data-[state=checked]:bg-product-primary"
							/>
						</div>

						{catalogue.header?.cta?.isEnabled && (
							<>
								<div className="space-y-2">
									<Input
										placeholder="Label (e.g. Contact Us)"
										value={catalogue.header?.cta?.label || ""}
										onChange={(e) =>
											handleChange("header.cta.label", e.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<Input
										placeholder="URL (e.g. https://mywebsite.com/contact)"
										value={catalogue.header?.cta?.url || ""}
										onChange={(e) =>
											handleChange("header.cta.url", e.target.value)
										}
									/>
								</div>
							</>
						)}
					</div>
				</div>

				<div className="w-full h-[1px] bg-border" />

				{/* Icons Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold">Icons</h3>
						<Popover>
							<PopoverTrigger type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								side="top"
								className="z-[2000] w-[200px] p-3 text-sm"
							>
								<p>Toggle display of contact icons in your header.</p>
							</PopoverContent>
						</Popover>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Label htmlFor="header-phone-icon" className="text-base">
									Phone Number Icon
								</Label>
								<Popover>
									<PopoverTrigger type="button" className="inline-flex">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent
										side="top"
										className="z-[2000] w-[200px] p-3 text-sm"
									>
										<p>Show a phone icon in the header.</p>
									</PopoverContent>
								</Popover>
							</div>
							<Switch
								id="header-phone-icon"
								checked={catalogue.header?.phoneCta || false}
								onCheckedChange={(checked) =>
									handleChange("header.phoneCta", checked)
								}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Label htmlFor="header-email-icon" className="text-base">
									Email Icon
								</Label>
								<Popover>
									<PopoverTrigger type="button" className="inline-flex">
										<Info className="h-4 w-4 text-muted-foreground" />
									</PopoverTrigger>
									<PopoverContent
										side="top"
										className="z-[2000] w-[200px] p-3 text-sm"
									>
										<p>Show an email icon in the header.</p>
									</PopoverContent>
								</Popover>
							</div>
							<Switch
								id="header-email-icon"
								checked={catalogue.header?.emailCta || false}
								onCheckedChange={(checked) =>
									handleChange("header.emailCta", checked)
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default HeaderTab;
