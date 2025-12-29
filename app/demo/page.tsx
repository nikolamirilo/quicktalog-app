"use client";
import Catalogue from "@/components/catalogue/view/Catalogue";
import CreateCatalogueCTA from "@/components/general/CreateCatalogueCTA";
import { useMainContext } from "@/context/MainContext";
import data from "../../showcase.json";

const page: React.FC = () => {
	const { theme, layout } = useMainContext();

	// Updated check for 'content' instead of 'services'
	if (!data.content || !Array.isArray(data.content)) {
		throw new Error("Invalid content data structure");
	}

	// Apply selected layout and theme to demo data
	const demoData = {
		...data,
		appearance: {
			...data.appearance,
			theme: {
				...data.appearance.theme,
				name: theme || data.appearance.theme.name || "theme-luxury",
			},
		},
		content: data.content.map((block: any) => ({
			...block,
			layout: layout || block.layout || "variant_1",
		})),
	};

	return (
		<>
			<div
				className={`min-h-screen text-text bg-background font-lora ${theme ? theme : "theme-luxury"}`}
			>
				<main>
					<Catalogue type="demo" item={demoData as any} />
					<CreateCatalogueCTA />
				</main>
			</div>
		</>
	);
};

export default page;
