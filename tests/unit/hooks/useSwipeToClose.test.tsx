// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { TouchEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSwipeToClose } from "@/hooks/useSwipeToClose";

afterEach(cleanup);

const touch = (clientY: number, target: Element = document.body) =>
	({ target, touches: [{ clientY }] }) as unknown as TouchEvent;

const drag = (
	result: { current: ReturnType<typeof useSwipeToClose> },
	from: number,
	to: number,
) => {
	act(() => result.current.handleProps.onTouchStart(touch(from)));
	act(() => result.current.handleProps.onTouchMove(touch(to)));
};

const setup = (props: { open?: boolean; enabled?: boolean } = {}) => {
	const onClose = vi.fn();
	const hook = renderHook(
		(p: { open: boolean }) =>
			useSwipeToClose({
				open: p.open,
				onClose,
				enabled: props.enabled ?? true,
			}),
		{ initialProps: { open: props.open ?? true } },
	);
	return { onClose, ...hook };
};

describe("useSwipeToClose", () => {
	it("follows the finger down while dragging", () => {
		const { result } = setup();
		drag(result, 100, 160);
		expect(result.current.style).toEqual({
			transform: "translateY(60px)",
			transition: "none",
		});
	});

	it("never moves the sheet above its resting place", () => {
		const { result } = setup();
		drag(result, 300, 200);
		expect(result.current.style).toBeUndefined();
	});

	it("snaps back on a short drag", () => {
		const { result, onClose } = setup();
		drag(result, 100, 150);
		act(() => result.current.handleProps.onTouchEnd());
		expect(onClose).not.toHaveBeenCalled();
		expect(result.current.style).toBeUndefined();
	});

	it("closes past the threshold and clears the offset on the next open", () => {
		const { result, onClose, rerender } = setup();
		drag(result, 100, 260);
		act(() => result.current.handleProps.onTouchEnd());
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(result.current.style?.transform).toBe("translateY(160px)");

		rerender({ open: false });
		rerender({ open: true });
		expect(result.current.style).toBeUndefined();
	});

	it("ignores touches on buttons and when disabled", () => {
		const button = document.createElement("button");
		const { result } = setup();
		act(() => result.current.handleProps.onTouchStart(touch(100, button)));
		act(() => result.current.handleProps.onTouchMove(touch(300)));
		expect(result.current.style).toBeUndefined();

		const disabled = setup({ enabled: false });
		drag(disabled.result, 100, 300);
		expect(disabled.result.current.style).toBeUndefined();
	});
});
