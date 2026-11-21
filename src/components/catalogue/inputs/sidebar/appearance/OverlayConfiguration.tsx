"use client";

import { SwitchField } from "@/components/catalogue/inputs/sidebar/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countEmojis, isOnlyEmojis } from "@/lib/format/emoji";
import { EmojiPicker } from "./EmojiPicker";

const MAX_EMOJIS = 3;

interface OverlayConfigurationProps {
	currentOverlay: Record<string, any>;
	onOverlayChange: (field: string, value: any) => void;
}

const OverlayConfiguration = ({
	currentOverlay,
	onOverlayChange,
}: OverlayConfigurationProps) => {
	const icon: string = currentOverlay.icon || "";
	return (
		<div className="space-y-3">
			<SwitchField
				checked={currentOverlay.isEnabled || false}
				id="appearance-overlay-enabled"
				label="Enable overlay"
				onCheckedChange={(checked) => onOverlayChange("isEnabled", checked)}
			/>

			{currentOverlay.isEnabled && (
				<div className="space-y-2 border-t border-product-border pt-4">
					<Label htmlFor="appearance-overlay-icon">Overlay icon</Label>
					<div className="flex items-center gap-2">
						<Input
							aria-describedby="appearance-overlay-icon-hint"
							className="flex-1"
							id="appearance-overlay-icon"
							onChange={(e) => {
								const value = e.target.value;
								if (value === "" || isOnlyEmojis(value)) {
									if (countEmojis(value) <= MAX_EMOJIS) {
										onOverlayChange("icon", value);
									}
								}
							}}
							placeholder="e.g. 🎁"
							value={icon}
						/>
						<EmojiPicker
							label="Overlay icon"
							max={MAX_EMOJIS}
							onChange={(value) => onOverlayChange("icon", value)}
							value={icon}
						/>
					</div>
					<p
						className="text-[12.5px] text-product-muted"
						id="appearance-overlay-icon-hint"
					>
						Emojis only · {countEmojis(icon)}/{MAX_EMOJIS}
					</p>
				</div>
			)}
		</div>
	);
};

export default OverlayConfiguration;
