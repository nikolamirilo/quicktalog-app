// @vitest-environment happy-dom
import type { Metadata } from "@quicktalog/common";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import TrackingSection from "@/components/catalogue/inputs/sidebar/general/TrackingSection";

afterEach(cleanup);

let latest: Metadata = {} as Metadata;

const Harness = ({
	initial = {},
	hasTracking = true,
}: {
	initial?: Partial<Metadata>;
	hasTracking?: boolean;
}) => {
	const [metadata, setMetadata] = useState<Metadata>(initial as Metadata);
	latest = metadata;
	return (
		<TrackingSection
			handleChange={(field, value) => {
				const key = field.split(".")[1];
				setMetadata((prev) => {
					latest = { ...prev, [key]: value };
					return latest;
				});
			}}
			hasTracking={hasTracking}
			metadata={metadata}
		/>
	);
};

const gaSwitch = () => screen.getByRole("switch", { name: "Google Analytics" });
const pixelSwitch = () => screen.getByRole("switch", { name: "Meta Pixel" });
const gaInput = () => screen.queryByLabelText("Google Analytics ID");

const toggle = async (el: HTMLElement) => {
	await act(async () => {
		fireEvent.click(el);
	});
};

describe("TrackingSection", () => {
	it("keeps the id inputs hidden until a vendor is switched on", async () => {
		render(<Harness />);
		expect(gaSwitch().getAttribute("aria-checked")).toBe("false");
		expect(gaInput()).toBeNull();

		await toggle(gaSwitch());
		expect(gaSwitch().getAttribute("aria-checked")).toBe("true");
		expect(gaInput()).toBeTruthy();
		expect(screen.queryByLabelText("Meta Pixel ID")).toBeNull();
	});

	it("shows a vendor as on when the catalogue already has its id", () => {
		render(<Harness initial={{ metaPixelId: "1234567890123456" }} />);
		expect(pixelSwitch().getAttribute("aria-checked")).toBe("true");
		expect(
			(screen.getByLabelText("Meta Pixel ID") as HTMLInputElement).value,
		).toBe("1234567890123456");
	});

	it("clears the id when switched off and restores it when switched back on", async () => {
		render(<Harness initial={{ googleAnalyticsId: "G-ABC1234567" }} />);

		await toggle(gaSwitch());
		expect(latest.googleAnalyticsId).toBe("");
		expect(gaInput()).toBeNull();

		await toggle(gaSwitch());
		expect(latest.googleAnalyticsId).toBe("G-ABC1234567");
		expect((gaInput() as HTMLInputElement).value).toBe("G-ABC1234567");
	});

	it("disables both switches and says why when the plan lacks tracking", () => {
		render(
			<Harness
				hasTracking={false}
				initial={{ googleAnalyticsId: "G-ABC1234567" }}
			/>,
		);
		expect(gaSwitch().hasAttribute("disabled")).toBe(true);
		expect(gaSwitch().getAttribute("aria-checked")).toBe("false");
		expect(pixelSwitch().hasAttribute("disabled")).toBe(true);
		expect(gaInput()).toBeNull();
		expect(
			screen.getByText("Upgrade your plan to connect your own analytics."),
		).toBeTruthy();
	});
});
