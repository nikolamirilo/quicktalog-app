"use client";
import { Download, Mail } from "lucide-react";
import Link from "next/link";

import { toIsoDay } from "@/components/dashboard/overview/timestamps";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatIsoDay } from "@/lib/format/date";
import type { NewsletterSubscriber } from "@/types/shared";

type NewsletterTableProps = {
	subscribers: NewsletterSubscriber[];
	/** The list could not be loaded. */
	error?: boolean;
};

const HEADINGS = ["Email", "Catalogue", "Date"];

// Quote every cell and double inner quotes; a leading ' keeps Excel and
// Sheets from executing a cell that starts with = + - @ (CSV injection).
function escapeCell(value: string) {
	const text = String(value ?? "");
	const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
	return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(subscribers: NewsletterSubscriber[]) {
	const rows = [
		HEADINGS,
		...subscribers.map((s) => [
			s.email,
			s.catalogueName ?? "",
			// ISO days sort and import the same in every locale.
			toIsoDay(s.createdAt),
		]),
	];
	const csv = rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
	// The BOM makes Excel read the file as UTF-8 (accented names, emoji).
	const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = "newsletter-subscribers.csv";
	// Firefox only follows a click on an anchor that is in the document.
	anchor.style.display = "none";
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	// Revoking right away can cancel the download in some browsers.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function NewsletterTable({ subscribers, error }: NewsletterTableProps) {
	const count = subscribers.length;

	return (
		<div className="overflow-hidden rounded-product-card border border-product-border bg-product-card shadow-product">
			<div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-product-border px-[18px] py-3.5">
				<span className="font-product-heading text-[15px] font-bold">
					{count} subscriber{count !== 1 ? "s" : ""}
				</span>
				<Button
					disabled={count === 0}
					onClick={() => downloadCsv(subscribers)}
					size="sm"
					variant="outline"
				>
					<Download aria-hidden="true" />
					Export CSV
				</Button>
			</div>

			{error ? (
				<p className="px-4 py-8 text-center text-product-error" role="alert">
					We couldn't load your newsletter subscribers.
				</p>
			) : count === 0 ? (
				<div className="flex flex-col items-center gap-2 px-4 py-8 text-product-muted">
					<Mail aria-hidden="true" className="size-7" />
					<p>No newsletter subscribers yet.</p>
				</div>
			) : (
				<section
					aria-label="Newsletter subscribers"
					className="max-w-full overflow-x-auto"
					// Focusable so keyboard users can scroll a wide table.
					tabIndex={0}
				>
					<Table className="min-w-[460px] text-sm">
						<TableHeader>
							<TableRow className="border-product-border hover:bg-transparent">
								{HEADINGS.map((heading) => (
									<TableHead
										className="h-auto bg-product-background px-[18px] py-3 text-xs font-bold uppercase tracking-[0.06em] text-product-muted"
										key={heading}
										scope="col"
									>
										{heading}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{subscribers.map((subscriber) => (
								<TableRow
									className="border-product-border hover:bg-product-primary-soft/35"
									key={subscriber.id}
								>
									<TableCell className="whitespace-nowrap px-[18px] py-3">
										{subscriber.email}
									</TableCell>
									<TableCell className="whitespace-nowrap px-[18px] py-3">
										{subscriber.catalogueName ? (
											<Link
												className="font-semibold text-product-primary-ink underline decoration-product-primary-ink/35 underline-offset-[3px] hover:decoration-current"
												href={`/catalogues/${subscriber.catalogueName}`}
											>
												{subscriber.catalogueName}
											</Link>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell className="whitespace-nowrap px-[18px] py-3 tabular-nums text-product-foreground-accent">
										{formatIsoDay(toIsoDay(subscriber.createdAt), {
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</section>
			)}
		</div>
	);
}
