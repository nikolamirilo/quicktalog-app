import { ArrowRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface FlowNode {
	icon: LucideIcon;
	title: string;
	body: ReactNode;
	/** What takes the reader from the previous node to this one. */
	via?: string;
}

/**
 * A short left-to-right flow for something no single screen shows, such as the
 * trip from a draft to a customer's phone. It stacks on a narrow screen, so the
 * arrows always point the way the reader is reading.
 */
export function Flow({
	nodes,
	caption,
}: {
	nodes: FlowNode[];
	caption?: string;
}) {
	return (
		<figure>
			<div className="flex flex-col items-stretch gap-2 md:flex-row md:gap-0">
				{nodes.map(({ icon: Icon, title, body, via }, index) => (
					<div className="contents" key={title}>
						{index > 0 ? (
							<div className="flex flex-none items-center justify-center gap-2 px-1 py-1 md:w-[76px] md:flex-col md:gap-1 md:px-2 md:py-0">
								<ArrowRight
									aria-hidden="true"
									className="h-4 w-4 flex-none rotate-90 text-product-primary md:rotate-0"
								/>
								{via ? (
									<span className="text-center text-[12px] font-semibold leading-tight text-product-primary-ink">
										{via}
									</span>
								) : null}
							</div>
						) : null}
						<div className="flex flex-1 flex-col gap-2 rounded-product-card border border-product-border bg-product-card p-4">
							<span
								aria-hidden="true"
								className="grid h-8 w-8 place-items-center rounded-[10px] bg-product-primary-soft text-product-primary-ink"
							>
								<Icon className="h-4 w-4" />
							</span>
							<span className="font-product-heading text-[15.5px] font-bold leading-tight text-product-foreground">
								{title}
							</span>
							<span className="text-[14px] leading-[1.55] text-product-foreground-accent">
								{body}
							</span>
						</div>
					</div>
				))}
			</div>
			{caption ? (
				<figcaption className="mt-2.5 text-[13.5px] text-product-muted">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}
