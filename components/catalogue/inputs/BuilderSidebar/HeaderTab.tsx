import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Info } from "lucide-react";

const HeaderTab = () => {
	const { catalogue, updateCatalogue } = useCatalogueContext() || {};

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
		<div className="space-y-4 p-2">
			{/* Interaction Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold text-center mx-auto">Interaction</h3>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label htmlFor="header-cta-enabled" className="text-base">
								Header Action Link
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Enable a call-to-action button in the header.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
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
					<h3 className="text-lg font-bold text-center mx-auto">Icons</h3>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Label htmlFor="header-phone-icon" className="text-base">
								Phone Number Icon
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Show a phone icon in the header.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
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
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Show an email icon in the header.</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
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
	);
};

export default HeaderTab;
