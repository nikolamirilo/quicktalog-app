import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import { Screen, SpotMarker } from "@/components/manual/Screen";
import {
	AppNavbar,
	Btn,
	DashboardSidebar,
	PageWash,
	Panel,
	SectionTitle,
} from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

function SettingsCard({
	title,
	danger,
	children,
}: {
	title: string;
	danger?: boolean;
	children: ReactNode;
}) {
	return (
		<div
			className={cn(
				"rounded-product-card border bg-product-card",
				danger ? "border-product-error/45" : "border-product-border",
			)}
		>
			<p
				className={cn(
					"border-b px-5 py-3 text-[15px] font-bold",
					danger
						? "border-product-error/25 text-product-error"
						: "border-product-border text-product-foreground",
				)}
			>
				{title}
			</p>
			<div className="divide-y divide-product-border">{children}</div>
		</div>
	);
}

function Row({
	label,
	value,
	action,
	danger,
	spot,
}: {
	label: string;
	value: string;
	action: string;
	danger?: boolean;
	spot?: number;
}) {
	return (
		<div className="relative flex items-center gap-4 px-5 py-3.5">
			{spot ? <SpotMarker n={spot} /> : null}
			<span
				className={cn(
					"w-[150px] flex-none text-[13.5px] font-semibold",
					danger ? "text-product-error" : "text-product-foreground",
				)}
			>
				{label}
			</span>
			<span className="min-w-0 flex-1 text-[13px] text-product-foreground-accent">
				{value}
			</span>
			<Btn variant={danger ? "danger" : "outline"}>{action}</Btn>
		</div>
	);
}

/** The Settings tab of the dashboard. */
export function SettingsScreen() {
	return (
		<Screen
			caption="The Settings tab, with your account details, your privacy choices and the danger zone."
			height={660}
			legend={[
				"Your name, as it appears in emails",
				"Changing your email needs both inboxes confirmed",
				"Changing your password signs out every other device",
				"End this session, or every session everywhere",
				"Delete your account and everything in it",
			]}
			title="quicktalog.app/admin/dashboard?tab=settings"
			width={1280}
		>
			<PageWash>
				<AppNavbar />
				<div className="absolute inset-x-0 top-[96px] mx-auto flex max-w-[1280px] items-start gap-7 px-5">
					<DashboardSidebar active="Settings" />
					<Panel>
						<SectionTitle icon={Settings}>Settings</SectionTitle>
						<div className="mt-4 grid gap-4">
							<SettingsCard title="Account">
								<Row action="Edit" label="Name" spot={1} value="Ana Marin" />
								<Row
									action="Change"
									label="Email"
									spot={2}
									value="ana@brightsidecafe.com"
								/>
								<Row
									action="Change"
									label="Password"
									spot={3}
									value="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
								/>
								<Row
									action="Connect Google"
									label="Google"
									value="Not connected"
								/>
							</SettingsCard>

							<SettingsCard title="Privacy and sessions">
								<Row
									action="Manage"
									label="Cookies"
									value="Choose which optional cookies we may use."
								/>
								<Row
									action="Sign out"
									label="Sessions"
									spot={4}
									value="Signing out everywhere ends every session, this one included."
								/>
							</SettingsCard>

							<SettingsCard danger title="Danger zone">
								<Row
									action="Delete account"
									danger
									label="Delete account"
									spot={5}
									value="Cancels your subscription and permanently removes your catalogues."
								/>
							</SettingsCard>
						</div>
					</Panel>
				</div>
			</PageWash>
		</Screen>
	);
}
