import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Catalogue } from "@quicktalog/common";
import { Info } from "lucide-react";

interface BusinessInfoSectionProps {
	catalogue: Catalogue;
	handleChange: (field: string, value: any) => void;
}

const BusinessInfoSection = ({
	catalogue,
	handleChange,
}: BusinessInfoSectionProps) => {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<h3 className="text-lg font-bold">Business Information</h3>
				<Popover>
					<PopoverTrigger type="button">
						<Info className="h-4 w-4 text-muted-foreground" />
					</PopoverTrigger>
					<PopoverContent className="z-[2000] w-[200px] p-3 text-sm" side="top">
						<p>Company details and legal links.</p>
					</PopoverContent>
				</Popover>
			</div>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label className="flex items-center gap-2">
						Legal Business Name
						<Popover>
							<PopoverTrigger className="inline-flex" type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Your officially registered business name.</p>
							</PopoverContent>
						</Popover>
					</Label>
					<Input
						onChange={(e) => handleChange("legal.legalName", e.target.value)}
						placeholder="e.g. Quicktalog Inc."
						value={catalogue.legal?.legalName || ""}
					/>
				</div>

				<div className="space-y-2">
					<Label className="flex items-center gap-2">
						Business Address
						<Popover>
							<PopoverTrigger className="inline-flex" type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Your physical business address.</p>
							</PopoverContent>
						</Popover>
					</Label>
					<Input
						onChange={(e) => handleChange("legal.address", e.target.value)}
						placeholder="e.g. 123 Main St, San Francisco, CA"
						value={catalogue.legal?.address || ""}
					/>
				</div>

				<div className="space-y-2">
					<Label className="flex items-center gap-2">
						Terms & Conditions Link
						<Popover>
							<PopoverTrigger className="inline-flex" type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Link to your terms and conditions page.</p>
							</PopoverContent>
						</Popover>
					</Label>
					<Input
						onChange={(e) =>
							handleChange("legal.termsAndConditions", e.target.value)
						}
						placeholder="e.g. https://mywebsite.com/terms"
						value={catalogue.legal?.termsAndConditions || ""}
					/>
				</div>

				<div className="space-y-2">
					<Label className="flex items-center gap-2">
						Privacy Policy Link
						<Popover>
							<PopoverTrigger className="inline-flex" type="button">
								<Info className="h-4 w-4 text-muted-foreground" />
							</PopoverTrigger>
							<PopoverContent
								className="z-[2000] w-[200px] p-3 text-sm"
								side="top"
							>
								<p>Link to your privacy policy page.</p>
							</PopoverContent>
						</Popover>
					</Label>
					<Input
						onChange={(e) =>
							handleChange("legal.privacyPolicy", e.target.value)
						}
						placeholder="e.g. https://mywebsite.com/privacy"
						value={catalogue.legal?.privacyPolicy || ""}
					/>
				</div>
			</div>
		</div>
	);
};

export default BusinessInfoSection;
