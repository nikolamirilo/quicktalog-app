import { renameLegacyBlocks } from "../../../scripts/redis/rename-custom-code-blocks";
import { describe, expect, it } from "vitest";

describe("renameLegacyBlocks", () => {
	it("renames custom_code blocks and keeps everything else", () => {
		const draft = {
			name: "menu",
			content: [
				{ id: "a", type: "items" },
				{ id: "b", type: "custom_code", code: "<b>hi</b>" },
			],
		};
		expect(renameLegacyBlocks(draft)).toEqual({
			name: "menu",
			content: [
				{ id: "a", type: "items" },
				{ id: "b", type: "custom_visual", code: "<b>hi</b>" },
			],
		});
	});

	it("leaves a draft without legacy blocks alone", () => {
		expect(renameLegacyBlocks({ content: [{ type: "items" }] })).toBeNull();
		expect(renameLegacyBlocks("not a draft")).toBeNull();
		expect(renameLegacyBlocks({ content: "nope" })).toBeNull();
	});
});
