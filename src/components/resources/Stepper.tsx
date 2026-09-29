export interface Step {
	title: string;
	description: string;
}

/**
 * Numbered steps on a dashed amber rail. Replaces plain numbered headings in
 * how-to sections so a process reads as a clear visual sequence.
 */
export function Stepper({ steps }: { steps: Step[] }) {
	return (
		<ol className="relative grid gap-3.5 before:absolute before:bottom-[18px] before:left-[17px] before:top-[18px] before:border-l-2 before:border-dashed before:border-product-primary/70 before:content-['']">
			{steps.map((step, i) => (
				<li className="relative flex items-start gap-4" key={step.title}>
					<span
						aria-hidden="true"
						className="relative z-[1] grid h-9 w-9 flex-none place-items-center rounded-full bg-product-primary font-product-heading text-[15px] font-extrabold leading-none text-product-foreground shadow-[0_0_0_5px_var(--product-background),var(--product-shadow-primary)]"
					>
						{i + 1}
					</span>
					<div className="min-w-0 flex-1 rounded-[18px] border border-product-border bg-product-card px-[18px] py-3.5 shadow-[0_1px_2px_rgba(22,20,15,0.04)]">
						<h3 className="font-product-heading text-[16.5px] font-bold leading-[1.35] tracking-[-0.01em] text-product-foreground">
							<span className="sr-only">Step {i + 1}: </span>
							{step.title}
						</h3>
						<p className="mt-1 text-[15.5px] leading-[1.6]">
							{step.description}
						</p>
					</div>
				</li>
			))}
		</ol>
	);
}
