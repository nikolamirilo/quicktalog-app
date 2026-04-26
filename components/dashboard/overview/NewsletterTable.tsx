"use client";
import { Card } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { NewsletterSubscriber } from "@/types/shared";
import Link from "next/link";
import { FiDownload, FiMail } from "react-icons/fi";

interface NewsletterTableProps {
	subscribers: NewsletterSubscriber[];
}

export default function NewsletterTable({ subscribers }: NewsletterTableProps) {
	function handleExportCsv() {
		const rows = [
			["Email", "Catalogue", "Date"],
			...subscribers.map((s) => [
				s.email,
				s.catalogueName ?? "",
				new Date(s.createdAt).toLocaleDateString(),
			]),
		];
		const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "newsletter-subscribers.csv";
		anchor.click();
		URL.revokeObjectURL(url);
	}

	if (!subscribers || subscribers.length === 0) {
		return (
			<Card className="p-6 sm:p-8 flex flex-col items-center justify-center gap-3 bg-product-background border border-product-border shadow-product-shadow animate-fade-in">
				<FiMail className="w-8 h-8 text-product-foreground-accent opacity-40" />
				<p className="text-product-foreground-accent text-sm sm:text-base">
					No newsletter subscribers yet.
				</p>
			</Card>
		);
	}

	return (
		<Card className="bg-product-background border border-product-border shadow-product-shadow animate-fade-in overflow-hidden">
			<div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-product-border">
				<span className="text-sm text-product-foreground font-medium">
					{subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}
				</span>
				<button
					className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-product-border text-product-foreground hover:bg-product-background-hover transition-colors duration-200 text-sm font-medium"
					onClick={handleExportCsv}
				>
					<FiDownload className="w-3.5 h-3.5" />
					Export CSV
				</button>
			</div>

			<Table>
				<TableHeader>
					<TableRow className="bg-product-primary border-product-border">
						<TableHead className="font-semibold text-product-foreground text-xs sm:text-sm uppercase tracking-wide px-4 sm:px-6">
							Email
						</TableHead>
						<TableHead className="font-semibold text-product-foreground text-xs sm:text-sm uppercase tracking-wide px-4 sm:px-6">
							Catalogue
						</TableHead>
						<TableHead className="font-semibold text-product-foreground text-xs sm:text-sm uppercase tracking-wide px-4 sm:px-6">
							Date
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{subscribers.map((subscriber) => (
						<TableRow
							className="border-product-border hover:bg-product-background-hover/50 transition-colors duration-150"
							key={subscriber.id}
						>
							<TableCell className="text-product-foreground text-sm font-medium px-4 sm:px-6 py-3">
								{subscriber.email}
							</TableCell>
							<TableCell className="text-product-foreground-accent text-sm px-4 sm:px-6 py-3">
								{subscriber.catalogueName ? (
									<Link
										className="text-blue-700 underline"
										href={`/catalogues/${subscriber.catalogueName}`}
									>
										{subscriber.catalogueName}
									</Link>
								) : (
									"—"
								)}
							</TableCell>
							<TableCell className="text-product-foreground-accent text-sm px-4 sm:px-6 py-3">
								{new Date(subscriber.createdAt).toLocaleDateString()}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Card>
	);
}
