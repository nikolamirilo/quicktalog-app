import HeadingInput from "@/components/catalogue/inputs/HeadingInput";
import { HtmlContent } from "@/components/general/HtmlContent";
import {
	DEFAULT_HEADING_SIZE,
	parseHeading,
	wrapHeading,
} from "@/lib/catalogue/heading";
import { Catalogue } from "@quicktalog/common";

const Heading = ({
	item,
	type,
}: {
	type: "edit" | "view" | "demo";
	item: Catalogue;
}) => {
	if (type === "edit") return <HeadingInput />;
	if (!item.heading) return null;
	// No `data-size` means the heading never went through the builder's wrapper -
	// an older row, or an assistant edit from before it was normalized - and
	// without the wrapper's classes the page would draw it at body size.
	const parsed = parseHeading(item.heading);
	let headingHtml = parsed.size
		? item.heading
		: wrapHeading(parsed.inner, DEFAULT_HEADING_SIZE);
	headingHtml = headingHtml.replace(/line-clamp-\d+/g, "");
	// Strip whitespace-nowrap so long headings wrap like they do in edit mode
	headingHtml = headingHtml.replace(/whitespace-nowrap\s*/g, "");

	return (
		<div className="flex flex-col items-center w-full px-0 mt-8 lg:mt-4">
			<div className="w-full max-w-[94%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] 2xl:max-w-[50%] mx-auto">
				<HtmlContent className="" html={headingHtml} />
			</div>
		</div>
	);
};

export default Heading;
