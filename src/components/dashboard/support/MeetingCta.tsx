"use client";
import { CalendarDays, ExternalLink } from "lucide-react";
import { InlineWidget } from "react-calendly";

import { IconTile } from "@/components/general/IconTile";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

const CALENDLY_URL =
	process.env.NEXT_PUBLIC_CALENDLY_URL ||
	"https://calendly.com/quicktalog/customer-support";

/** "Prefer to talk?" strip whose button opens Calendly in a dialog. */
export function MeetingCta() {
	return (
		<section
			aria-labelledby="support-meeting-h"
			className="flex flex-col gap-4 rounded-product-card border border-product-primary/45 bg-product-amber-strip p-5 shadow-product sm:flex-row sm:items-center sm:justify-between md:px-6"
		>
			<div className="flex items-start gap-3">
				<IconTile size="sm">
					<CalendarDays />
				</IconTile>
				<div>
					<h2
						className="font-product-heading text-base font-bold text-product-foreground"
						id="support-meeting-h"
					>
						Prefer to talk it through?
					</h2>
					<p className="text-sm text-product-foreground-accent">
						Book a free 30-minute call to discuss your needs or get personalized
						help.
					</p>
				</div>
			</div>
			<Dialog>
				<DialogTrigger asChild>
					<Button className="w-full shrink-0 sm:w-auto">
						<CalendarDays aria-hidden="true" />
						Schedule a meeting
					</Button>
				</DialogTrigger>
				<DialogContent className="flex max-h-[calc(100dvh-32px)] w-[calc(100vw-24px)] max-w-[760px] flex-col gap-0 overflow-hidden p-0">
					<div className="border-b border-product-border px-6 pb-4 pr-16 pt-6">
						<DialogTitle>Schedule a meeting</DialogTitle>
						<DialogDescription className="mt-1">
							Customer support · 30 min. Pick a time that suits you.
						</DialogDescription>
					</div>
					{/* Mounted only while open, so Calendly loads on demand. */}
					<div className="h-[min(680px,calc(100dvh-190px))] min-h-[420px] w-full bg-product-background">
						<InlineWidget
							styles={{ height: "100%", width: "100%" }}
							url={CALENDLY_URL}
						/>
					</div>
					<div className="border-t border-product-border px-6 py-3">
						<Button asChild size="sm" variant="link">
							<a href={CALENDLY_URL} rel="noopener noreferrer" target="_blank">
								Open Calendly in a new tab
								<ExternalLink aria-hidden="true" />
							</a>
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</section>
	);
}
