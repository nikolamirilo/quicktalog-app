import {
	CalendarDays,
	ChartColumn,
	ChevronDown,
	CircleHelp,
	FileChartColumn,
	Info,
	type LucideIcon,
	MoreVertical,
	Settings,
	User,
	UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The pieces the product is built from, drawn at the real sizes taken from the
 * components. Screens are assembled from these so every drawing of the same
 * part looks the same, and so a reader can match a drawing to their own screen.
 */

/** The floating navbar pill: 64px tall, 1240px wide, 9px from the top. */
export function AppNavbar({ signedIn = true }: { signedIn?: boolean }) {
	return (
		<div className="absolute left-1/2 top-[9px] z-10 flex h-16 w-[calc(100%-24px)] max-w-[1240px] -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-product-foreground/[0.08] bg-product-card/80 pl-[18px] pr-2.5 shadow-[0_1px_2px_rgba(22,20,15,0.04)]">
			<span className="flex items-center gap-2">
				<span className="grid h-7 w-7 place-items-center rounded-full bg-product-primary text-[13px] font-extrabold text-product-foreground">
					Q
				</span>
				<span className="font-product-heading text-[17px] font-extrabold tracking-[-0.02em] text-product-foreground">
					Quicktalog
				</span>
			</span>
			<span className="flex items-center gap-1">
				<span className="flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-semibold text-product-foreground-accent">
					Product <ChevronDown className="h-3.5 w-3.5" />
				</span>
				<span className="flex items-center gap-1 rounded-full px-3 py-2 text-[14px] font-semibold text-product-foreground-accent">
					Resources <ChevronDown className="h-3.5 w-3.5" />
				</span>
				<span className="rounded-full px-3 py-2 text-[14px] font-semibold text-product-foreground-accent">
					Pricing
				</span>
			</span>
			<span className="flex items-center gap-2">
				{signedIn ? (
					<>
						<span className="inline-flex h-9 items-center rounded-full bg-product-primary px-4 text-sm font-semibold text-product-foreground shadow-product-primary">
							Dashboard
						</span>
						<span className="grid h-9 w-9 place-items-center rounded-full bg-product-primary-soft text-[12px] font-extrabold text-product-primary-ink ring-2 ring-product-primary">
							AM
						</span>
					</>
				) : (
					<>
						<span className="inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-product-primary bg-product-card px-4 text-sm font-semibold text-product-foreground">
							<User className="h-4 w-4" />
							Log In
						</span>
						<span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-product-primary px-4 text-sm font-semibold text-product-foreground shadow-product-primary">
							<UserPlus className="h-4 w-4" />
							Start free
						</span>
					</>
				)}
			</span>
		</div>
	);
}

/** The dashboard sidebar: 224px card, 46px rows, 14px radius. */
export function DashboardSidebar({ active }: { active: string }) {
	const tabs = [
		{ icon: FileChartColumn, label: "Overview" },
		{ icon: CalendarDays, label: "Subscription" },
		{ icon: ChartColumn, label: "Usage" },
		{ icon: Settings, label: "Settings" },
		{ icon: CircleHelp, label: "Support" },
	];

	return (
		<div className="w-56 flex-none self-start rounded-product-card border border-product-border bg-product-card p-3 shadow-product">
			<div className="flex flex-col gap-1.5">
				{tabs.map(({ icon: Icon, label }) => (
					<div
						className={cn(
							"flex h-[46px] items-center gap-3 rounded-[14px] border border-transparent px-3.5 text-[15px] font-medium text-product-foreground-accent",
							label === active &&
								"border-product-primary bg-product-primary-soft font-bold text-product-foreground",
						)}
						key={label}
					>
						<Icon
							className={cn(
								"h-[19px] w-[19px] flex-none",
								label === active && "text-product-primary-ink",
							)}
						/>
						{label}
					</div>
				))}
			</div>
		</div>
	);
}

/** The panel the tab contents sit in. */
export function Panel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"relative min-w-0 flex-1 rounded-product-panel border border-product-border bg-product-card/70 p-9 shadow-product",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function SectionTitle({
	icon: Icon,
	children,
}: {
	icon?: LucideIcon;
	children: ReactNode;
}) {
	return (
		<p className="flex items-center gap-2.5 text-xl font-bold leading-tight tracking-[-0.02em] text-product-foreground">
			{Icon ? (
				<Icon className="h-[22px] w-[22px] flex-none text-product-primary-ink" />
			) : null}
			{children}
		</p>
	);
}

export function StatCard({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: string;
	icon: LucideIcon;
}) {
	return (
		<div className="relative flex min-w-0 flex-col gap-3 rounded-product-card border border-product-border bg-product-card p-5 shadow-product">
			<div className="flex items-start gap-1.5">
				<p className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug text-product-foreground-accent">
					{label}
				</p>
				<span className="-mr-1.5 -mt-[5px] grid h-7 w-7 flex-none place-items-center rounded-full text-product-muted">
					<Info className="h-[15px] w-[15px]" />
				</span>
			</div>
			<p className="pr-9 font-product-heading text-[32px] font-extrabold leading-none tracking-[-0.03em] text-product-foreground">
				{value}
			</p>
			<span className="absolute bottom-3.5 right-3.5 grid h-9 w-9 place-items-center rounded-[11px] border border-product-primary/35 bg-product-primary-soft text-product-primary-ink">
				<Icon className="h-[17px] w-[17px]" />
			</span>
		</div>
	);
}

const statusStyles = {
	Active: "bg-product-success-soft text-product-success",
	Draft: "bg-product-primary-soft text-product-primary-ink",
	Inactive: "bg-product-background-hero text-product-muted",
	"In preparation": "bg-product-info-soft text-product-info",
	Error: "bg-product-error-soft text-product-error-ink",
} as const;

export function StatusPill({ status }: { status: keyof typeof statusStyles }) {
	return (
		<span
			className={cn(
				"inline-flex h-6 w-fit items-center whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-bold",
				statusStyles[status],
			)}
		>
			{status}
		</span>
	);
}

export function Btn({
	children,
	variant = "primary",
	className,
}: {
	children: ReactNode;
	variant?: "primary" | "outline" | "danger" | "ghost";
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-transparent px-4 text-sm font-semibold leading-none [&_svg]:h-[1.1em] [&_svg]:w-[1.1em]",
				variant === "primary" &&
					"bg-product-primary text-product-foreground shadow-product-primary",
				variant === "outline" &&
					"border-product-primary bg-product-card text-product-foreground",
				variant === "danger" && "bg-product-error text-white",
				variant === "ghost" && "text-product-foreground-accent",
				className,
			)}
		>
			{children}
		</span>
	);
}

