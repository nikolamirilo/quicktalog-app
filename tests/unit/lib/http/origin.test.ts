import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sameOrigin } from "@/lib/http/origin";

const env = { ...process.env };

const request = (headers: Record<string, string>) =>
	new Request("https://www.quicktalog.app/api/agent", {
		method: "POST",
		headers,
	});

describe("sameOrigin", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_BASE_URL = "https://www.quicktalog.app";
		delete process.env.VERCEL_URL;
	});
	afterEach(() => {
		process.env = { ...env };
	});

	it("accepts a request from the app's own origin", () => {
		expect(sameOrigin(request({ origin: "https://www.quicktalog.app" }))).toBe(
			true,
		);
	});

	it("accepts the host the request arrived on (preview deployments)", () => {
		expect(
			sameOrigin(
				request({
					origin: "https://quicktalog-git-test.vercel.app",
					host: "quicktalog-git-test.vercel.app",
				}),
			),
		).toBe(true);
	});

	it("rejects another site", () => {
		expect(sameOrigin(request({ origin: "https://evil.example" }))).toBe(false);
	});

	it("rejects a lookalike subdomain", () => {
		expect(
			sameOrigin(request({ origin: "https://evil.quicktalog.app.evil.test" })),
		).toBe(false);
	});

	it("rejects a request with no Origin header", () => {
		expect(sameOrigin(request({}))).toBe(false);
	});

	it("does not allow everything when the base URL is malformed", () => {
		process.env.NEXT_PUBLIC_BASE_URL = "not a url";
		expect(sameOrigin(request({ origin: "https://evil.example" }))).toBe(false);
	});
});
