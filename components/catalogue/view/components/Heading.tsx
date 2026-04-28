import HtmlContent from "@/components/general/HtmlContent";
import { Catalogue } from "@quicktalog/common";
import { HeadingInput } from "../..";

const Heading = ({
	item,
	type,
}: {
	type: "edit" | "view" | "demo";
	item: Catalogue;
}) => {
	if (type === "edit") return <HeadingInput />;
	if (!item.heading) return null;
	const isHtml = item.heading.includes("<h1");
	let headingHtml = isHtml
		? item.heading
		: `<h1 class="text-3xl md:text-4xl lg:text-5xl font-heading text-heading drop-shadow-sm text-center break-words w-full max-w-[98%] mx-auto" data-size="large">${item.heading}</h1>`;
	if (isHtml && headingHtml.includes("line-clamp-")) {
		headingHtml = headingHtml.replace(/line-clamp-\d+/g, "");
	}
	// Strip whitespace-nowrap so long headings wrap like they do in edit mode
	if (isHtml && headingHtml.includes("whitespace-nowrap")) {
		headingHtml = headingHtml.replace(/whitespace-nowrap\s*/g, "");
	}

	return (
		<div className="flex flex-col items-center w-full px-0 mt-8 lg:mt-4">
			<div className="w-full max-w-[94%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] 2xl:max-w-[50%] mx-auto">
				<HtmlContent className="" html={headingHtml} />
			</div>
		</div>
	);
};

export default Heading;
