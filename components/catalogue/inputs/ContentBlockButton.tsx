import React from "react";

const ContentBlockButton = ({
	setIsAddContentOpen,
}: {
	setIsAddContentOpen: (open: boolean) => void;
}) => {
	return (
		<div className="max-w-6xl mx-auto px-4 block">
			<button
				className="mt-4 w-full group border-2 border-dashed border-gray-700 bg-gray-100/30 rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all hover:bg-[#FFFCF1] hover:border-[#FCD34D] hover:scale-[1.01] py-12"
				onClick={() => setIsAddContentOpen(true)}
			>
				<img
					alt="Add Content"
					className="w-[200px] h-[200px]"
					src="/builder/content.svg"
				/>
				<span className="text-2xl text-gray-800 ">Add Content Block</span>
			</button>
		</div>
	);
};

export default ContentBlockButton;
