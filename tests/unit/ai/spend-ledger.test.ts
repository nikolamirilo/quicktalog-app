import { createSpendLedger } from "@/lib/ai/spend-ledger";
import { describe, expect, it, vi } from "vitest";

const slowWrite = () => {
	const written: number[] = [];
	const write = vi.fn(async (credits: number) => {
		await new Promise((resolve) => setTimeout(resolve, 5));
		written.push(credits);
		return credits;
	});
	return { written, write };
};

describe("spend ledger", () => {
	it("writes each credit once when a step's write and the closing write overlap", async () => {
		const { written, write } = slowWrite();
		let billed = 3;
		const ledger = createSpendLedger(write, () => billed, {
			onError: vi.fn(),
			onShort: vi.fn(),
		});
		const step = ledger.flush();
		billed = 4;
		const closing = ledger.flush();
		await Promise.all([step, closing]);
		expect(written.reduce((a, b) => a + b, 0)).toBe(4);
		expect(ledger.persisted).toBe(4);
	});

	it("retries a failed write on the next flush", async () => {
		const write = vi
			.fn<(credits: number) => Promise<number>>()
			.mockRejectedValueOnce(new Error("db down"))
			.mockResolvedValue(2);
		const onError = vi.fn();
		const ledger = createSpendLedger(write, () => 2, {
			onError,
			onShort: vi.fn(),
		});
		await ledger.flush();
		expect(ledger.persisted).toBe(0);
		expect(onError).toHaveBeenCalledTimes(1);
		await ledger.flush();
		expect(ledger.persisted).toBe(2);
	});

	it("reports a lapsed hold once", async () => {
		const onShort = vi.fn();
		let billed = 1;
		const ledger = createSpendLedger(
			async () => 0,
			() => billed,
			{
				onError: vi.fn(),
				onShort,
			},
		);
		await ledger.flush();
		billed = 2;
		await ledger.flush();
		expect(onShort).toHaveBeenCalledTimes(1);
	});

	it("writes nothing when nothing is due", async () => {
		const write = vi.fn(async () => 0);
		const ledger = createSpendLedger(write, () => 0, {
			onError: vi.fn(),
			onShort: vi.fn(),
		});
		await ledger.flush();
		expect(write).not.toHaveBeenCalled();
	});
});
