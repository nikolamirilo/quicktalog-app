import { Status } from "@quicktalog/common";

export const statusOrder: Record<Status, number> = {
	"in preparation": 1,
	error: 2,
	draft: 3,
	active: 4,
	inactive: 5,
};
