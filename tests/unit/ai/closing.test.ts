import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { closingCharge } from "@/lib/ai/turn";

const base = {
	charged: true,
	applied: 0,
	planOpen: false,
	billed: 0,
	persisted: 0,
};

describe("closingCharge", () => {
	it("refunds a question", () => {
		expect(closingCharge(base)).toEqual({ refund: true, spend: 0 });
	});

	it("charges a request that only read a page", () => {
		expect(closingCharge({ ...base, billed: 2 })).toEqual({
			refund: false,
			spend: 2,
		});
	});

	it("never refunds a continuation", () => {
		expect(closingCharge({ ...base, charged: false })).toEqual({
			refund: false,
			spend: 0,
		});
	});

	it("charges only what the steps did not already write", () => {
		expect(
			closingCharge({ ...base, applied: 4, billed: 3, persisted: 2 }),
		).toEqual({ refund: false, spend: 1 });
	});

	it("keeps the charge while a plan is open", () => {
		expect(closingCharge({ ...base, planOpen: true }).refund).toBe(false);
	});
});
