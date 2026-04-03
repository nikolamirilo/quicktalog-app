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
		: `<h1 class="text-3xl sm:text-5xl font-heading text-heading drop-shadow-sm mb-4 text-center break-words pb-1 md:pb-2 w-full max-w-[98%] mx-auto" data-size="large">${item.heading}</h1>`;
	// Backward compat: patch old headings missing required classes
	if (isHtml && !headingHtml.includes("pb-1 md:pb-2")) {
		headingHtml = headingHtml.replace('class="', 'class="pb-1 md:pb-2 ');
	}
	if (isHtml && headingHtml.includes("line-clamp-")) {
		headingHtml = headingHtml.replace(/line-clamp-\d+/g, "");
	}
	// Strip whitespace-nowrap so long headings wrap like they do in edit mode
	if (isHtml && headingHtml.includes("whitespace-nowrap")) {
		headingHtml = headingHtml.replace(/whitespace-nowrap\s*/g, "");
	}

	return (
		<div className="flex flex-col items-center w-full mb-4 px-0">
			<div className="w-fit max-w-[94%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] 2xl:max-w-[50%] min-w-[80%] sm:min-w-[70%] md:min-w-[50%] lg:min-w-[40%] xl:min-w-[30%] mx-auto">
				<HtmlContent className="" html={headingHtml} />
			</div>
		</div>
	);
};

export default Heading;
