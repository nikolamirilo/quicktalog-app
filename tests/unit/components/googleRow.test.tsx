// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { GoogleRow } from "@/components/dashboard/account/supabase/GoogleRow";
import type { SupabaseBrowserClient } from "@/components/dashboard/account/supabase/types";

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const google = {
	provider: "google",
	identity_data: { email: "ana@gmail.com" },
};
const email = { provider: "email", identity_data: { email: "ana@gmail.com" } };

const clientWith = (identities: object[], unlinkError: object | null = null) =>
	({
		auth: {
			getUserIdentities: vi.fn().mockResolvedValue({
				data: { identities },
				error: null,
			}),
			unlinkIdentity: vi.fn().mockResolvedValue({ error: unlinkError }),
			linkIdentity: vi.fn(),
		},
	}) as unknown as SupabaseBrowserClient;

describe("GoogleRow", () => {
	it("explains why Google cannot be disconnected when it is the only sign-in method", async () => {
		render(<GoogleRow supabase={clientWith([google])} />);
		const button = await screen.findByRole("button", { name: "Disconnect" });
		expect((button as HTMLButtonElement).disabled).toBe(true);
		expect(
			screen.getByText(/only sign-in provider linked to this account/),
		).toBeTruthy();
	});

	it("does not show the explanation when another sign-in method exists", async () => {
		render(<GoogleRow supabase={clientWith([email, google])} />);
		await screen.findByRole("button", { name: "Disconnect" });
		expect(
			screen.queryByText(/only sign-in provider linked to this account/),
		).toBeNull();
	});

	it("shows a neutral message when linking is turned off", async () => {
		render(
			<GoogleRow
				supabase={clientWith([email, google], {
					code: "manual_linking_disabled",
					message: "Manual linking is disabled",
				})}
			/>,
		);
		fireEvent.click(await screen.findByRole("button", { name: "Disconnect" }));
		await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
		const message = toast.error.mock.calls[0][0] as string;
		expect(message).not.toMatch(/connecting/i);
		expect(message).toMatch(/Google connections are turned off/);
	});
});
