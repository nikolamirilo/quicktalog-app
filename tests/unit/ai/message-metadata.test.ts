import { agentEditLimits, agentTurnId } from "@/lib/ai/message-metadata";
import { describe, expect, it } from "vitest";

describe("agent message metadata", () => {
	it("reads the limits the server judged edits by", () => {
		const limits = { items: 30, sections: 8, branding: true };
		expect(agentEditLimits({ metadata: { turnId: "t", limits } })).toEqual(
			limits,
		);
	});

	it("returns null when a message carries no limits, so its edits are held back", () => {
		expect(agentEditLimits({ metadata: { turnId: "t" } })).toBeNull();
		expect(agentEditLimits({})).toBeNull();
		expect(agentEditLimits({ metadata: { limits: "nope" } })).toBeNull();
	});

	it("reads the turn id", () => {
		expect(agentTurnId({ metadata: { turnId: "t1", limits: {} } })).toBe("t1");
		expect(agentTurnId({})).toBeNull();
	});
});
