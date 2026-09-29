// @vitest-environment happy-dom
import CreditMeter from "@/components/catalogue/chat/CreditMeter";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

const ring = () => screen.getByRole("button", { name: /AI credits/i });
/** The second circle is the progress arc; the first is the track. */
const arcClass = (container: HTMLElement) =>
	container.querySelectorAll("circle")[1]?.getAttribute("class") ?? "";

const open = async () => {
	await act(async () => {
		fireEvent.click(ring());
	});
};

describe("CreditMeter", () => {
	it("renders nothing on a plan with no AI", () => {
		const { container } = render(<CreditMeter limit={0} used={0} />);
		expect(container.innerHTML).toBe("");
	});

	it("shows what is left, not what is spent", () => {
		render(<CreditMeter limit={15} used={3} />);
		expect(ring().getAttribute("title")).toBe("12 AI credits left");
	});

	it("turns red once the limit is reached", () => {
		const { container } = render(<CreditMeter limit={15} used={15} />);
		expect(arcClass(container)).toContain("text-product-error");
	});

	it("warns before it turns red", () => {
		const { container } = render(<CreditMeter limit={20} used={15} />);
		expect(arcClass(container)).toContain("text-product-warning");
		expect(arcClass(container)).not.toContain("text-product-error");
	});

	it("never reports a negative balance after an overshoot", () => {
		render(<CreditMeter limit={15} used={16} />);
		expect(ring().getAttribute("title")).toBe("0 AI credits left");
	});

	it("draws the arc the right way round", () => {
		// dashoffset == circumference is an empty ring, 0 is a full one. Inverting
		// these is the classic ring bug and looks plausible until you compare two.
		const offset = (used: number, limit: number) => {
			const { container } = render(<CreditMeter limit={limit} used={used} />);
			const arc = container.querySelectorAll("circle")[1];
			return {
				dash: Number(arc?.getAttribute("stroke-dasharray")),
				off: Number(arc?.getAttribute("stroke-dashoffset")),
			};
		};
		const empty = offset(0, 15);
		expect(empty.off).toBeCloseTo(empty.dash, 5);
		cleanup();
		expect(offset(15, 15).off).toBeCloseTo(0, 5);
		cleanup();
		const half = offset(10, 20);
		expect(half.off).toBeCloseTo(half.dash / 2, 5);
		cleanup();
		// An overshoot fills the ring rather than wrapping past it.
		expect(offset(16, 15).off).toBeCloseTo(0, 5);
	});

	it("opens a bigger chart on click, and names the overage", async () => {
		render(<CreditMeter limit={15} used={16} />);
		await open();
		expect(document.body.textContent).toContain("16 of 15 used");
		expect(document.body.textContent).toContain("1 over");
		expect(document.body.textContent).toMatch(/out until the month resets/i);
	});
});
