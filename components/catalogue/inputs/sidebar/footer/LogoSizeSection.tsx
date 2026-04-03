import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Catalogue } from "@quicktalog/common";
import { Info } from "lucide-react";

interface LogoSizeSectionProps {
	catalogue: Catalogue;
	handleChange: (field: string, value: any) => void;
}

const LogoSizeSection = ({ catalogue, handleChange }: LogoSizeSectionProps) => {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<h3 className="text-lg font-bold">Footer Logo Size</h3>
				<Popover>
					<PopoverTrigger type="button">
						<Info className="h-4 w-4 text-muted-foreground" />
					</PopoverTrigger>
					<PopoverContent className="z-[2000] w-[200px] p-3 text-sm" side="top">
						<p>Configure the size of the logo in your footer.</p>
					</PopoverContent>
				</Popover>
			</div>

			<div className="space-y-4">
				<div className="space-y-3">
					<div className="flex justify-end items-center">
						<span className="text-sm text-muted-foreground">
							{catalogue.footer?.logoSize?.width || 160}px
						</span>
					</div>
					<Slider
						max={400}
						min={20}
						onValueChange={(val) =>
							handleChange("footer.logoSize.width", val[0])
						}
						step={2}
						value={[catalogue.footer?.logoSize?.width || 160]}
					/>
				</div>
			</div>
		</div>
	);
};

export default LogoSizeSection;
