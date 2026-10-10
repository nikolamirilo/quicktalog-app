import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

/** Large amber "sign up" link with the arrow that nudges right on hover. */
export function SignupButton({
	children = "Start Creating Now",
	className,
	href = "/auth?mode=signup",
}: {
	children?: ReactNode;
	className?: string;
	href?: string;
}) {
	return (
		<Button
			asChild
			className={cn("group w-full sm:w-auto sm:min-w-[224px]", className)}
			size="lg"
		>
			<Link href={href}>
				{children}
				<ArrowRight
					aria-hidden="true"
					className="transition-transform group-hover:translate-x-[3px]"
				/>
			</Link>
		</Button>
	);
}
