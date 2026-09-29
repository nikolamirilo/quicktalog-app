"use client";
import { CircleHelp } from "lucide-react";

import { SupportContactCard } from "@/components/contact/SupportContactCard";
import { AppLead, AppTitle } from "@/components/dashboard/common/AppHeadings";
import { MeetingCard } from "@/components/dashboard/support/MeetingCard";

export const Support = () => {
	return (
		<div>
			<AppTitle icon={<CircleHelp />}>Support</AppTitle>
			<AppLead>
				We're here to help you get the most out of Quicktalog. Choose your
				preferred support method below.
			</AppLead>
			<div className="grid items-start gap-4 min-[1100px]:grid-cols-[1.35fr_1fr]">
				<SupportContactCard />
				<MeetingCard />
			</div>
		</div>
	);
};
