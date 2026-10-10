import type { Metadata } from "@quicktalog/common";
import { Lock } from "lucide-react";
import { useRef, useState } from "react";
import {
	PanelSection,
	SwitchField,
} from "@/components/catalogue/inputs/sidebar/panel";
import { Input } from "@/components/ui/input";
import {
	TRACKING_VENDOR_KEYS,
	TRACKING_VENDORS,
	type TrackingVendor,
	trackingIdError,
} from "@/lib/catalogue/tracking-providers";
import { cn } from "@/lib/ui/cn";

interface TrackingVendorFieldProps {
	vendor: TrackingVendor;
	value: string;
	locked: boolean;
	onChange: (value: string) => void;
}

/**
 * One vendor: a switch, and the id input once it is on. The switch is UI only
 * and is not saved: it reads as on while an id is set, and turning it off
 * clears the id (which removes the tag on save). The cleared id is kept for
 * this session, so switching back on restores it.
 */
const TrackingVendorField = ({
	vendor,
	value,
	locked,
	onChange,
}: TrackingVendorFieldProps) => {
	const spec = TRACKING_VENDORS[vendor];
	const [switchedOn, setSwitchedOn] = useState(false);
	const clearedId = useRef("");
	const focusOnMount = useRef(false);
	const isOn = !locked && (switchedOn || value.trim() !== "");
	const error = isOn ? trackingIdError(vendor, value) : null;

	const handleToggle = (checked: boolean) => {
		setSwitchedOn(checked);
		if (checked) {
			focusOnMount.current = true;
			if (!value && clearedId.current) onChange(clearedId.current);
		} else {
			clearedId.current = value;
			if (value) onChange("");
		}
	};

	return (
		<div className="py-2">
			<SwitchField
				checked={isOn}
				disabled={locked}
				hint={spec.summary}
				id={`tracking-${vendor}-enabled`}
				label={spec.label}
				onCheckedChange={handleToggle}
			/>
			{isOn && (
				<div className="space-y-2 pb-1 pt-2">
					<Input
						aria-describedby={`tracking-${vendor}-hint`}
						aria-invalid={!!error}
						aria-label={`${spec.label} ID`}
						className="font-mono text-sm"
						id={`tracking-${vendor}`}
						onChange={(e) => onChange(e.target.value)}
						placeholder={spec.placeholder}
						ref={(el) => {
							if (el && focusOnMount.current) {
								focusOnMount.current = false;
								el.focus();
							}
						}}
						spellCheck={false}
						value={value}
					/>
					<span
						className={cn(
							"block text-[12.5px] leading-snug",
							error ? "font-semibold text-product-error" : "text-product-muted",
						)}
						id={`tracking-${vendor}-hint`}
					>
						{error ?? spec.hint}
					</span>
				</div>
			)}
		</div>
	);
};

interface TrackingSectionProps {
	metadata: Metadata | undefined;
	/** False when the plan doesn't include the owner's own analytics tags. */
	hasTracking: boolean;
	handleChange: (field: string, value: string) => void;
}

const TrackingSection = ({
	metadata,
	hasTracking,
	handleChange,
}: TrackingSectionProps) => {
	const idOf = (vendor: TrackingVendor) =>
		(metadata?.[TRACKING_VENDORS[vendor].field] as string | undefined) ?? "";
	const anyConnected = TRACKING_VENDOR_KEYS.some(
		(vendor) => idOf(vendor).trim() !== "",
	);

	return (
		<PanelSection
			info="Connect your own Google Analytics or Meta Pixel to see how visitors use this catalogue. Visitors are asked to allow analytics before any tag loads, and nothing loads if they decline. Google Tag Manager is not supported, because a container can run any code on your page."
			title="Analytics & tracking"
		>
			<div className="-my-2 divide-y divide-product-border">
				{TRACKING_VENDOR_KEYS.map((vendor) => (
					<TrackingVendorField
						key={vendor}
						locked={!hasTracking}
						onChange={(value) =>
							handleChange(`metadata.${TRACKING_VENDORS[vendor].field}`, value)
						}
						value={idOf(vendor)}
						vendor={vendor}
					/>
				))}
			</div>
			{!hasTracking ? (
				<p className="flex items-center gap-1.5 rounded-xl bg-product-primary-soft px-3 py-2 text-[12.5px] font-semibold text-product-primary-ink">
					<Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
					Upgrade your plan to connect your own analytics.
				</p>
			) : (
				anyConnected && (
					<p className="text-[12.5px] leading-snug text-product-muted">
						Remember to mention these tools in your privacy policy.
					</p>
				)
			)}
		</PanelSection>
	);
};

export default TrackingSection;
