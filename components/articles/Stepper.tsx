export interface Step {
	title: string;
	description: string;
}

/**
 * Vertical numbered steps with a connecting rail. Replaces plain numbered
 * headings in how-to sections so a process reads as a clear visual sequence.
 */
export default function Stepper({ steps }: { steps: Step[] }) {
	return (
		<ol className="my-10">
			{steps.map((step, i) => (
				<li className="relative flex gap-5 pb-8 last:pb-0" key={step.title}>
					{i < steps.length - 1 && (
						<span
							aria-hidden
							className="absolute left-[1.125rem] top-10 h-[calc(100%-1.5rem)] w-px bg-product-border"
						/>
					)}
					<span className="z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-product-primary font-lora-semibold text-base font-bold text-product-foreground shadow-sm">
						{i + 1}
					</span>
					<div className="pt-1">
						<h3 className="font-lora text-lg font-bold text-product-foreground">
							{step.title}
						</h3>
						<p className="mt-1.5 leading-relaxed text-product-foreground-accent">
							{step.description}
						</p>
					</div>
				</li>
			))}
		</ol>
	);
}
