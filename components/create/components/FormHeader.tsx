import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FormHeader = ({
	title,
	subtitle,
}: {
	title: string;
	subtitle: string;
}) => {
	return (
		<CardHeader className="p-6">
			<CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-product-foreground font-heading">
				{title}
			</CardTitle>
			<CardDescription className="text-center text-product-foreground-accent text-base sm:text-lg mt-2 font-body max-w-[600px] mx-auto">
				{subtitle}
			</CardDescription>
		</CardHeader>
	);
};

export default FormHeader;
