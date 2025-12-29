"use client";
import { useCatalogueContext } from "@/context/CatalogueContext";
import React, { useRef } from "react";

const DescriptionInput = () => {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	if (!catalogue) return null;

	const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
		const el = e.currentTarget;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	};

	return (
		<div className="flex justify-center w-full mb-8">
			<textarea
				className={`
          text-center text-gray-600 placeholder:text-gray-400 text-base sm:text-lg
          border rounded-lg
          px-8 py-1.5
          min-w-[90%] md:min-w-[600px] focus:bg-white ${catalogue.description === "" ? "bg-white border-gray-300 " : "bg-transparent border-none"}
        focus:border-gray-500 focus:outline-none
          transition-all
          resize-none overflow-hidden
        `}
				onChange={(e) => updateCatalogue?.({ description: e.target.value })}
				onInput={handleInput}
				placeholder="Add Description"
				ref={textareaRef}
				rows={1}
				value={catalogue?.description}
			/>
		</div>
	);
};

export default DescriptionInput;
