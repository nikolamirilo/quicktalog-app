"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";

const HeadingInput = () => {
	const { catalogue, updateCatalogue } = useCatalogueContext();

	return (
		<div className="flex justify-center w-full mb-4">
			<input
				value={catalogue?.heading}
				onChange={(e) => updateCatalogue({ heading: e.target.value })}
				placeholder="Add Heading"
				className="text-center text-2xl sm:text-4xl text-foreground placeholder:text-gray-400  border-card-border border-2 border-dashed rounded-lg px-6 py-2 w-[90%] md:w-auto bg-transparent md:min-w-[300px] focus:border-primary outline-none transition-all"
			/>
		</div>
	);
};

export default HeadingInput;
