import { cn } from "@/helpers/client";

interface CardDescriptionProps {
	description: string;
	slugId: string;
	className?: string;
}

const CardDescription = ({
	description,
	slugId,
	className,
}: CardDescriptionProps) => {
	return (
		<p
			aria-describedby={`item-title-${slugId}`}
			className={cn(
				"text-catalogue-card-description font-body !leading-[1.15] sm:!leading-snug",
				className,
			)}
			style={{ fontSize: "var(--content-font-size)" }}
		>
			{description}
		</p>
	);
};

export default CardDescription;
