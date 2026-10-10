import type { ReactNode } from "react";

import { Container } from "@/components/general/Container";
import { SectionHeading } from "@/components/general/SectionHeading";
import { cn } from "@/lib/ui/cn";

type SectionProps = {
	children: ReactNode;
	id?: string;
	title?: ReactNode;
	eyebrow?: ReactNode;
	description?: ReactNode;
	className?: string;
	containerClassName?: string;
};

/** Page section with the standard vertical rhythm, container and optional heading. */
export function Section({
	children,
	id,
	title,
	eyebrow,
	description,
	className,
	containerClassName,
}: SectionProps) {
	return (
		<section className={cn("py-16 lg:py-24", className)} id={id}>
			<Container className={containerClassName}>
				{title && (
					<SectionHeading
						description={description}
						eyebrow={eyebrow}
						title={title}
					/>
				)}
				{children}
			</Container>
		</section>
	);
}
