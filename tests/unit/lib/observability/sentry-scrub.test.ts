import { describe, expect, it } from "vitest";
import {
	scrubBreadcrumb,
	scrubEvent,
	scrubUrl,
	stripDrizzleParams,
} from "@/lib/observability/sentry-scrub";

describe("sentry scrubbing", () => {
	it("removes cookies, auth headers, bodies and query strings from requests", () => {
		const event = scrubEvent({
			request: {
				cookies: { __session: "jwt", "sb-ref-auth-token": "base64-token" },
				headers: {
					cookie: "__session=jwt",
					authorization: "Bearer token",
					"x-revalidate-secret": "secret",
					"user-agent": "Mozilla",
				},
				url: "https://www.quicktalog.app/auth/confirm?token_hash=abc&type=email",
				query_string: "token_hash=abc&type=email",
				data: { email: "person@example.com" },
			},
		});

		expect(event.request?.cookies).toEqual({});
		expect(event.request?.headers).toEqual({
			cookie: "[Filtered]",
			authorization: "[Filtered]",
			"x-revalidate-secret": "[Filtered]",
			"user-agent": "Mozilla",
		});
		expect(event.request?.url).toBe(
			"https://www.quicktalog.app/auth/confirm?token_hash=%5BFiltered%5D&type=email",
		);
		expect(event.request?.query_string).toBe("[Filtered]");
		expect(event.request?.data).toBe("[Filtered]");
	});

	it("strips Drizzle bound parameters from messages and exceptions", () => {
		const event = scrubEvent({
			message:
				'Failed query: select * from "users" where "email" = $1\nparams: person@example.com',
			exception: {
				values: [
					{
						value:
							'Failed query: insert into "newsletter" values ($1)\nparams: person@example.com,user_123',
					},
				],
			},
		});

		expect(event.message).toBe(
			'Failed query: select * from "users" where "email" = $1',
		);
		expect(event.exception?.values?.[0]?.value).toBe(
			'Failed query: insert into "newsletter" values ($1)',
		);
	});

	it("keeps only the user id", () => {
		const event = scrubEvent({
			user: {
				id: "user_1",
				email: "person@example.com",
				ip_address: "1.2.3.4",
			},
		});
		expect(event.user).toEqual({ id: "user_1" });
	});

	it("scrubs breadcrumb URLs and messages", () => {
		const crumb = scrubBreadcrumb({
			message: "query failed params: secret",
			data: { url: "/auth/callback?code=xyz&next=/admin" },
		});
		expect(crumb.message).toBe("query failed");
		expect(crumb.data?.url).toBe(
			"/auth/callback?code=%5BFiltered%5D&next=%2Fadmin",
		);
	});

	it("leaves URLs without sensitive parameters readable", () => {
		expect(scrubUrl("/catalogues/lux?q=watch")).toBe("/catalogues/lux?q=watch");
		expect(stripDrizzleParams("no params here")).toBe("no params here");
	});
});
