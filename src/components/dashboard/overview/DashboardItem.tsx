"use client";
import type { Catalogue, PricingPlan, Status, Usage } from "@quicktalog/common";
import { ChartColumn, Rocket, Settings, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { getCatalogueByName, publishCatalogue } from "@/actions/catalogue";
import { ItemDropdownMenu } from "@/components/dashboard/overview/ItemDropdownMenu";
import { StatusBadge } from "@/components/dashboard/overview/StatusBadge";
import { parseTimestamp } from "@/components/dashboard/overview/timestamps";
import { Button } from "@/components/ui/button";
import { htmlToText } from "@/lib/html/to-text";

type DashboardItemProps = {
	catalogue: Catalogue;
	currentPlan: PricingPlan;
	usage: Usage;
	deleteDialogOpen: boolean;
	statusBusyId: string | null;
	onDelete: (name: string) => void;
	onStatusChange: (id: string, status: Status) => void;
	onChanged: () => Promise<void>;
	onDuplicated: () => Promise<void>;
};

const formatDateTime = (value: string) => {
	const time = parseTimestamp(value);
	if (Number.isNaN(time)) return "-";
	return new Date(time).toLocaleString("en-US", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/** One catalogue card on the overview (`.as-cat`). */
export function DashboardItem({
	catalogue,
	currentPlan,
	usage,
	deleteDialogOpen,
	statusBusyId,
	onDelete,
	onStatusChange,
	onChanged,
	onDuplicated,
}: DashboardItemProps) {
	const viewAction = {
		label: "View",
		onClick: () => {
			window.open(`/catalogues/${catalogue.name}`, "_blank");
		},
	};

	const handlePublish = async () => {
		const result = await getCatalogueByName(catalogue.name);
		if (!result.success || !result.data) {
			toast.error("Could not retrieve catalogue data. Please try again.");
			return;
		}

		const raw = result.data;
		const latest = (
			typeof raw === "string" ? JSON.parse(raw) : raw
		) as Catalogue;
		const heading = htmlToText(latest.heading) || "";
		const missingFields: string[] = [];
		if (!heading || heading.length === 0) missingFields.push("heading");
		if (!latest.content || latest.content.length === 0)
			missingFields.push("content");
		if (missingFields.length > 0) {
			toast.error(`Cannot publish: missing ${missingFields.join(" and ")}.`, {
				action: {
					label: "Open Builder",
					onClick: () => {
						window.location.href = `/admin/${catalogue.name}/builder`;
					},
				},
			});
			return;
		}

		const promise = publishCatalogue(latest);
		if (catalogue.status === "draft") {
			toast.promise(promise, {
				loading: "Publishing...",
				success: async (success) => {
					if (!success) throw new Error("Failed to update status");
					await onChanged();
					return "Catalogue published successfully";
				},
				action: viewAction,
				error: "Failed to publish catalogue",
			});
		} else {
			toast.promise(promise, {
				loading: "Updating...",
				success: async (success) => {
					if (!success) throw new Error("Failed to update status");
					await onChanged();
					return "Catalogue updated successfully";
				},
				action: viewAction,
				error: "Failed to update catalogue",
			});
		}
	};

	return (
		<article className="relative flex min-w-0 flex-col gap-3 rounded-product-card border border-product-border bg-product-card p-[18px] shadow-product transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-product-hover">
			<div className="flex items-start justify-between gap-2">
				<h3 className="min-w-0 break-words text-[17px] font-bold leading-snug tracking-[-0.015em] [overflow-wrap:anywhere]">
					{catalogue.name}
				</h3>
				<ItemDropdownMenu
					catalogue={catalogue}
					currentPlan={currentPlan}
					deleteDialogOpen={deleteDialogOpen}
					disabled={!["active", "inactive", "draft"].includes(catalogue.status)}
					onDelete={onDelete}
					onDuplicated={onDuplicated}
					onStatusChange={onStatusChange}
					statusBusy={statusBusyId === catalogue.id}
					usage={usage}
				/>
			</div>

			<StatusBadge status={catalogue.status} />

			<dl className="grid gap-0.5 text-[13px] text-product-muted">
				<div className="flex gap-1.5">
					<dt className="font-semibold text-product-foreground-accent">
						Updated:
					</dt>
					<dd>{formatDateTime(catalogue.updatedAt)}</dd>
				</div>
				<div className="flex gap-1.5">
					<dt className="font-semibold text-product-foreground-accent">
						Created:
					</dt>
					<dd>{formatDateTime(catalogue.createdAt)}</dd>
				</div>
			</dl>

			<div className="mt-auto flex flex-wrap gap-2 pt-1 [&>*]:flex-[1_1_auto]">
				{catalogue.status === "active" && (
					<>
						<Button asChild size="sm">
							<Link href={`/catalogues/${catalogue.name}`}>View Catalogue</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link href={`/admin/${catalogue.name}/analytics`}>
								<ChartColumn aria-hidden="true" />
								Analytics
							</Link>
						</Button>
					</>
				)}
				{(catalogue.status === "draft" || catalogue.status === "inactive") && (
					<>
						<Button asChild size="sm">
							<Link href={`/admin/${catalogue.name}/builder`}>
								Continue Editing
							</Link>
						</Button>
						<Button onClick={handlePublish} size="sm" variant="outline">
							<Rocket aria-hidden="true" />
							Publish Catalogue
						</Button>
					</>
				)}
				{catalogue.status === "error" && (
					<p className="flex items-start gap-2 text-[13.5px] font-semibold text-product-error">
						<TriangleAlert
							aria-hidden="true"
							className="mt-px size-[18px] flex-none"
						/>
						Error occurred. Please delete the catalogue and retry.
					</p>
				)}
				{catalogue.status === "in_preparation" && (
					<p className="flex h-9 items-center text-product-info">
						<Settings
							aria-hidden="true"
							className="size-6 animate-[spin_3s_linear_infinite]"
						/>
						<span className="sr-only">Catalogue is being prepared</span>
					</p>
				)}
			</div>
		</article>
	);
}
