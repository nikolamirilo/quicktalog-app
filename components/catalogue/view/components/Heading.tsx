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
	if (isHtml && !headingHtml.includes("pb-1 md:pb-2")) {
		headingHtml = headingHtml.replace('class="', 'class="pb-1 md:pb-2 ');
	}
	if (isHtml && headingHtml.includes("line-clamp-")) {
		headingHtml = headingHtml.replace(/line-clamp-\d+/g, "");
	}
	if (isHtml && headingHtml.includes("break-words")) {
		headingHtml = headingHtml.replace(/break-words/g, "break-word");
	}
	if (isHtml && !headingHtml.includes("whitespace-")) {
		headingHtml = headingHtml.replace('class="', 'class="whitespace-nowrap ');
	}

	return <HtmlContent className="" html={headingHtml} />;
};

export default Heading;
