import type { ReactNode } from "react";

/**
 * A comparison table. On a phone each row becomes a card and every cell keeps
 * its column header, because a table that scrolls sideways loses the headers
 * exactly when a reader needs them.
 */
export function ManualTable({
	columns,
	rows,
	caption,
}: {
	columns: string[];
	rows: ReactNode[][];
	caption?: string;
}) {
	return (
		<div className="overflow-hidden rounded-product-card border border-product-border bg-product-card/70">
			<table className="hidden w-full border-collapse text-left text-[14.5px] sm:table">
				{caption ? <caption className="sr-only">{caption}</caption> : null}
				<thead>
					<tr className="border-b border-product-border bg-product-card/60">
						{columns.map((column) => (
							<th
								className="px-5 py-3 font-product-heading text-[12.5px] font-semibold uppercase tracking-[0.04em] text-product-muted"
								key={column}
								scope="col"
							>
								{column}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, rowIndex) => (
						<tr
							className="border-b border-product-border last:border-0"
							key={rowIndex}
						>
							{row.map((cell, cellIndex) => (
								<td
									className="px-5 py-3.5 align-top leading-[1.6] text-product-foreground-accent first:font-semibold first:text-product-foreground"
									key={cellIndex}
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<div className="divide-y divide-product-border sm:hidden">
				{rows.map((row, rowIndex) => (
					<div className="grid gap-2 p-4" key={rowIndex}>
						{row.map((cell, cellIndex) => (
							<div key={cellIndex}>
								<p className="font-product-heading text-[11.5px] font-bold uppercase tracking-[0.03em] text-product-muted">
									{columns[cellIndex]}
								</p>
								<div className="mt-0.5 text-[14.5px] text-product-foreground-accent">
									{cell}
								</div>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
