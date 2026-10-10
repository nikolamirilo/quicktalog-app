import { CatalogueSession } from "@/agent/session";
import { buildTools } from "@/agent/tools";
import {
	isHiddenTool,
	runningLabel,
	TOOL_DISPLAY,
} from "@/agent/tools/display";
import type { AgentToolResult } from "@/types/ai";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";
import { describe, expect, it } from "vitest";

const catalogue = { ...defaultCatalogueData, name: "cafe" } as Catalogue;

const run = (
	tools: ReturnType<typeof buildTools>,
	name: keyof ReturnType<typeof buildTools>,
	input: unknown,
) =>
	(tools[name].execute as (i: unknown, o: unknown) => Promise<AgentToolResult>)(
		input,
		{},
	);

describe("header and footer tools", () => {
	it("changes the header without touching the fields it was not given", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);

		const result = await run(tools, "updateHeader", {
			fields: { type: "custom", cta: { label: "Book a table" } },
		});

		expect(result).toMatchObject({ ok: true });
		expect(session.working.header.type).toBe("custom");
		expect(session.working.header.cta.label).toBe("Book a table");
		// Only `label` was sent, so the rest of the button is left alone.
		expect(session.working.header.cta.isEnabled).toBe(
			catalogue.header.cta.isEnabled,
		);
		expect(session.working.header.phoneCta).toBe(catalogue.header.phoneCta);
	});

	it("keeps the logo height when only the width is set", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);

		await run(tools, "updateFooter", { fields: { logoWidth: 240 } });

		expect(session.working.footer.logoSize).toEqual({
			width: 240,
			height: catalogue.footer.logoSize.height,
		});
	});

	it("tells the model when a call changed nothing", async () => {
		const tools = buildTools(new CatalogueSession(catalogue));

		expect(await run(tools, "updateFooter", { fields: {} })).toEqual({
			ok: false,
			error: expect.stringContaining("No footer settings"),
		});
	});

	it("writes terms and privacy through the legal fields", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);

		const result = await run(tools, "updateLegal", {
			fields: { termsAndConditions: "Tables are held for 15 minutes." },
		});

		expect(result).toMatchObject({ ok: true });
		expect(session.working.legal.termsAndConditions).toBe(
			"Tables are held for 15 minutes.",
		);
		expect(session.working.legal.legalName).toBe(catalogue.legal.legalName);
	});
});

// The sidebar hides these behind an upgrade overlay; the assistant must not be
// the way around it.
describe("the branding plan gate", () => {
	const locked = () =>
		buildTools(new CatalogueSession(catalogue, { branding: false }));

	it("refuses the header and footer, and says the plan is why", async () => {
		expect(
			await run(locked(), "updateHeader", { fields: { type: "custom" } }),
		).toEqual({
			ok: false,
			error: expect.stringContaining("not part of your plan"),
			limitReached: true,
		});
		expect(
			await run(locked(), "updateFooter", { fields: { newsletter: true } }),
		).toMatchObject({ ok: false, limitReached: true });
	});

	it("refuses logo, contact, SEO and legal writes", async () => {
		for (const fields of [
			{ logo: "https://cdn.test/logo.png" },
			{ contact: { phone: "0600" } },
			{ metadata: { title: "Cafe" } },
		]) {
			expect(await run(locked(), "updateCatalogue", { fields })).toMatchObject({
				ok: false,
				limitReached: true,
			});
		}

		expect(
			await run(locked(), "updateLegal", { fields: { address: "1 High St" } }),
		).toMatchObject({ ok: false, limitReached: true });
	});

	it("still allows the settings that sit outside the overlay", async () => {
		const session = new CatalogueSession(catalogue, { branding: false });

		const result = await run(buildTools(session), "updateCatalogue", {
			fields: { currency: "GBP", language: "en" },
		});

		expect(result).toMatchObject({ ok: true });
		expect(session.working.currency).toBe("GBP");
	});

	it("leaves the catalogue untouched when it refuses", async () => {
		const session = new CatalogueSession(catalogue, { branding: false });

		await run(buildTools(session), "updateHeader", {
			fields: { type: "custom" },
		});

		expect(session.working.header).toEqual(catalogue.header);
		expect(session.operations).toHaveLength(0);
	});
});

describe("tool display", () => {
	it("has an entry for every tool the agent exposes", () => {
		const names = Object.keys(buildTools(new CatalogueSession(catalogue)));

		expect(Object.keys(TOOL_DISPLAY).sort()).toEqual(names.sort());
	});

	it("hides the plan tools and labels the rest", () => {
		expect(isHiddenTool("createPlan")).toBe(true);
		expect(isHiddenTool("updateHeader")).toBe(false);
		expect(runningLabel("updateHeader")).toBe("Updating the header");
		expect(runningLabel("somethingElse")).toBe("Working");
	});
});

describe("an empty settings call", () => {
	// Every field is optional, so `{}` parses. It must read back as "nothing
	// happened" rather than as a change the model believes landed.
	it("is reported as a failure, not a silent success", async () => {
		const session = new CatalogueSession(catalogue);
		const tools = buildTools(session);

		expect(await run(tools, "updateLegal", { fields: {} })).toMatchObject({
			ok: false,
		});
		expect(await run(tools, "updateCatalogue", { fields: {} })).toMatchObject({
			ok: false,
		});
		expect(await run(tools, "updateHeader", { fields: {} })).toMatchObject({
			ok: false,
		});
		expect(session.operations).toHaveLength(0);
	});
});
