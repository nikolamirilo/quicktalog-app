import {
	Check,
	ChevronDown,
	LayoutDashboard,
	LogOut,
	type LucideIcon,
	Plus,
	Settings,
	Tag,
	Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import { GoogleLogo } from "@/components/general/GoogleLogo";
import { Screen, SpotMarker } from "@/components/manual/Screen";
import { Btn, DashboardSidebar, Panel } from "@/components/manual/screens/kit";
import { cn } from "@/lib/ui/cn";

/**
 * The Settings tab of the dashboard, drawn as the whole 1280px page: the
 * floating navbar, the 224px tab sidebar and the 964px panel holding three
 * cards. Settings has no dark variant, so one light drawing is the screen.
 *
 * The kit's AppNavbar draws a signed-out bar at older sizes, its PageWash glow
 * is a different shape from the real one, and SectionTitle is the 20px section
 * heading rather than the 32px tab title, so the navbar, the glow and the title
 * are rebuilt here from the real components. The sidebar, the panel and the
 * buttons come from the kit.
 */

/** The brand mark: the amber magnifier over a QR grid, then the wordmark. */
function BrandLogo() {
	return (
		<span className="flex h-[38px] flex-none items-center gap-[5px]">
			<svg
				aria-hidden="true"
				className="h-[26px] w-[26px] flex-none"
				fill="none"
				viewBox="0 0 30 30"
			>
				<title>Quicktalog</title>
				<circle cx="13" cy="13" r="10.5" stroke="#FFB020" strokeWidth="3" />
				<path
					d="M20.8 20.8 26.4 26.4"
					stroke="#FFB020"
					strokeLinecap="round"
					strokeWidth="4"
				/>
				<rect fill="#FFB020" height="3.6" rx="1" width="3.6" x="8.4" y="8.4" />
				<rect fill="#FFB020" height="3.6" rx="1" width="3.6" x="14" y="8.4" />
				<rect fill="#FFB020" height="3.6" rx="1" width="3.6" x="8.4" y="14" />
				<rect
					fill="#FFB020"
					height="2.2"
					rx="0.7"
					width="2.2"
					x="14.7"
					y="14.7"
				/>
			</svg>
			<span className="font-product-heading text-[15px] font-extrabold tracking-[-0.03em] text-[#2B3539]">
				Quicktalog
			</span>
		</span>
	);
}

/** A navbar pill: 40px tall, 15px label. `active` is the amber current route. */
function NavPill({
	active,
	chevron,
	children,
	icon: Icon,
}: {
	active?: boolean;
	chevron?: boolean;
	children: ReactNode;
	icon?: LucideIcon;
}) {
	return (
		<span
			className={cn(
				"inline-flex h-10 items-center gap-2 rounded-full border border-transparent px-3.5 text-[15px] font-medium text-product-foreground-accent",
				active &&
					"border-product-primary/55 bg-product-primary-soft font-bold text-product-foreground",
			)}
		>
			{Icon ? <Icon className="h-4 w-4 flex-none" /> : null}
			{children}
			{chevron ? <ChevronDown className="h-[15px] w-[15px] flex-none" /> : null}
		</span>
	);
}

/** The fixed navbar pill: 1240px wide, 64px tall, 9px from the top. */
function TopBar() {
	return (
		<div className="absolute inset-x-0 top-[9px] z-10 px-3">
			<div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 rounded-full border border-product-foreground/[0.08] bg-product-card/80 pl-[18px] pr-2.5 shadow-[0_1px_2px_rgba(22,20,15,0.04)] backdrop-blur-[14px]">
				<BrandLogo />
				<span className="flex items-center gap-1">
					<NavPill chevron>Product</NavPill>
					<NavPill chevron>Resources</NavPill>
					<NavPill icon={Tag}>Pricing</NavPill>
					<span className="ml-2.5 flex items-center gap-1.5">
						<NavPill active icon={LayoutDashboard}>
							Dashboard
						</NavPill>
						<span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full border-2 border-product-primary bg-product-primary-soft font-product-heading text-sm font-extrabold leading-none tracking-[0.02em] text-product-foreground">
							AM
						</span>
					</span>
				</span>
			</div>
		</div>
	);
}

/** One settings card: a 16.5px title, then rows divided by hairlines. */
function SettingsCard({
	children,
	danger,
	title,
}: {
	children: ReactNode;
	danger?: boolean;
	title: string;
}) {
	return (
		<section
			className={cn(
				"overflow-hidden rounded-product-card border bg-product-card shadow-product",
				danger ? "border-product-error/30" : "border-product-border",
			)}
		>
			<p
				className={cn(
					"px-6 pb-2.5 pt-[18px] font-product-heading text-[16.5px] font-bold leading-snug tracking-[-0.015em]",
					danger ? "text-product-error" : "text-product-foreground",
				)}
			>
				{title}
			</p>
			{children}
		</section>
	);
}

/**
 * One row: a 180px label column, the value or the description, and the action
 * stack flush right. A row with a description shows no value, and the buttons
 * in a stack all take the width of the widest one.
 */
function SettingsRow({
	action,
	danger,
	description,
	label,
	spot,
	value,
}: {
	action: ReactNode;
	danger?: boolean;
	/** Shown instead of the value, as in the real row. */
	description?: string;
	label: string;
	/** Marks the action stack. */
	spot?: number;
	value?: ReactNode;
}) {
	return (
		<div className="border-t border-product-border px-6 py-3.5">
			<div className="grid grid-cols-[180px_minmax(0,1fr)_auto] items-center gap-4">
				<span
					className={cn(
						"text-sm font-semibold",
						danger ? "text-product-error" : "text-product-foreground",
					)}
				>
					{label}
				</span>
				{description ? (
					<p className="min-w-0 text-sm leading-normal text-product-foreground-accent">
						{description}
					</p>
				) : (
					<div className="min-w-0 text-[15px] text-product-foreground-accent">
						{value}
					</div>
				)}
				<div className="relative flex flex-col gap-2">
					{spot ? <SpotMarker n={spot} /> : null}
					{action}
				</div>
			</div>
		</div>
	);
}

/** The white outlined pill saying whether Google is linked. */
function GoogleBadge() {
	return (
		<span className="relative inline-flex h-[30px] flex-none items-center gap-[7px] rounded-full border border-product-border bg-product-card pl-2 pr-3 text-[13px] font-semibold text-product-foreground">
			<SpotMarker className="-bottom-2 -left-2 top-auto" n={3} />
			<GoogleLogo className="size-4" />
			Connected
			<Check className="size-3.5 text-product-success" strokeWidth={3} />
		</span>
	);
}

/** The Settings tab of the dashboard. */
export function SettingsScreen() {
	return (
		<Screen
			caption="The Settings tab of the Quicktalog dashboard, where a signed-in owner edits their name, email and password, manages the Google link, cookies and sessions, and can delete the account."
			height={1050}
			legend={[
				"The Settings tab, highlighted amber in the dashboard sidebar",
				"Edit your display name, email or password one row at a time",
				"Shows whether Google sign-in is linked, and to which address",
				"Reopens the cookie choices you made on your first visit",
				"Sign out here, or end every session on every device",
				"Opens the confirmation dialog that permanently deletes the account",
			]}
			title="https://www.quicktalog.app/admin/dashboard?tab=settings"
			width={1280}
		>
			<div className="absolute inset-0 overflow-hidden bg-product-background font-product-body text-product-foreground">
				{/* The page glow: a 460px amber circle behind the panel's top right. */}
				<span
					aria-hidden="true"
					className="pointer-events-none absolute right-[-6%] top-[60px] h-[460px] w-[460px] rounded-full bg-product-primary/[0.12] blur-[110px]"
				/>

				<TopBar />

				<div className="absolute inset-x-0 top-[120px] mx-auto max-w-[1280px] px-8">
					<div className="flex items-start gap-7">
						<div className="relative flex-none">
							<DashboardSidebar active="Settings" />
							{/* The fourth tab button, 46px tall inside the card's 12px padding. */}
							<span className="absolute left-3 top-[168px] h-[46px] w-[200px]">
								<SpotMarker n={1} />
							</span>
						</div>

						<Panel>
							<p className="mb-[18px] flex items-center gap-3 font-product-heading text-[32px] font-extrabold leading-[1.15] tracking-[-0.025em] text-product-foreground">
								<Settings className="h-7 w-7 flex-none text-product-primary-ink" />
								Settings
							</p>

							<div className="flex min-w-0 flex-col gap-4">
								<SettingsCard title="Account">
									<SettingsRow
										action={
											<Btn className="relative" variant="outline">
												<SpotMarker n={2} />
												Edit
											</Btn>
										}
										label="Name"
										value="Ana Marin"
									/>
									<SettingsRow
										action={<Btn variant="outline">Change</Btn>}
										label="Email"
										value="ana@brightsidecafe.com"
									/>
									<SettingsRow
										action={<Btn variant="outline">Change</Btn>}
										label="Password"
										value={<span className="tracking-[0.15em]">••••••••</span>}
									/>
									<SettingsRow
										action={<Btn variant="outline">Disconnect</Btn>}
										label="Google"
										value={
											<span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
												<GoogleBadge />
												<span className="text-sm font-normal text-product-foreground-accent">
													as ana@brightsidecafe.com
												</span>
											</span>
										}
									/>
								</SettingsCard>

								<SettingsCard title="Privacy and sessions">
									<SettingsRow
										action={
											<Btn className="relative" variant="outline">
												<SpotMarker n={4} />
												Manage
											</Btn>
										}
										description="Choose which optional cookies we may use."
										label="Cookies"
									/>
									<SettingsRow
										action={
											<>
												<Btn variant="outline">
													<LogOut />
													Sign out
												</Btn>
												<Btn
													className="border-product-error/40 text-product-error"
													variant="outline"
												>
													Sign out everywhere
												</Btn>
											</>
										}
										description="Signing out everywhere ends every session, this one included."
										label="Sessions"
										spot={5}
									/>
								</SettingsCard>

								<SettingsCard danger title="Danger zone">
									<SettingsRow
										action={
											<Btn className="relative" variant="danger">
												<SpotMarker n={6} />
												<Trash2 />
												Delete account
											</Btn>
										}
										danger
										description="Cancels your subscription and permanently removes your catalogues and their public pages. This cannot be undone."
										label="Delete account"
									/>
								</SettingsCard>
							</div>
						</Panel>
					</div>
				</div>

				{/* The create button floats over the panel's lower right corner. */}
				<span className="absolute bottom-[32px] right-8 z-20 grid h-[60px] w-[60px] place-items-center rounded-full bg-product-primary text-product-foreground shadow-[0_14px_30px_-8px_rgba(245,163,0,0.7),0_2px_6px_rgba(22,20,15,0.14)]">
					<Plus className="h-[26px] w-[26px]" strokeWidth={2.4} />
				</span>
			</div>
		</Screen>
	);
}
