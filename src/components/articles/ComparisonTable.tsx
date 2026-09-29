import { Check } from "lucide-react";

import { cn } from "@/lib/ui/cn";

interface ComparisonRow {
	label: string;
	/** One value per column. Boolean renders a check or dash; string renders text. */
	values: (boolean | string)[];
}

interface Props {
	columns: string[];
	rows: ComparisonRow[];
	/** Column index to emphasize (default 0, usually Quicktalog). */
	highlightIndex?: number;
}

const cell =
	"border-b border-product-border px-3.5 py-3 text-left align-middle";

/** Feature comparison table that scrolls sideways on small screens. */
export function ComparisonTable({ columns, rows, highlightIndex = 0 }: Props) {
	return (
		<div
			aria-label="Feature comparison"
			className="min-w-0 max-w-full overflow-x-auto rounded-[18px] border border-product-border bg-product-card shadow-[0_1px_2px_rgba(22,20,15,0.04)] [contain:paint]"
			role="region"
			tabIndex={0}
		>
			<table className="w-full min-w-[560px] border-collapse text-[14.5px] leading-[1.4]">
				<thead>
					<tr>
						<th
							className={cn(
								cell,
								"whitespace-nowrap bg-product-background-hero text-[12.5px] font-bold uppercase tracking-[0.06em] text-product-muted",
							)}
							scope="col"
						>
							Feature
						</th>
						{columns.map((col, i) => (
							<th
								className={cn(
									cell,
									"whitespace-nowrap text-[12.5px] font-bold uppercase tracking-[0.06em]",
									i === highlightIndex
										? "bg-product-primary/25 text-product-primary-ink"
										: "bg-product-background-hero text-product-muted",
								)}
								key={col}
								scope="col"
							>
								{col}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="[&>tr:last-child>*]:border-b-0">
					{rows.map((row) => (
						<tr key={row.label}>
							<th
								className={cn(cell, "font-semibold text-product-foreground")}
								scope="row"
							>
								{row.label}
							</th>
							{row.values.map((value, i) => (
								<td
									className={cn(
										cell,
										i === highlightIndex
											? "bg-product-primary-soft font-semibold text-product-foreground"
											: "text-product-foreground-accent",
									)}
									key={`${row.label}-${columns[i]}`}
								>
									{typeof value === "boolean" ? (
										value ? (
											<span className="inline-grid h-[22px] w-[22px] place-items-center rounded-full bg-product-primary text-product-foreground">
												<Check
													aria-hidden="true"
													className="h-3 w-3"
													strokeWidth={3}
												/>
												<span className="sr-only">Yes</span>
											</span>
										) : (
											<span className="text-product-muted">
												<span aria-hidden="true">–</span>
												<span className="sr-only">No</span>
											</span>
										)
									) : (
										value
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
