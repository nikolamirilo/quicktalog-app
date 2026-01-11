import { useMemo } from "react";

export const useCard = (record: { name: string }) => {
	const slugId = useMemo(
		() => record.name?.replace(/\s+/g, "-").toLowerCase() || "",
		[record.name],
	);

	const rootProps = {
		"aria-labelledby": `item-title-${slugId}`,
		role: "article",
		tabIndex: 0,
	};

	return { slugId, rootProps };
};
