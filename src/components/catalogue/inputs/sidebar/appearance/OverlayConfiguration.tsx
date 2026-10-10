"use client";

import { SwitchField } from "@/components/catalogue/inputs/sidebar/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OverlayConfigurationProps {
	currentOverlay: Record<string, any>;
	onOverlayChange: (field: string, value: any) => void;
}

const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;
const ONLY_EMOJI = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})*$/u;
const MAX_EMOJIS = 3;

/** Emoji count, not string length: one emoji can be several code units. */
const countEmojis = (value: string) =>
	[...value].filter((char) => EMOJI.test(char)).length;

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
					<Input
						aria-describedby="appearance-overlay-icon-hint"
						id="appearance-overlay-icon"
						onChange={(e) => {
							const value = e.target.value;
							if (value === "" || ONLY_EMOJI.test(value)) {
								if (countEmojis(value) <= MAX_EMOJIS) {
									onOverlayChange("icon", value);
								}
							}
						}}
						placeholder="e.g. 🎁"
						value={icon}
					/>
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
