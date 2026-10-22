// @vitest-environment happy-dom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Next 15's router never settles a refresh queued behind a navigation that cut
 * off another refresh, so the page hangs. The provider already refreshes when
 * the user changes; a flow that then navigates must not refresh again.
 */
const mocks = vi.hoisted(() => {
	type User = { id: string };
	type Listener = (event: string, session: { user: User } | null) => void;
	const listeners: Listener[] = [];
	const notify = (event: string, user: User | null) => {
		for (const listener of listeners) listener(event, user ? { user } : null);
	};
	const state = {
		calls: [] as string[],
		user: null as User | null,
		listeners,
		router: {
			push: (href: string) => state.calls.push(`push ${href}`),
			replace: (href: string) => state.calls.push(`replace ${href}`),
			refresh: () => state.calls.push("refresh"),
		},
		auth: {
			getUser: async () => ({ data: { user: state.user } }),
			onAuthStateChange: (listener: Listener) => {
				listeners.push(listener);
				return { data: { subscription: { unsubscribe: () => {} } } };
			},
			signInWithPassword: async () => {
				notify("SIGNED_IN", { id: "u1" });
				return { error: null };
			},
			signOut: async () => {
				notify("SIGNED_OUT", null);
				return { error: null };
			},
		},
	};
	return state;
});

vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("@/utils/supabase/client", () => ({
	createClient: () => ({ auth: mocks.auth }),
}));
vi.mock("@/components/auth/common/useTurnstile", () => ({
	useTurnstile: () => ({
		token: null,
		pending: false,
		reset: () => {},
		element: null,
	}),
}));

import { SignInForm } from "@/components/auth/forms/SignInForm";
import { SupabaseAuthProvider } from "@/components/auth/session/SupabaseAuthProvider";
import { useAuth } from "@/context/AuthContext";

function SignOutButton() {
	const { isSignedIn, signOut } = useAuth();
	return isSignedIn ? (
		<button onClick={() => signOut()} type="button">
			Sign out
		</button>
	) : null;
}

describe("auth navigation", () => {
	beforeEach(() => {
		mocks.calls.length = 0;
		mocks.listeners.length = 0;
		mocks.user = null;
	});
	afterEach(cleanup);

	it("sign-in only navigates after the provider's refresh", async () => {
		render(
			<SupabaseAuthProvider>
				<SignInForm next="/admin/dashboard" onForgotPassword={() => {}} />
			</SupabaseAuthProvider>,
		);
		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "john@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "secret-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

		await waitFor(() =>
			expect(mocks.calls).toContain("replace /admin/dashboard"),
		);
		expect(mocks.calls).toEqual(["refresh", "replace /admin/dashboard"]);
	});

	it("sign-out only navigates after the provider's refresh", async () => {
		mocks.user = { id: "u1" };
		render(
			<SupabaseAuthProvider>
				<SignOutButton />
			</SupabaseAuthProvider>,
		);
		fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));

		await waitFor(() => expect(mocks.calls).toContain("push /"));
		expect(mocks.calls).toEqual(["refresh", "push /"]);
	});
});
