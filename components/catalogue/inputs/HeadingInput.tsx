"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";

const HeadingInput = () => {
	const { catalogue, updateCatalogue } = useCatalogueContext();

	console.log(catalogue.heading);

	return (
		<div className="flex justify-center w-full mb-4">
			<input
				value={catalogue?.heading}
				onChange={(e) => updateCatalogue({ heading: e.target.value })}
				placeholder="Add Heading"
				className="text-center text-2xl sm:text-4xl text-gray-700 placeholder:text-gray-400  border border-gray-300 rounded-lg px-6 py-2 w-[90%] md:w-auto md:min-w-[300px] bg-white hover:border-gray-400 focus:border-gray-500 focus:outline-none transition-all"
			/>
		</div>
	);
};

export default HeadingInput;
