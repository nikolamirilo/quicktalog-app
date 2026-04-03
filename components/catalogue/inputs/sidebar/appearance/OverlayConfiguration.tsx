"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";

export interface OverlayConfigurationProps {
	currentOverlay: Record<string, any>;
	onOverlayChange: (field: string, value: any) => void;
}

const OverlayConfiguration = ({
	currentOverlay,
	onOverlayChange,
}: OverlayConfigurationProps) => {
	return (
		<div className="space-y-4 pt-2">
			<div className="flex items-center gap-2">
				<Label className="text-base font-semibold">Overlay</Label>
				<Popover>
					<PopoverTrigger type="button">
						<Info className="h-4 w-4 text-muted-foreground" />
					</PopoverTrigger>
					<PopoverContent side="top" className="z-[2000] w-[200px] p-3 text-sm">
						<p>Add a floating icon overlay to your catalogue.</p>
					</PopoverContent>
				</Popover>
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Label>Enable Overlay</Label>
					<Switch
						checked={currentOverlay.isEnabled || false}
						onCheckedChange={(checked) => onOverlayChange("isEnabled", checked)}
					/>
				</div>

				{currentOverlay.isEnabled && (
					<div className="space-y-2">
						<Label>Overlay Icon</Label>
						<Input
							onChange={(e) => {
								const value = e.target.value;
								const emojiRegex =
									/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})*$/u;
								if (value === "" || emojiRegex.test(value)) {
									// Count emoji characters (not string length, since emojis can be multi-byte)
									const emojiCount = [...value].filter((char) =>
										/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(
											char,
										),
									).length;
									if (emojiCount <= 3) {
										onOverlayChange("icon", value);
									}
								}
							}}
							placeholder="e.g. 🎁"
							value={currentOverlay.icon || ""}
						/>
						<p className="text-xs text-muted-foreground">
							Emojis only ·{" "}
							{
								[...(currentOverlay.icon || "")].filter((c) =>
									/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(c),
								).length
							}
							/3
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default OverlayConfiguration;
