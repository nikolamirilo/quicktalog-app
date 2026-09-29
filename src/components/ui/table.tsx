import * as React from "react";

import { cn } from "@/lib/ui/cn";

const Table = React.forwardRef<
	HTMLTableElement,
	React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
	<div className="relative w-full overflow-auto">
		<table
			className={cn(
				"w-full caption-bottom text-sm text-product-foreground",
				className,
			)}
			ref={ref}
			{...props}
		/>
	</div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		className={cn(
			"bg-product-background [&_tr]:border-b [&_tr]:border-product-border [&_tr:hover]:bg-transparent",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		className={cn("[&_tr:last-child]:border-0", className)}
		ref={ref}
		{...props}
	/>
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		className={cn(
			"border-t border-product-border bg-product-background-hero font-medium [&>tr]:last:border-b-0",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr
		className={cn(
			"border-b border-product-border transition-colors hover:bg-[#fffcf5] data-[state=selected]:bg-product-primary-soft",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		className={cn(
			"h-11 px-4 text-left align-middle text-xs font-bold uppercase tracking-[0.06em] text-product-muted [&:has([role=checkbox])]:pr-0",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		className={cn(
			"px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		className={cn("mt-4 text-sm text-product-muted", className)}
		ref={ref}
		{...props}
	/>
));
TableCaption.displayName = "TableCaption";

export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
};
