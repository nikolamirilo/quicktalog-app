import { Check, Minus } from "lucide-react";

export interface ComparisonRow {
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

/** Responsive feature comparison table. The centerpiece of the comparison article. */
export default function ComparisonTable({
	columns,
	rows,
	highlightIndex = 0,
}: Props) {
	return (
		<div className="my-10 overflow-x-auto rounded-2xl border border-product-border">
			<table className="w-full border-collapse text-left text-sm sm:text-base">
				<thead>
					<tr>
						<th className="sticky left-0 z-10 bg-product-background-hero p-3 font-semibold text-product-foreground sm:p-4">
							Feature
						</th>
						{columns.map((col, i) => (
							<th
								className={`p-3 text-center align-bottom font-semibold sm:p-4 ${
									i === highlightIndex
										? "rounded-t-xl bg-product-primary text-product-foreground"
										: "bg-product-background-hero text-product-secondary"
								}`}
								key={col}
							>
								{i === highlightIndex && (
									<span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-wider text-product-foreground/70">
										Best fit
									</span>
								)}
								{col}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, r) => (
						<tr
							className={
								r % 2 === 1
									? "bg-product-background-hover"
									: "bg-product-background"
							}
							key={row.label}
						>
							<th
								className={`sticky left-0 z-10 p-3 font-medium text-product-foreground sm:p-4 ${
									r % 2 === 1
										? "bg-product-background-hover"
										: "bg-product-background"
								}`}
								scope="row"
							>
								{row.label}
							</th>
							{row.values.map((value, i) => (
								<td
									className={`p-3 text-center sm:p-4 ${
										i === highlightIndex ? "bg-product-background-hover" : ""
									}`}
									key={`${row.label}-${columns[i]}`}
								>
									{typeof value === "boolean" ? (
										value ? (
											<span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
												<Check
													aria-label="Yes"
													className="h-4 w-4 text-green-600"
												/>
											</span>
										) : (
											<span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-product-background-hero">
												<Minus
													aria-label="No"
													className="h-4 w-4 text-product-foreground-accent"
												/>
											</span>
										)
									) : (
										<span className="text-product-foreground-accent">
											{value}
										</span>
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
