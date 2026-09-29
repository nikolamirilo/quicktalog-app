"use client";
import { CalendarDays, ExternalLink } from "lucide-react";
import { InlineWidget } from "react-calendly";

import { AppCardTitle } from "@/components/dashboard/common/AppHeadings";
import { IconTile } from "@/components/general/IconTile";
import { Button } from "@/components/ui/button";

const CALENDLY_URL =
	process.env.NEXT_PUBLIC_CALENDLY_URL ||
	"https://calendly.com/quicktalog/customer-support";

/** "Schedule a Meeting" card with the inline Calendly booking widget. */
export function MeetingCard() {
	return (
		<section
			aria-labelledby="support-meeting-h"
			className="flex min-w-0 flex-col rounded-product-card border border-product-border bg-product-card p-5 shadow-product md:p-6"
		>
			<div className="mb-4 flex items-start gap-3">
				<IconTile size="sm">
					<CalendarDays />
				</IconTile>
				<div>
					<AppCardTitle id="support-meeting-h">Schedule a Meeting</AppCardTitle>
					<p className="text-sm text-product-foreground-accent">
						Book a 30-minute consultation to discuss your needs or get
						personalized assistance.
					</p>
				</div>
			</div>
			<div className="h-[640px] w-full overflow-hidden rounded-[18px] border border-product-border bg-product-background">
				<InlineWidget
					styles={{ height: "100%", width: "100%" }}
					url={CALENDLY_URL}
				/>
			</div>
			<Button asChild className="mt-3 self-start" size="sm" variant="outline">
				<a href={CALENDLY_URL} rel="noopener noreferrer" target="_blank">
					Open Calendly
					<ExternalLink aria-hidden="true" />
					<span className="sr-only">(opens in a new tab)</span>
				</a>
			</Button>
		</section>
	);
}
