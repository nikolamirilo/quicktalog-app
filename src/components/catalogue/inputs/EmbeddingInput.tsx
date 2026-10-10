import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmbeddingBlock } from "@quicktalog/common";
import {
	Calendar,
	CreditCard,
	Image as ImageIcon,
	MapPin,
	Share2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/ui/cn";
import BlockNameInput from "./BlockNameInput";

interface EmbeddingInputProps {
	value: Partial<EmbeddingBlock>;
	onChange: (value: Partial<EmbeddingBlock>) => void;
}

const PRESETS = [
	{
		id: "maps",
		label: "Maps",
		icon: MapPin,
		placeholder:
			"Go to Google Maps, click Share > Embed a map, and paste the <iframe> code here.",
	},
	{
		id: "booking",
		label: "Booking",
		icon: Calendar,
		placeholder:
			"Copy the embed code from Calendly, OpenTable, or your booking provider and paste it here.",
	},
	{
		id: "media",
		label: "Media",
		icon: ImageIcon,
		placeholder:
			"Paste the embed code from YouTube, Vimeo, Spotify, or other media platforms.",
	},
	{
		id: "commerce",
		label: "Commerce",
		icon: CreditCard,
		placeholder:
			"Paste payment buttons or product embeds from Stripe, Shopify, or PayPal.",
	},
	{
		id: "social",
		label: "Social Media",
		icon: Share2,
		placeholder:
			"Go to Instagram, TikTok, or Twitter, click Share > Embed, and paste the code here. Example: TikTok videos and Instagram posts.",
	},
];

const EmbeddingInput = ({ value, onChange }: EmbeddingInputProps) => {
	const [activePreset, setActivePreset] = useState(PRESETS[0]);

	return (
		<div className="space-y-4 font-product-body">
			<BlockNameInput
				onChange={(name) => onChange({ ...value, name })}
				type="embedding"
				value={value.name || ""}
			/>

			<fieldset className="space-y-3">
				<legend className="mb-3 text-[13.5px] font-semibold leading-none text-product-foreground">
					What would you like to embed?
				</legend>
				<div className="flex flex-wrap gap-2">
					{PRESETS.map((preset) => {
						const Icon = preset.icon;
						const isActive = activePreset.id === preset.id;
						return (
							<button
								aria-pressed={isActive}
								className={cn(
									"flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors",
									isActive
										? "border-product-primary-accent bg-product-primary-soft text-product-foreground"
										: "border-product-border bg-product-card text-product-foreground-accent hover:border-product-border-strong hover:text-product-foreground",
								)}
								key={preset.id}
								onClick={() => setActivePreset(preset)}
								type="button"
							>
								<Icon aria-hidden="true" className="h-4 w-4" />
								<span>{preset.label}</span>
							</button>
						);
					})}
				</div>
			</fieldset>

			<div className="space-y-2">
				<Label htmlFor="embedding-code">
					Embed code
					<span aria-hidden="true" className="ml-1 text-product-error">
						*
					</span>
				</Label>
				<Textarea
					className="min-h-[180px] resize-y font-mono text-xs md:text-xs"
					id="embedding-code"
					onChange={(e) => onChange({ ...value, code: e.target.value })}
					placeholder={activePreset.placeholder}
					required
					spellCheck={false}
					value={value.code || ""}
				/>
			</div>
		</div>
	);
};

export default EmbeddingInput;
