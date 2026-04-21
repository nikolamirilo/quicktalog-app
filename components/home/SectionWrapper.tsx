import React from "react";
import SectionTitle from "./SectionTitle";

interface Props {
	id: string;
	title: string;
	description: string;
}

const SectionWrapper: React.FC<React.PropsWithChildren<Props>> = ({
	id,
	title,
	description,
	children,
}: React.PropsWithChildren<Props>) => {
	return (
		<section className="py-10 lg:py-20 lg:px-0 bg-product-background" id={id}>
			<div className="px-4">
				<SectionTitle>
					<h2 className="text-center mb-4">{title}</h2>
				</SectionTitle>

				<p className="mb-12 text-center max-w-full md:max-w-[60%] mx-auto">
					{description}
				</p>
			</div>
			{children}
		</section>
	);
};

export default SectionWrapper;
