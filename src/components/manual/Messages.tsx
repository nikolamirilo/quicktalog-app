import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { ManualTable } from "@/components/manual/ManualTable";

export interface ProductMessage {
	/** The message exactly as the product writes it. */
	text: string;
	/** Why the reader is seeing it. */
	cause: ReactNode;
	/** What to do about it, in plain words. */
	fix: ReactNode;
}

const columns = ["What you see", "Why", "What to do"];

const toRows = (messages: ProductMessage[]) =>
	messages.map((message) => [
		<q className="text-product-foreground" key={message.text}>
			{message.text}
		</q>,
		message.cause,
		message.fix,
	]);

/**
 * Messages and their fixes. Folded away by default, because on a task page a
 * long error table pushed the steps off the screen. Troubleshooting pages pass
 * `open`.
 */
export function Messages({
	messages,
	open = false,
}: {
	messages: ProductMessage[];
	open?: boolean;
}) {
	if (open) {
		return <ManualTable columns={columns} rows={toRows(messages)} />;
	}

	return (
		<details className="group rounded-product-card border border-product-border bg-product-card">
			<summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-2.5 px-4 text-[15px] font-bold text-product-foreground [&::-webkit-details-marker]:hidden">
				What the messages mean
				<span className="ml-auto text-[13px] font-semibold text-product-muted">
					{messages.length}
				</span>
				<ChevronDown
					aria-hidden="true"
					className="h-4 w-4 text-product-muted transition-transform group-open:rotate-180"
				/>
			</summary>
			<div className="border-t border-product-border p-3">
				<ManualTable columns={columns} rows={toRows(messages)} />
			</div>
		</details>
	);
}
