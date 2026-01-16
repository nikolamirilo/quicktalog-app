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
				"text-card-description font-body tracking-body leading-snug",
				className,
			)}
		>
			{description}
		</p>
	);
};

export default CardDescription;