/** One catalogue card on the dashboard overview. */
export function CatalogueCard({
	name,
	status,
	updated,
	created,
	actions,
	children,
}: {
	name: string;
	status: keyof typeof statusStyles;
	updated: string;
	created: string;
	/** The buttons for this status, in order. They grow and wrap as whole units. */
	actions: ReactNode;
	children?: ReactNode;
}) {
	return (
		<div className="relative flex min-w-0 flex-col gap-3 rounded-product-card border border-product-border bg-product-card p-[18px] shadow-product">
			<div className="flex items-start justify-between gap-2">
				<p className="min-w-0 text-[17px] font-bold leading-snug tracking-[-0.015em] text-product-foreground">
					{name}
				</p>
				<span className="relative grid h-9 w-9 flex-none place-items-center rounded-full text-product-muted">
					{children}
					<MoreVertical className="h-[18px] w-[18px]" />
				</span>
			</div>
			<StatusPill status={status} />
			<dl className="grid gap-0.5 text-[13px] text-product-muted">
				<div className="flex gap-1.5">
					<dt className="font-semibold text-product-foreground-accent">
						Updated:
					</dt>
					<dd>{updated}</dd>
				</div>
				<div className="flex gap-1.5">
					<dt className="font-semibold text-product-foreground-accent">
						Created:
					</dt>
					<dd>{created}</dd>
				</div>
			</dl>
			<div className="mt-auto flex flex-wrap gap-2 pt-1 [&>*]:flex-[1_1_auto]">
				{actions}
			</div>
		</div>
	);
}

/** A form row: label, control, and the hint under it. */
export function Field({
	label,
	children,
	hint,
	required,
}: {
	label: string;
	children: ReactNode;
	hint?: ReactNode;
	required?: boolean;
}) {
	return (
		<div>
			<p className="mb-1 text-[12px] font-bold text-product-foreground">
				{label}
				{required ? <span className="text-product-error"> *</span> : null}
			</p>
			{children}
			{hint ? (
				<p className="mt-1 text-[11px] text-product-muted">{hint}</p>
			) : null}
		</div>
	);
}

export function Input({
	value,
	placeholder,
	className,
}: {
	value?: string;
	placeholder?: string;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"flex h-9 items-center rounded-[12px] border border-product-border-strong bg-product-card px-3 text-[13px]",
				value ? "text-product-foreground" : "text-product-muted",
				className,
			)}
		>
			{value ?? placeholder}
		</span>
	);
}

export function Select({ value }: { value: string }) {
	return (
		<span className="flex h-9 items-center justify-between rounded-[12px] border border-product-border-strong bg-product-card px-3 text-[13px] text-product-foreground">
			{value}
			<span className="text-product-muted">&#9662;</span>
		</span>
	);
}

export function Toggle({ on = false, label }: { on?: boolean; label: string }) {
	return (
		<span className="flex items-center justify-between gap-3">
			<span className="text-[13px] text-product-foreground">{label}</span>
			<span
				className={cn(
					"flex h-[18px] w-[32px] flex-none items-center rounded-full p-[2px]",
					on ? "justify-end bg-product-primary" : "bg-product-border-hover",
				)}
			>
				<span className="h-[14px] w-[14px] rounded-full bg-white" />
			</span>
		</span>
	);
}

/** A dialog drawn over a dimmed screen. */
export function DialogBox({
	title,
	description,
	width = 460,
	children,
	footer,
}: {
	title: string;
	description?: string;
	width?: number;
	children?: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<>
			<div className="absolute inset-0 z-20 bg-product-dark/45" />
			<div
				className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-product-border bg-product-card p-5 shadow-product-hover"
				style={{ width }}
			>
				<p className="font-product-heading text-[16px] font-extrabold text-product-foreground">
					{title}
				</p>
				{description ? (
					<p className="mt-1 text-[12.5px] text-product-foreground-accent">
						{description}
					</p>
				) : null}
				{children ? <div className="mt-3.5">{children}</div> : null}
				{footer ? (
					<div className="mt-4 flex justify-end gap-2">{footer}</div>
				) : null}
			</div>
		</>
	);
}

/** The amber page wash behind the dashboard and builder. */
export function PageWash({ children }: { children: ReactNode }) {
	return (
		<div className="absolute inset-0 overflow-hidden bg-product-background">
			<span className="absolute -right-16 -top-10 h-56 w-80 rounded-full bg-product-primary/20 blur-3xl" />
			{children}
		</div>
	);
}
