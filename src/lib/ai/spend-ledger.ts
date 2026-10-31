/**
 * Writes what a request has spent, one write at a time. A step's write and the
 * closing write can overlap when the browser disconnects (the stream's cancel
 * runs the close while a step is still writing), so every flush queues behind
 * the last one and reads what is due only when its turn comes.
 */
export function createSpendLedger(
	write: (credits: number) => Promise<number>,
	billed: () => number,
	report: { onError: (error: unknown) => void; onShort: () => void },
) {
	let persisted = 0;
	let reportedShort = false;
	let queue: Promise<void> = Promise.resolve();

	const writeDue = async () => {
		const due = billed() - persisted;
		if (due <= 0) return;
		try {
			const moved = await write(due);
			persisted += due;
			if (moved < due && !reportedShort) {
				reportedShort = true;
				report.onShort();
			}
		} catch (error) {
			report.onError(error);
		}
	};

	return {
		flush(): Promise<void> {
			queue = queue.then(writeDue);
			return queue;
		},
		get persisted(): number {
			return persisted;
		},
	};
}
