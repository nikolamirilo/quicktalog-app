import React from "react";
import { cn } from "@/helpers/client";

interface CardTitleProps {
	name: string;
	slugId: string;
	className?: string;
}

const CardTitle = ({ name, slugId, className }: CardTitleProps) => {
	return (
		<h3
			className={cn(
				"font-heading tracking-heading text-card-heading leading-tight truncate",
				className,
			)}
			id={`item-title-${slugId}`}
		>
			{name}
		</h3>
	);
};

export default CardTitle;
